import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { createSelector } from '@reduxjs/toolkit';
import { ChartDataPoint, PIDType, BufferMetrics } from '../../types/pidMonitor';
import { RootState } from '../index';

// Mise à jour de l'interface LogEntry pour utiliser un timestamp numérique
interface LogEntry {
  id: string;
  timestamp: number; // Changé de Date à number
  level: 'info' | 'warning' | 'error';
  message: string;
}

interface PIDState {
  selectedPID: string | null;
  selectedPIDType: PIDType | null;
  timeSeriesData: ChartDataPoint[];
  logs: LogEntry[];
  bufferMetrics: BufferMetrics | null;
  lastUpdate: number;
}

const initialState: PIDState = {
  selectedPID: null,
  selectedPIDType: null,
  timeSeriesData: [],
  logs: [],
  bufferMetrics: null,
  lastUpdate: Date.now(),
};

const pidSlice = createSlice({
  name: 'pid',
  initialState,
  reducers: {
    selectPID: (
      state,
      action: PayloadAction<{ pidName: string; type: PIDType }>,
    ) => {
      state.selectedPID = action.payload.pidName;
      state.selectedPIDType = action.payload.type;
      state.timeSeriesData = [];
      state.logs = [];
    },
    addDataPoint: (state, action: PayloadAction<ChartDataPoint>) => {
      const now = Date.now();
      if (now - state.lastUpdate >= 16) {
        state.timeSeriesData.push(action.payload);
        if (state.timeSeriesData.length > 50) {
          state.timeSeriesData.shift();
        }
        state.lastUpdate = now;
      }
    },
    updateBufferMetrics: (state, action: PayloadAction<BufferMetrics>) => {
      state.bufferMetrics = action.payload;
    },
    addLog: (state, action: PayloadAction<Omit<LogEntry, 'timestamp'>>) => {
      state.logs.push({
        ...action.payload,
        timestamp: Date.now(), // Utiliser un timestamp numérique
      });
      if (state.logs.length > 100) {
        state.logs.shift();
      }
    },
    clearPIDData: (state) => {
      state.timeSeriesData = [];
      state.logs = [];
      state.bufferMetrics = null;
    },
  },
});

// Selectors mis à jour
export const selectPIDState = (state: RootState) => state.pid;

export const selectPIDMetrics = createSelector(
  [selectPIDState],
  (pidState) => ({
    selectedPID: pidState.selectedPID,
    selectedPIDType: pidState.selectedPIDType,
    bufferMetrics: pidState.bufferMetrics,
  }),
);

export const selectTimeSeriesData = createSelector(
  [selectPIDState],
  (pidState) => pidState.timeSeriesData || [],
);

export const selectPIDLogs = createSelector(
  [selectPIDState],
  (pidState) => pidState.logs || [],
);

export const {
  selectPID,
  addDataPoint,
  updateBufferMetrics,
  addLog,
  clearPIDData,
} = pidSlice.actions;

export default pidSlice.reducer;
