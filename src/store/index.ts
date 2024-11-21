import { configureStore } from '@reduxjs/toolkit';
import filterReducer from './slices/filterSlice';
import graphReducer from './slices/graphSlice';
import widgetsReducer from './slices/widgetsSlice';

export const store = configureStore({
  reducer: {
    filter: filterReducer,
    graph: graphReducer,
    widgets: widgetsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignorer certaines actions non-sérialisables si nécessaire
        ignoredActions: ['SOCKET_CONNECT', 'SOCKET_DISCONNECT'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Hooks typés pour useDispatch et useSelector
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
