import { configureStore } from '@reduxjs/toolkit';
import widgetsReducer from './slices/widgetsSlice';
import pidReducer from './slices/pidSlice';

export const store = configureStore({
  reducer: {
    pid: pidReducer,
    widgets: widgetsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
