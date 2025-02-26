import { IGpacMessageHandler } from './IGpacMessageHandler';

/**
 * Configuration interface for GPAC communication channels.
 * Provides necessary parameters for connection management and retry policies.
 */
export interface IGpacCommunicationConfig {
    /** WebSocket endpoint address */
    address: string;
    
    /** Maximum number of reconnection attempts before failing */
    maxReconnectAttempts: number;
    
    /** Base delay (in ms) between reconnection attempts */
    reconnectDelay: number;
    
    /** Optional initial connection delay */
    initialDelay?: number;
    
    /** Maximum delay cap for exponential backoff */
    maxDelay?: number;
    
    /** Optional timeout for connection attempts */
    connectionTimeout?: number;
}

/**
 * Core message types supported by GPAC communication protocol.
 * Extensible for future message types.
 */
export type GpacMessageType = 
    | 'get_all_filters'
    | 'get_details'
    | 'stop_details'
    | 'update_arg'
    | 'get_png'
    | 'filters'
    | 'update'
    | 'details';

/**
 * Base message structure for GPAC communication.
 * All specific message types extend this interface.
 */
export interface GpacMessageBase {
    readonly type: GpacMessageType;
    readonly timestamp?: number;
}

/**
 * Union type of all possible GPAC messages.
 * Provides type safety for message handling.
 */
export interface GpacMessage {
    type: GpacMessageType;

    message?: GpacMessageType;
    [key: string]: any;
}

/**
 * Connection status enumeration for precise state management.
 */
export enum ConnectionStatus {
    DISCONNECTED = 'DISCONNECTED',
    CONNECTING = 'CONNECTING',
    CONNECTED = 'CONNECTED',
    RECONNECTING = 'RECONNECTING',
    ERROR = 'ERROR'
}

/**
 * Event types for connection lifecycle management.
 */
export enum ConnectionEventType {
    CONNECT = 'connect',
    DISCONNECT = 'disconnect',
    MESSAGE = 'message',
    ERROR = 'error',
    STATUS_CHANGE = 'status_change'
}

/**
 * Core interface for GPAC communication implementations.
 * Provides contract for WebSocket and future communication channels.
 */
export interface IGpacCommunication {
    /**
     * Initiates connection with GPAC service.
     * @param config - Connection configuration parameters
     * @throws {GpacConnectionError} On connection failure
     */
    connect(config: IGpacCommunicationConfig): Promise<void>;

    /**
     * Gracefully terminates connection.
     * Cleans up resources and event listeners.
     */
    disconnect(): void;

    /**
     * Sends message to GPAC service.
     * @param message - Formatted GPAC message
     * @throws {GpacMessageError} On send failure
     */
    send(message: GpacMessage): void;

    /**
     * Registers message handler for specific message types.
     * @param handler - Message handler implementation
     * @returns Cleanup function for handler removal
     */
    registerHandler(handler: IGpacMessageHandler): () => void;

    /**
     * Removes specific message handler.
     * @param handler - Previously registered handler
     */
    unregisterHandler(handler: IGpacMessageHandler): void;

    /**
     * Queries current connection status.
     * @returns Current connection state
     */
    getStatus(): ConnectionStatus;

    /**
     * Verifies active connection state.
     * @returns Boolean indicating connection status
     */
    isConnected(): boolean;
}

/**
 * Custom error class for GPAC communication failures.
 */
export class GpacCommunicationError extends Error {
    constructor(
        message: string,
        public readonly code?: string,
        public readonly originalError?: Error
    ) {
        super(message);
        this.name = 'GpacCommunicationError';
    }
}