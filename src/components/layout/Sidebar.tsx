import React from 'react';
import { useDispatch } from 'react-redux';
import { addWidget } from '../../store/slices/widgetsSlice';
import { WidgetType } from '../../types/widget';
import {
  Activity,
  Gauge,
  Video,
  Volume2,
  FileText,
  Share2,
  Layout,
} from 'lucide-react';

const availableWidgets = [
  {
    type: WidgetType.AUDIO,
    title: 'Audio Monitor',
    icon: Volume2,
    defaultSize: { w: 4, h: 4 },
  },
  {
    type: WidgetType.VIDEO,
    title: 'Video Monitor',
    icon: Video,
    defaultSize: { w: 6, h: 4 },
  },
  {
    type: WidgetType.METRICS,
    title: 'System Metrics',
    icon: Gauge,
    defaultSize: { w: 6, h: 4 },
  },
  {
    type: WidgetType.LOGS,
    title: 'System Logs',
    icon: FileText,
    defaultSize: { w: 4, h: 4 },
  },
  {
    type: WidgetType.GRAPH,
    title: 'Pipeline Graph',
    icon: Share2,
    defaultSize: { w: 8, h: 6 },
  },
  {
    type: WidgetType.FILTER,
    title: 'Filter Metrics',
    icon: Activity,
    defaultSize: { w: 4, h: 4 },
  },
  {
    type: WidgetType.MULTI_FILTER,
    title: 'Multi-Filter Monitor',
    icon: Layout, // Vous pouvez choisir une autre icône si vous préférez
    defaultSize: { w: 12, h: 6 }, // Taille par défaut plus grande car il affiche plusieurs filtres
  },
];

const Sidebar: React.FC = () => {
  const dispatch = useDispatch();

  const handleAddWidget = (
    type: WidgetType,
    defaultSize: { w: number; h: number },
  ) => {
    dispatch(
      addWidget({
        id: `${type}-${Date.now()}`,
        type,
        title: availableWidgets.find((w) => w.type === type)?.title || '',
        x: 0,
        y: 0,
        w: defaultSize.w,
        h: defaultSize.h,
        isResizable: true,
        isDraggable: true,
      }),
    );
  };

  return (
    <div className="w-64 bg-gray-800 p-6 h-full">
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Dashboard</h2>
        <p className="text-sm text-gray-400">
          Drag and drop widgets to create your custom dashboard
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-400 uppercase">
          Available Widgets
        </h3>
        {availableWidgets.map((widget) => (
          <button
            key={widget.type}
            onClick={() => handleAddWidget(widget.type, widget.defaultSize)}
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            <widget.icon className="w-5 h-5" />
            <span>{widget.title}</span>
          </button>
        ))}
      </div>

      <div className="mt-8 space-y-4">
        <h3 className="text-sm font-medium text-gray-400 uppercase">Layouts</h3>
        <button className="w-full p-2 rounded bg-blue-600 hover:bg-blue-500 transition-colors">
          Save Current Layout
        </button>
        <select className="w-full p-2 rounded bg-gray-700 border border-gray-600">
          <option value="">Load Layout...</option>
          <option value="default">Default Layout</option>
          <option value="minimal">Minimal Layout</option>
        </select>
      </div>
    </div>
  );
};

export default Sidebar;
