import { EventEmitter } from 'events';
import { Node, Edge, MarkerType } from '@xyflow/react';
import { GpacNodeData } from '../types/gpac';
import { GpacWebSocket } from './gpacWebSocket';
import {
  FilterMetric,
  RealTimeMetrics,
} from '../types/filterMonitor';
import { FilterBufferStats, BufferMetrics } from '../types/bufferMetrics';

// Utilitaires importés (ajustez les chemins d'import)
import { analyzeBufferMetrics, parseFilterStatus } from '../utils/bufferAnalytics';
import { determineTrend } from '../utils/filterMonitorUtils';

// Types internes
type FilterType = 'video' | 'audio' | 'text' | 'image' | 'other';

interface ConnectionOptions {
  type: 'websocket' | 'wasm';
  address?: string;
}

// État interne similaire à graphSlice
interface GraphInternalState {
  filters: GpacNodeData[];
  nodes: Node[];
  edges: Edge[];
  isLoading: boolean;
  error: string | null;
  redraw: boolean;
  selectedNodeId: string | null;
  lastUpdate: number;
  selectedFilterDetails: GpacNodeData | null;
}

// État interne similaire à filterMonitoringSlice
interface FilterMonitoringState {
  bufferStats: Record<string, FilterBufferStats>;
  selectedFilterHistory: {
    [filterId: string]: FilterMetric[];
  };
  realtimeMetrics: {
    [filterId: string]: RealTimeMetrics;
  };
  activeFilters: string[];
  maxHistoryLength: number;
}

// État interne similaire à multiFilterSlice
interface MonitoredFilter {
  id: string;
  nodeData: GpacNodeData;
}

interface MultiFilterState {
  selectedFilters: MonitoredFilter[];
  maxMonitors: number;
  activeSubscriptions: string[];
}

export default class Graph extends EventEmitter {
  private connection!: GpacWebSocket;

  // États internes
  private graphState: GraphInternalState = {
    filters: [],
    nodes: [],
    edges: [],
    isLoading: false,
    error: null,
    redraw: false,
    selectedNodeId: null,
    lastUpdate: Date.now(),
    selectedFilterDetails: null,
  };

  private filterMonitoringState: FilterMonitoringState = {
    bufferStats: {},
    selectedFilterHistory: {},
    realtimeMetrics: {},
    activeFilters: [],
    maxHistoryLength: 50,
  };

  private multiFilterState: MultiFilterState = {
    selectedFilters: [],
    maxMonitors: 6,
    activeSubscriptions: [],
  };

  constructor(private options: ConnectionOptions) {
    super();
    this.initializeConnection();
  }

  private initializeConnection() {
    if (this.options.type === 'websocket') {
      this.connection = new GpacWebSocket(this.options.address);
    } else if (this.options.type === 'wasm') {
     console.log('WASM connection not implemented yet');
    } else {
      throw new Error(`Unsupported connection type: ${this.options.type}`);
    }

    this.setupConnectionHandlers();
  }

  private setupConnectionHandlers() {
    this.connection.on('connected', () => {
      this.setLoading(false);
      this.setError(null);
    });

    this.connection.on('disconnected', () => {
      this.setError('Disconnected from GPAC');
    });

    this.connection.on('error', (error: string) => {
      this.setError(error);
    });

    this.connection.on('filters', (filters: GpacNodeData[]) => {
      this.updateGraphData(filters);
    });

    this.connection.on('update', (filters: GpacNodeData[]) => {
      this.updateGraphData(filters);
    });

    this.connection.on('filterDetails', (filter: GpacNodeData) => {
      this.updateFilterDetails(filter);
    });

    this.connection.on('filterDataUpdate', (payload: { id: string; data: GpacNodeData }) => {
      // Mettre à jour les données du filtre surveillé (si nécessaire)
      this.updateFilterData(payload.id, payload.data);
      // Mise à jour des metrics en temps réel et buffer stats
      this.updateFilterBufferStats(payload.id, payload.data);
      this.emit('filterDataUpdate', payload);
    });

    this.connection.on('realTimeMetricsUpdate', (payload: {
      filterId: string;
      bytes_done: number;
      buffer?: number;
      buffer_total?: number;
    }) => {
      this.updateRealTimeMetricsInternal(payload.filterId, payload.bytes_done, payload.buffer, payload.buffer_total);
      this.emit('realTimeMetricsUpdate', payload);
    });

    this.connection.on('filterSubscribed', (idx: string) => {
      // Gérer l'abonnement côté multiFilter
      if (!this.multiFilterState.activeSubscriptions.includes(idx)) {
        this.multiFilterState.activeSubscriptions.push(idx);
      }
      // Ajouter le filtre dans activeFilters côté filterMonitoring
      this.addActiveFilterInternal(idx);
      this.emit('filterSubscribed', idx);
    });

    this.connection.on('filterUnsubscribed', (idx: string) => {
      // Gérer la désinscription côté multiFilter
      this.multiFilterState.activeSubscriptions = this.multiFilterState.activeSubscriptions.filter(id => id !== idx);
      this.removeActiveFilterInternal(idx);
      this.emit('filterUnsubscribed', idx);
    });
  }

