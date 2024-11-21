import React from 'react';
import { useSelector } from 'react-redux';
import { useFilterMonitor } from '../../hooks/useFilterMonitor';
import { RootState } from '../../store';
import {
  selectTimeSeriesData,
  selectFilterDetails,
  selectFilterLogs,
} from '../../store/selectors/filterSelector';
import WidgetWrapper from '../common/WidgetWrapper';
import { BufferStatus } from './metrics/BufferStatus';
import { RealTimeGraph } from './metrics/RealTimeGraph';
import { EventLogger } from './metrics/EventLogger';
import { FilterList } from './metrics/FilterList';

const FilterMonitor: React.FC<{ id: string; title: string }> = ({
  id,
  title,
}) => {
  const {
    selectedNode,
    selectedFilter,
    selectedFilterType,
    bufferMetrics,
    handleFilterSelect,
  } = useFilterMonitor();

  const filterDetails = useSelector(selectFilterDetails);
  const timeSeriesData = useSelector(selectTimeSeriesData);
  const logs = useSelector(selectFilterLogs);

  if (!selectedNode) {
    return (
      <WidgetWrapper id={id} title={title}>
        <div className="flex items-center justify-center h-full text-gray-400">
          Select a node in the Pipeline Graph to view filter details
        </div>
      </WidgetWrapper>
    );
  }

  return (
    <WidgetWrapper id={id} title={`${title} - ${selectedNode.name}`}>
      <div className="flex h-full">
        {/* Left Panel - Filter Lists */}
        <div className="w-1/3 p-4 border-r border-gray-700 overflow-y-auto">
          <FilterList
            type="input"
            filters={selectedNode.ipid}
            selectedFilter={selectedFilter}
            selectedFilterType={selectedFilterType}
            onFilterSelect={handleFilterSelect}
            count={selectedNode.nb_ipid}
          />
          <FilterList
            type="output"
            filters={selectedNode.opid}
            selectedFilter={selectedFilter}
            selectedFilterType={selectedFilterType}
            onFilterSelect={handleFilterSelect}
            count={selectedNode.nb_opid}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {selectedFilter ? (
            <>
              {/* Buffer Metrics */}
              {bufferMetrics && (
                <BufferStatus
                  currentBuffer={bufferMetrics.currentBuffer}
                  totalBuffer={bufferMetrics.bufferTotal}
                  percentage={bufferMetrics.bufferPercentage}
                />
              )}

              {/* Real-time Graph */}
              <RealTimeGraph
                data={timeSeriesData}
                timeWindow={30} // 30 seconds window
              />

              {/* Event Logger */}
              <EventLogger logs={logs} maxHeight="h-48" />

              {/* Filter Details */}
              {filterDetails && (
                <div className="bg-gray-800 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-400">
                    Filter Details
                  </h4>
                  <pre className="text-xs text-gray-300">
                    {JSON.stringify(filterDetails, null, 2)}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              Select a filter to view detailed metrics
            </div>
          )}
        </div>
      </div>
    </WidgetWrapper>
  );
};

export default React.memo(FilterMonitor);
