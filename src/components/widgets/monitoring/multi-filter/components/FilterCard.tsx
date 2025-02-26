import React from 'react';
import { GpacNodeData } from '../../../../../types/domain/gpac';
import BufferMonitoring from './BufferMonitoring';
import AdvancedMetrics from '../../../../common/metrics/AdvancedMetrics';
import { PIDMetricsCard } from './PIDMetricsCard';
import FilterArgumentsDialog from '../../../../filters/FilterArgumentsDialog';

interface FilterCardProps {
  filter: {
    id: string;
    nodeData: GpacNodeData;
  };
  onClose: (id: string) => void;
}

/**
 * FilterCard component displays detailed information about a single GPAC filter
 * including advanced metrics and buffer monitoring in a scrollable card format.
 * Each card maintains its own scroll state independently.
 */
const FilterCard: React.FC<FilterCardProps> = React.memo(
  ({ filter, onClose }) => {
    return (
      <div className="bg-gray-900 rounded-lg overflow-hidden shadow-lg flex flex-col h-[600px]">
        {/* header */}
        <header className="p-4 bg-gray-700 flex justify-center items-center ">
          <div className="flex-1">
            <div className='flex'>
            <span className='mr-6'>
              <FilterArgumentsDialog filter={filter.nodeData} />
            </span>
            <h3 className="font-medium text-lg flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  filter.nodeData.status?.includes('error')
                    ? 'bg-red-500'
                    : filter.nodeData.status?.includes('warning')
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                }`}
              />
              {filter.nodeData.name}
            </h3>
        

            </div>
        
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>{filter.nodeData.type}</span>
              <span className="text-xs px-2 py-0.5 bg-gray-600 rounded-full">
                ID: {filter.id}
              </span>
            </div>
          </div>
          <button
            onClick={() => onClose(filter.id)}
            className="p-2 hover:bg-gray-600 rounded-lg text-gray-400 hover:text-white transition-colors"
            title="Stop monitoring this filter"
          >
            <span className="sr-only">Close</span>×
          </button>
        </header>


        <div className="flex-1 overflow-y-auto">
          <div className="space-y-4 p-4">
       
            <section className="bg-gray-900 rounded-lg p-4 border border-gray-700/50">
              <PIDMetricsCard data={filter.nodeData} />
            </section>
            <section className="bg-gray-900 rounded-lg p-4 border border-gray-700/50">
              <AdvancedMetrics data={filter.nodeData} />
            </section>

            {/*  buffers */}
            <section className="bg-gray-900 rounded-lg p-4 border border-gray-700/50">
              <BufferMonitoring data={filter.nodeData} />
            </section>
          </div>
        </div>
      </div>
    );
  },
);

FilterCard.displayName = 'FilterCard';

export default FilterCard;