  public connect(address?: string): void {
    this.setLoading(true);
    this.connection.connect(address);
  }

  public disconnect(): void {
    this.connection.disconnect();
  }

  public sendMessage(message: any): void {
    this.connection.sendMessage(message);
  }

  public isConnected(): boolean {
    return this.connection.isConnected();
  }

  // ---- Logique issue de graphSlice ----

  private setLoading(isLoading: boolean) {
    this.graphState.isLoading = isLoading;
    // On peut émettre un événement si nécessaire
    // this.emit('loading', isLoading);
  }

  private setError(error: string | null) {
    this.graphState.error = error;
    this.graphState.isLoading = false;
    if (error) {
      this.emit('error', error);
    } else {
      this.emit('error', 'Unknown error');
    }
  }

  private updateGraphData(filters: GpacNodeData[]) {
    // Nettoyer l'état
    this.graphState.filters = [];
    this.graphState.nodes = [];
    this.graphState.edges = [];

    this.graphState.filters = filters;
    this.graphState.nodes = filters.map((f, i) => this.createNodeFromFilter(f, i, []));
    this.graphState.edges = this.createEdgesFromFilters(filters, []);
    this.graphState.lastUpdate = Date.now();
console.log('**', this.graphState.nodes);

    this.emit('nodesUpdated', this.graphState.nodes);
    this.emit('edgesUpdated', this.graphState.edges);
  }

  private updateFilterDetails(filter: GpacNodeData) {
    this.graphState.selectedFilterDetails = filter;
    this.emit('filterDetails', filter);
  }

  public selectNode(nodeId: string | null) {
    if (this.graphState.selectedNodeId !== nodeId) {
      this.graphState.selectedNodeId = nodeId;
      this.emit('selectedNodeChanged', this.graphState.selectedNodeId);
    }
  }

  public getNodes(): Node[] {
    return this.graphState.nodes;
  }

  public getEdges(): Edge[] {
    return this.graphState.edges;
  }

  public getSelectedNodeId(): string | null {
    return this.graphState.selectedNodeId;
  }

  public setCurrentFilterId(id: number | null): void {
    this.connection.setCurrentFilterId(id);
  }

  // Méthode pour demander les détails d'un filtre spécifique
  public getFilterDetails(idx: number): void {
    this.connection.getFilterDetails(idx);
  }

  public stopFilterDetails(idx: number): void {
    this.connection.stopFilterDetails(idx);
  }

  // ---- Logique issue de multiFilterSlice ----

  public addSelectedFilter(nodeData: GpacNodeData) {
    if (this.multiFilterState.selectedFilters.length > this.multiFilterState.maxMonitors) {
      return;
    }

    const filterId = nodeData.idx.toString();
    if (this.multiFilterState.selectedFilters.some((f) => f.id === filterId)) {
      return;
    }
    this.multiFilterState.selectedFilters.push({ id: filterId, nodeData });
    this.multiFilterState.activeSubscriptions.push(filterId);

    // S'abonner côté WebSocket
    this.subscribeToFilter(filterId);
  }

  public removeSelectedFilter(filterId: string) {
    this.multiFilterState.selectedFilters = this.multiFilterState.selectedFilters.filter(
      (f) => f.id !== filterId,
    );
    this.multiFilterState.activeSubscriptions = this.multiFilterState.activeSubscriptions.filter(
      (id) => id !== filterId,
    );

    // Se désabonner côté WebSocket
    this.unsubscribeFromFilter(filterId);
  }

