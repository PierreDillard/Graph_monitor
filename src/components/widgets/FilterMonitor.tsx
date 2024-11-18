import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  selectPIDMetrics,
  selectTimeSeriesData,
  selectPIDLogs,
} from '../../store/slices/pidSlice';
import {
  FilterMonitorProps,
  PIDType,
  FilterData,
} from '../../types/pidMonitor';
import { useFilterMonitor } from '../../hooks/useFilterMonitor';
import { RootState } from '../../store';
import WidgetWrapper from '../common/WidgetWrapper';

// Composant Tooltip optimisé
const CustomTooltip = React.memo(({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 p-3 rounded shadow border border-gray-700">
        <p className="text-gray-400">{new Date(label).toLocaleTimeString()}</p>
        <p className="text-white">Buffer: {payload[0].value.toFixed(1)}%</p>
        <p className="text-gray-300 text-sm">
          Raw: {payload[0].payload.rawBuffer}/{payload[0].payload.bufferTotal}
        </p>
      </div>
    );
  }
  return null;
});

CustomTooltip.displayName = 'CustomTooltip';

// Composant d'informations du nœud
const NodeInfo = React.memo(({ node }: { node: any }) => (
  <div className="mb-4 p-4 bg-gray-800 rounded-lg">
    <h3 className="font-medium mb-2">Node Information</h3>
    <div className="space-y-2 text-sm">
      <div>
        <span className="text-gray-400">Name:</span> {node.name}
      </div>
      <div>
        <span className="text-gray-400">Type:</span> {node.type}
      </div>
      <div>
        <span className="text-gray-400">Status:</span>{' '}
        {node.status || 'No status'}
      </div>
      <div>
        <span className="text-gray-400">Bytes Processed:</span>{' '}
        {typeof node.bytes_done === 'number'
          ? node.bytes_done.toLocaleString()
          : '0'}
      </div>
    </div>
  </div>
));

NodeInfo.displayName = 'NodeInfo';

// Composant de la liste des PIDs
interface FilterListProps {
  type: PIDType;
  pids: Record<string, FilterData>;
  selectedPID: string | null;
  selectedPIDType: PIDType | null;
  onPIDSelect: (pidName: string, type: PIDType) => void;
  nodeCount: number;
}

