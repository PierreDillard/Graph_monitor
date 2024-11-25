import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { RootState } from '../../store';
import { GpacNodeData } from '../../types/gpac';
import { WidgetProps } from '../../types/widget';
import WidgetWrapper from '../common/WidgetWrapper';
import { addFilterMetric } from '../../store/slices/filter-monitoringSlice';

const ProcessingChart: React.FC<ProcessingChartProps> = ({ history = [] }) => {
  // Vérifie et normalise les données
  const processedHistory = useMemo(() => 
    history.map(point => ({
      ...point,
      bytes_done: typeof point.bytes_done === 'number' ? point.bytes_done : 0,
      timestamp: typeof point.timestamp === 'number' ? point.timestamp : Date.now()
    }))
  , [history]);

  // Log des données traitées
  useEffect(() => {
    console.log('Chart Data:', {
      rawHistory: history,
      processedHistory: processedHistory,
      samplePoint: processedHistory[0],
      latestBytes: processedHistory[processedHistory.length - 1]?.bytes_done
    });
  }, [processedHistory]);

  if (!processedHistory.length) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-sm font-medium mb-4">Processing Progress</h3>
        <div className="h-48 flex items-center justify-center text-gray-500">
          No processing data available
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.[0]) {
      const bytesValue = payload[0].value;
      // Choix de l'unité de mesure appropriée
      let displayValue;
      if (bytesValue >= 1024 * 1024) {
        displayValue = `${(bytesValue / (1024 * 1024)).toFixed(2)} MB`;
      } else if (bytesValue >= 1024) {
        displayValue = `${(bytesValue / 1024).toFixed(2)} KB`;
      } else {
        displayValue = `${bytesValue} bytes`;
      }

      return (
        <div className="bg-gray-800 p-3 rounded shadow-lg border border-gray-700">
          <p className="text-gray-400">
            {new Date(label).toLocaleTimeString()}
          </p>
          <p className="text-sm font-medium text-blue-400">
            {displayValue}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-gray-800 h-full p-4 rounded-lg">
      <h3 className="text-sm font-medium mb-2">Processing Progress</h3>
      <div className="h-[calc(100%-3rem)]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
              data={processedHistory}
              margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
            >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={['auto', 'auto']}
              tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()}
              stroke="#6B7280"
              tickMargin={10}
            />
            <YAxis
              stroke="#6B7280"
              domain={['auto', 'auto']}
              tickFormatter={(value) => {
                if (value >= 1024 * 1024) {
                  return `${(value / (1024 * 1024)).toFixed(1)}MB`;
                } else if (value >= 1024) {
                  return `${(value / 1024).toFixed(1)}KB`;
                }
                return `${value}B`;
              }}
              width={55}
              tickMargin={5}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="bytes_done"
              name="Bytes Processed"
              stroke="#3b82f6"
              dot={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
        
        {/* Debug info */}
        <div className="mt-2 text-xs text-gray-500 space-y-1">
          <div>
            Latest: {(() => {
              const latest = processedHistory[processedHistory.length - 1]?.bytes_done || 0;
              if (latest >= 1024 * 1024) {
                return `${(latest / (1024 * 1024)).toFixed(2)} MB`;
              } else if (latest >= 1024) {
                return `${(latest / 1024).toFixed(2)} KB`;
              }
              return `${latest} bytes`;
            })()}
          </div>
          <div>
            Points: {processedHistory.length}
          </div>
        </div>
      </div>
    </div>
  );
};

