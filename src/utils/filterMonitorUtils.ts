

import { GpacNodeData } from '../types/gpac';

// Types
export type TrendType = 'up' | 'down' | 'stable';
export type StatusColorType = string;

// Constantes
const STATUS_COLORS = {
  active: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
  default: 'bg-gray-500'
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
 * Détermine la tendance des données
 */
export const getDataTrend = (currentValue: number, previousValue?: number): TrendType => {
  if (!previousValue) return 'stable';
  if (currentValue > previousValue) return 'up';
  if (currentValue < previousValue) return 'down';
  return 'stable';
};

/**
 * Calculate the processing rate
 */
const calculateProcessingRate = (currentBytes: number, previousBytes: number, timeInterval: number) => {
  const bytesDiff = currentBytes - previousBytes;
  return (bytesDiff / (1024 * 1024)) / (timeInterval / 1000); 
};
/**
 * Verify if the data is valid
 */
export const isValidFilterData = (data: GpacNodeData | null): data is GpacNodeData => {
  return data !== null && typeof data === 'object';
};