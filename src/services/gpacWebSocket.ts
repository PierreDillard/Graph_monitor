import { WebSocketBase } from './WebSocketBase';
import { EventEmitter } from 'events';
import { GpacNodeData } from '../types/gpac';
import { DataViewReader } from './DataViewReader';
import throttle from 'lodash/throttle';

export class GpacWebSocket extends EventEmitter {
  private ws: WebSocketBase;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private activeSubscriptions: Set<string> = new Set();
  private currentFilterId: number | null = null;

  constructor(private address: string = 'ws://127.0.0.1:17815/rmt') {
    super();
    this.ws = new WebSocketBase();
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.ws.addConnectHandler(() => {
      console.log('Connected to GPAC WebSocket');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.emit('connected');

      // Ask filters
      this.sendMessage({ message: 'get_all_filters' });
    });

    this.ws.addDisconnectHandler(() => {
      console.log('Disconnected from GPAC WebSocket');
      this.handleDisconnect();
      this.emit('disconnected');
    });

    // Handler JSON
    this.ws.addMessageHandler('{"me', (_, dataView) => {
      try {
        const text = new TextDecoder().decode(dataView.buffer as ArrayBuffer);
        console.log('[DEBUG] Direct JSON message:', text);
        const jsonData = JSON.parse(text);
        this.handleGpacMessage(jsonData);
      } catch (error) {
        console.error('Error parsing direct JSON message:', error);
        this.emit('error', 'Failed to parse direct JSON message');
      }
    });

    this.ws.addMessageHandler('CONI', (_, dataView) => {
      try {
        const reader = new DataViewReader(dataView, 4);
        const text = reader.getText();
        console.log('[DEBUG] CONI message:', text);

        if (text.startsWith('json:')) {
          const jsonText = text.slice(5);
          const jsonData = JSON.parse(jsonText);
          this.handleGpacMessage(jsonData);
          
        }
      } catch (error) {
        console.error('Error parsing CONI message:', error);
        this.emit('error', 'Failed to parse CONI message');
      }
    });

    this.ws.addDefaultMessageHandler((_, dataView) => {
      try {
        const text = new TextDecoder().decode(dataView.buffer);
        if (text.startsWith('{')) {
          // Probably JSON
          const jsonData = JSON.parse(text);
          this.handleGpacMessage(jsonData);
        } else {
          console.log('[DEBUG] Default message:', text);
        }
      } catch (error) {
        console.error('Error handling default message:', error);
        this.emit('error', 'Failed to handle default message');
      }
    });

    // Ajout d'un gestionnaire d'erreur global
    this.ws.addErrorHandler((error: any) => {
      const errorMessage = typeof error === 'string' ? error : 'Unknown WebSocket error';
      console.error('[WebSocketBase] Error:', error);
      this.emit('error', errorMessage);
    });
  }
  

  private throttledUpdateRealTimeMetrics = throttle(
    (payload: any) => {
      if (payload.bytesProcessed > 0) {
        this.emit('realTimeMetricsUpdate', payload);
      }
    },
    1000,
    { leading: true, trailing: true },
  );

  private isValidFilterData(filter: any): filter is GpacNodeData {
    return (
      filter &&
      typeof filter === 'object' &&
      'idx' in filter &&
      typeof filter.idx === 'number' &&
      'name' in filter &&
      typeof filter.name === 'string' &&
      'type' in filter &&
      typeof filter.type === 'string' &&
      'status' in filter &&
      (filter.status === null || typeof filter.status === 'string') &&
      'bytes_done' in filter &&
      typeof filter.bytes_done === 'number'
    );
  }

