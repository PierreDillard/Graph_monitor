// src/components/layout/DashboardLayout.tsx
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

import { RootState } from '../../store';
import { updateWidgetPosition } from '../../store/slices/widgetsSlice';
import Header from './Header';
import Sidebar from './Sidebar';
import GraphMonitor from '../widgets/GraphMonitor';
import AudioMonitor from '../widgets/AudioMonitor';
import VideoMonitor from '../widgets/VideoMonitor';
import LogsMonitor from '../widgets/LogsMonitor';
import MetricsMonitor from '../widgets/MetricsMonitor';
import { WidgetType } from '../../types/widget';

const ResponsiveGridLayout = WidthProvider(Responsive);

// Explicit mapping of widget types to components
const WIDGET_COMPONENTS = {
  [WidgetType.GRAPH]: GraphMonitor,
  [WidgetType.AUDIO]: AudioMonitor,
  [WidgetType.VIDEO]: VideoMonitor,
  [WidgetType.LOGS]: LogsMonitor,
  [WidgetType.METRICS]: MetricsMonitor,
};

const DashboardLayout: React.FC = () => {
  const dispatch = useDispatch();
  const activeWidgets = useSelector((state: RootState) => state.widgets.activeWidgets);
  const configs = useSelector((state: RootState) => state.widgets.configs);

  // Generate layouts based on activeWidgets
  const layouts = {
    lg: activeWidgets.map(widget => ({
      i: widget.id,
      x: widget.x || 0,
      y: widget.y || 0,
      w: widget.w || 6,
      h: widget.h || 4,
      minW: 2,
      minH: 2,
    })),
  };

  const renderWidget = (widget: any) => {
    const Component = WIDGET_COMPONENTS[widget.type];
    
    if (!Component) {
      console.warn(`No component found for widget type: ${widget.type}`);
      return null;
    }

    return (
      <div key={widget.id}>
        <Component 
          id={widget.id}
          title={widget.title}
          config={configs[widget.id] || {
            isMaximized: false,
            isMinimized: false,
            settings: {},
          }}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6">
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={60}
            onLayoutChange={(layout, allLayouts) => {
              layout.forEach((item) => {
                dispatch(updateWidgetPosition({
                  id: item.i,
                  x: item.x,
                  y: item.y,
                  w: item.w,
                  h: item.h,
                }));
              });
            }}
            isDraggable={true}
            isResizable={true}
            margin={[16, 16]}
            containerPadding={[16, 16]}
            draggableCancel=".no-drag"    
            resizableCancel=".no-drag" 
          >
            {activeWidgets.map(renderWidget)}
          </ResponsiveGridLayout>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
