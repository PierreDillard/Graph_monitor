import { GpacNodeData } from '../types/gpac';
import { TrendDirection } from '../types/bufferMetrics';

// Types
export type TrendType = 'up' | 'down' | 'stable';
export type StatusColorType = string;

// Constantes
const STATUS_COLORS = {
  active: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
  default: 'bg-gray-500',
} as const;

export const getStatusColor = (status: string | undefined): StatusColorType => {
  if (!status) return STATUS_COLORS.default;

  if (status.toLowerCase().includes('error')) {
    return STATUS_COLORS.error;
  }

  if (status.toLowerCase().includes('warning')) {
    return STATUS_COLORS.warning;
  }

  return STATUS_COLORS.active;
};

/**
 * Format bytes into human readable string
 */

export const formatBytes = (bytes: number | undefined): string => {
  const value = typeof bytes === 'number' ? bytes : 0;
  if (value === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(value) / Math.log(k));
  return `${parseFloat((value / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Determine the trend of the data
 */
export function determineTrend(
  currentValue: number | null,
  previousValue: number | null,
  threshold: number = 0.1,
): TrendDirection {
  if (currentValue === null || previousValue === null) {
    return 'stable';
  }

  const percentChange = Math.abs(
    (currentValue - previousValue) / previousValue,
  );

  if (percentChange < threshold) {
    return 'stable';
  }

  return currentValue > previousValue ? 'increasing' : 'decreasing';
}

/**
 * Verify if the data is valid
 */
export const isValidFilterData = (
  data: GpacNodeData | null,
): data is GpacNodeData => {
  return data !== null && typeof data === 'object';
};
