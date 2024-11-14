import React, { useEffect, useState } from 'react';
import WidgetWrapper from '../common/WidgetWrapper';

interface AudioMonitorProps {
  id: string;
  title: string;
}

const AudioMonitor: React.FC<AudioMonitorProps> = ({ id, title }) => {
  const [levels, setLevels] = useState({ left: 0, right: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      setLevels({
        left: Math.random() * 100,
        right: Math.random() * 100,
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <WidgetWrapper id={id} title={title}>
      <div className="flex justify-around items-end h-48">
        <div className="flex flex-col items-center">
          <div className="h-40 w-6 bg-gray-700 rounded relative">
            <div 
              className="absolute bottom-0 w-full bg-green-400 rounded-b transition-all duration-100"
              style={{ height: `${levels.left}%` }}
            />
          </div>
          <span className="mt-2 text-sm">L</span>
          <span className="text-xs text-gray-400">{Math.round(levels.left)}%</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="h-40 w-6 bg-gray-700 rounded relative">
            <div 
              className="absolute bottom-0 w-full bg-green-400 rounded-b transition-all duration-100"
              style={{ height: `${levels.right}%` }}
            />
          </div>
          <span className="mt-2 text-sm">R</span>
          <span className="text-xs text-gray-400">{Math.round(levels.right)}%</span>
        </div>
      </div>
    </WidgetWrapper>
  );
};

export default AudioMonitor;