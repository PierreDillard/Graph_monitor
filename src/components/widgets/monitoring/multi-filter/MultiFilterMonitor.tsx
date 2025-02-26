import React from 'react';
import { useMultiFilterMonitor } from './hooks/useMultiFilterMonitor';
import WidgetWrapper from '../../../common/WidgetWrapper';
import { WidgetProps } from '../../../../types/ui/widget';
import FilterCard from './components/FilterCard';

const MultiFilterMonitor: React.FC<WidgetProps> = React.memo(
  ({ id, title }) => {
    const { selectedFilters, isLoading, handleCloseMonitor } =
      useMultiFilterMonitor();

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
                height: '100%',
              }}
            >
              {selectedFilters.map((filter) => (
                <div key={filter.id} className="h-full">
                  <FilterCard filter={filter} onClose={handleCloseMonitor} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </WidgetWrapper>
    );
  },
);

MultiFilterMonitor.displayName = 'MultiFilterMonitor';

export default MultiFilterMonitor;