const FilterList = React.memo(
  ({
    type,
    pids,
    selectedPID,
    selectedPIDType,
    onPIDSelect,
    nodeCount,
  }: FilterListProps) => {
    const handlePIDClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>, pidName: string) => {
        // Empêcher la propagation de l'événement si nécessaire
        event.preventDefault();
        event.stopPropagation();
        onPIDSelect(pidName, type);
      },
      [onPIDSelect, type],
    );

    // Vérifier si pids est défini et non vide
    if (!pids || Object.keys(pids).length === 0) {
      return (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-400 uppercase mb-2">
            {type === 'input' ? 'Input PIDs' : 'Output PIDs'} (0)
          </h3>
          <div className="text-gray-400 text-sm">No PIDs available</div>
        </div>
      );
    }

    return (
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-400 uppercase mb-2 no-drag">
          {type === 'input' ? 'Input PIDs' : 'Output PIDs'} ({nodeCount})
        </h3>
        {Object.entries(pids).map(([pidName, data]) => {
          const isSelected =
            selectedPID === pidName && selectedPIDType === type;
          const bufferPercentage = data.buffer_total
            ? (data.buffer / data.buffer_total) * 100
            : 0;

          return (
            <button
              key={pidName}
              onClick={(e) => handlePIDClick(e, pidName)}
              className={`w-full text-left mb-2 p-3 rounded-lg transition-all duration-200 no-drag
              ${
                isSelected
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-700 hover:bg-gray-600'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
              type="button"
              role="button"
              aria-pressed={isSelected}
              data-pid={pidName}
              data-type={type}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{pidName}</span>
                <span className="text-sm text-gray-300">
                  Buffer: {bufferPercentage.toFixed(1)}%
                </span>
              </div>
              {data.codec && (
                <div className="text-sm text-gray-400 mt-1">
                  Codec: {data.codec}
                </div>
              )}
              {'source_idx' in data && (
                <div className="text-sm text-gray-400 mt-1">
                  Source: Filter {data.source_idx}
                </div>
              )}
            </button>
          );
        })}
      </div>
    );
  },
);

FilterList.displayName = 'PIDList';

const FilterMonitor: React.FC<FilterMonitorProps> = ({ id, title }) => {
  // Hooks
  const selectedNode = useSelector(
    (state: RootState) => state.widgets.selectedNode,
  );
  const { selectedPID, selectedPIDType, bufferMetrics } =
    useSelector(selectPIDMetrics);
  const timeSeriesData = useSelector(selectTimeSeriesData);
  const logs = useSelector(selectPIDLogs);
  const { handlePIDSelect } = useFilterMonitor();

  if (!selectedNode) {
    return (
      <WidgetWrapper id={id} title={title}>
        <div className="flex items-center justify-center text-gray-400">
          Select a node in the Pipeline Graph to view PID details
        </div>
      </WidgetWrapper>
    );
  }

  return (
    <WidgetWrapper id={id} title={`Filter Monitor - ${selectedNode.name}`}>
      <div className="flex h-full">
        {/* Panneau latéral */}
        <div className="w-1/3 p-4 border-r border-gray-700 overflow-y-auto">
          <NodeInfo node={selectedNode} />
          <FilterList
            type="input"
            pids={selectedNode.ipid || {}}
            selectedPID={selectedPID}
            selectedPIDType={selectedPIDType}
            onPIDSelect={handlePIDSelect}
            nodeCount={selectedNode.nb_ipid}
          />
          <FilterList
            type="output"
            pids={selectedNode.opid || {}}
            selectedPID={selectedPID}
            selectedPIDType={selectedPIDType}
            onPIDSelect={handlePIDSelect}
            nodeCount={selectedNode.nb_opid}
          />
        </div>

        {/* Zone principale */}
        <div className="flex-1 p-4 overflow-hidden">
          {selectedPID ? (
            <div className="h-full flex flex-col">
              {/* Métriques du buffer */}
              {bufferMetrics && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-800 p-4 rounded">
                    <h4 className="text-sm text-gray-400 mb-1">
                      Buffer Status
                    </h4>
                    <div className="text-2xl font-semibold">
                      {bufferMetrics.bufferPercentage.toFixed(1)}%
                    </div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded">
                    <h4 className="text-sm text-gray-400 mb-1">
                      Buffer Capacity
                    </h4>
                    <div className="text-2xl font-semibold">
                      {bufferMetrics.bufferTotal}
                    </div>
                  </div>
                </div>
              )}

              {/* Graphique */}
              <div className="bg-gray-800 p-4 rounded-lg flex-grow min-h-[300px]">
                <h4 className="text-sm font-medium mb-4">
                  Buffer Usage Over Time
                </h4>
                <div className="h-[calc(100%-2rem)]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={timeSeriesData}
                      margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="timestamp"
                        tick={{ fill: '#9CA3AF' }}
                        stroke="#4B5563"
                        tickFormatter={(value) =>
                          new Date(value).toLocaleTimeString()
                        }
                      />
                      <YAxis
                        tick={{ fill: '#9CA3AF' }}
                        stroke="#4B5563"
                        domain={[0, 100]}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="buffer"
                        stroke="#3B82F6"
                        dot={false}
                        strokeWidth={2}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Logs */}
              <div className="mt-4 bg-gray-800 p-4 rounded-lg h-48 overflow-y-auto">
                <h4 className="text-sm font-medium mb-2">Event Log</h4>
                <div className="space-y-2">
                  {logs.map((log, index) => (
                    <div
                      key={`${log.id}-${index}`}
                      className="flex items-start gap-2 text-sm"
                    >
                      <span className="text-gray-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span
                        className={
                          log.level === 'error'
                            ? 'text-red-400'
                            : log.level === 'warning'
                              ? 'text-yellow-400'
                              : 'text-blue-400'
                        }
                      >
                        {log.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              Select a PID to view detailed metrics
            </div>
          )}
        </div>
      </div>
    </WidgetWrapper>
  );
};

export default React.memo(FilterMonitor);
