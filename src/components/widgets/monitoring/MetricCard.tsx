import React from 'react';
interface MetricCardProps {
    title: string;
    value: number;
    total?: number;
    unit?: string;
    color?: 'blue' | 'green' | 'yellow' | 'red';
  }
  
  export const MetricCard: React.FC<MetricCardProps> = React.memo(({
    title,
    value,
    total,
    unit,
    color = 'blue'
  }) => {
    const colorClasses = {
      blue: 'bg-blue-900/20',
      green: 'bg-green-900/20',
      yellow: 'bg-yellow-900/20',
      red: 'bg-red-900/20'
    };
  
    return (
      <div className={`p-4 rounded-lg ${colorClasses[color]}`}>
        <div className="text-sm text-gray-400">{title}</div>
        <div className="mt-2 flex items-baseline">
          <div className="text-2xl font-semibold">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          {total && (
            <span className="text-sm text-gray-400 ml-1">
              / {total.toLocaleString()}
            </span>
          )}
          {unit && <span className="text-sm text-gray-400 ml-1">{unit}</span>}
        </div>
      </div>
    );
  });