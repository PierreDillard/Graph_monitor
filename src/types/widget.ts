import { ReactNode } from 'react';

export enum WidgetType {
  GRAPH = 'graph-monitor',
  AUDIO = 'audio-monitor',
  VIDEO = 'video-monitor',
  METRICS = 'metrics-monitor',
  LOGS = 'logs-monitor',
  FILTER = 'filter-monitor',
  MULTI_FILTER = 'multi-filter-monitor',
}
export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  isResizable?: boolean;
  isDraggable?: boolean;
}
export interface WidgetComponent {
  id: string;
  title: string;
  config: WidgetConfig; 
  children?: ReactNode;
}

export type WidgetSetting = string | number | boolean | null | undefined;

export interface WidgetConfig {
  isMaximized: boolean;
  isMinimized: boolean;
  settings: Record<string, WidgetSetting>;
}

export interface WidgetProps {
  id: string;
  title: string;
  config: WidgetConfig;
}
