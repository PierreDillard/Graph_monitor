import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface BufferStatusProps {
  currentBuffer: number;
  totalBuffer: number;
  percentage: number;
}

export const BufferStatus = React.memo(
  ({ currentBuffer, totalBuffer, percentage }: BufferStatusProps) => {
    const getStatusColor = () => {
      if (percentage < 20) return 'text-red-400';
      if (percentage > 80) return 'text-yellow-400';
      return 'text-green-400';
    };

    return (
      <div className="bg-gray-800 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm text-gray-400">Buffer Status</h4>
          {percentage < 20 && (
            <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
          )}
        </div>
        <div className="space-y-2">
          <div className={`text-2xl font-bold ${getStatusColor()}`}>
            {percentage.toFixed(1)}%
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Current</span>
            <span>{currentBuffer.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Total</span>
            <span>{totalBuffer.toLocaleString()}</span>
          </div>
          {/* Progress bar */}
          <div className="h-2 bg-gray-700 rounded overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${getStatusColor()}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    );
  },
);

BufferStatus.displayName = 'BufferStatus';