  public setSelectedFilters(filters: MonitoredFilter[]) {
    this.multiFilterState.selectedFilters = filters;
    this.multiFilterState.activeSubscriptions = filters.map((f) => f.id);

    // S'abonner pour chaque filtre
    filters.forEach((f) => {
      this.subscribeToFilter(f.id);
    });
  }

  public updateFilterData(filterId: string, data: GpacNodeData) {
    const index = this.multiFilterState.selectedFilters.findIndex((f) => f.id === filterId);
    if (index !== -1) {
      this.multiFilterState.selectedFilters[index].nodeData = data;
    }
    // Mettre à jour buffer stats & metrics aussi
    this.updateFilterBufferStats(filterId, data);
  }

  public setMaxMonitors(max: number) {
    this.multiFilterState.maxMonitors = Math.max(1, Math.min(12, max));
    if (this.multiFilterState.selectedFilters.length > this.multiFilterState.maxMonitors) {
      this.multiFilterState.selectedFilters = this.multiFilterState.selectedFilters.slice(
        0,
        this.multiFilterState.maxMonitors,
      );
      this.multiFilterState.activeSubscriptions = this.multiFilterState.activeSubscriptions.slice(
        0,
        this.multiFilterState.maxMonitors,
      );
    }
  }

  // ---- Logique issue de filterMonitoringSlice ----

  private updateFilterBufferStats(filterId: string, nodeData: GpacNodeData) {
    const input: Record<string, BufferMetrics> = {};
    Object.entries(nodeData.ipid || {}).forEach(([pidName, pidData]) => {
      input[pidName] = analyzeBufferMetrics(pidData.buffer, pidData.buffer_total);
    });

    const output: Record<string, BufferMetrics> = {};
    Object.entries(nodeData.opid || {}).forEach(([pidName, pidData]) => {
      output[pidName] = analyzeBufferMetrics(pidData.buffer, pidData.buffer_total);
    });

    const { fps, latency } = parseFilterStatus(nodeData.status || '');

    this.filterMonitoringState.bufferStats[filterId] = {
      input,
      output,
      fpsStats: {
        current: fps,
        trend: determineTrend(
          fps,
          this.filterMonitoringState.bufferStats[filterId]?.fpsStats.current,
        ),
      },
      latencyStats: latency
        ? {
            value: latency.value,
            unit: latency.unit,
          }
        : {
            value: null,
            unit: 'ms',
          },
    };
  }

  public addFilterMetric(filterId: string, metric: FilterMetric) {
    // Validation du metric
    if (!this.isValidFilterMetric(metric)) {
      console.warn('Invalid FilterMetric received:', metric);
      return;
    }

    const sanitizedMetric: FilterMetric = {
      timestamp: metric.timestamp,
      bytes_done: Number.isFinite(metric.bytes_done) ? metric.bytes_done : 0,
      packets_sent: Number.isFinite(metric.packets_sent) ? metric.packets_sent : 0,
      packets_done: Number.isFinite(metric.packets_done) ? metric.packets_done : 0,
    };

    if (!this.filterMonitoringState.selectedFilterHistory[filterId]) {
      this.filterMonitoringState.selectedFilterHistory[filterId] = [];
    }
    this.filterMonitoringState.selectedFilterHistory[filterId].push(sanitizedMetric);
    if (
      this.filterMonitoringState.selectedFilterHistory[filterId].length > this.filterMonitoringState.maxHistoryLength
    ) {
      this.filterMonitoringState.selectedFilterHistory[filterId].shift();
    }
  }

  private updateRealTimeMetricsInternal(
    filterId: string,
    bytes_done: number,
    buffer?: number,
    buffer_total?: number,
  ) {
    const now = Date.now();

    if (!this.filterMonitoringState.realtimeMetrics[filterId]) {
      this.filterMonitoringState.realtimeMetrics[filterId] = {
        previousBytes: 0,
        currentBytes: bytes_done,
        previousUpdateTime: now,
        lastUpdate: now,
        bufferStatus: {
          current: buffer || 0,
          total: buffer_total || 0,
        },
      };
    } else {
      const metrics = this.filterMonitoringState.realtimeMetrics[filterId];
      if (bytes_done !== metrics.currentBytes) {
        metrics.previousBytes = metrics.currentBytes;
        metrics.previousUpdateTime = metrics.lastUpdate;
        metrics.currentBytes = bytes_done;
        metrics.lastUpdate = now;
      }
      if (typeof buffer === 'number' && typeof buffer_total === 'number') {
        metrics.bufferStatus = {
          current: buffer,
          total: buffer_total,
        };
      }
    }
  }

