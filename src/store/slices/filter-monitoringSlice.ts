import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GpacNodeData } from '@/types/gpac';
import { RootState } from '../index';

interface FilterMetric {
  timestamp: number;
  bytes_done: number;
  buffers: {
    [pidName: string]: {
      buffer: number;
      buffer_total: number;
      percentage: number;
    };
  };
}

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
      if (!state.selectedFilterHistory[filterId]) {
        state.selectedFilterHistory[filterId] = [];
      }
      state.selectedFilterHistory[filterId].push(metric);
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
