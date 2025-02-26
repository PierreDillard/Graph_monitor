import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GpacNodeData } from '../../types/domain/gpac';

export interface MonitoredFilter {
  id: string;
  nodeData: GpacNodeData;
}

export interface MultifilterState {
  selectedFilters: MonitoredFilter[];
  maxMonitors: number;
  activeSubscriptions: string[];
}

const initialState: MultifilterState = {
  selectedFilters: [],
  maxMonitors: 6,
  activeSubscriptions: [],
};

const multiFilterSlice = createSlice({
  name: 'multiFilter',
  initialState,
  reducers: {
    addSelectedFilter(state, action: PayloadAction<MonitoredFilter>) {
      if (state.selectedFilters.length > state.maxMonitors) {
        return;
      }

      const filterId = action.payload.nodeData.idx.toString();
      if (state.selectedFilters.some((filter) => filter.id === filterId)) {
        return;
      }
      state.selectedFilters.push({ id: filterId, nodeData: action.payload.nodeData });
      state.activeSubscriptions.push(filterId);
    },
    removeSelectedFilter: (state, action: PayloadAction<string>) => {
      state.selectedFilters = state.selectedFilters.filter(
        (f) => f.id !== action.payload,
      );
      state.activeSubscriptions = state.activeSubscriptions.filter(
        (id) => id !== action.payload,
      );
    },

    setSelectedFilters: (state, action: PayloadAction<MonitoredFilter[]>) => {
      state.selectedFilters = action.payload;
      state.activeSubscriptions = action.payload.map((f) => f.id);
    },

    updateFilterData: (
      state,
      action: PayloadAction<{ id: string; data: GpacNodeData }>,
    ) => {
      const index = state.selectedFilters.findIndex(
        (f) => f.id === action.payload.id,
      );
      if (index !== -1) {
        state.selectedFilters[index].nodeData = action.payload.data;
      }
    },

    setMaxMonitors: (state, action: PayloadAction<number>) => {
      state.maxMonitors = Math.max(1, Math.min(12, action.payload));
      // If reducing max monitors, remove excess monitors from the end
      if (state.selectedFilters.length > state.maxMonitors) {
        state.selectedFilters = state.selectedFilters.slice(
          0,
          state.maxMonitors,
        );
        state.activeSubscriptions = state.activeSubscriptions.slice(
          0,
          state.maxMonitors,
        );
      }
    },
  },
});

export const {
  addSelectedFilter,
  removeSelectedFilter,
  setSelectedFilters,
  updateFilterData,
  setMaxMonitors,
} = multiFilterSlice.actions;

export default multiFilterSlice.reducer;