  private handleGpacMessage(data: any): void {
    if (!data.message) {
      console.warn('[DEBUG] Received message without type:', data);
      return;
    }

    switch (data.message) {
      case 'filters':
        this.emit('filters', data.filters);
        break;

      case 'update':
        if (Array.isArray(data.filters)) {
          this.emit('update', data.filters);
        }
        break;

      case 'details':
        if (data.filter) {
          const filterId = data.filter.idx.toString();

          // Validate data.filter structure
          if (!this.isValidFilterData(data.filter)) {
            console.error('Invalid filter data received:', data.filter);
            return;
          }

          // Support for single filter
          if (data.filter.idx === this.currentFilterId) {
            this.emit('filterDetails', data.filter);
          }

          // Support for multiple filters
          if (this.activeSubscriptions.has(filterId)) {
            this.emit('filterDataUpdate', {
              id: filterId,
              data: data.filter,
            });

            this.emit('realTimeMetricsUpdate', {
              filterId,
              bytes_done: data.filter.bytes_done,
              buffer: data.filter.buffer,
              buffer_total: data.filter.buffer_total,
            });

            const firstPid =
              data.filter.ipid &&
              data.filter.ipid[Object.keys(data.filter.ipid)[0]];

            // Use throttled emit
            this.throttledUpdateRealTimeMetrics({
              filterId,
              bytes_done: data.filter.bytes_done,
              buffer: firstPid?.buffer,
              buffer_total: firstPid?.buffer_total,
            });
          }
        }
        break;

      default:
        console.log('[DEBUG] Unknown message type:', data.message);
    }
  }

  public setCurrentFilterId(id: number | null): void {
    console.log('[WebSocket] Setting current filter ID:', id);
    this.currentFilterId = id;
  }

  public getCurrentFilterId(): number | null {
    return this.currentFilterId;
  }

  public subscribeToFilter(idx: string): void {
    if (this.activeSubscriptions.has(idx)) {
      return;
    }

    this.activeSubscriptions.add(idx);
    this.sendMessage({
      message: 'get_details',
      idx: parseInt(idx),
    });

    console.log(`[WebSocket] Subscribed to filter ${idx}`);
    this.emit('filterSubscribed', idx);
  }

  public unsubscribeFromFilter(idx: string): void {
    if (!this.activeSubscriptions.has(idx)) {
      return;
    }

    this.activeSubscriptions.delete(idx);
    this.sendMessage({
      message: 'stop_details',
      idx: parseInt(idx),
    });

    console.log(`[WebSocket] Unsubscribed from filter ${idx}`);
    this.emit('filterUnsubscribed', idx);
  }

  public connect(address?: string): void {
    if (this.isConnecting) return;

    if (address) {
      this.address = address;
    }

    console.log(`Attempting to connect to GPAC at ${this.address}...`);
    this.isConnecting = true;
    this.emit('loading', true);

    try {
      this.ws.connect(this.address);
    } catch (error) {
      console.error('Error connecting to GPAC:', error);
      this.isConnecting = false;
      this.handleDisconnect();
      this.emit('error', 'Failed to connect to GPAC');
    }
  }

  public isConnected(): boolean {
    return this.ws.isConnected();
  }

  private handleDisconnect(): void {
    if (this.isConnecting) return;

    if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);

      this.reconnectTimeout = setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, delay);
    } else {
      this.emit('error', 'Failed to connect to GPAC after multiple attempts');
    }
  }

  public disconnect(): void {
    console.log('[WebSocket] Initiating disconnect...');

    // Clean up reconnect timeout
    if (this.reconnectTimeout) {
      console.log('[WebSocket] Clearing reconnect timeout');
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    // Clean up active subscriptions
    if (this.activeSubscriptions.size > 0) {
      console.log(
        '[WebSocket] Clearing active subscriptions:',
        Array.from(this.activeSubscriptions),
      );
      this.activeSubscriptions.clear();
    }

    // Reset state
    this.isConnecting = false;
    this.currentFilterId = null;
    this.reconnectAttempts = 0;

    // Disconnect WebSocket
    this.ws.disconnect();

    this.emit('disconnected');
    console.log('[WebSocket] Disconnect complete');
  }

  public sendMessage(message: any): void {
    if (!this.ws.isConnected()) {
      console.warn('[WebSocket] Cannot send message: Not connected');
      return;
    }

    try {
      const jsonString = 'CONI' + 'json:' + JSON.stringify(message);
      console.log('Sending message:', jsonString);
      this.ws.send(jsonString);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  public getFilterDetails(idx: number): void {
    if (this.currentFilterId !== null && this.currentFilterId !== idx) {
      this.sendMessage({
        message: 'stop_details',
        idx: this.currentFilterId,
      });
    }

    this.currentFilterId = idx;

    this.sendMessage({
      message: 'get_details',
      idx: idx,
    });
  }

  public stopFilterDetails(idx: number): void {
    this.sendMessage({
      message: 'stop_details',
      idx: idx,
    });
  }
}



