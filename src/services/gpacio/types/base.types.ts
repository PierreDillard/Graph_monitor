import { ConnectionConfig } from './connection.types';
import { GPACMessageType } from './message.types';

export interface IGPACIOProvider {
    connect(config: ConnectionConfig): Promise<void>;
    disconnect(): void;
    sendMessage(message: GPACMessage): void;
    isConnected(): boolean;
  }
  
  export interface GPACMessage {
    type: GPACMessageType;
    payload: unknown;
  }
  

  
