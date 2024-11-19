

import { WebSocketBase } from './WebSocketBase';
import { store } from '../store';
import { updateGraphData, setLoading, setError } from '../store/slices/graphSlice';
import { GpacNodeData } from '../types/gpac';

interface MessageQueue {
  parts: { [key: number]: string };
  finalPart: number;
}

export class GpacWebSocket {
  private ws: WebSocketBase;
  private messageIndex: number = 0;
  private readonly MAX_MSGLEN = 800;
  private messageQueues: { [key: number]: MessageQueue } = {};

  constructor(private address: string = 'ws://127.0.0.1:17815/rmt') {
    this.ws = new WebSocketBase();
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.ws.addConnectHandler(() => {
      console.log('Connected to GPAC WebSocket');
      this.sendMessage({ message: 'get_all_filters' });
    });

    this.ws.addDisconnectHandler(() => {
      console.log('Disconnected from GPAC WebSocket');
      store.dispatch(setError('WebSocket connection lost'));
    });

    this.ws.addDefaultMessageHandler((_, dataView) => {
      const text = new TextDecoder().decode(dataView);
      this.handleMessage(text);
    });
  }

  private handleMessage(data: string): void {
    if (!data.startsWith('json:')) return;

    const [prefix, index, part, final, ...rest] = data.split(':');
    const content = rest.join(':');
    const messageIndex = parseInt(index);
    const partNumber = parseInt(part);
    const isFinal = parseInt(final) === 1;

 
    if (!this.messageQueues[messageIndex]) {
      this.messageQueues[messageIndex] = {
        parts: {},
        finalPart: -1
      };
    }

    // Store this part
    this.messageQueues[messageIndex].parts[partNumber] = content;
    if (isFinal) {
      this.messageQueues[messageIndex].finalPart = partNumber;
      this.processCompleteMessage(messageIndex);
    }
  }

  private processCompleteMessage(messageIndex: number): void {
    const queue = this.messageQueues[messageIndex];
    if (!queue) return;

    // Check if we have all parts
    const allParts = [];
    for (let i = 0; i <= queue.finalPart; i++) {
      if (!(i in queue.parts)) return;
      allParts.push(queue.parts[i]);
    }

    // Combine and process
    const message = allParts.join('');
    try {
      const jsonData = JSON.parse(message);
      this.handleGpacMessage(jsonData);
    } catch (error) {
      console.error('Error parsing message:', error);
    }

    // Cleanup
    delete this.messageQueues[messageIndex];
  }

  private handleGpacMessage(data: any): void {
    switch (data.message) {
      case 'filters':
        store.dispatch(setLoading(false));
        store.dispatch(updateGraphData(data.filters));
        break;
      case 'update':
        store.dispatch(updateGraphData(data.filters));
        break;
      case 'details':
        if (data.filter) {
          // À implémenter: mise à jour des détails du filtre
          console.log('Filter details received:', data.filter);
        }
        break;
      default:
        console.warn('Unknown message type:', data.message);
    }
  }

  public connect(): void {
    store.dispatch(setLoading(true));
    this.ws.connect(this.address);
  }

  public disconnect(): void {
    this.ws.disconnect();
  }

  public sendMessage(message: any): void {
    const jsonString = JSON.stringify(message);
    const parts = [];
    for (let i = 0; i < jsonString.length; i += this.MAX_MSGLEN) {
      parts.push(jsonString.slice(i, i + this.MAX_MSGLEN));
    }

    parts.forEach((part, index) => {
      const isFinal = index === parts.length - 1 ? 1 : 0;
      const messageFormat = `json:${this.messageIndex}:${index}:${isFinal}:${part}`;
      this.ws.send(messageFormat);
    });

    this.messageIndex = (this.messageIndex + 1) % 10000;
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

  public updateFilterArgument(
    idx: number, 
    name: string, 
    argName: string, 
    newValue: string
  ): void {
    this.sendMessage({
      message: 'update_arg',
      idx: idx,
      name: name,
      argName: argName,
      newValue: newValue
    });
  }

  public requestPNG(filter: GpacNodeData): void {
    this.sendMessage({
      message: 'get_png',
      idx: filter.idx,
      name: filter.name
    });
  }
}

export const gpacWebSocket = new GpacWebSocket();