import { ConnectionStatus, GpacMessage, GpacCommunicationError } from '../communication/IgpacCommunication';

/**
 * Handler interface for GPAC communication events.
 * Implements Observer pattern for WebSocket message processing.
 */
export interface IGpacMessageHandler {
    /**
     * Processes incoming GPAC messages
     * @param message Typed GPAC message
     */
    onMessage(message: GpacMessage): void;

    /**
     * Handles communication errors
     * @param error Strongly typed communication error
     */
    onError?(error: GpacCommunicationError): void;

    /**
     * Processes connection state changes
     * @param status Current connection status
     */
    onStatusChange?(status: ConnectionStatus): void;

    /**
     * Handles successful connection events
     */
    onConnect?(): void;

    /**
     * Processes disconnection events
     */
    onDisconnect?(): void;
}