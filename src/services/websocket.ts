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
}
