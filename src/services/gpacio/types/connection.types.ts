export interface ConnectionConfig {
    url: string;
    reconnectAttempts: number;
    reconnectDelay: number;
    heartbeatInterval?: number;
  }
  
  export interface ConnectionState {
    isConnected: boolean;
    lastError: Error | null;
    reconnectCount: number;
  }