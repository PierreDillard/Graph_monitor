import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { createSelector } from '@reduxjs/toolkit';
import { ChartDataPoint, PIDType, BufferMetrics } from '../../types/pidMonitor';
import { RootState } from '../index';


interface PIDInfo {
  buffer: number;
  buffer_total: number;
  source_idx?: number;
  codec?: string;
  width?: number;
  height?: number;
  fps?: string;
  samplerate?: number;
  channels?: number;
}

interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warning' | 'error';
  message: string;
}

interface GPACArg {
  name: string;
  value: any;
  update: boolean;
  min_max_enum?: string;
  desc?: string;
}

interface FilterDetails {
  idx: number;
  name: string;
  type: string;
  status: string;
  gpac_args: GPACArg[];
  ipid: Record<string, PIDInfo>;
  opid: Record<string, PIDInfo>;
}

interface FilterState {
  selectedPID: string | null;
  selectedPIDType: PIDType | null;
  timeSeriesData: ChartDataPoint[];
  logs: LogEntry[];
  bufferMetrics: BufferMetrics | null;
  lastUpdate: number;
  filterDetails: FilterDetails | null;
  pids: Record<string, PIDInfo>;
}

const initialState: FilterState = {
  selectedPID: null,
  selectedPIDType: null,
  timeSeriesData: [],
  logs: [],
  bufferMetrics: null,
  lastUpdate: Date.now(),
  filterDetails: null,
  pids: {}
};

const pidSlice = createSlice({
  name: 'filter',
  initialState,
  reducers: {
    selectPID: (state, action: PayloadAction<{ pidName: string; type: PIDType }>) => {
      state.selectedPID = action.payload.pidName;
      state.selectedPIDType = action.payload.type;
      state.timeSeriesData = [];
      state.logs = [];

      // Mise à jour des métriques du buffer si le PID existe
      const pid = state.pids[action.payload.pidName];
      if (pid) {
        state.bufferMetrics = {
          currentBuffer: pid.buffer,
          bufferTotal: pid.buffer_total,
          bufferPercentage: (pid.buffer / pid.buffer_total) * 100,
          isLow: (pid.buffer / pid.buffer_total) * 100 < 20,
          isHigh: (pid.buffer / pid.buffer_total) * 100 > 80
        };
      }
    },

    setFilterDetails: (state, action: PayloadAction<FilterDetails>) => {
      state.filterDetails = action.payload;
      
      // Mettre à jour les PIDs
      if (action.payload.ipid) {
        Object.entries(action.payload.ipid).forEach(([name, pid]) => {
          state.pids[name] = pid;
        });
      }
      if (action.payload.opid) {
        Object.entries(action.payload.opid).forEach(([name, pid]) => {
          state.pids[name] = pid;
        });
      }

      // Si un PID est sélectionné, mettre à jour ses métriques
      if (state.selectedPID && state.pids[state.selectedPID]) {
        const pid = state.pids[state.selectedPID];
        state.bufferMetrics = {
          currentBuffer: pid.buffer,
          bufferTotal: pid.buffer_total,
          bufferPercentage: (pid.buffer / pid.buffer_total) * 100,
          isLow: (pid.buffer / pid.buffer_total) * 100 < 20,
          isHigh: (pid.buffer / pid.buffer_total) * 100 > 80
        };
      }
    },

    updatePIDBuffer: (state, action: PayloadAction<{
      pidName: string;
      buffer: number;
      buffer_total: number;
    }>) => {
      const { pidName, buffer, buffer_total } = action.payload;
      
      if (!state.pids[pidName]) {
        state.pids[pidName] = { buffer, buffer_total };
      } else {
        state.pids[pidName].buffer = buffer;
        state.pids[pidName].buffer_total = buffer_total;
      }

      // Mettre à jour les métriques si c'est le PID sélectionné
      if (state.selectedPID === pidName) {
        state.bufferMetrics = {
          currentBuffer: buffer,
          bufferTotal: buffer_total,
          bufferPercentage: (buffer / buffer_total) * 100,
          isLow: (buffer / buffer_total) * 100 < 20,
          isHigh: (buffer / buffer_total) * 100 > 80
        };

        // Ajouter un point de données à la série temporelle
        const now = Date.now();
        if (now - state.lastUpdate >= 16) {
          state.timeSeriesData.push({
            timestamp: now,
            buffer: (buffer / buffer_total) * 100,
            rawBuffer: buffer,
            bufferTotal: buffer_total
          });
          if (state.timeSeriesData.length > 50) {
            state.timeSeriesData.shift();
          }
          state.lastUpdate = now;
        }
      }
    },

    addLog: (state, action: PayloadAction<Omit<LogEntry, 'timestamp'>>) => {
      state.logs.push({
        ...action.payload,
        timestamp: Date.now()
      });
      if (state.logs.length > 100) {
        state.logs.shift();
      }
    },

    clearPIDData: (state) => {
      state.timeSeriesData = [];
      state.logs = [];
      state.bufferMetrics = null;
      state.selectedPID = null;
      state.selectedPIDType = null;
    },

    reset: (state) => {
      Object.assign(state, initialState);
    }
  }
});

// Sélecteurs optimisés
export const selectPIDState = (state: RootState) => state.pid;

export const selectFilterDetails = createSelector(
  [selectPIDState],
  (state) => state.filterDetails
);

export const selectPIDMetrics = createSelector(
  [selectPIDState],
  (state) => ({
    selectedPID: state.selectedPID,
    selectedPIDType: state.selectedPIDType,
    bufferMetrics: state.bufferMetrics,
  })
);

export const selectTimeSeriesData = createSelector(
  [selectPIDState],
  (state) => state.timeSeriesData
);

export const selectPIDLogs = createSelector(
  [selectPIDState],
  (state) => state.logs
);

export const selectPIDInfo = createSelector(
  [selectPIDState, (state: RootState, pidName: string) => pidName],
  (state, pidName) => state.pids[pidName]
);

export const {
  selectPID,
  setFilterDetails,
  updatePIDBuffer,
  addLog,
  clearPIDData,
  reset
} = pidSlice.actions;

export default pidSlice.reducer;