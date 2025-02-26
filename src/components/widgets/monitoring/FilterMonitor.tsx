import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { RootState } from '../../../store';
import { WidgetProps } from '../../../types/ui/widget';
import {
  MetricCardProps,
  ProcessingChartProps,
  FilterMetric,
} from '../../../types/domain/monitoring/filterMonitor';
import WidgetWrapper from '../../common/WidgetWrapper';
import { addFilterMetric } from '../../../store/slices/filter-monitoringSlice';
import { formatBytes } from '../../../utils/filterMonitorUtils';

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  total,
  unit,
  className = '',
}) => (
  <div className={`bg-gray-700 p-4 rounded ${className}`}>
    <h3 className="text-sm text-gray-400 mb-1">{title}</h3>
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-semibold">
        {unit === 'bytes' ? formatBytes(value) : value.toLocaleString()}
      </span>
      {total && (
        <span className="text-sm text-gray-400">
          / {unit === 'bytes' ? formatBytes(total) : total.toLocaleString()}
        </span>
      )}
      {unit && unit !== 'bytes' && (
        <span className="text-sm text-gray-400">{unit}</span>
      )}
    </div>
  </div>
);

const ProcessingChart: React.FC<ProcessingChartProps> = ({
  history = [],
  className = '',
}) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-gray-800 p-3 rounded shadow-lg border border-gray-700">
          <p className="text-gray-400 mb-2">
            {new Date(label).toLocaleTimeString()}
          </p>
          {payload.map((entry: any, index: number) => {
            const value =
              entry.dataKey === 'bytes_done'
                ? formatBytes(entry.value)
                : entry.value.toLocaleString();

            return (
              <p key={index} style={{ color: entry.color }} className="text-sm">
                {entry.name}: {value}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-gray-800 p-4 rounded-lg h-[300px] ${className}`}>
      <h3 className="text-sm font-medium mb-4">Processing Metrics</h3>
      <div className="h-[calc(100%-2rem)]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={history}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={['auto', 'auto']}
              tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
              stroke="#6B7280"
            />
            <YAxis
              yAxisId="bytes"
              orientation="left"
              stroke="#3b82f6"
              tickFormatter={(value) => formatBytes(value, 0)}
            />
            <YAxis yAxisId="packets" orientation="right" stroke="#10b981" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              yAxisId="bytes"
              type="monotone"
              name="Bytes Done"
              dataKey="bytes_done"
              stroke="#3b82f6"
              dot={false}
              strokeWidth={2}
            />
            <Line
              yAxisId="packets"
              type="monotone"
              name="Packets Sent"
              dataKey="packets_sent"
              stroke="#10b981"
              dot={false}
              strokeWidth={2}
            />
            <Line
              yAxisId="packets"
              type="monotone"
              name="Packets Done"
              dataKey="packets_done"
              stroke="#f59e0b"
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const FilterMonitor: React.FC<WidgetProps> = ({ id, title }) => {
  const dispatch = useDispatch();
  const selectedFilter = useSelector(
    (state: RootState) => state.graph.selectedFilterDetails,
  );
  const filterHistory = useSelector((state: RootState) =>
    selectedFilter
      ? state.filterMonitoring.selectedFilterHistory[selectedFilter.idx]
      : [],
  );

  useEffect(() => {
    if (selectedFilter) {
      const metric: FilterMetric = {
        timestamp: Date.now(),
        bytes_done: Number(selectedFilter.bytes_done) || 0,
        packets_sent: Number(selectedFilter.pck_sent) || 0,
        packets_done: Number(selectedFilter.pck_done) || 0,
      };

      dispatch(
        addFilterMetric({
          filterId: selectedFilter.idx.toString(),
          metric,
        }),
      );
    }
  }, [selectedFilter, dispatch]);

  if (!selectedFilter) {
    return (
      <WidgetWrapper id={id} title={title}>
        <div className="flex items-center justify-center h-full  text-gray-400">
          Select a filter in the Graph Monitor to view details
        </div>
      </WidgetWrapper>
    );
  }

  return (
    <WidgetWrapper id={id} title={title}>
      <div className="flex flex-col h-full p-2 space-y-2 ">
        {/* Informations du filtre */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-700 p-1 rounded">
            <h3 className="text-sm text-gray-400 mb-1">Filter Name</h3>
            <div className="font-medium text-lg">{selectedFilter.name}</div>
            <div className="text-sm text-gray-400 mt-1">
              {selectedFilter.type}
            </div>
          </div>
          <div className="bg-gray-700 p-1 rounded">
            <h3 className="text-sm text-gray-400 mb-1">Status</h3>
            <div className="font-medium break-words">
              {selectedFilter.status || 'No status available'}
            </div>
          </div>
        </div>

        {/* Métriques */}
        <div className="grid grid-cols-3 gap-4">
          <MetricCard
            title="Data Processed"
            value={selectedFilter.bytes_done || 0}
            unit="bytes"
            className="bg-blue-900/20"
          />
          <MetricCard
            title="Packets Sent"
            value={selectedFilter.pck_sent || 0}
            unit="pkts"
            className="bg-green-900/20"
          />
          <MetricCard
            title="Packets Done"
            value={selectedFilter.pck_done || 0}
            unit="pkts"
            className="bg-yellow-900/20"
          />
        </div>

        {/* Graphique */}
        <ProcessingChart history={filterHistory} className="flex-grow" />
      </div>
    </WidgetWrapper>
  );
};

export default React.memo(FilterMonitor);
