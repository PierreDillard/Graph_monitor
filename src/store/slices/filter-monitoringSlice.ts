import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FilterMetric, RealTimeMetrics } from '../../types/filterMonitor';
import { FilterBufferStats } from '../../types/bufferMetrics';
import {
  analyzeBufferMetrics,
  parseFilterStatus,
} from '../../utils/bufferAnalytics';
import { RootState } from '../index';
import { BufferMetrics } from '../../types/bufferMetrics';
import { GpacNodeData } from '../../types/gpac';
import { determineTrend } from '../../utils/filterMonitorUtils';

export interface FilterMonitoringState {
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

const initialState: FilterMonitoringState = {
  bufferStats: {},
  selectedFilterHistory: {},
  realtimeMetrics: {},
  activeFilters: [],
  maxHistoryLength: 50,
};
const isValidFilterMetric = (metric: any): metric is FilterMetric => {
  return (
    typeof metric.timestamp === 'number' &&
    typeof metric.bytes_done === 'number' &&
    typeof metric.packets_sent === 'number' &&
    typeof metric.packets_done === 'number'
  );
};
const filterMonitoringSlice = createSlice({
  name: 'filterMonitoring',
  initialState,
  reducers: {
    updateFilterBufferStats(
      state,
      action: PayloadAction<{
        filterId: string;
        nodeData: GpacNodeData;
      }>,
    ) {
      const { filterId, nodeData } = action.payload;

      // Process Input PIDs
      const input: Record<string, BufferMetrics> = {};
      Object.entries(nodeData.ipid || {}).forEach(([pidName, pidData]) => {
        input[pidName] = analyzeBufferMetrics(
          pidData.buffer,
          pidData.buffer_total,
        );
      });

      // Process output PIDs
      const output: Record<string, BufferMetrics> = {};
      Object.entries(nodeData.opid || {}).forEach(([pidName, pidData]) => {
        output[pidName] = analyzeBufferMetrics(
          pidData.buffer,
          pidData.buffer_total,
        );
      });
      const { fps, latency } = parseFilterStatus(nodeData.status || '');

      state.bufferStats[filterId] = {
        input,
        output,
        fpsStats: {
          current: fps,
          trend: determineTrend(
            fps,
            state.bufferStats[filterId]?.fpsStats.current,
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
    },

    addFilterMetric(
      state,
      action: PayloadAction<{ filterId: string; metric: FilterMetric }>,
    ) {
      const { filterId, metric } = action.payload;
      if (!isValidFilterMetric(metric)) {
        console.warn('Invalid FilterMetric received:', metric);
        return;
      }

      const sanitizedMetric: FilterMetric = {
        timestamp: metric.timestamp,
        bytes_done: Number.isFinite(metric.bytes_done) ? metric.bytes_done : 0,
        packets_sent: Number.isFinite(metric.packets_sent)
          ? metric.packets_sent
          : 0,
        packets_done: Number.isFinite(metric.packets_done)
          ? metric.packets_done
          : 0,
      };
      if (!state.selectedFilterHistory[filterId]) {
        state.selectedFilterHistory[filterId] = [];
      }
      state.selectedFilterHistory[filterId].push(sanitizedMetric);
      if (
        state.selectedFilterHistory[filterId].length > state.maxHistoryLength
      ) {
        state.selectedFilterHistory[filterId].shift();
      }
    },
    updateRealTimeMetrics(
      state,
      action: PayloadAction<{
      filterId: string;
      bytes_done: number;
      buffer?: number;
      buffer_total?: number;
      }>,
    ) {
      const { filterId, bytes_done, buffer, buffer_total } = action.payload;
      const now = Date.now();

      if (!state.realtimeMetrics[filterId]) {
      state.realtimeMetrics[filterId] = {
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
      const metrics = state.realtimeMetrics[filterId];
        // Only update if we have new data
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
  },

    addActiveFilter: (state, action: PayloadAction<string>) => {
      if (!state.activeFilters.includes(action.payload)) {
       
        state.activeFilters.push(action.payload); 
      }
      if (!state.selectedFilterHistory[action.payload]) {
        state.selectedFilterHistory[action.payload] = [];
      }
    },
    removeActiveFilter: (state, action: PayloadAction<string>) => {
      state.activeFilters = state.activeFilters.filter(
        (id) => id !== action.payload,
      ); 
      delete state.selectedFilterHistory[action.payload];
    },

    clearFilterHistory(state, action: PayloadAction<string>) {
      delete state.selectedFilterHistory[action.payload];
    },

    setMaxHistoryLength(state, action: PayloadAction<number>) {
      state.maxHistoryLength = action.payload;

      // Adjust history length if needed
      for (const filterId of Object.keys(state.selectedFilterHistory)) {
        if (state.selectedFilterHistory[filterId].length > action.payload) {
          state.selectedFilterHistory[filterId] = state.selectedFilterHistory[
            filterId
          ].slice(-action.payload);
        }
      }
    },
    updateMultipleFilters: (
      state,
      action: PayloadAction<{
        [filterId: string]: FilterMetric;
      }>,
    ) => {
      Object.entries(action.payload).forEach(([filterId, metric]) => {
        if (state.activeFilters.includes(filterId)) {
          // Utiliser includes au lieu de has
          if (
            state.selectedFilterHistory[filterId].length >=
            state.maxHistoryLength
          ) {
            state.selectedFilterHistory[filterId].shift();
          }
          state.selectedFilterHistory[filterId].push(metric);
        }
      });
    },
  },
});

export const selectFilterHistory = (state: RootState, filterId: string) =>
  state.filterMonitoring.selectedFilterHistory[filterId] || [];

export const selectMaxHistoryLength = (state: RootState) =>
  state.filterMonitoring.maxHistoryLength;

export const selectRealTimeMetrics = (state: RootState, filterId: string) =>
  state.filterMonitoring.realtimeMetrics[filterId];

export const selectProcessingRate = (state: RootState, filterId: string) => {
  const metrics = state.filterMonitoring.realtimeMetrics[filterId];
  // Récupérer le filtre actuel pour accéder au status
  const filter = state.graph.filters.find(f => f.idx.toString() === filterId);

  // Si nous avons un statut avec FPS, utilisons-le prioritairement
  if (filter?.status) {
    // Parser le FPS du status
    const fpsMatch = filter.status.match(/(\d+\.?\d*)\s*FPS/);
    const resMatch = filter.status.match(/(\d+)x(\d+)/);
    
    if (fpsMatch && resMatch) {
      const fps = parseFloat(fpsMatch[1]);
      const [, width, height] = resMatch;
      // En supposant un format nv12 (12 bits par pixel)
      const bytesPerFrame = parseInt(width) * parseInt(height) * 1.5;
      return fps * bytesPerFrame;
    }
  }

  // Fallback sur la méthode actuelle si pas de FPS dans le status
  if (
    !metrics ||
    metrics.currentBytes === undefined ||
    metrics.previousBytes === undefined ||
    metrics.lastUpdate === undefined ||
    metrics.previousUpdateTime === undefined
  ) {
    return 0;
  }

  const timeDiff = (metrics.lastUpdate - metrics.previousUpdateTime) / 1000;
  if (timeDiff <= 0) return 0;

  const bytesDiff = metrics.currentBytes - metrics.previousBytes;
  const rateInBytesPerSecond = bytesDiff / timeDiff;
  return rateInBytesPerSecond > 0 ? rateInBytesPerSecond : 0;
};
// Dans filter-monitoringSlice.ts 

// Fonction utilitaire pour parser les buffers du status
const parseBufferFromStatus = (status: string | null): { current: number, total: number } | null => {
  if (!status) return null;
  
  // Parse des patterns comme "buffer 33 / 100 ms"
  const bufferMatch = status.match(/buffer\s+(\d+)\s*\/\s*(\d+)\s*ms/);
  if (bufferMatch) {
    return {
      current: parseInt(bufferMatch[1], 10),
      total: parseInt(bufferMatch[2], 10)
    };
  }
  return null;
};

// Nouveau sélecteur pour les buffers
export const selectBufferMetrics = (state: RootState, filterId: string) => {
  const filter = state.graph.filters.find(f => f.idx.toString() === filterId);
  
  // Si on a un status, on essaie d'abord d'en extraire les infos de buffer
  if (filter?.status) {
    const bufferInfo = parseBufferFromStatus(filter.status);
    if (bufferInfo) {
      return {
        current: bufferInfo.current,
        total: bufferInfo.total,
        percentage: (bufferInfo.current / bufferInfo.total) * 100
      };
    }
  }

  // Fallback sur les métriques stockées dans le store
  const metrics = state.filterMonitoring.realtimeMetrics[filterId];
  if (metrics?.bufferStatus) {
    return {
      current: metrics.bufferStatus.current,
      total: metrics.bufferStatus.total,
      percentage: metrics.bufferStatus.total > 0 ? 
        (metrics.bufferStatus.current / metrics.bufferStatus.total) * 100 : 0
    };
  }

  return null;
};
export const {
  addFilterMetric,
  clearFilterHistory,
  setMaxHistoryLength,
  updateMultipleFilters,
  updateRealTimeMetrics,
} = filterMonitoringSlice.actions;

export default filterMonitoringSlice.reducer;
