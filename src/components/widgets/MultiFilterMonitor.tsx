import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  getStatusColor,
  getDataTrend,
  formatBytes,
  isValidFilterData,
} from '../../utils/filterMonitorUtils';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import WidgetWrapper from '../common/WidgetWrapper';
import { WidgetProps } from '../../types/widget';
import { GpacNodeData } from '../../types/gpac';
import { gpacWebSocket } from '../../services/gpacWebSocket';
import BufferMonitoring from './monitoring/buffer/BufferMonitoring';
import {
  removeSelectedFilter,
  updateFilterData,
} from '../../store/slices/multiFilterSlice';
import { setFilterDetails } from '../../store/slices/graphSlice';
import {
  selectRealTimeMetrics,
  selectProcessingRate,
} from '../../store/slices/filter-monitoringSlice';

// Import Recharts components
import { LineChart, ResponsiveContainer, Line, XAxis } from 'recharts';

// MetricCard Component
interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  type?: 'text' | 'number';
  trend?: 'up' | 'down' | 'stable';
  color?: 'blue' | 'green' | 'red' | 'yellow';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  type = 'number',
  trend,
  color = 'blue',
}) => {
  const colorClasses = {
    blue: 'bg-blue-900/20 border-blue-500/30',
    green: 'bg-green-900/20 border-green-500/30',
    red: 'bg-red-900/20 border-red-500/30',
    yellow: 'bg-yellow-900/20 border-yellow-500/30',
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    stable: '→',
  };

  return (
    <div
      className={`p-4 rounded-lg border ${colorClasses[color]} transition-all duration-200 hover:border-opacity-50`}
    >
      <div className="flex justify-between items-start">
        <div className="text-sm text-gray-400">{title}</div>
        {trend && (
          <span className={`text-${color}-400`}>{trendIcons[trend]}</span>
        )}
      </div>
      <div className="mt-2 flex items-baseline">
        <div className="text-2xl font-semibold">
          {type === 'number' ? Number(value).toLocaleString() : value}
        </div>
        {unit && <span className="ml-1 text-sm text-gray-400">{unit}</span>}
      </div>
    </div>
  );
};

// ProcessingMetrics Component
interface ProcessingMetricsProps {
  data: GpacNodeData;
  type: 'input' | 'output';
}

const ProcessingMetrics: React.FC<ProcessingMetricsProps> = ({
  data,
  type,
}) => {
  const pidCount = type === 'input' ? data.nb_ipid : data.nb_opid;
  const pidType = type === 'input' ? 'Input' : 'Output';

  return (
    <div className="space-y-2">
      <div className="text-sm">
        {pidType} PIDs: <span className="text-gray-400">{pidCount}</span>
      </div>
      {data.status && (
        <div className="text-sm">
          Status: <span className="text-gray-400">{data.status}</span>
        </div>
      )}
    </div>
  );
};