const FilterMonitor: React.FC<WidgetProps> = ({ id, title }) => {
  const dispatch = useDispatch();
  const selectedFilter = useSelector((state: RootState) => state.graph.selectedFilterDetails);
  const filterHistory = useSelector((state: RootState) => 
    selectedFilter ? state.filterMonitoring.selectedFilterHistory[selectedFilter.idx] : []
  );

  // Effect pour la mise à jour des métriques
  useEffect(() => {
    if (selectedFilter) {
      const bytes_done = Number(selectedFilter.bytes_done);
      
      // Log détaillé des buffers
      const bufferDetails = {
        input_pids: Object.entries(selectedFilter.ipid || {}).map(([name, data]) => ({
          name,
          raw_buffer: data.buffer,
          raw_total: data.buffer_total,
          parsed_buffer: Number(data.buffer),
          parsed_total: data.buffer_total === -1 ? 'Infinity' : Number(data.buffer_total),
          percentage: data.buffer_total === -1 ? 100 : 
            ((Number(data.buffer) / Number(data.buffer_total || 1)) * 100).toFixed(1)
        })),
        output_pids: Object.entries(selectedFilter.opid || {}).map(([name, data]) => ({
          name,
          raw_buffer: data.buffer,
          raw_total: data.buffer_total,
          parsed_buffer: Number(data.buffer),
          parsed_total: data.buffer_total === -1 ? 'Infinity' : Number(data.buffer_total),
          percentage: data.buffer_total === -1 ? 100 : 
            ((Number(data.buffer) / Number(data.buffer_total || 1)) * 100).toFixed(1)
        }))
      };
      
      console.log('Filter Details:', {
        filter_id: selectedFilter.idx,
        name: selectedFilter.name,
        bytes_done: {
          raw: selectedFilter.bytes_done,
          parsed: bytes_done,
          type: typeof bytes_done
        },
        buffers: bufferDetails,
        status: selectedFilter.status
      });

      dispatch(addFilterMetric({
        filterId: selectedFilter.idx.toString(),
        metric: {
          timestamp: Date.now(),
          bytes_done: bytes_done,
          buffers: Object.fromEntries(
            [...Object.entries(selectedFilter.ipid || {}), ...Object.entries(selectedFilter.opid || {})]
              .map(([name, data]) => [
                name,
                {
                  buffer: Number(data.buffer) || 0,
                  buffer_total: data.buffer_total === -1 ? Infinity : Number(data.buffer_total) || 0,
                  percentage: data.buffer_total === -1 ? 100 : 
                    (Number(data.buffer) / Number(data.buffer_total) * 100) || 0
                }
              ])
          )
        }
      }));
    }
  }, [selectedFilter, dispatch]);

  if (!selectedFilter) {
    return (
      <WidgetWrapper id={id} title={title}>
        <div className="flex items-center justify-center h-full text-gray-400">
          Select a filter in the Graph Monitor to view details
        </div>
      </WidgetWrapper>
    );
  }

  return (
    <WidgetWrapper id={id} title={title}>
      <div className="flex flex-col h-full p-4 space-y-4">
        {/* Informations basiques du filtre */}
        <div className="grid grid-cols-2 gap-4 shrink-0">
          <div className="bg-gray-700 p-4 rounded">
            <span className="text-sm text-gray-400">Name</span>
            <div className="font-medium">{selectedFilter.name}</div>
          </div>
          <div className="bg-gray-700 p-4 rounded">
            <span className="text-sm text-gray-400">Type</span>
            <div className="font-medium">{selectedFilter.type}</div>
          </div>
        </div>

        {/* Graphique principal avec hauteur fixe */}
        <div className="h-[250px] shrink-0">
          <ProcessingChart history={filterHistory} />
        </div>

        {/* Buffer metrics */}
        <div className="shrink-0">
          <h4 className="text-sm font-medium mb-2">Buffer Status</h4>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries({...selectedFilter.ipid, ...selectedFilter.opid}).map(([name, data]) => {
  const buffer = data.buffer < 0 ? 0 : data.buffer;
  const total = data.buffer_total === -1 ? Infinity : (data.buffer_total < 0 ? 0 : data.buffer_total);
  const isStreaming = data.buffer_total === -1;
  const percentage = isStreaming ? 100 : ((buffer / (total || 1)) * 100);

  return (
    <div key={name} className="bg-gray-700 p-3 rounded">
      <span className="text-sm text-gray-400">{name}</span>
      <div className="text-xs text-gray-400 mb-1">
        {isStreaming ? 
          'Streaming Mode' : 
          `Buffer: ${buffer.toLocaleString()} / ${total.toLocaleString()}`
        }
      </div>
      {/* Barre de progression */}
      <div className="w-full bg-gray-600 h-1.5 rounded overflow-hidden mb-1">
        <div 
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="font-medium flex justify-between items-center">
        <span>{isStreaming ? 'Streaming' : `${percentage.toFixed(1)}%`}</span>
        {isStreaming && (
          <span className="text-xs text-gray-400">
            Buffer: {buffer.toLocaleString()}
          </span>
        )}
      </div>
    </div>
  );
})}
          </div>
        </div>
      </div>
    </WidgetWrapper>
  );
};

export default React.memo(FilterMonitor);