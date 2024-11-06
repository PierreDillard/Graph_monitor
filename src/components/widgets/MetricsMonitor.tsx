import React, { useEffect, useState, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import WidgetWrapper from '../common/WidgetWrapper';

interface MetricsMonitorProps {
  id: string;
  title: string;
}

interface MetricData {
  timestamp: string;
  cpu: number;
  memory: number;
  network: number;
}

const MetricsMonitor: React.FC<MetricsMonitorProps> = ({ id, title }) => {
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const intervalRef = useRef<number>();
  const isComponentMounted = useRef(true);

  useEffect(() => {
    // Définir le composant comme monté
    isComponentMounted.current = true;

    // Simuler les données en temps réel
    intervalRef.current = window.setInterval(() => {
      if (isComponentMounted.current) {
        // Vérifier si le composant est toujours monté
        const now = new Date();
        const newMetric = {
          timestamp: now.toLocaleTimeString(),
          cpu: Math.random() * 100,
          memory: Math.random() * 50,
          network: Math.random() * 1000,
        };

        setMetrics((prev) => {
          const newMetrics = [...prev, newMetric];
          if (newMetrics.length > 20) {
            newMetrics.shift();
          }
          return newMetrics;
        });
      }
    }, 1000);

    // Cleanup function
    return () => {
      isComponentMounted.current = false; // Marquer le composant comme démonté
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
      setMetrics([]); // Nettoyer les données
    };
  }, []);
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-3 rounded shadow border border-gray-700">
          <p className="text-gray-400">{label}</p>
          {payload.map((pld: any) => (
            <p key={pld.dataKey} style={{ color: pld.color }}>
              {pld.dataKey}: {pld.value.toFixed(2)}
              {pld.dataKey === 'network' ? ' Mbps' : '%'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <WidgetWrapper id={id} title={title}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full p-4">
        {/* CPU Usage */}
        <div className="bg-gray-700 p-4 rounded h-[300px]">
          {' '}
          {/* Hauteur fixe ajoutée */}
          <h4 className="text-sm font-medium mb-2">CPU Usage</h4>
          <div className="h-[250px] w-full">
            {' '}
            {/* Conteneur avec hauteur fixe */}
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="timestamp"
                  tick={{ fill: '#9CA3AF' }}
                  stroke="#4B5563"
                />
                <YAxis
                  tick={{ fill: '#9CA3AF' }}
                  stroke="#4B5563"
                  domain={[0, 100]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="cpu"
                  stroke="#10B981"
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Memory Usage */}
        <div className="bg-gray-700 p-4 rounded h-[300px]">
          {' '}
          {/* Hauteur fixe ajoutée */}
          <h4 className="text-sm font-medium mb-2">Memory Usage</h4>
          <div className="h-[250px] w-full">
            {' '}
            {/* Conteneur avec hauteur fixe */}
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="timestamp"
                  tick={{ fill: '#9CA3AF' }}
                  stroke="#4B5563"
                />
                <YAxis
                  tick={{ fill: '#9CA3AF' }}
                  stroke="#4B5563"
                  domain={[0, 100]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="memory"
                  stroke="#3B82F6"
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 md:col-span-2">
          <div className="bg-gray-800 p-4 rounded">
            <h5 className="text-xs text-gray-400">CPU Load</h5>
            <div className="text-lg font-semibold text-green-400">
              {metrics[metrics.length - 1]?.cpu.toFixed(1)}%
            </div>
          </div>
          <div className="bg-gray-800 p-4 rounded">
            <h5 className="text-xs text-gray-400">Memory Usage</h5>
            <div className="text-lg font-semibold text-blue-400">
              {metrics[metrics.length - 1]?.memory.toFixed(1)}%
            </div>
          </div>
          <div className="bg-gray-800 p-4 rounded">
            <h5 className="text-xs text-gray-400">Network</h5>
            <div className="text-lg font-semibold text-purple-400">
              {metrics[metrics.length - 1]?.network.toFixed(1)} Mbps
            </div>
          </div>
        </div>
      </div>
    </WidgetWrapper>
  );
};
export default React.memo(MetricsMonitor);
