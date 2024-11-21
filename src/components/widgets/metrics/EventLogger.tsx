import React, { useEffect, useRef } from 'react';
import { AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: number;
  level: 'info' | 'warning' | 'error';
  message: string;
}

interface EventLoggerProps {
  logs: LogEntry[];
  maxHeight?: string;
}

export const EventLogger = React.memo(
  ({ logs, maxHeight = 'h-48' }: EventLoggerProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, [logs]);

    const getIcon = (level: string) => {
      switch (level) {
        case 'error':
          return <AlertCircle className="w-4 h-4 text-red-400" />;
        case 'warning':
          return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
        default:
          return <Info className="w-4 h-4 text-blue-400" />;
      }
    };

    return (
      <div
        className={`bg-gray-800 p-4 rounded-lg ${maxHeight} overflow-hidden`}
      >
        <h4 className="text-sm font-medium mb-2 sticky top-0 bg-gray-800 z-10">
          Event Log
        </h4>
        <div ref={scrollRef} className="space-y-2 overflow-y-auto h-full">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-2 text-sm p-2 hover:bg-gray-700 rounded transition-colors"
            >
              {getIcon(log.level)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-xs">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="text-xs uppercase font-medium tracking-wider">
                    {log.level}
                  </span>
                </div>
                <p className="mt-1 text-sm break-words">{log.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },
);

EventLogger.displayName = 'EventLogger';
