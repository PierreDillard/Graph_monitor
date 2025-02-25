import { configureStore } from '@reduxjs/toolkit';
import { ThunkAction } from 'redux-thunk';
import { Action } from 'redux';
import graphReducer from './slices/graphSlice';
import widgetsReducer from './slices/widgetsSlice';
import filterMonitoringReducer from './slices/filter-monitoringSlice';
import multiFilterReducer from './slices/multiFilterSlice';
import filterArgumentReducer from './slices/filterArgumentSlice';

export const store = configureStore({
  reducer: {
    filterArgument: filterArgumentReducer,
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
export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
    ReturnType,
    RootState,
    unknown,
    Action<string>
>;

