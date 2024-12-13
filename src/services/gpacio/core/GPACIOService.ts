import { GPACIOError } from '../types/error.types';
import { GPACMessage, GPACMessageType, GPACFilterMessage } from '../types/message.types';
import { ConnectionConfig } from '../types/connection.types';
import { IGPACIOProvider } from '../types/base.types';
import { GpacNodeData } from '../../../types/gpac';

import { store } from '../../../store';
import {
  setLoading,
  setError,
  updateGraphData,
  setFilterDetails,
} from '../../../store/slices/graphSlice';
import { updateRealTimeMetrics, updateFilterBufferStats } from '../../../store/slices/filter-monitoringSlice';
import { throttle } from 'lodash';

export class GPACIOService {
  private static instance: GPACIOService | null = null;
  private implementation: IGPACIOProvider | null = null;
  private currentFilterId: number | null = null;
  private activeSubscriptions: Set<string>;
  private isConnecting: boolean;
  private reconnectAttempts: number;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private reconnectTimeout: NodeJS.Timeout | null;

  private constructor() {
    this.activeSubscriptions = new Set();
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.reconnectTimeout = null;
  }

  // Singleton getInstance
  public static getInstance(): GPACIOService {
    if (!GPACIOService.instance) {
      GPACIOService.instance = new GPACIOService();
    }
    return GPACIOService.instance;
  }

  private sendMessage(message: GPACFilterMessage): void {
    if (!this.implementation) {
      throw new GPACIOError('No implementation available');
    }
    const gpacMessage: GPACMessage = {
        type: this.convertMessageType(message.message),
        payload: message
      };
      this.implementation.sendMessage(gpacMessage);
    }

    private convertMessageType(message: string): GPACMessageType {
        switch (message) {
          case 'filters': return GPACMessageType.FILTERS;
          case 'update': return GPACMessageType.UPDATE;
          case 'details': return GPACMessageType.DETAILS;
          case 'get_all_filters': return GPACMessageType.GET_ALL_FILTERS;
          case 'get_details': return GPACMessageType.GET_DETAILS;
          case 'stop_details': return GPACMessageType.STOP_DETAILS;
          default: throw new GPACIOError(`Unknown message type: ${message}`);
        }
      }
  // Gestion des métriques en temps réel
  private throttledUpdateRealTimeMetrics = throttle(
    (payload: { filterId: string; bytes_done: number; buffer?: number; buffer_total?: number }) => {
      if (payload.bytes_done > 0) {
        store.dispatch(updateRealTimeMetrics(payload));
      }
    },
    1000,
    { leading: true, trailing: true }
  );

  // Validation des données de filtre
  private isValidFilterData(filter: unknown): filter is GpacNodeData {
    if (!filter || typeof filter !== 'object') return false;
    
    const requiredProps = {
      idx: 'number',
      name: 'string',
      type: 'string',
      status: ['string', 'null'],
      bytes_done: 'number'
    };

    return Object.entries(requiredProps).every(([key, type]) => {
      if (!(key in (filter as object))) return false;
      if (Array.isArray(type)) {
        return type.some(t => typeof (filter as any)[key] === t || (filter as any)[key] === null);
      }
      return typeof (filter as any)[key] === type;
    });
  }

  // Gestion des messages GPAC
  protected handleGpacMessage(data: GPACFilterMessage): void {
    if (!data.message) {
      console.warn('[GPACIO] Message reçu sans type:', data);
      return;
    }

    switch (data.message) {
      case 'filters':
        this.handleFiltersMessage(data);
        break;
      case 'update':
        this.handleUpdateMessage(data);
        break;
      case 'details':
        this.handleDetailsMessage(data);
        break;
      default:
        console.log('[GPACIO] Type de message inconnu:', data.message);
    }
  }

  private handleFiltersMessage(data: GPACFilterMessage): void {
    store.dispatch(setLoading(false));
    if (Array.isArray(data.filters)) {
      store.dispatch(updateGraphData(data.filters));
    } else {
      console.error('[GPACIO] Données de filtres invalides:', data.filters);
    }
  }

