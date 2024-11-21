// src/types/filter.ts

/**
 * Types de filtres disponibles
 */
export type FilterType = 'input' | 'output';

/**
 * Propriétés de base d'un filtre GPAC
 */
export interface FilterProperties {
  name: string;
  type: string;
  ID: string | null;
  itag: string | null;
  status: string;
  bytes_done: number;
  idx: number;
}

/**
 * Données du buffer
 */
export interface BufferData {
  buffer: number;
  buffer_total: number;
  source_idx?: number;
}

/**
 * Métriques du buffer calculées
 */
export interface BufferMetrics {
  currentBuffer: number;
  bufferTotal: number;
  bufferPercentage: number;
  isLow: boolean;
  isHigh: boolean;
}

/**
 * Point de données pour les graphiques
 */
export interface ChartDataPoint {
  timestamp: number;
  buffer: number;
  rawBuffer: number;
  bufferTotal: number;
}

/**
 * Information codec média
 */
export interface CodecInfo {
  codec?: string;
  width?: number;
  height?: number;
  fps?: string;
  samplerate?: number;
  channels?: number;
  format?: string;
  pixel_format?: string;
}

/**
 * Données complètes d'un filtre
 */
export interface FilterData extends BufferData, Partial<CodecInfo> {
  source_idx?: number;
}

/**
 * Types de logs possibles
 */
export type LogLevel = 'info' | 'warning' | 'error';

/**
 * Structure d'une entrée de log
 */
export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string;
  code?: string;
}

/**
 * État du filtre
 */
export interface FilterState {
  selectedFilter: string | null;
  selectedFilterType: FilterType | null;
  timeSeriesData: ChartDataPoint[];
  logs: LogEntry[];
  bufferMetrics: BufferMetrics | null;
  lastUpdate: number;
  filterDetails: FilterData | null;
}

/**
 * Arguments du filtre
 */
export interface FilterArgument {
  name: string;
  value: string | number | boolean;
  desc?: string;
  min_max_enum?: string;
  update?: boolean;
}

/**
 * Configuration complète du filtre
 */
export interface FilterConfiguration {
  id: string;
  name: string;
  type: FilterType;
  properties: FilterProperties;
  arguments: FilterArgument[];
  inputs: Record<string, FilterData>;
  outputs: Record<string, FilterData>;
}

/**
 * Props pour les composants de visualisation
 */
export interface FilterVisualizationProps {
  data: FilterData;
  type: FilterType;
  onUpdate?: (data: Partial<FilterData>) => void;
}

/**
 * Actions possibles sur un filtre
 */
export type FilterAction =
  | { type: 'SELECT_FILTER'; payload: { name: string; type: FilterType } }
  | { type: 'UPDATE_METRICS'; payload: BufferMetrics }
  | { type: 'ADD_DATA_POINT'; payload: ChartDataPoint }
  | { type: 'ADD_LOG'; payload: Omit<LogEntry, 'timestamp'> }
  | { type: 'CLEAR_DATA' };

/**
 * État de connexion du filtre
 */
export interface FilterConnectionState {
  isConnected: boolean;
  lastConnected: number | null;
  reconnectAttempts: number;
  errorMessage: string | null;
}

/**
 * Options de configuration du moniteur
 */
export interface FilterMonitorOptions {
  updateInterval: number;
  maxDataPoints: number;
  maxLogs: number;
  bufferThresholds: {
    low: number;
    high: number;
  };
  timeWindow: number; // en secondes
}

/**
 * Statistiques du filtre
 */
export interface FilterStats {
  totalBytesProcessed: number;
  averageBufferUsage: number;
  peakBufferUsage: number;
  lowBufferCount: number;
  highBufferCount: number;
  errorCount: number;
  warningCount: number;
  uptime: number; // en secondes
}

/**
 * Event handler props
 */
export interface FilterEventHandlers {
  onFilterSelect: (name: string, type: FilterType) => void;
  onFilterUpdate: (id: string, data: Partial<FilterData>) => void;
  onFilterError: (error: Error) => void;
  onBufferAlert: (metrics: BufferMetrics) => void;
}

/**
 * Filter Context type
 */
export interface FilterContextType {
  state: FilterState;
  stats: FilterStats;
  options: FilterMonitorOptions;
  handlers: FilterEventHandlers;
  connection: FilterConnectionState;
}
