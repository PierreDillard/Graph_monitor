import { WebSocketBase } from '../WebSocketBase';
import { store } from '../../store';
import { GpacNodeData } from '../../types/domain/gpac/model';
import { updateFilterData, setSelectedFilters } from '../../store/slices/multiFilterSlice';
import { updateRealTimeMetrics } from '../../store/slices/filter-monitoringSlice';
import { updateGraphData, setLoading, setError, setFilterDetails } from '../../store/slices/graphSlice';
import { GpacCommunicationAdapter } from '../communication/adapters/GpacCommunicationAdapter';
import { IGpacCommunication, GpacMessage } from '../../types/communication/IgpacCommunication';
import { throttle } from 'lodash';
import { messageProcessor } from './messageProcessor';

export const DEFAULT_WS_CONFIG = {
  address: 'ws://127.0.0.1:17815/rmt',
  maxReconnectAttempts: 5,
  reconnectDelay: 1000,
  maxDelay: 10000,
};

export class GpacService {
  private static instance: GpacService | null = null;
  private ws: WebSocketBase;
  private reconnectAttempts: number = 0;
  private readonly MAX_RECONNECT_ATTEMPTS: number = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnecting: boolean = false;
  private currentFilterId: number | null = null;
  private activeSubscriptions: Set<string> = new Set();
  private communicationAdapter: GpacCommunicationAdapter | null = null;
  // Notification properties
  private notifyFilterUpdate?: (filter: GpacNodeData) => void;
  private notifyError?: (error: Error) => void;
  private notifyConnectionStatus?: (connected: boolean) => void;

  public onMessage?: (message: any) => void;
  public onError?: (error: Error) => void;
  public onDisconnect?: () => void;

  private constructor(private readonly address: string = DEFAULT_WS_CONFIG.address) {
    this.ws = new WebSocketBase();
    this.setupWebSocketHandlers();
  }

  public static getInstance(): GpacService {
    if (!GpacService.instance) {
      GpacService.instance = new GpacService();
    }
    return GpacService.instance;
  }

  public setNotificationHandlers({
    onError,
    onFilterUpdate,
    onConnectionStatus,
  }: {
    onError?: (error: Error) => void;
    onFilterUpdate?: (filter: GpacNodeData) => void;
    onConnectionStatus?: (connected: boolean) => void;
  }) {
    this.notifyError = onError;
    this.notifyFilterUpdate = onFilterUpdate;
    this.notifyConnectionStatus = onConnectionStatus;
  }

  public getCommunicationAdapter(): IGpacCommunication {
    if (!this.communicationAdapter) {
      this.communicationAdapter = new GpacCommunicationAdapter(this);
    }
    return this.communicationAdapter;
  }

  public async connect(): Promise<void> {
    if (this.isConnecting) return;
    console.log('[GpacService] Initiating connection to GPAC');
    this.isConnecting = true;
    store.dispatch(setLoading(true));
    try {
      await this.ws.connect(this.address);
      this.notifyConnectionStatus?.(true);
    } catch (error) {
      this.notifyError?.(error as Error);
      this.notifyConnectionStatus?.(false);
      // Appel de handleDisconnect pour initier la reconnexion
      this.handleDisconnect();
      throw error;
    }
  }

  public disconnect(): void {
    console.log('[GpacService] Initiating disconnect sequence');
    this.cleanup();
    this.ws.disconnect();
    store.dispatch(setSelectedFilters([]));
    store.dispatch(setFilterDetails(null));
  }

  public sendMessage(message: GpacMessage): void {
    if (!this.ws.isConnected()) {
      throw new Error('[GpacService] WebSocket not connected');
    }
    try {
      const formattedMessage = { message: message.type, ...message };
      const jsonString = 'CONIjson:' + JSON.stringify(formattedMessage);
      this.ws.send(jsonString);
    } catch (error) {
      console.error('[GpacService] Send error:', error);
      throw error;
    }
  }

