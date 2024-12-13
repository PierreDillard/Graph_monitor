import { WebSocketBase } from '../../WebSocketBase';
import { IGPACIOProvider } from '../types/base.types';
import { ConnectionConfig } from '../types/connection.types';
import { GPACMessage, GPACFilterMessage } from '../types/message.types';
import { DataViewReader } from '../../DataViewReader';
import { GPACIOService } from '../core/GPACIOService';
import { GPACIOError } from '../types/error.types';

export class WebSocketProvider implements IGPACIOProvider {
  private ws: WebSocketBase;
  private isConnectedFlag = false;
  private activeSubscriptions: Set<string> = new Set();

  constructor() {
    this.ws = new WebSocketBase();
  }

  /**
   * Établit la connexion WebSocket avec GPAC
   */
  public async connect(config: ConnectionConfig): Promise<void> {
    if (this.isConnectedFlag) return;

    try {
      await this.setupWebSocket(config.url);
      this.setupMessageHandlers();
    } catch (error) {
      throw new GPACIOError(
        'Échec de la connexion WebSocket',
        'CONNECT_ERROR',
        error
      );
    }
  }

  /**
   * Configure la connexion WebSocket initiale
   */
  private async setupWebSocket(url: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        this.ws.connect(url);
        
        this.ws.addConnectHandler(() => {
          this.isConnectedFlag = true;
          resolve();
        });

        this.ws.addDisconnectHandler(() => {
          this.isConnectedFlag = false;
        });

      } catch (error) {
        reject(new GPACIOError('Configuration WebSocket échouée', 'SETUP_ERROR', error));
      }
    });
  }

  /**
   * Configure les gestionnaires de messages
   */
  private setupMessageHandlers(): void {
    // Gestionnaire messages JSON directs
    this.ws.addMessageHandler('{"me', this.createMessageHandler('JSON'));
    
    // Gestionnaire messages CONI
    this.ws.addMessageHandler('CONI', this.createCONIMessageHandler());
    
    // Gestionnaire par défaut
    this.ws.addDefaultMessageHandler(this.createMessageHandler('DEFAULT'));
  }


  /**
   * Crée un gestionnaire de messages générique
   */
  private createMessageHandler(type: string) {
    return (_: unknown, dataView: DataView) => {
      try {
        const text = new TextDecoder().decode(dataView.buffer as ArrayBuffer);
        if (text.startsWith('{')) {
          const jsonData = this.parseAndValidateMessage(text);
          if (jsonData) {
            // Accès via une méthode publique intermédiaire
            GPACIOService.getInstance().processMessage(jsonData);
          }
        }
      } catch (error) {
        console.error(`Erreur traitement message ${type}:`, error);
      }
    };
  }

  /**
   * Crée un gestionnaire spécifique pour les messages CONI
   */
  private createCONIMessageHandler() {
    return (_: unknown, dataView: DataView) => {
      try {
        const reader = new DataViewReader(dataView, 4);
        const text = reader.getText();

        if (text.startsWith('json:')) {
          const jsonText = text.slice(5);
          const jsonData = this.parseAndValidateMessage(jsonText);
          if (jsonData) {
            GPACIOService.getInstance().processMessage(jsonData);
          }
        }
      } catch (error) {
        console.error('Erreur traitement message CONI:', error);
      }
    };
  }

  /**
   * Parse et valide un message JSON
   */
  private parseAndValidateMessage(text: string): GPACFilterMessage | null {
    try {
      const data = JSON.parse(text);
      if (this.isValidGPACMessage(data)) {
        return data;
      }
      console.error('Message invalide:', data);
      return null;
    } catch (error) {
      console.error('Erreur parsing JSON:', error);
      return null;
    }
  }

  /**
   * Valide la structure d'un message GPAC
   */
  private isValidGPACMessage(data: unknown): data is GPACFilterMessage {
    if (!data || typeof data !== 'object') return false;
    
    const msg = data as Record<string, unknown>;
    return (
      'message' in msg &&
      typeof msg.message === 'string' &&
      ['filters', 'update', 'details', 'get_all_filters', 'get_details', 'stop_details'].includes(msg.message)
    );
  }

  /**
   * Envoie un message à GPAC
   */
  public sendMessage(message: GPACMessage): void {
    if (!this.isConnectedFlag) {
      throw new GPACIOError('WebSocket non connecté');
    }

    try {
      const payload = message.payload as GPACFilterMessage;
      const jsonString = 'CONI' + 'json:' + JSON.stringify(payload);
      this.ws.send(jsonString);
    } catch (error) {
      throw new GPACIOError('Échec envoi message', 'SEND_ERROR', error);
    }
  }

  /**
   * Déconnecte le WebSocket
   */
  public disconnect(): void {
    this.ws.disconnect();
    this.isConnectedFlag = false;
    this.activeSubscriptions.clear();
    this.currentFilterId = null;
  }

  /**
   * Vérifie l'état de connexion
   */
  public isConnected(): boolean {
    return this.isConnectedFlag && this.ws.isConnected();
  }
}