  private handleUpdateMessage(data: GPACFilterMessage): void {
    if (Array.isArray(data.filters)) {
      store.dispatch(updateGraphData(data.filters));
    }
  }

  private handleDetailsMessage(data: GPACFilterMessage): void {
    if (!data.filter) return;
    if (typeof data.filter.idx !== 'number') {
        console.error('[GPACIO] Invalid filter idx:', data.filter);
        return;
      }

    const filterId = data.filter.idx.toString();


    if (!this.isValidFilterData(data.filter)) {
      console.error('[GPACIO] Données de filtre invalides reçues:', data.filter);
      return;
    }

    this.updateFilterDetails(filterId, data.filter as GpacNodeData);
  }
  private handleConnectionError(error: unknown): void {
    if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
      }

      this.reconnectTimeout = setTimeout(async () => {
        this.reconnectAttempts++;
        // Configuration complète pour la reconnexion
        await this.connect({
          url: 'ws://127.0.0.1:17815/rmt',
          reconnectAttempts: this.MAX_RECONNECT_ATTEMPTS,
          reconnectDelay: 1000,
          heartbeatInterval: 30000
        });
      }, delay);
    } else {
      store.dispatch(setError('Échec de connexion à GPAC'));
    }
  }

  // Méthodes publiques
  public async connect(config: ConnectionConfig): Promise<void> {
    if (this.isConnecting) return;

    try {
      this.isConnecting = true;
      store.dispatch(setLoading(true));
      
      if (!this.implementation) {
        throw new GPACIOError('No implementation available');
      }
      
      await this.implementation.connect(config);
      this.sendMessage({ message: 'get_all_filters' });
      
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      
    } catch (error) {
      this.isConnecting = false;
      this.handleConnectionError(error);
    }
  }


  public subscribeToFilter(idx: string): void {
    if (this.activeSubscriptions.has(idx)) return;

    this.activeSubscriptions.add(idx);
    this.sendMessage({
      message: 'get_details',
      idx: parseInt(idx)
    });
  }

  public unsubscribeFromFilter(idx: string): void {
    if (!this.activeSubscriptions.has(idx)) return;

    this.activeSubscriptions.delete(idx);
    this.sendMessage({
      message: 'stop_details',
      idx: parseInt(idx)
    });
  }

  public setCurrentFilterId(id: number | null): void {
    if (this.currentFilterId === id) return;

    if (this.currentFilterId !== null) {
      this.sendMessage({
        message: 'stop_details',
        idx: this.currentFilterId
      });
    }

    this.currentFilterId = id;

    if (id !== null) {
      this.sendMessage({
        message: 'get_details',
        idx: id
      });
    }
  }
  public processMessage(data: GPACFilterMessage): void {
    this.handleGpacMessage(data);
  }


  private updateFilterDetails(filterId: string, filterData: GpacNodeData): void {
    // Mise à jour du filtre unique si c'est le filtre courant
    if (filterData.idx === this.currentFilterId) {
      store.dispatch(setFilterDetails(filterData));
    }

    // Mise à jour pour les filtres multiples
    if (this.activeSubscriptions.has(filterId)) {
      store.dispatch(updateFilterBufferStats({
        filterId: filterId,
        nodeData: filterData
      }));

      // Mise à jour des métriques
      this.updateMetrics(filterId, filterData);
    }
  }

  private updateMetrics(filterId: string, filterData: GpacNodeData): void {
    const firstPid = filterData.ipid && 
      Object.values(filterData.ipid)[0];

    this.throttledUpdateRealTimeMetrics({
      filterId,
      bytes_done: filterData.bytes_done,
      buffer: firstPid?.buffer,
      buffer_total: firstPid?.buffer_total
    });
  }
  public setImplementation(implementation: IGPACIOProvider): void {
    this.implementation = implementation;
  }
}