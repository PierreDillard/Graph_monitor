import React, { useCallback } from 'react';
import { FilterType, FilterData } from '../../../types/filter';

interface FilterListProps {
  type: FilterType;
  filters: Record<string, FilterData>;
  selectedFilter: string | null;
  selectedFilterType: FilterType | null;
  onFilterSelect: (filterName: string, type: FilterType) => void;
  count: number;
}

export const FilterList = React.memo(
  ({
    type,
    filters,
    selectedFilter,
    selectedFilterType,
    onFilterSelect,
    count,
  }: FilterListProps) => {
    const handleFilterClick = useCallback(
      (event: React.MouseEvent<HTMLButtonElement>, filterName: string) => {
        event.preventDefault();
        event.stopPropagation();
        onFilterSelect(filterName, type);
      },
      [onFilterSelect, type],
    );

    if (!filters || Object.keys(filters).length === 0) {
      return (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-400 uppercase mb-2">
            {type === 'input' ? 'Input Filters' : 'Output Filters'} (0)
          </h3>
          <div className="text-gray-400 text-sm">No filters available</div>
        </div>
      );
    }

    return (
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-400 uppercase mb-2">
          {type === 'input' ? 'Input Filters' : 'Output Filters'} ({count})
        </h3>
        <div className="space-y-2">
          {Object.entries(filters).map(([name, data]) => {
            const isSelected =
              selectedFilter === name && selectedFilterType === type;
            const bufferPercentage = data.buffer_total
              ? (data.buffer / data.buffer_total) * 100
              : 0;

            return (
              <button
                key={name}
                onClick={(e) => handleFilterClick(e, name)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
                type="button"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{name}</span>
                  <span className="text-sm text-gray-300">
                    {bufferPercentage.toFixed(1)}%
                  </span>
                </div>
                {data.codec && (
                  <div className="text-sm text-gray-400 mt-1">
                    Codec: {data.codec}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  },
);

FilterList.displayName = 'FilterList';
