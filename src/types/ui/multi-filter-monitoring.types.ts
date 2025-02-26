import { GpacNodeData } from '../domain/gpac';
export interface MetricCardProps {
  title: string;
  value: number | string;
  total: number | string;
  unit?: string;
  type?: 'text' | 'number';
  trend?: 'up' | 'down' | 'stable';
  color?: 'blue' | 'green' | 'red' | 'yellow';
}

export interface ProcessingMetricsProps {
  data: GpacNodeData;
  type: 'input' | 'output';
}