  public clearFilterHistory(filterId: string) {
    delete this.filterMonitoringState.selectedFilterHistory[filterId];
  }

  public setMaxHistoryLength(length: number) {
    this.filterMonitoringState.maxHistoryLength = length;
    for (const fid of Object.keys(this.filterMonitoringState.selectedFilterHistory)) {
      if (this.filterMonitoringState.selectedFilterHistory[fid].length > length) {
        this.filterMonitoringState.selectedFilterHistory[fid] =
          this.filterMonitoringState.selectedFilterHistory[fid].slice(-length);
      }
    }
  }

  public updateMultipleFilters(payload: { [filterId: string]: FilterMetric }) {
    Object.entries(payload).forEach(([filterId, metric]) => {
      if (this.filterMonitoringState.activeFilters.includes(filterId)) {
        if (
          this.filterMonitoringState.selectedFilterHistory[filterId].length >=
          this.filterMonitoringState.maxHistoryLength
        ) {
          this.filterMonitoringState.selectedFilterHistory[filterId].shift();
        }
        this.filterMonitoringState.selectedFilterHistory[filterId].push(metric);
      }
    });
  }

  private isValidFilterMetric(metric: any): metric is FilterMetric {
    return (
      typeof metric.timestamp === 'number' &&
      typeof metric.bytes_done === 'number' &&
      typeof metric.packets_sent === 'number' &&
      typeof metric.packets_done === 'number'
    );
  }

  // Méthodes pour gérer les filtres actifs
  private addActiveFilterInternal(filterId: string) {
    if (!this.filterMonitoringState.activeFilters.includes(filterId)) {
      this.filterMonitoringState.activeFilters.push(filterId);
    }
    if (!this.filterMonitoringState.selectedFilterHistory[filterId]) {
      this.filterMonitoringState.selectedFilterHistory[filterId] = [];
    }
  }

  private removeActiveFilterInternal(filterId: string) {
    this.filterMonitoringState.activeFilters = this.filterMonitoringState.activeFilters.filter(
      (id) => id !== filterId,
    );
    delete this.filterMonitoringState.selectedFilterHistory[filterId];
    delete this.filterMonitoringState.realtimeMetrics[filterId];
  }

  // ---- Gestion des abonnements via la connexion ----
  public subscribeToFilter(idx: string) {
    this.connection.subscribeToFilter(idx);
  }

  public unsubscribeFromFilter(idx: string) {
    this.connection.unsubscribeFromFilter(idx);
  }

  // ---- Fonctions utilitaires pour les nodes et edges ----

  private determineFilterType(filterName: string, filterType: string): FilterType {
    const name = filterName.toLowerCase();
    const type = filterType.toLowerCase();

    if (
      name.includes('video') ||
      type.includes('vout') ||
      type.includes('vflip') ||
      type.includes('nvdec')
    ) {
      return 'video';
    }
    if (
      name.includes('audio') ||
      type.includes('aout') ||
      type.includes('aenc')
    ) {
      return 'audio';
    }
    if (name.includes('text') || name.includes('subt') || type.includes('text')) {
      return 'text';
    }
    if (name.includes('image') || type.includes('img')) {
      return 'image';
    }
    return 'other';
  }

  private getFilterColor(filterType: FilterType): string {
    const colors = {
      video: '#3b82f6',
      audio: '#10b981',
      text: '#f59e0b',
      image: '#8b5cf6',
      other: '#6b7280',
    };
    return colors[filterType];
  }

