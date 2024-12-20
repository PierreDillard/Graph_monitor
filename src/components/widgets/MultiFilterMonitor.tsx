import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import WidgetWrapper from '../common/WidgetWrapper';
import { WidgetProps } from '../../types/widget';
import { GpacNodeData } from '../../types/gpac';
import { gpacService } from '../../services/gpacService';

import {
  removeSelectedFilter,
  updateFilterData,
} from '../../store/slices/multiFilterSlice';
import { setFilterDetails } from '../../store/slices/graphSlice';

import FilterCard from './monitoring/filter/FilterCard';


// MetricCard Component
interface MetricCardProps {
  title: string;
  value: number | string;
  total: number | string;
  unit?: string;
  type?: 'text' | 'number';
  trend?: 'up' | 'down' | 'stable';
  color?: 'blue' | 'green' | 'red' | 'yellow';
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  type = 'number',
  trend,
  color = 'blue',
}) => {
  const colorClasses = {
    blue: 'bg-blue-900/20 border-blue-500/30',
    green: 'bg-green-900/20 border-green-500/30',
    red: 'bg-red-900/20 border-red-500/30',
    yellow: 'bg-yellow-900/20 border-yellow-500/30',
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    stable: '→',
  };

  return (
    <div
      className={`p-4 rounded-lg border ${colorClasses[color]} transition-all duration-200 hover:border-opacity-50`}
    >
      <div className="flex justify-between items-start">
        <div className="text-sm text-gray-400">{title}</div>
        {trend && (
          <span className={`text-${color}-400`}>{trendIcons[trend]}</span>
        )}
      </div>
      <div className="mt-2 flex items-baseline">
        <div className="text-2xl font-semibold">
          {type === 'number' ? Number(value).toLocaleString() : value}
        </div>
        {unit && <span className="ml-1 text-sm text-gray-400">{unit}</span>}
      </div>
    </div>
  );
};

// ProcessingMetrics Component
interface ProcessingMetricsProps {
  data: GpacNodeData;
  type: 'input' | 'output';
}

const ProcessingMetrics: React.FC<ProcessingMetricsProps> = ({
  data,
  type,
}) => {
  const pidCount = type === 'input' ? data.nb_ipid : data.nb_opid;
  const pidType = type === 'input' ? 'Input' : 'Output';

  return (
    <div className="space-y-2">
      <div className="text-sm">
        {pidType} PIDs: <span className="text-gray-400">{pidCount}</span>
      </div>
      {data.status && (
        <div className="text-sm">
          Status: <span className="text-gray-400">{data.status}</span>
        </div>
      )}
    </div>
  );
};



// Main Component MultiFilterMonitor
const MultiFilterMonitor: React.FC<WidgetProps> = React.memo(
  ({ id, title }) => {
    const dispatch = useDispatch();

    const selectedFilters = useSelector(
      (state: RootState) => state.multiFilter.selectedFilters,
    );
    const isLoading = useSelector((state: RootState) => state.graph.isLoading);

    const handleCloseMonitor = useCallback(
      (filterId: string) => {
        gpacService.unsubscribeFromFilter(filterId);
        dispatch(removeSelectedFilter(filterId));

        // If it was also the active filter of the PID Monitor, clear it
        if (gpacService.getCurrentFilterId()?.toString() === filterId) {
          dispatch(setFilterDetails(null));
          gpacService.setCurrentFilterId(null);
        }
      },
      [dispatch],
    );

 

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
        <div className="h-full flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto p-4">
            <div 
              className="grid gap-6 auto-rows-[600px] grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3" 
              style={{ 
                minHeight: 'min-content',
                height: '100%'
              }}
            >
              {selectedFilters.map((filter) => (
                <div 
                  key={filter.id} 
                  className="h-full"
                >
                  <FilterCard
                    filter={filter}
                    onClose={handleCloseMonitor}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </WidgetWrapper>
    );
  },
);

// Add displayNames for debugging
MultiFilterMonitor.displayName = 'MultiFilterMonitor';
/* FilterMonitorContent.displayName = 'FilterMonitorContent'; */
MetricCard.displayName = 'MetricCard';
ProcessingMetrics.displayName = 'ProcessingMetrics';

export default MultiFilterMonitor;
