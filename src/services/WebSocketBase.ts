import { toastService } from '../hooks/useToast';



export class WebSocketBase {

  private socket: WebSocket | null = null;
  private messageHandlers: {
    [key: string]: ((connection: WebSocketBase, dataView: DataView) => void)[];
  } = {};

  public isConnected(): boolean {
    const isConnected = this.socket !== null && this.socket.readyState === WebSocket.OPEN;

    if (isConnected) {
      toastService.show({
        title: " WebSocket connexion",
        description: "Connexion established",
        variant: "default"
      });
    }
    
    return isConnected;
  }

  public connect(address: string): void {
    try {
      console.log(`[WebSocket] Attempting to connect to ${address}`);

      if (this.socket) {
        console.log('[WebSocket] Closing existing connection');
        this.socket.close();
        this.socket = null;
      }

      this.socket = new WebSocket(address);
      this.socket.binaryType = 'arraybuffer';

      this.socket.onopen = () => {
        toastService.show({
          title: "Connexion established",
          description: `Connected at ${address}`,
          variant: "default"
        });
        this.callMessageHandlers(
          '__OnConnect__',
          new DataView(new ArrayBuffer(0)),
        );
      };

      this.socket.onmessage = (event: MessageEvent) => {
        try {
          const dataView = new DataView(event.data);

          // Pour les messages qui commencent par un caractère {
          const firstChar = String.fromCharCode(dataView.getInt8(0));
          if (firstChar === '{') {
            console.log('[WebSocket] Message received:', firstChar);
            this.callMessageHandlers('{"me', dataView);
            return;
          }

          // Pour les messages qui commencent par CONI, LOGM, etc.
          if (dataView.byteLength >= 4) {
            const id = String.fromCharCode(
              dataView.getInt8(0),
              dataView.getInt8(1),
              dataView.getInt8(2),
              dataView.getInt8(3),
            );
            console.log('[WebSocket] Message received:', id);

            // Essayer d'abord le handler spécifique
            const handlers = this.messageHandlers[id];
            if (handlers && handlers.length > 0) {
              handlers.forEach((handler) => handler(this, dataView));
              return;
            }
          }

          // Si aucun handler spécifique n'a été trouvé
          this.callMessageHandlers('__default__', dataView);
        } catch (error) {
          console.error('[WebSocket] Error processing message:', error);
          this.callMessageHandlers('__default__', new DataView(event.data));
        }
      };

      this.socket.onclose = (event) => {
        console.log(
          `[WebSocket] Connection closed: Code=${event.code}, Clean=${event.wasClean}, Reason=${event.reason || 'No reason provided'}`,
        );
        toastService.show({
          title: "Connexion closed",
          description: event.reason || 'Connexion closed',
          variant: event.wasClean ? "default" : "destructive"
        });
        this.socket = null;
        this.callMessageHandlers(
          '__OnDisconnect__',
          new DataView(new ArrayBuffer(0)),
        );
      };

      this.socket.onerror = (error) => {
        console.error('[WebSocket] Connection error:', error);
        toastService.show({
          title: "WebSocket error",
          description: "An error occurred",
          variant: "destructive"
        });
      };
    } catch (error) {
      console.error('[WebSocket] Error creating connection:', error);
      throw error;
    }
  }

  public disconnect(): void {
    if (this.socket) {
      console.log('[WebSocket] Disconnecting...');
      try {
        this.socket.close(1000, 'Client disconnecting');
      } catch (error) {
        console.error('[WebSocket] Error during disconnect:', error);
      }
      this.socket = null;
    }
  }

  public send(message: string): void {
    if (!this.isConnected()) {
      throw new Error('Cannot send message: WebSocket is not connected');
    }

    try {
      console.log('[WebSocket] Sending message:', message);
      this.socket!.send(message);
    } catch (error) {
      console.error('[WebSocket] Error sending message:', error);
      throw error;
    }
  }

  public addConnectHandler(
    handler: (connection: WebSocketBase, dataView: DataView) => void,
  ): void {
    this.addMessageHandler('__OnConnect__', handler);
  }

  public addDisconnectHandler(
    handler: (connection: WebSocketBase, dataView: DataView) => void,
  ): void {
    this.addMessageHandler('__OnDisconnect__', handler);
  }

  public addDefaultMessageHandler(
    handler: (connection: WebSocketBase, dataView: DataView) => void,
  ): void {
    this.addMessageHandler('__default__', handler);
  }

  public addMessageHandler(
    messageName: string,
    handler: (connection: WebSocketBase, dataView: DataView) => void,
  ): void {
    if (!(messageName in this.messageHandlers)) {
      this.messageHandlers[messageName] = [];
    }
    this.messageHandlers[messageName].push(handler);
  }

  private callMessageHandlers(messageName: string, dataView: DataView): void {
    const handlers = this.messageHandlers[messageName];
    if (!handlers || handlers.length === 0) {
      // Si pas de handler spécifique et ce n'est pas déjà le handler par défaut,
      // essayer le handler par défaut
      if (messageName !== '__default__') {
        const defaultHandlers = this.messageHandlers['__default__'];
        if (defaultHandlers) {
          defaultHandlers.forEach((handler) => {
            try {
              handler(this, dataView);
            } catch (error) {
              console.error(`[WebSocket] Error in default handler:`, error);
            }
          });
        }
      }
      return;
    }

    handlers.forEach((handler) => {
      try {
        handler(this, dataView);
      } catch (error) {
        console.error(
          `[WebSocket] Error in handler for ${messageName}:`,
          error,
        );
      }
    });
  }
}