  private createNodeFromFilter(filter: GpacNodeData, index: number, existingNodes: Node[]): Node {
    const existingNode = existingNodes.find((n) => n.id === filter.idx.toString());
    const filterType = this.determineFilterType(filter.name, filter.type);

    return {
      id: filter.idx.toString(),
      type: 'default',
      data: {
        label: filter.name,
        filterType,
        ...filter,
      },
      position: existingNode?.position || {
        x: 150 + (index % 3) * 300,
        y: 100 + Math.floor(index / 3) * 200,
      },
      className: `transition-all duration-200 ${
        existingNode?.selected
          ? 'ring-2 ring-offset-2 ring-blue-500 shadow-lg scale-105'
          : ''
      }`,
      selected: existingNode?.selected,
      style: {
        background:
          filter.nb_ipid === 0
            ? '#4ade80'
            : filter.nb_opid === 0
              ? '#ef4444'
              : this.getFilterColor(filterType),
        color: 'white',
        padding: '10px',
        borderRadius: '8px',
        border: '1px solid #4b5563',
        width: 180,
      },
    };
  }

  private createEdgesFromFilters(filters: GpacNodeData[], existingEdges: Edge[]): Edge[] {
    const newEdges: Edge[] = [];

    filters.forEach((filter) => {
      if (filter.ipid) {
        Object.entries(filter.ipid).forEach(([pidName, pid]: [string, any]) => {
          if (pid.source_idx !== undefined) {
            const edgeId = `${pid.source_idx}-${filter.idx}-${pidName}`;
            const existingEdge = existingEdges.find((e) => e.id === edgeId);

            const filterType = this.determineFilterType(filter.name, filter.type);
            const filterColor = this.getFilterColor(filterType);

            const bufferPercentage =
              pid.buffer_total > 0
                ? Math.round((pid.buffer / pid.buffer_total) * 100)
                : 0;

            newEdges.push({
              id: edgeId,
              source: pid.source_idx.toString(),
              target: filter.idx.toString(),
              type: 'simplebezier',
              label: `${pidName} (${bufferPercentage}%)`,
              data: {
                filterType,
                bufferPercentage,
                pidName,
              },
              animated: true,
              style: {
                stroke: filterColor,
                strokeWidth: 2,
                opacity: 0.8,
              },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: filterColor,
              },
              selected: existingEdge?.selected,
            });
          }
        });
      }
    });

    return newEdges;
  }

  // Méthodes d'accès à l'état interne si nécessaire
  public getSelectedFilterDetails(): GpacNodeData | null {
    return this.graphState.selectedFilterDetails;
  }

  public getActiveFilters(): string[] {
    return this.filterMonitoringState.activeFilters;
  }

  public getSelectedFilterHistory(filterId: string): FilterMetric[] {
    return this.filterMonitoringState.selectedFilterHistory[filterId] || [];
  }

  public getRealTimeMetrics(filterId: string): RealTimeMetrics | undefined {
    return this.filterMonitoringState.realtimeMetrics[filterId];
  }

  public getBufferStats(filterId: string): FilterBufferStats | undefined {
    return this.filterMonitoringState.bufferStats[filterId];
  }

  public getSelectedFilters(): MonitoredFilter[] {
    return this.multiFilterState.selectedFilters;
  }

  public getProcessingRate(filterId: string): number {
    const metrics = this.filterMonitoringState.realtimeMetrics[filterId];
    // Si besoin, on peut intégrer la logique du selectProcessingRate ici
    const filter = this.graphState.filters.find(f => f.idx.toString() === filterId);

    if (filter?.status) {
      const fpsMatch = filter.status.match(/(\d+\.?\d*)\s*FPS/);
      const resMatch = filter.status.match(/(\d+)x(\d+)/);
      if (fpsMatch && resMatch) {
        const fps = parseFloat(fpsMatch[1]);
        const [, width, height] = resMatch;
        const bytesPerFrame = parseInt(width) * parseInt(height) * 1.5; 
        return fps * bytesPerFrame;
      }
    }

    if (!metrics ||
        metrics.currentBytes === undefined ||
        metrics.previousBytes === undefined ||
        metrics.lastUpdate === undefined ||
        metrics.previousUpdateTime === undefined) {
      return 0;
    }

    const timeDiff = (metrics.lastUpdate - metrics.previousUpdateTime) / 1000;
    if (timeDiff <= 0) return 0;

    const bytesDiff = metrics.currentBytes - metrics.previousBytes;
    const rateInBytesPerSecond = bytesDiff / timeDiff;
    return rateInBytesPerSecond > 0 ? rateInBytesPerSecond : 0;
  }
}
