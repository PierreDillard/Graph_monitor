import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FilterMetric, RealTimeMetrics } from '@/types/filterMonitor';
import { RootState } from '../index';


export interface FilterMonitoringState {
  selectedFilterHistory: {
    [filterId: string]: FilterMetric[];
  };
  realtimeMetrics: {
    [filterId: string]: RealTimeMetrics;
  };
  activeFilters: Set<string>; 
  maxHistoryLength: number;
}

const initialState: FilterMonitoringState = {
  selectedFilterHistory: {},
  realtimeMetrics: {},
  activeFilters: new Set(),
  maxHistoryLength: 50,
};

const filterMonitoringSlice = createSlice({
  name: 'filterMonitoring',
  initialState,
  reducers: {
    addFilterMetric(
      state,
      action: PayloadAction<{ filterId: string; metric: FilterMetric }>,
    ) {
      const { filterId, metric } = action.payload;

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
    updateRealTimeMetrics(state, action: PayloadAction<{
      filterId: string;
      bytes_done: number;
      buffer?: number;
      buffer_total?: number;
    }>) {
      const { filterId, bytes_done, buffer, buffer_total } = action.payload;
      const now = Date.now();
      
      if (!state.realtimeMetrics[filterId]) {
        state.realtimeMetrics[filterId] = {
          previousBytes: bytes_done,
          currentBytes: bytes_done,
          lastUpdate: now,
          bufferStatus: {
            current: buffer || 0,
            total: buffer_total || 0
          }
        };
      } else {
        const metrics = state.realtimeMetrics[filterId];
        metrics.previousBytes = metrics.currentBytes;
        metrics.currentBytes = bytes_done;
        metrics.lastUpdate = now;
        if (buffer !== undefined) {
          metrics.bufferStatus.current = buffer;
        }
        if (buffer_total !== undefined) {
          metrics.bufferStatus.total = buffer_total;
        }
      }
    },

    addActiveFilter: (state, action: PayloadAction<string>) => {
      state.activeFilters.add(action.payload);
      if(!state.selectedFilterHistory[action.payload]) {
        state.selectedFilterHistory[action.payload] = [];
      }     
    },
    removeActiveFilter: (state, action: PayloadAction<string>) => {
      state.activeFilters.delete(action.payload);
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
    updateMultipleFilters: (state, action: PayloadAction<{
      [filterId: string]: FilterMetric
    }>) => {
      Object.entries(action.payload).forEach(([filterId, metric]) => {
        if (state.activeFilters.has(filterId)) {
          if (state.selectedFilterHistory[filterId].length >= state.maxHistoryLength) {
            state.selectedFilterHistory[filterId].shift();
          }
          state.selectedFilterHistory[filterId].push(metric);
        }
      });
    }
  }
});

export const selectFilterHistory = (state: RootState, filterId: string) =>
  state.filterMonitoring.selectedFilterHistory[filterId] || [];

export const selectMaxHistoryLength = (state: RootState) =>
  state.filterMonitoring.maxHistoryLength;

export const selectRealTimeMetrics = (state: RootState, filterId: string) =>
  state.filterMonitoring.realtimeMetrics[filterId];

export const selectProcessingRate = (state: RootState, filterId: string) => {
  const metrics = state.filterMonitoring.realtimeMetrics[filterId];
  if (!metrics) return 0;
  
  const timeDiff = Date.now() - metrics.lastUpdate;
  if (timeDiff === 0) return 0;
  
  const bytesDiff = metrics.currentBytes - metrics.previousBytes;
  return (bytesDiff / (1024 * 1024)) / (timeDiff / 1000); // MB/s
};

export const { addFilterMetric, clearFilterHistory, setMaxHistoryLength, updateMultipleFilters, updateRealTimeMetrics } =
  filterMonitoringSlice.actions;

export default filterMonitoringSlice.reducer;
