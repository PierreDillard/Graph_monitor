import { WebSocketBase } from './WebSocketBase';
import { DataViewReader } from './DataViewReader';
import { store } from '../store';
import { GpacNodeData } from '../types/gpac/index';

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
import { GpacCommunicationAdapter } from './communication/adapters/GpacCommunicationAdapter';
import { IGpacCommunication, GpacMessage } from './communication/types/IgpacCommunication';
import { throttle } from 'lodash';

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
    private notifyError?: (error: Error) => void;
    private notifyFilterUpdate?: (filter: GpacNodeData) => void;
    private notifyConnectionStatus?: (connected: boolean) => void;

    public onMessage?: (message: any) => void;
    public onError?: (error: Error) => void;
    public onDisconnect?: () => void;

    private constructor(private readonly address: string = 'ws://127.0.0.1:17815/rmt') {
        this.ws = new WebSocketBase();
        this.setupWebSocketHandlers();
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

      private handleServiceError(error: Error): void {
        this.notifyError?.(error);
      }
      private handleServiceMessage(data: any): void {
        if (data.message === 'filters' || data.message === 'update') {
          data.filters?.forEach((filter: GpacNodeData) => {
            this.notifyFilterUpdate?.(filter);
          });
        }
      }
    public static getInstance(): GpacService {
        if (!GpacService.instance) {
            GpacService.instance = new GpacService();
        }
        return GpacService.instance;
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
          const formattedMessage = {
            message: message.type,
            ...message
        };
        const jsonString = 'CONIjson:' + JSON.stringify(formattedMessage);
        this.ws.send(jsonString);
        } catch (error) {
            console.error('[GpacService] Send error:', error);
            throw error;
        }
    }

    public getFilterDetails(idx: number): void {
      // Si un filtre est déjà sélectionné, stopper sa surveillance
      if (this.currentFilterId !== null && this.currentFilterId !== idx) {
          this.sendMessage({
              type: 'stop_details',
              idx: this.currentFilterId
          });
      }
  
      // Définir le nouveau filtre comme courant
      this.currentFilterId = idx;
  
      // Requête des détails
      this.sendMessage({
          type: 'get_details',
          idx: idx
      });
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
        this.sendMessage({
            type: 'get_details',
            idx: parseInt(idx)
        });

        console.log(`[GpacService] Subscribed to filter ${idx}`);
    }

    public unsubscribeFromFilter(idx: string): void {
        if (!this.activeSubscriptions.has(idx)) return;

        this.activeSubscriptions.delete(idx);
        this.sendMessage({
            type: 'stop_details',
            idx: parseInt(idx)
        });

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
        try {
            const text = new TextDecoder().decode(dataView.buffer);
            console.log('[GpacService] JSON message received:', text);
            const data = JSON.parse(text);
            this.processGpacMessage(data);
        } catch (error) {
            console.error('[GpacService] JSON parsing error:', error);
        }
    }

    private handleConiMessage(_: WebSocketBase, dataView: DataView): void {
        try {
            const reader = new DataViewReader(dataView, 4);
            const text = reader.getText();
            
            if (text.startsWith('json:')) {
                const jsonText = text.slice(5);
                const data = JSON.parse(jsonText);
                this.processGpacMessage(data);
            }
        } catch (error) {
            console.error('[GpacService] CONI message parsing error:', error);
        }
    }

    private handleDefaultMessage(_: WebSocketBase, dataView: DataView): void {
        try {
            const text = new TextDecoder().decode(dataView.buffer);
            if (text.startsWith('{')) {
                const data = JSON.parse(text);
                this.processGpacMessage(data);
            }
        } catch (error) {
            console.error('[GpacService] Default message parsing error:', error);
        }
    }

    private processGpacMessage(data: any): void {
        this.onMessage?.(data);

        if (!data.message) {
            console.warn('[GpacService] Received message without type:', data);
            return;
        }

        switch (data.message) {
            case 'filters':
                this.handleFiltersMessage(data);
                break;
            case 'update':
                this.handleUpdateMessage(data);
                break;
            case 'details':
                this.handleDetailsMessage(data);
                break;
            default:
                console.log('[GpacService] Unknown message type:', data.message);
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

    private handleFiltersMessage(data: any): void {
        store.dispatch(setLoading(false));
        store.dispatch(updateGraphData(data.filters));
    }

    private handleUpdateMessage(data: any): void {
        if (Array.isArray(data.filters)) {
            store.dispatch(updateGraphData(data.filters));
        }
    }

    private handleDetailsMessage(data: any): void {
        if (!data.filter) return;

        const filterId = data.filter.idx.toString();
        
        if (data.filter.idx === this.currentFilterId) {
            store.dispatch(setFilterDetails(data.filter));
        }

        if (this.activeSubscriptions.has(filterId)) {
            store.dispatch(updateFilterData({
                id: filterId,
                data: data.filter
            }));

            this.throttledUpdateRealTimeMetrics({
                filterId,
                bytes_done: data.filter.bytes_done,
                buffer: data.filter.buffer,
                buffer_total: data.filter.buffer_total
            });
        }
    }
}

export const gpacService = GpacService.getInstance();