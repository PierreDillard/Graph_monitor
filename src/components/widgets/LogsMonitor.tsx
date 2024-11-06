
import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';
import WidgetWrapper from '../common/WidgetWrapper';

interface LogsMonitorProps {
  id: string;
  title: string;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  message: string;
}

const LogsMonitor: React.FC<LogsMonitorProps> = ({ id, title }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'info' | 'warning' | 'error'>('all');
  const logsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  // Simuler l'arrivée de nouveaux logs
  useEffect(() => {
    const sampleLogs = [
      'Filter video_decoder started successfully',
      'High CPU usage detected on transcoding process',
      'Failed to connect to remote stream',
      'Buffer overflow warning in audio stream',
      'Network latency increased above threshold',
      'Stream reconnected successfully'
    ];

    const interval = setInterval(() => {
      const randomLog = sampleLogs[Math.floor(Math.random() * sampleLogs.length)];
      const levels: Array<'info' | 'warning' | 'error'> = ['info', 'warning', 'error'];
      const randomLevel = levels[Math.floor(Math.random() * levels.length)];

      setLogs(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          timestamp: new Date(),
          level: randomLevel,
          message: randomLog
        }
      ].slice(-100)); 
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const filteredLogs = logs.filter(log => 
    filter === 'all' ? true : log.level === filter
  );

  const getLevelIcon = (level: 'info' | 'warning' | 'error') => {
    switch (level) {
      case 'info':
        return <Info className="w-4 h-4 text-blue-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
    }
  };

  const getLevelStyle = (level: 'info' | 'warning' | 'error') => {
    switch (level) {
      case 'info':
        return 'text-blue-400';
      case 'warning':
        return 'text-yellow-400';
      case 'error':
        return 'text-red-400';
    }
  };

  return (
    <WidgetWrapper id={id} title={title}>
      <div className="flex flex-col h-full">
        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded text-sm ${
              filter === 'all' ? 'bg-gray-600' : 'bg-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('info')}
            className={`px-3 py-1 rounded text-sm ${
              filter === 'info' ? 'bg-blue-600' : 'bg-gray-700'
            }`}
          >
            Info
          </button>
          <button
            onClick={() => setFilter('warning')}
            className={`px-3 py-1 rounded text-sm ${
              filter === 'warning' ? 'bg-yellow-600' : 'bg-gray-700'
            }`}
          >
            Warnings
          </button>
          <button
            onClick={() => setFilter('error')}
            className={`px-3 py-1 rounded text-sm ${
              filter === 'error' ? 'bg-red-600' : 'bg-gray-700'
            }`}
          >
            Errors
          </button>
        </div>

        {/* Logs */}
        <div className="flex-1 overflow-y-auto bg-gray-900 rounded p-4 font-mono text-sm">
          {filteredLogs.map(log => (
            <div
              key={log.id}
              className="flex items-start gap-2 mb-2 hover:bg-gray-800 p-1 rounded"
            >
              {getLevelIcon(log.level)}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-xs">
                    {log.timestamp.toLocaleTimeString()}
                  </span>
                  <span className={getLevelStyle(log.level)}>
                    [{log.level.toUpperCase()}]
                  </span>
                </div>
                <div className="mt-1">{log.message}</div>
              </div>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>
    </WidgetWrapper>
  );
};

export default LogsMonitor;