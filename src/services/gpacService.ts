import { WebSocketBase } from './WebSocketBase';
import { isEqual } from 'lodash';
import { store } from '../store';
import { GpacNodeData } from '../types/gpac';
import {
  updateFilterData,
  setSelectedFilters,
} from '../store/slices/multiFilterSlice';
import { updateRealTimeMetrics } from '../store/slices/filter-monitoringSlice';
import {
  updateGraphData,
  setLoading,
  setError,
  setFilterDetails,
} from '../store/slices/graphSlice';
import { DataViewReader } from './DataViewReader';
import throttle from 'lodash/throttle';

export class GpacService {
  private ws: WebSocketBase;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnecting = false;

  constructor(private address: string = 'ws://127.0.0.1:17815/rmt') {
    this.ws = new WebSocketBase();
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.ws.addConnectHandler(() => {
      console.log('Connected to GPAC WebSocket');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      store.dispatch(setError(null));

      // Ask filters
      this.sendMessage({ message: 'get_all_filters' });
    });

    this.ws.addDisconnectHandler(() => {
      console.log('Disconnected from GPAC WebSocket');
      this.handleDisconnect();
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
      }
    });

    this.ws.addDefaultMessageHandler((_, dataView) => {
      try {
        const text = new TextDecoder().decode(dataView.buffer);
        if (text.startsWith('{')) {
          //Probably JSON
          const jsonData = JSON.parse(text);
          this.handleGpacMessage(jsonData);
        } else {
          console.log('[DEBUG] Default message:', text);
        }
      } catch (error) {
        console.error('Error handling default message:', error);
      }
    });
  }

  private activeSubscriptions: Set<string> = new Set();

  private throttledUpdateRealTimeMetrics = throttle(
    (payload) => {
      if (payload.bytesProcessed > 0) {
        // Filter inusual values
        store.dispatch(updateRealTimeMetrics(payload));
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
    const currentState = store.getState();

    if (!data.message) {
      console.warn('[DEBUG] Received message without type:', data);
      return;
    }

    switch (data.message) {
      case 'filters':
        store.dispatch(setLoading(false));
        if (!isEqual(currentState.graph.filters, data.filters)) {
          store.dispatch(updateGraphData(data.filters));
        } else {
          console.error('[DEBUG] Invalid filters data:', data.filters);
        }
        break;

      case 'update':
        if (Array.isArray(data.filters)) {
          store.dispatch(updateGraphData(data.filters));
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
            store.dispatch(setFilterDetails(data.filter));
          }

          // Support for multiple filters
          if (this.activeSubscriptions.has(filterId)) {
            store.dispatch(
              updateFilterData({
                id: filterId,
                data: data.filter,
              }),
            );
            store.dispatch(
              updateRealTimeMetrics({
                filterId,
                bytes_done: data.filter.bytes_done,
                buffer: data.filter.buffer,
                buffer_total: data.filter.buffer_total,
              }),
            );

            const firstPid =
              data.filter.ipid &&
              data.filter.ipid[Object.keys(data.filter.ipid)[0]];

            // Use throttled dispatch
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
  private currentFilterId: number | null = null;

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
  }
  public connect(): void {
    if (this.isConnecting) return;

    console.log('Attempting to connect to GPAC...');
    this.isConnecting = true;
    store.dispatch(setLoading(true));

    try {
      this.ws.connect(this.address);
    } catch (error) {
      console.error('Error connecting to GPAC:', error);
      this.isConnecting = false;
      this.handleDisconnect();
    }
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
      store.dispatch(setError('Failed to connect to GPAC'));
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
    //Clean up active subscriptions
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

    // Stop current filter details
    store.dispatch(setSelectedFilters([]));
    store.dispatch(setFilterDetails(null));

    // Disconnect WebSocket
    if (this.ws) {
      console.log('[WebSocket] Disconnecting WebSocket');
      this.ws.disconnect();
    }

    console.log('[WebSocket] Disconnect complete');
  }

  public sendMessage(message: any): void {
    if (!this.ws.isConnected()) return;

    try {
      const jsonString = 'CONI' + 'json:' + JSON.stringify(message);
      console.log('Sending message:', jsonString);
      this.ws.send(jsonString);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  public getFilterDetails(idx: number): void {
    // If a filter is already selected, stop it
    if (this.currentFilterId !== null && this.currentFilterId !== idx) {
      this.sendMessage({
        message: 'stop_details',
        idx: this.currentFilterId,
      });
    }

    // Define the new filter as the current one
    this.currentFilterId = idx;

    // Ask for details
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

export const gpacService = new GpacService();
