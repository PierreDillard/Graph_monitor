export enum WidgetType {
    GRAPH = 'graph-monitor',
    AUDIO = 'audio-monitor',
    VIDEO = 'video-monitor',
    METRICS = 'metrics-monitor',
    LOGS = 'logs-monitor'
  }
  
  export interface WidgetConfig {
    isMaximized: boolean;
    isMinimized: boolean;
    settings: Record<string, any>;
  }
  
  export interface Widget {
    id: string;
    type: WidgetType;
    title: string;
    x: number;
    y: number;
    w: number;
    h: number;
  }
  
  export interface WidgetProps {
    id: string;
    title: string;
    config: WidgetConfig;
  }