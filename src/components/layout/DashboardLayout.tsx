import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Responsive,
  WidthProvider,
  Layout,
  Layouts as RGLLayouts,
} from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import { useMediaQuery } from 'react-responsive';
import 'react-resizable/css/styles.css';

import { RootState } from '../../store';
import { updateWidgetPosition } from '../../store/slices/widgetsSlice';
import Header from './Header';
import Sidebar from './Sidebar';
import MultiFilterMonitor from '../widgets/monitoring/multi-filter/MultiFilterMonitor';
import GraphMonitor from '../widgets/graph/GraphMonitor';
import AudioMonitor from '../widgets/AudioMonitor';
import VideoMonitor from '../widgets/video/VideoMonitor';
import LogsMonitor from '../widgets/LogsMonitor';
import FilterMonitor from '../widgets/monitoring/FilterMonitor';
import MetricsMonitor from '../widgets/MetricsMonitor';
import { Widget, WidgetType, WidgetComponent } from '../../types/ui/widget';

const ResponsiveGridLayout = WidthProvider(Responsive);

const WIDGET_COMPONENTS: Record<
  WidgetType,
  React.ComponentType<WidgetComponent>
> = {
  [WidgetType.GRAPH]: GraphMonitor,
  [WidgetType.AUDIO]: AudioMonitor,
  [WidgetType.VIDEO]: VideoMonitor,
  [WidgetType.LOGS]: LogsMonitor,
  [WidgetType.METRICS]: MetricsMonitor,
  [WidgetType.FILTER]: FilterMonitor,
  [WidgetType.MULTI_FILTER]: MultiFilterMonitor,
};

const DashboardLayout: React.FC = () => {
  const isDesktop = useMediaQuery({ minWidth: 1200 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1199 });
  const isMobile = useMediaQuery({ maxWidth: 767 });

  const getBreakpoint = () => {
    if (isDesktop) return 'lg';
    if (isTablet) return 'md';
    return 'sm';
  };

  const dispatch = useDispatch();
  const activeWidgets = useSelector(
    (state: RootState) => state.widgets.activeWidgets,
  );
  const configs = useSelector((state: RootState) => state.widgets.configs);

  const layouts: RGLLayouts = {
    lg: activeWidgets.map((widget) => ({
      i: widget.id,
      x: widget.x,
      y: widget.y,
      w: widget.w,
      h: widget.h,
      minW: 2,
      minH: 2,
    })),
  };

  const renderWidget = (widget: Widget) => {
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
          config={
            configs[widget.id] || {
              isMaximized: false,
              isMinimized: false,
              settings: {},
            }
          }
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header fixe en haut */}
      <div className="fixed top-0 left-0 right-0 h-16 z-20">
        <Header />
      </div>

      <div className="flex pt-16">
        {/* Sidebar fixe */}
        <div className="fixed left-0 top-16 bottom-0 w-64 z-10 bg-gray-800">
          <Sidebar />
        </div>

        <main className="flex-1 pl-64 p-6]">
          <ResponsiveGridLayout
            className="layout "
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={60}
            onLayoutChange={(currentLayout: Layout[]) => {
              currentLayout.forEach((item: Layout) => {
                dispatch(
                  updateWidgetPosition({
                    id: item.i,
                    x: item.x,
                    y: item.y,
                    w: item.w,
                    h: item.h,
                  }),
                );
              });
            }}
            isDraggable={true}
            isResizable={true}
            margin={[16, 16]}
            containerPadding={[16, 16]}
            draggableCancel=".no-drag"
          >
            {activeWidgets.map(renderWidget)}
          </ResponsiveGridLayout>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
