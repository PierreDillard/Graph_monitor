import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';
import { FilterState, ChartDataPoint, LogEntry } from '../../types/filter';
import isEqual from 'lodash/isEqual';

const selectFilterState = (state: RootState) => state.filter;

interface MemoizeOptions {
  resultEqualityCheck: (a: ChartDataPoint[], b: ChartDataPoint[]) => boolean;
}
export const selectFilterDetails = createSelector(
  [selectFilterState],
  (filterState) => 
    filterState.filterDetails,
  {
    memoizeOptions: {
      resultEqualityCheck: isEqual, // Using Lodash isEqual for deep comparison
    },
  },
);
export const selectTimeSeriesData = createSelector(
  [selectFilterState],
  (filterState: FilterState): ChartDataPoint[] => {
    return filterState.timeSeriesData;
  },
  {
    memoizeOptions: {
      resultEqualityCheck: (
        a: ChartDataPoint[],
        b: ChartDataPoint[],
      ): boolean =>
        a.length === b.length &&
        a.every((point, i) => point.timestamp === b[i].timestamp),
    } as MemoizeOptions,
  },
);

export const selectFilterLogs = createSelector(
  [selectFilterState],
  (filterState: FilterState): LogEntry[] => {
    return filterState.logs;
  },
);

// Sélecteur pour les métriques du buffer
export const selectBufferMetrics = createSelector(
  [selectFilterState],
  (filterState) => filterState.bufferMetrics,
);

// Sélecteur pour le filtre sélectionné
export const selectSelectedFilter = createSelector(
  [selectFilterState],
  (filterState) => ({
    selectedFilter: filterState.selectedFilter,
    selectedFilterType: filterState.selectedFilterType,
  }),
);

// Sélecteur pour vérifier si un filtre est sélectionné
export const selectHasSelectedFilter = createSelector(
  [selectFilterState],
  (filterState) => filterState.selectedFilter !== null,
);

// Sélecteur pour les dernières métriques
export const selectLatestMetrics = createSelector(
  [selectTimeSeriesData],
  (timeSeriesData): ChartDataPoint | null => {
    return timeSeriesData.length > 0
      ? timeSeriesData[timeSeriesData.length - 1]
      : null;
  },
);

// Sélecteur pour les logs filtrés par niveau
export const selectLogsByLevel = createSelector(
  [selectFilterLogs, (_: RootState, level: string) => level],
  (logs, level) => logs.filter((log) => log.level === level),
);

// Sélecteur pour les statistiques des logs
export const selectLogsStats = createSelector([selectFilterLogs], (logs) => ({
  total: logs.length,
  errors: logs.filter((log) => log.level === 'error').length,
  warnings: logs.filter((log) => log.level === 'warning').length,
  info: logs.filter((log) => log.level === 'info').length,
}));

// Sélecteur pour obtenir les métriques dans une fenêtre de temps
export const selectTimeWindowMetrics = createSelector(
  [selectTimeSeriesData, (_: RootState, timeWindow: number) => timeWindow],
  (timeSeriesData, timeWindow) => {
    const now = Date.now();
    const windowStart = now - timeWindow * 1000; // timeWindow en secondes
    return timeSeriesData.filter((point) => point.timestamp >= windowStart);
  },
);

// Sélecteur pour l'état complet du moniteur
export const selectFilterMonitorState = createSelector(
  [
    selectSelectedFilter,
    selectBufferMetrics,
    selectTimeSeriesData,
    selectFilterLogs,
  ],
  (selected, metrics, timeSeriesData, logs) => ({
    selected,
    metrics,
    timeSeriesData,
    logs,
  }),
);
