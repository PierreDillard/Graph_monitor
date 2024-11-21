import React from 'react';
import { Activity } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ChartDataPoint } from '../../../types/filter';

interface RealTimeGraphProps {
  data: ChartDataPoint[];
  timeWindow?: number; // in seconds
}

export const RealTimeGraph = React.memo(
  ({ data, timeWindow = 30 }: RealTimeGraphProps) => {
    const CustomTooltip = React.useCallback(
      ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
          return (
            <div className="bg-gray-800 p-3 rounded shadow border border-gray-700">
              <p className="text-gray-400">
                {new Date(label).toLocaleTimeString()}
              </p>
              <p className="text-white">
                Buffer: {payload[0].value.toFixed(1)}%
              </p>
              <p className="text-gray-300 text-sm">
                Raw: {payload[0].payload.rawBuffer}/
                {payload[0].payload.bufferTotal}
              </p>
            </div>
          );
        }
        return null;
      },
      [],
    );

    return (
      <div className="bg-gray-800 p-4 rounded-lg flex-grow">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium">Buffer Usage Over Time</h4>
          <div className="flex items-center text-sm">
            <Activity className="w-4 h-4 text-blue-400 mr-2" />
            <span className="text-gray-400">Last {timeWindow} seconds</span>
          </div>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
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
    );
  },
);

RealTimeGraph.displayName = 'RealTimeGraph';
