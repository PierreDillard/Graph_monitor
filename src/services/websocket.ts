import { store } from '../store';
import { updateGraphData } from '../store/slices/graphSlice';
import { GpacNodeData } from '@/types/gpac';

export class webSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: number | null = null;
  private messageBuffer: string = '';
  private messageIndex = 0;

  constructor(private url: string = 'ws://localhost:8080') {}

  connect() {
    try {
      this.ws = new WebSocket(this.url);
      this.setupEventHandlers();
    } catch (error) {
        console.error('Error connecting to WebSocket:', error);
        this.handleReconnect();
    }
}

private setupEventHandlers() {
    if (!this.ws) {
        return;
    }

    this.ws.onopen = () => {
        console.log('WebSocket connection established');
        this.reconnectAttempts = 0;
        this.sendMessage({ message: 'get_all_filters' });
    };

    this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
    };

    this.ws.onclose = () => {
        console.log('WebSocket connection closed');
        this.handleReconnect();
    };

    this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        
    };

}

private handleMessage(data: string) {
    try {
      if (!data.startsWith('json:')) return;
      
      // Parse message format: json:index:part:final:content
      const [prefix, index, part, final, ...rest] = data.split(':');
      const content = rest.join(':');
      
      if (parseInt(index) !== this.messageIndex) {
        // New message started, clear buffer
        this.messageBuffer = content;
        this.messageIndex = parseInt(index);
      } else {
        // Append to existing message
        this.messageBuffer += content;
      }
      
      // If this is the final part, process the complete message
      if (parseInt(final) === 1) {
        const jsonData = JSON.parse(this.messageBuffer);
        this.messageBuffer = '';
        
        switch (jsonData.message) {
        case 'filters':
          this.handleFiltersUpdate(jsonData.filters);
          break;
        case 'update':
          this.handleFiltersUpdate(jsonData.filters);
          break;
        case 'details':
          this.handleFilterDetails(jsonData.filter);
          break;
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  }


private handleFiltersUpdate(filters: GpacNodeData[]) {
    store.dispatch(updateGraphData(filters));
}

private handleFilterDetails(details: GpacNodeData) {
    store.dispatch(updateGraphData([details]));
}

sendMessage(message: any) {
    if(this.ws?.readyState !== WebSocket.OPEN) {
        if (this.ws) {
            this.ws.send('json' + JSON.stringify(message));
        }
    }
        
    }

    private handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
          this.reconnectTimeout = window.setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
          }, delay);
        }
      }

      requestFilterDetails(idx: number) {
        this.sendMessage({ message: 'get_details', 
        idx: idx
        });
      }
stopFilterDetails(idx: number) {
    this.sendMessage({ message: 'stop_details',
         idx: idx
         });
}

updateFilterArguments(idx: number, name: string, argName: string, newValue: string) {
    this.sendMessage({ message: 'update_arg',
    idx: idx,
    name: name,
    arg: argName,
    value: newValue
    });
}

disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.close();
    }
  }
}

export const websocketService = new webSocketService();