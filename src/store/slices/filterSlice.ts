// src/store/slices/filterSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  FilterState,
  FilterType,
  ChartDataPoint,
  BufferMetrics,
  LogEntry,
} from '../../types/filter';
import { FilterData } from '../../types/filter';

const MAX_TIME_SERIES_POINTS = 100;
const MAX_LOGS = 1000;
const MIN_UPDATE_INTERVAL = 16; // ms (environ 60 FPS)

const initialState: FilterState = {
  selectedFilter: null,
  selectedFilterType: null,
  timeSeriesData: [],
  logs: [],
  bufferMetrics: null,
  lastUpdate: Date.now(),
  filterDetails: null,
};

const filterSlice = createSlice({
  name: 'filter',
  initialState,
  reducers: {
    // Sélection d'un filtre
    selectFilter: (
      state,
      action: PayloadAction<{ name: string; type: FilterType }>,
    ) => {
      state.selectedFilter = action.payload.name;
      state.selectedFilterType = action.payload.type;
    },

    // Ajout d'un point de données avec throttling
    addDataPoint: (state, action: PayloadAction<ChartDataPoint>) => {
      const now = Date.now();
      if (now - state.lastUpdate >= MIN_UPDATE_INTERVAL) {
        state.timeSeriesData.push(action.payload);

        // Maintenir une taille maximale pour les données de séries temporelles
        if (state.timeSeriesData.length > MAX_TIME_SERIES_POINTS) {
          state.timeSeriesData = state.timeSeriesData.slice(
            -MAX_TIME_SERIES_POINTS,
          );
        }

        state.lastUpdate = now;
      }
    },

    // Mise à jour des métriques du buffer
    updateBufferMetrics: (state, action: PayloadAction<BufferMetrics>) => {
      state.bufferMetrics = action.payload;
    },

    // Ajout d'un log avec gestion de la taille maximale
    addLog: (state, action: PayloadAction<Omit<LogEntry, 'timestamp'>>) => {
      const newLog: LogEntry = {
        ...action.payload,
        timestamp: Date.now(),
      };

      state.logs.push(newLog);

      // Maintenir une taille maximale pour les logs
      if (state.logs.length > MAX_LOGS) {
        state.logs = state.logs.slice(-MAX_LOGS);
      }
    },

    // Nettoyage des données
    clearFilterData: (state) => {
      state.timeSeriesData = [];
      state.logs = [];
      state.bufferMetrics = null;
    },

    // Définir une fenêtre de temps pour les données
    setTimeWindow: (
      state,
      action: PayloadAction<{ windowInSeconds: number }>,
    ) => {
      const cutoffTime = Date.now() - action.payload.windowInSeconds * 1000;
      state.timeSeriesData = state.timeSeriesData.filter(
        (point) => point.timestamp >= cutoffTime,
      );
    },

    // Nettoyage des anciens logs
    cleanOldLogs: (
      state,
      action: PayloadAction<{ olderThanSeconds: number }>,
    ) => {
      const cutoffTime = Date.now() - action.payload.olderThanSeconds * 1000;
      state.logs = state.logs.filter((log) => log.timestamp >= cutoffTime);
    },

    // Mise à jour du filtre sélectionné
    updateSelectedFilter: (
      state,
      action: PayloadAction<{ metrics: BufferMetrics; data: ChartDataPoint }>,
    ) => {
      if (state.selectedFilter) {
        state.bufferMetrics = action.payload.metrics;
        state.timeSeriesData.push(action.payload.data);

        if (state.timeSeriesData.length > MAX_TIME_SERIES_POINTS) {
          state.timeSeriesData = state.timeSeriesData.slice(
            -MAX_TIME_SERIES_POINTS,
          );
        }
      }
    },
    updateFilterDetails: (state, action: PayloadAction<FilterData>) => {
      console.log(
        '[DEBUG_FILTER_DETAIL] Updating filterDetails in state with:',
        action.payload,
      );
      state.filterDetails = action.payload;
    },
  },
});

export const {
  selectFilter,
  addDataPoint,
  updateBufferMetrics,
  addLog,
  clearFilterData,
  setTimeWindow,
  cleanOldLogs,
  updateSelectedFilter,
  updateFilterDetails,
} = filterSlice.actions;

export default filterSlice.reducer;
