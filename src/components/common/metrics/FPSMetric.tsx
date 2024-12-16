import React from 'react';
import { Activity } from 'lucide-react';
import { TimeFraction } from '../../../types/gpac';

interface FPSMetricProps {
  fps?: {
    type: string | undefined;
    val: TimeFraction;
  };
  className?: string;
}

const FPSMetric: React.FC<FPSMetricProps> = ({ fps, className = '' }) => {
  if (!fps?.val) return null;
  if (!fps?.val?.n || !fps?.val?.d) return null;
  const fpsValue = fps.val.n / fps.val.d;

  let statusColor = 'text-green-400';
  if (fpsValue < 24) statusColor = 'text-red-400';
  else if (fpsValue < 30) statusColor = 'text-yellow-400';

  return (
    <div className={`bg-gray-800 p-4 rounded-lg ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">FPS</span>
        </div>
        <div className={`text-xl font-semibold ${statusColor}`}>
          {fpsValue.toFixed(2)}
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        Frame Rate: {fps.val.n}/{fps.val.d}
      </div>
    </div>
  );
};

export default React.memo(FPSMetric);
