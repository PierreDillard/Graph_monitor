import { configureStore } from '@reduxjs/toolkit';
import graphReducer from './slices/graphSlice';
import widgetsReducer from './slices/widgetsSlice';
import pidReducer from './slices/pidSlice';

export const store = configureStore({
  reducer: {
    graph: graphReducer,
    pid: pidReducer,
    widgets: widgetsReducer,
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