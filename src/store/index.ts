import { configureStore } from '@reduxjs/toolkit';
import graphReducer from './slices/graphSlice';
import widgetsReducer from './slices/widgetsSlice';
import filterMonitoringReducer from './slices/filter-monitoringSlice';
import multiFilterReducer from './slices/multiFilterSlice';

export const store = configureStore({
  reducer: {
    graph: graphReducer,
    filterMonitoring: filterMonitoringReducer,
    widgets: widgetsReducer,
    multiFilter: multiFilterReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['graph/updateGraphData', 'graph/updateNodeData'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
