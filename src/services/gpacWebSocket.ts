import { WebSocketBase } from './WebSocketBase';
import { store } from '../store';
import { updateGraphData, setLoading, setError } from '../store/slices/graphSlice';
import { GpacNodeData } from '../types/gpac';
import { DataViewReader } from './DataViewReader';

export class GpacWebSocket {
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
    this.ws.addMessageHandler("{\"me", (_, dataView) => {
      try {
        const text = new TextDecoder().decode(dataView.buffer);
        console.log('[DEBUG] Direct JSON message:', text);
        const jsonData = JSON.parse(text);
        this.handleGpacMessage(jsonData);
      } catch (error) {
        console.error('Error parsing direct JSON message:', error);
      }
    });

    // Handler pour les messages CONI
    this.ws.addMessageHandler("CONI", (_, dataView) => {
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
          // C'est probablement du JSON
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

  private handleGpacMessage(data: any): void {
    console.log('[DEBUG] Handling GPAC message:', data);
    
    if (!data.message) {
      console.warn('[DEBUG] Received message without type:', data);
      return;
    }

    switch (data.message) {
      case 'filters':
        console.log('[DEBUG] Received filters message:', data.filters);
        store.dispatch(setLoading(false));
        if (Array.isArray(data.filters)) {
          store.dispatch(updateGraphData(data.filters));
        } else {
          console.error('[DEBUG] Invalid filters data:', data.filters);
        }
        break;

      case 'update':
        console.log('[DEBUG] Received update message:', data.filters);
        if (Array.isArray(data.filters)) {
          store.dispatch(updateGraphData(data.filters));
        }
        break;

      default:
        console.log('[DEBUG] Unknown message type:', data.message);
    }
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
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.isConnecting = false;
    this.ws.disconnect();
  }

  public sendMessage(message: any): void {
    if (!this.ws.isConnected()) return;
    
    try {
      // Important: Préfixer avec CONI comme dans l'ancien code
      const jsonString = "CONI" + "json:" + JSON.stringify(message);
      console.log('Sending message:', jsonString);
      this.ws.send(jsonString);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  public getFilterDetails(idx: number): void {
    this.sendMessage({
      message: 'get_details',
      idx: idx
    });
  }

  public stopFilterDetails(idx: number): void {
    this.sendMessage({
      message: 'stop_details',
      idx: idx
    });
  }
}

export const gpacWebSocket = new GpacWebSocket();