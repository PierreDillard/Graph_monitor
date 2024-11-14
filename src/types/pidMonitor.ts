
  
  export interface UpdateQueueItem {
    type: 'data' | 'log';
    payload: ChartDataPoint | LogEntry;
  }
  


  // src/types/pidMonitor.ts
export interface LogEntry {
    id: string;
    timestamp: number; // Changé de Date à number
    level: 'info' | 'warning' | 'error';
    message: string;
    code?: string;
  }
  
  export interface ChartDataPoint {
    timestamp: number;
    buffer: number;
    rawBuffer: number;
    bufferTotal: number;
  }
  
  export interface PIDMonitorProps {
    id: string;
    title: string;
    config: {
      isMaximized: boolean;
      isMinimized: boolean;
      settings: Record<string, any>;
    };
  }
  
  export interface PIDData {
    buffer: number;
    buffer_total: number;
    source_idx?: number;
    codec?: string;
    width?: number;
    height?: number;
    fps?: string;
    samplerate?: number;
    channels?: number;
  }
  
  export interface BufferMetrics {
    currentBuffer: number;
    bufferTotal: number;
    bufferPercentage: number;
    isLow: boolean;
    isHigh: boolean;
  }
  
  export type PIDType = 'input' | 'output';