// FilterMonitorContent Component
interface FilterMonitorContentProps {
  data: GpacNodeData;
  onUpdate: (newData: any) => void;
}
const FilterMonitorContent: React.FC<FilterMonitorContentProps> = React.memo(
  ({ data, onUpdate }) => {
    const realtimeMetrics = useSelector((state: RootState) =>
      selectRealTimeMetrics(state, data.idx.toString()),
    );
    const processingRate = useSelector((state: RootState) =>
      selectProcessingRate(state, data.idx.toString())
    );
    // State to store history data for charts
    const [historyData, setHistoryData] = useState<
      { time: number; bytes_done: number }[]
    >([]);

    // Debounce state updates
    const updateTimeout = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
      if (updateTimeout.current) {
        clearTimeout(updateTimeout.current);
      }
      updateTimeout.current = setTimeout(() => {
        const now = Date.now();
        setHistoryData((prevData) => {
          const newData = [
            ...prevData,
            { time: now, bytes_done: data.bytes_done },
          ];
          if (newData.length > 50) {
            newData.shift(); // Keep only the latest 50 data points
          }
          return newData;
        });
      }, 500);
    }, [data.bytes_done]);

    return (
      <div className="space-y-6">
        {/* Status Header */}
        <div className="flex justify-between items-center bg-gray-800/50 p-4 rounded-lg">
          <div>
            <h3 className="font-medium text-lg flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${getStatusColor(data.status)}`}
              />
              {data.name}
            </h3>
            <p className="text-sm text-gray-400">{data.type}</p>
          </div>
          <div className="text-sm px-3 py-1 rounded-full bg-gray-700">
            ID: {data.idx}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            title="Processing Rate"
            value={processingRate ? processingRate.toFixed(2) : '0.00'}
            unit="MB/s"
            color="green"
            trend={processingRate > 0 ? 'up' : 'stable'}
          />
          <MetricCard
            title="Buffer Usage"
            value={realtimeMetrics?.bufferStatus.current || 0}
            total={realtimeMetrics?.bufferStatus.total || 0}
            unit="bytes"
            color="blue"
          />
        </div>


        {/* PID Information */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Input PIDs</h4>
            <ProcessingMetrics data={data} type="input" />
          </div>
          <div className="bg-gray-800/50 p-4 rounded-lg">
            <h4 className="text-sm font-medium mb-2">Output PIDs</h4>
            <ProcessingMetrics data={data} type="output" />
          </div>
        </div>
        <div className="bg-gray-800/50 p-4 rounded-lg">
          <BufferMonitoring data={data} />
        </div>
      </div>
    );
  },
);
// Main Component MultiFilterMonitor
const MultiFilterMonitor: React.FC<WidgetProps> = React.memo(
  ({ id, title }) => {
    const dispatch = useDispatch();

    const selectedFilters = useSelector(
      (state: RootState) => state.multiFilter.selectedFilters,
    );
    const isLoading = useSelector((state: RootState) => state.graph.isLoading);

    const handleCloseMonitor = useCallback(
      (filterId: string) => {
        gpacWebSocket.unsubscribeFromFilter(filterId);
        dispatch(removeSelectedFilter(filterId));

        // If it was also the active filter of the PID Monitor, clear it
        if (gpacWebSocket.getCurrentFilterId()?.toString() === filterId) {
          dispatch(setFilterDetails(null));
          gpacWebSocket.setCurrentFilterId(null);
        }
      },
      [dispatch],
    );

    const handleFilterUpdate = useCallback(
      (filterId: string, newData: any) => {
        dispatch(
          updateFilterData({
            id: filterId,
            data: newData,
          }),
        );
      },
      [dispatch],
    );

    if (isLoading) {
      return (
        <WidgetWrapper id={id} title={title}>
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        </WidgetWrapper>
      );
    }

    if (selectedFilters.length === 0) {
      return (
        <WidgetWrapper id={id} title={title}>
          <div className="flex flex-col items-center justify-center h-full p-4 text-gray-400">
            <p>No filters currently monitored</p>
            <p className="text-sm mt-2">
              Click on nodes in the Graph Monitor to start monitoring filters
            </p>
          </div>
        </WidgetWrapper>
      );
    }

    return (
      <WidgetWrapper id={id} title={title}>
        <div className="grid gap-4 p-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {selectedFilters.map((filter) => (
            <div
              key={filter.id}
              className="bg-gray-800 rounded-lg overflow-hidden shadow-lg"
            >
              <div className="p-4 bg-gray-700 flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-lg">
                    {filter.nodeData.name}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {filter.nodeData.type}
                  </p>
                </div>
                <button
                  onClick={() => handleCloseMonitor(filter.id)}
                  className="p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-white"
                  title="Stop monitoring this filter"
                >
                  <span className="sr-only">Close</span>×
                </button>
              </div>

              <div className="p-4">
                <FilterMonitorContent
                  data={filter.nodeData}
                  onUpdate={(newData) => handleFilterUpdate(filter.id, newData)}
                />
              </div>
            </div>
          ))}
        </div>
      </WidgetWrapper>
    );
  },
);

// Add displayNames for debugging
MultiFilterMonitor.displayName = 'MultiFilterMonitor';
FilterMonitorContent.displayName = 'FilterMonitorContent';
MetricCard.displayName = 'MetricCard';
ProcessingMetrics.displayName = 'ProcessingMetrics';

export default MultiFilterMonitor;
