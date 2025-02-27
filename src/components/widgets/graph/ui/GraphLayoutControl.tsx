// src/components/widgets/graph/ui/GraphLayoutControls.tsx
import React from 'react';
import { LayoutType, LayoutOptions } from '../utils/GraphLayout';
import {  ArrowRight, ArrowDown, Grid, Circle } from 'lucide-react';

interface GraphLayoutControlsProps {
  currentLayout: LayoutOptions;
  onLayoutChange: (layout: LayoutOptions) => void;
  onAutoLayout: () => void;
}

const GraphLayoutControls: React.FC<GraphLayoutControlsProps> = ({
  currentLayout,
  onLayoutChange,
  onAutoLayout,
}) => {
  const handleTypeChange = (type: LayoutType) => {
    onLayoutChange({ ...currentLayout, type });
  };

  const handleDirectionChange = (direction: 'LR' | 'RL' | 'TB' | 'BT') => {
    onLayoutChange({ ...currentLayout, direction });
  };

  return (
    <div className="absolute top-4 right-4 bg-gray-800 p-2 rounded-lg shadow-lg border border-gray-700 z-50 flex flex-col gap-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-400">Layout</span>
        <button
          onClick={onAutoLayout}
          className="text-xs text-blue-400 hover:text-blue-300"
          title="Auto-arrange layout"
        >
          Auto
        </button>
      </div>
      
      <div className="flex gap-1">
        <button
          onClick={() => handleTypeChange(LayoutType.HORIZONTAL)}
          className={`p-1.5 rounded-md ${
            currentLayout.type === LayoutType.HORIZONTAL
              ? 'bg-blue-600'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title="Horizontal Layout"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => handleTypeChange(LayoutType.VERTICAL)}
          className={`p-1.5 rounded-md ${
            currentLayout.type === LayoutType.VERTICAL
              ? 'bg-blue-600'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title="Vertical Layout"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => handleTypeChange(LayoutType.DAGRE)}
          className={`p-1.5 rounded-md ${
            currentLayout.type === LayoutType.DAGRE
              ? 'bg-blue-600'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title="Hierarchical Layout"
        >
          <Grid className="w-4 h-4" />
        </button>
        
        <button
          onClick={() => handleTypeChange(LayoutType.RADIAL)}
          className={`p-1.5 rounded-md ${
            currentLayout.type === LayoutType.RADIAL
              ? 'bg-blue-600'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title="Radial Layout"
        >
          <Circle className="w-4 h-4" />
        </button>
      </div>
      
      {currentLayout.type === LayoutType.DAGRE && (
        <div className="flex gap-1 mt-1">
          <button
            onClick={() => handleDirectionChange('LR')}
            className={`text-xs p-1 rounded ${
              currentLayout.direction === 'LR'
                ? 'bg-blue-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title="Left to Right"
          >
            LR
          </button>
          <button
            onClick={() => handleDirectionChange('RL')}
            className={`text-xs p-1 rounded ${
              currentLayout.direction === 'RL'
                ? 'bg-blue-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title="Right to Left"
          >
            RL
          </button>
          <button
            onClick={() => handleDirectionChange('TB')}
            className={`text-xs p-1 rounded ${
              currentLayout.direction === 'TB'
                ? 'bg-blue-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title="Top to Bottom"
          >
            TB
          </button>
          <button
            onClick={() => handleDirectionChange('BT')}
            className={`text-xs p-1 rounded ${
              currentLayout.direction === 'BT'
                ? 'bg-blue-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title="Bottom to Top"
          >
            BT
          </button>
        </div>
      )}
      
      {currentLayout.type === LayoutType.DAGRE && (
        <div className="mt-1 flex items-center gap-2">
          <label className="flex items-center gap-1 text-xs text-gray-400">
            <input
              type="checkbox"
              className="rounded text-blue-600"
              checked={currentLayout.groupByFilterType || false}
              onChange={(e) =>
                onLayoutChange({
                  ...currentLayout,
                  groupByFilterType: e.target.checked,
                })
              }
            />
            Group by type
          </label>
        </div>
      )}
    </div>
  );
};

export default React.memo(GraphLayoutControls);