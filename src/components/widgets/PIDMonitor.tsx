import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import WidgetWrapper from '../common/WidgetWrapper';
import { Activity, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import Alert from '../ui/Alert';

interface PIDMonitorProps {
  id: string;
  title: string;
}

interface PIDData {
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
  ipid: Record<string, PIDInfo>;
  opid: Record<string, PIDInfo>;
}

interface PIDInfo {
  buffer: number;
  buffer_total: number;
  source_idx?: number;
}

interface TimeSeriesData {
  timestamp: number;
  buffer: number;
  bufferTotal: number;
}

const PIDMonitor: React.FC<PIDMonitorProps> = ({ id, title }) => {
  const [selectedPID, setSelectedPID] = useState<string | null>(null);
  const [pidData, setPIDData] = useState<PIDData | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [alerts, setAlerts] = useState<Array<{ type: 'success' | 'error' | 'warning' | 'info', message: string }>>([]);

  // Fonction pour ajouter une alerte
  const addAlert = useCallback((type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    setAlerts(prev => [...prev, { type, message }].slice(-3)); // Garde les 3 dernières alertes
  }, []);

  // Surveiller l'état du buffer
  useEffect(() => {
    if (selectedPID && pidData) {
      const pidInfo = pidData.opid[selectedPID] || pidData.ipid[selectedPID];
      if (pidInfo) {
        const bufferPercentage = (pidInfo.buffer / pidInfo.buffer_total) * 100;
        
        if (bufferPercentage < 10) {
          addAlert('error', `Buffer critically low for ${selectedPID}: ${bufferPercentage.toFixed(1)}%`);
        } else if (bufferPercentage < 30) {
          addAlert('warning', `Buffer running low for ${selectedPID}: ${bufferPercentage.toFixed(1)}%`);
        } else if (bufferPercentage > 90) {
          addAlert('info', `Buffer nearly full for ${selectedPID}: ${bufferPercentage.toFixed(1)}%`);
        }
      }
    }
  }, [selectedPID, pidData, addAlert]);

  useEffect(() => {
    // Mock data - à remplacer par des données WebSocket
    const mockPIDData: PIDData = {
      name: "ffdmx",
      type: "ffdmx",
      itag: null,
      ID: null,
      nb_ipid: 1,
      nb_opid: 2,
      status: "Processing...",
      bytes_done: 85610163,
      idx: 2,
      gpac_args: [],
      ipid: {
        "video1": {
          buffer: 0,
          buffer_total: 100,
          source_idx: 1
        }
      },
      opid: {
        "video1": {
          buffer: 30,
          buffer_total: 100
        },
        "audio1": {
          buffer: 45,
          buffer_total: 100
        }
      }
    };

    setPIDData(mockPIDData);

    const interval = setInterval(() => {
      if (selectedPID) {
        const newDataPoint = {
          timestamp: Date.now(),
          buffer: Math.random() * 100,
          bufferTotal: 100
        };

        setTimeSeriesData(prev => {
          const newData = [...prev, newDataPoint];
          if (newData.length > 50) newData.shift();
          return newData;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedPID]);

  const renderPIDList = (pids: Record<string, PIDInfo>, isInput: boolean) => {
    return Object.entries(pids).map(([pidName, info]) => (
      <button
        key={pidName}
        onClick={() => setSelectedPID(pidName)}
        className={`flex items-center justify-between p-3 rounded-lg ${
          selectedPID === pidName ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
        } transition-colors mb-2 w-full`}
      >
        <div className="flex items-center gap-2">
          {isInput ? (
            <ArrowDownCircle className="w-4 h-4 text-green-400" />
          ) : (
            <ArrowUpCircle className="w-4 h-4 text-blue-400" />
          )}
          <span>{pidName}</span>
        </div>
        <div className="text-sm text-gray-300">
          Buffer: {info.buffer}/{info.buffer_total}
        </div>
      </button>
    ));
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-3 rounded shadow border border-gray-700">
          <p className="text-gray-300">
            Buffer: {payload[0].value.toFixed(2)}%
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <WidgetWrapper id={id} title={title}>
      <div className="flex h-full">
        <div className="w-1/3 p-4 border-r border-gray-700">
          {pidData && (
            <>
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-400 uppercase mb-2">Input PIDs</h3>
                {Object.keys(pidData.ipid).length > 0 ? (
                  renderPIDList(pidData.ipid, true)
                ) : (
                  <Alert
                    type="info"
                    message="No input PIDs available"
                  />
                )}
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-400 uppercase mb-2">Output PIDs</h3>
                {Object.keys(pidData.opid).length > 0 ? (
                  renderPIDList(pidData.opid, false)
                ) : (
                  <Alert
                    type="info"
                    message="No output PIDs available"
                  />
                )}
              </div>
            </>
          )}

          {/* Affichage des alertes */}
          {alerts.length > 0 && (
            <div className="mt-4 space-y-2">
              {alerts.map((alert, index) => (
                <Alert
                  key={index}
                  type={alert.type}
                  message={alert.message}
                />
              ))}
            </div>
          )}
        </div>
        
        <div className="flex-1 p-4">
          {selectedPID ? (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-800 p-4 rounded">
                  <h4 className="text-sm text-gray-400 mb-1">Buffer Status</h4>
                  <div className="text-xl font-semibold">
                    {pidData?.opid[selectedPID]?.buffer || pidData?.ipid[selectedPID]?.buffer || 0}%
                  </div>
                </div>
                <div className="bg-gray-800 p-4 rounded">
                  <h4 className="text-sm text-gray-400 mb-1">Total Capacity</h4>
                  <div className="text-xl font-semibold">
                    {pidData?.opid[selectedPID]?.buffer_total || pidData?.ipid[selectedPID]?.buffer_total || 0}
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 p-4 rounded h-64">
                <h4 className="text-sm font-medium mb-2">Buffer Usage Over Time</h4>
                <ResponsiveContainer width="100%" height="100%">
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
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="buffer"
                      stroke="#3B82F6"
                      dot={false}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              Select a PID to view details
            </div>
          )}
        </div>
      </div>
    </WidgetWrapper>
  );
};

export default React.memo(PIDMonitor);