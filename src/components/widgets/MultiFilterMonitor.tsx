// src/components/widgets/MultiFilterMonitor.tsx
import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import WidgetWrapper from '../common/WidgetWrapper';
import { WidgetProps } from '../../types/widget';
import { GpacNodeData } from '../../types/gpac';
import { gpacWebSocket } from '../../services/gpacWebSocket';
import { removeSelectedFilter,updateFilterData } from '../../store/slices/multiFilterSlice';
import { setFilterDetails } from '../../store/slices/graphSlice';

// Composant MetricCard
interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  type?: 'text' | 'number';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  type = 'number'
}) => {
  const formatValue = (val: number | string) => {
    if (type === 'number' && typeof val === 'number') {
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <div className="bg-gray-700 p-3 rounded">
      <div className="text-sm text-gray-400">{title}</div>
      <div className="text-lg font-medium">
        {formatValue(value)}
        {unit && <span className="text-sm text-gray-400 ml-1">{unit}</span>}
      </div>
    </div>
  );
};

// Composant ProcessingMetrics
interface ProcessingMetricsProps {
  data: GpacNodeData;
}

const ProcessingMetrics: React.FC<ProcessingMetricsProps> = ({ data }) => {
  return (
    <div className="bg-gray-700 p-3 rounded">
      <h4 className="text-sm font-medium mb-2">Processing Details</h4>
      <div className="space-y-2">
        {data.nb_ipid > 0 && (
          <div className="text-sm">
            Input PIDs: <span className="text-gray-400">{data.nb_ipid}</span>
          </div>
        )}
        {data.nb_opid > 0 && (
          <div className="text-sm">
            Output PIDs: <span className="text-gray-400">{data.nb_opid}</span>
          </div>
        )}
        {data.status && (
          <div className="text-sm">
            Status: <span className="text-gray-400">{data.status}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Composant FilterMonitorContent
interface FilterMonitorContentProps {
  data: GpacNodeData;
  onUpdate: (newData: any) => void;
}

const FilterMonitorContent: React.FC<FilterMonitorContentProps> = React.memo(
  ({ data, onUpdate }) => {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <MetricCard
            title="Data Processed"
            value={data.bytes_done}
            unit="bytes"
          />
          <MetricCard
            title="Status"
            value={data.status || 'N/A'}
            type="text"
          />
        </div>
        <div className="mt-4">
          <ProcessingMetrics data={data} />
        </div>
      </div>
    );
  }
);

// Composant principal MultiFilterMonitor
const MultiFilterMonitor: React.FC<WidgetProps> = React.memo(({ id, title }) => {
  const dispatch = useDispatch();
  
  const selectedFilters = useSelector(
    (state: RootState) => state.multiFilter.selectedFilters
  );
  const isLoading = useSelector(
    (state: RootState) => state.graph.isLoading
  );

  const handleCloseMonitor = useCallback((filterId: string) => {
    gpacWebSocket.unsubscribeFromFilter(filterId);
    dispatch(removeSelectedFilter(filterId));
    
    // Si c'était aussi le filtre actif du PID Monitor, le nettoyer
    if (gpacWebSocket.getCurrentFilterId()?.toString() === filterId) {
      dispatch(setFilterDetails(null));
      gpacWebSocket.setCurrentFilterId(null);
    }
  }, [dispatch]);

  const handleFilterUpdate = useCallback((filterId: string, newData: any) => {
    dispatch(updateFilterData({
      id: filterId,
      data: newData
    }));
  }, [dispatch]);

  if (isLoading) {
    return (
      <WidgetWrapper id={id} title={title}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </WidgetWrapper>
    );
  }

  if (selectedFilters.length === 0) {
    return (
      <WidgetWrapper id={id} title={title}>
        <div className="flex flex-col items-center justify-center h-full p-4 text-gray-400">
          <p>No filters currently monitored</p>
          <p className="text-sm mt-2">
            Click on nodes in the Graph Monitor to start monitoring filters
          </p>
        </div>
      </WidgetWrapper>
    );
  }

  return (
    <WidgetWrapper id={id} title={title}>
      <div className="grid gap-4 p-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {selectedFilters.map((filter) => (
          <div 
            key={filter.id}
            className="bg-gray-800 rounded-lg overflow-hidden shadow-lg"
          >
            <div className="p-4 bg-gray-700 flex justify-between items-center">
              <div>
                <h3 className="font-medium text-lg">{filter.nodeData.name}</h3>
                <p className="text-sm text-gray-400">{filter.nodeData.type}</p>
              </div>
              <button
                onClick={() => handleCloseMonitor(filter.id)}
                className="p-1 hover:bg-gray-600 rounded text-gray-400 hover:text-white"
                title="Stop monitoring this filter"
              >
                <span className="sr-only">Close</span>
                ×
              </button>
            </div>
            
            <div className="p-4">
              <FilterMonitorContent
                data={filter.nodeData}
                onUpdate={(newData) => handleFilterUpdate(filter.id, newData)}
              />
            </div>
          </div>
        ))}
      </div>
    </WidgetWrapper>
  );
});

// Ajouter les displayNames pour le debugging
MultiFilterMonitor.displayName = 'MultiFilterMonitor';
FilterMonitorContent.displayName = 'FilterMonitorContent';
MetricCard.displayName = 'MetricCard';
ProcessingMetrics.displayName = 'ProcessingMetrics';

export default MultiFilterMonitor;