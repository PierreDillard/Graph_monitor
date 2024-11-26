import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FilterMetric } from '@/types/filterMonitor';
import { RootState } from '../index';

export interface FilterMonitoringState {
  selectedFilterHistory: {
    [filterId: string]: FilterMetric[];
  };
  maxHistoryLength: number;
}

const initialState: FilterMonitoringState = {
  selectedFilterHistory: {},
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
  },
});

export const selectFilterHistory = (state: RootState, filterId: string) =>
  state.filterMonitoring.selectedFilterHistory[filterId] || [];

export const selectMaxHistoryLength = (state: RootState) =>
  state.filterMonitoring.maxHistoryLength;

export const { addFilterMetric, clearFilterHistory, setMaxHistoryLength } =
  filterMonitoringSlice.actions;

export default filterMonitoringSlice.reducer;
