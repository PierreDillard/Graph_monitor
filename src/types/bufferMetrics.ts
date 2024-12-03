export interface BufferMetrics {
  current: number;
  total: number;
  isDynamic: boolean;
  usagePercentage: number;
  status: 'normal' | 'warning' | 'critical';
}

export interface FilterBufferStats {
  input: Record<string, BufferMetrics>;
  output: Record<string, BufferMetrics>;
  fpsStats: {
    current: number | null;
    trend: 'stable' | 'increasing' | 'decreasing';
  };
  latencyStats: {
    value: number | null;
    unit: 'ms' | 's';
  };
}
export type TrendDirection = 'stable' | 'increasing' | 'decreasing';
