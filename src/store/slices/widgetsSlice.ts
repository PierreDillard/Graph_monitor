import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Widget, WidgetType, WidgetConfig } from '../../types/widget';
import { createSelector } from '@reduxjs/toolkit';

export interface RootState {
  widgets: WidgetsState;
}

export interface WidgetsState {
  activeWidgets: Widget[];
  configs: Record<string, WidgetConfig>;
  selectedNode: {
    name: string;
    type: string;
    itag: string | null;
    ID: string | null;
    nb_ipid: number;
    nb_opid: number;
    status: string;
    bytes_done: number;
    idx: number;
    gpac_args: string[];
    ipid: Record<string, any>;
    opid: Record<string, any>;
  } | null;
}

export const selectActiveWidgets = (state: RootState) =>
  state.widgets.activeWidgets;
export const selectWidgetConfigs = (state: RootState) => state.widgets.configs;

export const selectWidgetById = createSelector(
  [
    (state: RootState) => state.widgets.activeWidgets,
    (_: RootState, widgetId: string) => widgetId,
  ],
  (widgets, widgetId) => widgets.find((w) => w.id === widgetId),
);

const defaultConfig: WidgetConfig = {
  isMaximized: false,
  isMinimized: false,
  settings: {},
};

const initialState: WidgetsState = {
  activeWidgets: [
    {
      id: `pid-${Date.now()}`,
      type: WidgetType.FILTER,
      title: 'FILTER Monitor',
      x: 0,
      y: 8,
      w: 6,
      h: 4,
    },

    {
      id: 'graph-1',
      type: WidgetType.GRAPH,
      title: 'Pipeline Graph',
      x: 0,
      y: 0,
      w: 10,
      h: 6,
    },
  ],
  configs: {
    'metrics-1': { ...defaultConfig },
    'graph-1': { ...defaultConfig },
  },
  selectedNode: null,
};

const widgetsSlice = createSlice({
  name: 'widgets',
  initialState,
  reducers: {
    addWidget: (state, action: PayloadAction<Widget>) => {
      state.activeWidgets.push(action.payload);
      state.configs[action.payload.id] = { ...defaultConfig };
    },
    removeWidget: (state, action: PayloadAction<string>) => {
      console.log('removeWidget action triggered with id:', action.payload);
      const widgetId = action.payload;

      state.activeWidgets = state.activeWidgets.filter(
        (w) => w.id !== widgetId,
      );

      if (state.configs[widgetId]) {
        const { [widgetId]: _, ...remainingConfigs } = state.configs;
        state.configs = remainingConfigs;
      }

      console.log('State after removal:', {
        activeWidgets: state.activeWidgets,
        configs: state.configs,
      });
    },
    maximizeWidget: (state, action: PayloadAction<string>) => {
      if (state.configs[action.payload]) {
        state.configs[action.payload] = {
          ...state.configs[action.payload],
          isMaximized: true,
          isMinimized: false,
        };
      }
    },
    minimizeWidget: (state, action: PayloadAction<string>) => {
      if (state.configs[action.payload]) {
        state.configs[action.payload] = {
          ...state.configs[action.payload],
          isMaximized: false,
          isMinimized: true,
        };
      }
    },
    restoreWidget: (state, action: PayloadAction<string>) => {
      if (state.configs[action.payload]) {
        state.configs[action.payload] = {
          ...state.configs[action.payload],
          isMaximized: false,
          isMinimized: false,
        };
      }
    },
    updateWidgetPosition: (
      state,
      action: PayloadAction<{
        id: string;
        x: number;
        y: number;
        w: number;
        h: number;
      }>,
    ) => {
      const widget = state.activeWidgets.find(
        (w) => w.id === action.payload.id,
      );
      if (widget) {
        widget.x = action.payload.x;
        widget.y = action.payload.y;
        widget.w = action.payload.w;
        widget.h = action.payload.h;
      }
    },
    setSelectedNode: (
      state,
      action: PayloadAction<WidgetsState['selectedNode']>,
    ) => {
      state.selectedNode = action.payload;

      if (
        action.payload &&
        !state.activeWidgets.some((w) => w.type === WidgetType.FILTER)
      ) {
        const pidWidget: Widget = {
          id: `pid-${Date.now()}`,
          type: WidgetType.FILTER,
          title: 'FILTER Monitor',
          x: 0,
          y: 8,
          w: 8,
          h: 6,
        };
        state.activeWidgets.push(pidWidget);
        state.configs[pidWidget.id] = { ...defaultConfig };
      }
    },
  },
});

export const {
  addWidget,
  removeWidget,
  maximizeWidget,
  minimizeWidget,
  restoreWidget,
  updateWidgetPosition,
  setSelectedNode,
} = widgetsSlice.actions;

export default widgetsSlice.reducer;
