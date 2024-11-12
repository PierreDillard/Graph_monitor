import React, { useEffect, useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSelector } from 'react-redux';
import WidgetWrapper from '../common/WidgetWrapper';
import { RootState } from '../../store';

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  message: string;
}

interface ChartDataPoint {
  timestamp: number;
  buffer: number;
}

interface PIDMonitorProps {
  id: string;
  title: string;
  config: {
    isMaximized: boolean;
    isMinimized: boolean;
    settings: Record<string, any>;
  };
}

// Fonction pour générer des données initiales
const generateInitialData = (count: number): ChartDataPoint[] => {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    timestamp: now - (count - i) * 1000,
    buffer: Math.random() * 70 + 30 // Valeurs entre 30 et 100
  }));
};

const PIDMonitor: React.FC<PIDMonitorProps> = ({ id, title }) => {
  const selectedNode = useSelector((state: RootState) => state.widgets.selectedNode);
  const [selectedPID, setSelectedPID] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<ChartDataPoint[]>(generateInitialData(20));
  const [chartKey, setChartKey] = useState(0); // Pour forcer le re-render du graphique

  const addLog = useCallback((level: 'info' | 'warning' | 'error', message: string) => {
    setLogs(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        timestamp: new Date(),
        level,
        message
      }
    ].slice(-100));
  }, []);

  // Reset data when node changes
  useEffect((): (() => void) => {
    if (selectedNode) {
      addLog('info', `Node ${selectedNode.name} (${selectedNode.type}) selected`);
      setSelectedPID(null);
      setTimeSeriesData(generateInitialData(20));
      setChartKey(prev => prev + 1);
    }
    // Toujours retourner une fonction de nettoyage, même vide si nécessaire
    return () => {
      setSelectedPID(null);
      setTimeSeriesData([]);
    };
  }, [selectedNode, addLog]);

  // Update chart data
  useEffect((): (() => void) => {
    let intervalId: number | undefined;
  
    if (selectedPID && selectedNode) {
      intervalId = window.setInterval(() => {
        const newDataPoint = {
          timestamp: Date.now(),
          buffer: Math.random() * 70 + 30 // Valeurs entre 30 et 100
        };
  
        setTimeSeriesData(prev => {
          const newData = [...prev, newDataPoint];
          if (newData.length > 50) newData.shift();
          return newData;
        });
  
        // Ajouter des logs aléatoires pour la simulation
        const bufferValue = newDataPoint.buffer;
        if (bufferValue < 40) {
          addLog('warning', `Low buffer (${bufferValue.toFixed(1)}%) for ${selectedPID}`);
        } else if (bufferValue > 90) {
          addLog('info', `High buffer usage (${bufferValue.toFixed(1)}%) for ${selectedPID}`);
        }
      }, 1000);
    }
  
    return () => {
      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
      }
    };
  }, [selectedPID, selectedNode, addLog]);

  const renderPIDList = useCallback((type: 'input' | 'output') => {
    if (!selectedNode) return null;

    const pids = type === 'input' ? selectedNode.ipid : selectedNode.opid;

    return (
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-400 uppercase mb-2">
          {type === 'input' ? 'Input PIDs' : 'Output PIDs'} 
          ({type === 'input' ? selectedNode.nb_ipid : selectedNode.nb_opid})
        </h3>
        {Object.entries(pids).map(([pidName, data]) => (
          <div
            key={pidName}
            onClick={() => setSelectedPID(pidName)}
            className={`cursor-pointer mb-2 p-3 rounded-lg ${
              selectedPID === pidName ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">{pidName}</span>
              <span className="text-sm text-gray-300">
                Buffer: {data.buffer.toFixed(1)}/{data.buffer_total}
              </span>
            </div>
            {'source_idx' in data && (
              <div className="text-sm text-gray-400 mt-1">
                Source: Filter {data.source_idx}
              </div>
            )}
          </div>
        ))}
        {Object.keys(pids).length === 0 && (
          <div className="text-gray-400 text-sm">No {type} PIDs available</div>
        )}
      </div>
    );
  }, [selectedNode, selectedPID]);

  const CustomTooltip = useCallback(({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-3 rounded shadow border border-gray-700">
          <p className="text-gray-400">{new Date(label).toLocaleTimeString()}</p>
          <p className="text-white">Buffer: {payload[0].value.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  }, []);

  if (!selectedNode) {
    return (
      <WidgetWrapper id={id} title={title}>
        <div className="flex items-center justify-center h-full text-gray-400">
          Select a node in the Pipeline Graph to view PID details
        </div>
      </WidgetWrapper>
    );
  }

  return (
    <WidgetWrapper id={id} title={`PID Monitor - ${selectedNode.name}`}>
      <div className="flex h-full">
        <div className="w-1/3 p-4 border-r border-gray-700">
          {/* Node Info */}
          <div className="mb-4 p-4 bg-gray-800 rounded-lg">
            <h3 className="font-medium mb-2">Node Information</h3>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-400">Name:</span> {selectedNode.name}</div>
              <div><span className="text-gray-400">Type:</span> {selectedNode.type}</div>
              <div><span className="text-gray-400">Status:</span> {selectedNode.status || 'No status'}</div>
              <div>
                <span className="text-gray-400">Bytes Processed:</span>{' '}
                {typeof selectedNode.bytes_done === 'number' 
                  ? selectedNode.bytes_done.toLocaleString()
                  : '0'
                }
              </div>
            </div>
          </div>

          {/* PIDs */}
          {renderPIDList('input')}
          {renderPIDList('output')}
        </div>

        <div className="flex-1 p-4 overflow-hidden">
          {selectedPID ? (
            <div className="h-full flex flex-col">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-800 p-4 rounded">
                  <h4 className="text-sm text-gray-400 mb-1">Current Buffer</h4>
                  <div className="text-2xl font-semibold">
                    {(selectedNode.opid[selectedPID]?.buffer || selectedNode.ipid[selectedPID]?.buffer || 0).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-gray-800 p-4 rounded">
                  <h4 className="text-sm text-gray-400 mb-1">Buffer Capacity</h4>
                  <div className="text-2xl font-semibold">
                    {selectedNode.opid[selectedPID]?.buffer_total || selectedNode.ipid[selectedPID]?.buffer_total || 0}
                  </div>
                </div>
              </div>

              <div className="flex-grow bg-gray-800 p-4 rounded-lg min-h-[300px]" style={{ height: '300px' }}>
                <h4 className="text-sm font-medium mb-4">Buffer Usage Over Time</h4>
                <div style={{ width: '100%', height: 'calc(100% - 2rem)' }}>
                  <ResponsiveContainer key={chartKey}>
                    <LineChart data={timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="timestamp"
                        tick={{ fill: '#9CA3AF' }}
                        stroke="#4B5563"
                        tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                      />
                      <YAxis
                        tick={{ fill: '#9CA3AF' }}
                        stroke="#4B5563"
                        domain={[0, 100]}
                      />
                      <Tooltip content={CustomTooltip} />
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
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 mb-2 text-sm">
                    <span className="text-gray-400">{log.timestamp.toLocaleTimeString()}</span>
                    <span className={`
                      ${log.level === 'error' ? 'text-red-400' : ''}
                      ${log.level === 'warning' ? 'text-yellow-400' : ''}
                      ${log.level === 'info' ? 'text-blue-400' : ''}
                    `}>
                      {log.message}
                    </span>
                  </div>
                ))}
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

export default React.memo(PIDMonitor);