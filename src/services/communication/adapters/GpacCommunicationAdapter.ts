import { 
    IGpacCommunication,
    IGpacCommunicationConfig,
    GpacMessage,
    ConnectionStatus,
    GpacCommunicationError
} from '../types/IgpacCommunication';
import { IGpacMessageHandler } from '../types/IGpacMessageHandler';
import { GpacService } from '../../gpacService';
import { store } from '../../../store';
import { setError, setLoading } from '../../../store/slices/graphSlice';

/**
 * Adapts existing GpacService to IGpacCommunication interface.
 * Implements Adapter pattern for legacy system integration.
 */
export class GpacCommunicationAdapter implements IGpacCommunication {
    private handlers: Set<IGpacMessageHandler>;
    private status: ConnectionStatus;
    private connectionConfig: IGpacCommunicationConfig | null;
    private reconnectAttempts: number;
    private reconnectTimeout: NodeJS.Timeout | null;

    constructor(private readonly gpacService: GpacService) {
        this.handlers = new Set();
        this.status = ConnectionStatus.DISCONNECTED;
        this.connectionConfig = null;
        this.reconnectAttempts = 0;
        this.reconnectTimeout = null;

        // Bind GpacService event handlers
        this.gpacService.onMessage = this.handleServiceMessage.bind(this);
        this.gpacService.onError = this.handleServiceError.bind(this);
        this.gpacService.onDisconnect = this.handleServiceDisconnect.bind(this);
    }
    protected formatOutgoingMessage(message: GpacMessage): string {
        const gpacMessage = {
            message: message.type,
            ...message
        };
        return 'json:' + JSON.stringify(gpacMessage);
    }

    public async connect(config: IGpacCommunicationConfig): Promise<void> {
        try {
            this.validateConfig(config);
            this.connectionConfig = config;
            this.setStatus(ConnectionStatus.CONNECTING);

            await this.gpacService.connect();
            
            this.setStatus(ConnectionStatus.CONNECTED);
            this.reconnectAttempts = 0;
            store.dispatch(setLoading(false));
            store.dispatch(setError(null));
        } catch (error) {
            this.handleConnectionError(error);
        }
    }

    public disconnect(): void {
        this.cleanup();
        this.gpacService.disconnect();
        this.setStatus(ConnectionStatus.DISCONNECTED);
    }

    public send(message: GpacMessage): void {
        if (!this.isConnected()) {
            throw new GpacCommunicationError(
                'Cannot send message: Connection not established',
                'CONN_ERROR'
            );
        }

        try {
            this.gpacService.sendMessage(this.formatMessage(message));
        } catch (error) {
            throw new GpacCommunicationError(
                'Message send failed',
                'SEND_ERROR',
                error instanceof Error ? error : undefined
            );
        }
    }

    public registerHandler(handler: IGpacMessageHandler): () => void {
        this.handlers.add(handler);
        return () => this.unregisterHandler(handler);
    }

    public unregisterHandler(handler: IGpacMessageHandler): void {
        this.handlers.delete(handler);
    }

    public getStatus(): ConnectionStatus {
        return this.status;
    }

    public isConnected(): boolean {
        return this.status === ConnectionStatus.CONNECTED;
    }

    private setStatus(newStatus: ConnectionStatus): void {
        if (this.status === newStatus) return;
        
        this.status = newStatus;
        this.notifyStatusChange();
    }

    private handleServiceMessage(message: any): void {
        const formattedMessage = this.parseServiceMessage(message);
        this.notifyHandlers(formattedMessage);
    }

    private handleServiceError(error: Error): void {
        const gpacError = new GpacCommunicationError(
            error.message,
            'SERVICE_ERROR',
            error
        );
        this.notifyError(gpacError);
    }

    private handleServiceDisconnect(): void {
        this.setStatus(ConnectionStatus.DISCONNECTED);
        this.handleReconnection();
    }

    private handleConnectionError(error: unknown): void {
        const gpacError = new GpacCommunicationError(
            error instanceof Error ? error.message : 'Connection failed',
            'CONN_ERROR',
            error instanceof Error ? error : undefined
        );

        this.setStatus(ConnectionStatus.ERROR);
        this.notifyError(gpacError);
        store.dispatch(setError(gpacError.message));
        
        this.handleReconnection();
    }

    private handleReconnection(): void {
        if (!this.connectionConfig || !this.shouldAttemptReconnect()) {
            return;
        }

        this.setStatus(ConnectionStatus.RECONNECTING);
        const delay = this.calculateReconnectDelay();

        this.reconnectTimeout = setTimeout(() => {
            this.reconnectAttempts++;
            this.connect(this.connectionConfig!).catch(() => {});
        }, delay);
    }

    private shouldAttemptReconnect(): boolean {
        return this.reconnectAttempts < (this.connectionConfig?.maxReconnectAttempts ?? 0);
    }

    private calculateReconnectDelay(): number {
        if (!this.connectionConfig) return 0;

        const { reconnectDelay, maxDelay = 10000 } = this.connectionConfig;
        return Math.min(
            reconnectDelay * Math.pow(2, this.reconnectAttempts),
            maxDelay
        );
    }

    private cleanup(): void {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        this.reconnectAttempts = 0;
    }

    private validateConfig(config: IGpacCommunicationConfig): void {
        if (!config.address) {
            throw new GpacCommunicationError(
                'Invalid configuration: address is required',
                'CONFIG_ERROR'
            );
        }
    }

    private formatMessage(message: GpacMessage): any {
        return {
            ...message,
            timestamp: Date.now()
        };
    }

    private parseServiceMessage(message: any): GpacMessage {
        // Implement parsing logic based on GPAC message format
        return {
            type: message.message || 'unknown',
            ...message
        };
    }

    private notifyHandlers(message: GpacMessage): void {
        this.handlers.forEach(handler => {
            try {
                handler.onMessage(message);
            } catch (error) {
                console.error('Handler execution failed:', error);
            }
        });
    }

    private notifyError(error: GpacCommunicationError): void {
        this.handlers.forEach(handler => {
            if (handler.onError) {
                try {
                    handler.onError(error);
                } catch (innerError) {
                    console.error('Error handler execution failed:', innerError);
                }
            }
        });
    }

    private notifyStatusChange(): void {
        this.handlers.forEach(handler => {
            if (handler.onStatusChange) {
                try {
                    handler.onStatusChange(this.status);
                } catch (error) {
                    console.error('Status change handler execution failed:', error);
                }
            }
        });
    }
}