  public getFilterDetails(idx: number): void {
    if (this.currentFilterId !== null && this.currentFilterId !== idx) {
      this.sendMessage({ type: 'stop_details', idx: this.currentFilterId });
    }
    this.currentFilterId = idx;
    this.sendMessage({ type: 'get_details', idx: idx });
  }

  public setCurrentFilterId(id: number | null): void {
    console.log('[GpacService] Setting current filter ID:', id);
    this.currentFilterId = id;
  }

  public getCurrentFilterId(): number | null {
    return this.currentFilterId;
  }

  public subscribeToFilter(idx: string): void {
    if (this.activeSubscriptions.has(idx)) return;
    this.activeSubscriptions.add(idx);
    this.sendMessage({ type: 'get_details', idx: parseInt(idx, 10) });
    console.log(`[GpacService] Subscribed to filter ${idx}`);
  }

  public unsubscribeFromFilter(idx: string): void {
    if (!this.activeSubscriptions.has(idx)) return;
    this.activeSubscriptions.delete(idx);
    this.sendMessage({ type: 'stop_details', idx: parseInt(idx, 10) });
    console.log(`[GpacService] Unsubscribed from filter ${idx}`);
  }

  private readonly throttledUpdateRealTimeMetrics = throttle(
    (payload: any) => {
      if (payload.bytesProcessed > 0) {
        store.dispatch(updateRealTimeMetrics(payload));
      }
    },
    1000,
    { leading: true, trailing: true }
  );

  private setupWebSocketHandlers(): void {
    this.ws.addConnectHandler(() => {
      console.log('[GpacService] Connection established');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      store.dispatch(setError(null));
      this.sendMessage({ type: 'get_all_filters' });
    });
    this.ws.addMessageHandler('{"me', this.handleJsonMessage.bind(this));
    this.ws.addMessageHandler('CONI', this.handleConiMessage.bind(this));
    this.ws.addDefaultMessageHandler(this.handleDefaultMessage.bind(this));
  }

  private handleJsonMessage(_: WebSocketBase, dataView: DataView): void {
    messageProcessor.processJsonMessage(dataView, this);
  }

  private handleConiMessage(_: WebSocketBase, dataView: DataView): void {
    messageProcessor.processConiMessage(dataView, this);
  }

  private handleDefaultMessage(_: WebSocketBase, dataView: DataView): void {
    messageProcessor.processDefaultMessage(dataView, this);
  }

  // Ces méthodes sont appelées depuis le module messageProcessor.
  public handleFiltersMessage(data: any): void {
    store.dispatch(setLoading(false));
    store.dispatch(updateGraphData(data.filters));
    if (data.filters) {
      data.filters.forEach((filter: GpacNodeData) => {
        this.notifyFilterUpdate?.(filter);
      });
    }
  }

  public handleUpdateMessage(data: any): void {
    if (Array.isArray(data.filters)) {
      store.dispatch(updateGraphData(data.filters));
    }
  }

  public handleDetailsMessage(data: any): void {
    if (!data.filter) return;
    const filterId = data.filter.idx.toString();
    if (data.filter.idx === this.currentFilterId) {
      store.dispatch(setFilterDetails(data.filter));
    }
    if (this.activeSubscriptions.has(filterId)) {
      store.dispatch(updateFilterData({ id: filterId, data: data.filter }));
      this.throttledUpdateRealTimeMetrics({
        filterId,
        bytes_done: data.filter.bytes_done,
        buffer: data.filter.buffer,
        buffer_total: data.filter.buffer_total,
      });
    }
  }

  private cleanup(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.isConnecting = false;
    this.currentFilterId = null;
    this.reconnectAttempts = 0;
    this.activeSubscriptions.clear();
  }

  private handleDisconnect(): void {
    this.onDisconnect?.();
    if (!this.isConnecting && this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectAttempts++;
        this.connect().catch(console.error);
      }, delay);
    } else {
      store.dispatch(setError('Failed to connect to GPAC'));
    }
  }
}

export const gpacService = GpacService.getInstance();
