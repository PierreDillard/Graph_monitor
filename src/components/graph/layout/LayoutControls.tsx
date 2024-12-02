import React from 'react';
import { ArrowDown, ArrowRight, RotateCcw } from 'lucide-react';
import { LayoutDirection } from '../../../types/graphLayout';

interface LayoutControlsProps {
  isLayouting: boolean;
  currentDirection: LayoutDirection;
  onDirectionChange: (direction: LayoutDirection) => void;
  onApplyLayout: (direction: LayoutDirection) => void;
}

export const LayoutControls: React.FC<LayoutControlsProps> = ({
  isLayouting,
  currentDirection,
  onDirectionChange,
  onApplyLayout,
}) => {
  return (
    <div className="absolute top-4 left-4 flex gap-2 bg-gray-800 p-2 rounded-lg shadow-lg z-10">
      <button
        onClick={() => {
          onDirectionChange('DOWN');
          onApplyLayout('DOWN');
        }}
        disabled={isLayouting}
        className={`p-2 rounded ${
          currentDirection === 'DOWN' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-700 hover:bg-gray-600'
        }`}
        title="Vertical Layout"
      >
        <ArrowDown className="w-4 h-4" />
      </button>
      <button
        onClick={() => {
          onDirectionChange('RIGHT');
          onApplyLayout('RIGHT');
        }}
        disabled={isLayouting}
        className={`p-2 rounded ${
          currentDirection === 'RIGHT' 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-700 hover:bg-gray-600'
        }`}
        title="Horizontal Layout"
      >
        <ArrowRight className="w-4 h-4" />
      </button>
      <button
        onClick={() => onApplyLayout(currentDirection)}
        disabled={isLayouting}
        className="p-2 rounded bg-gray-700 hover:bg-gray-600"
        title="Recalculate Layout"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
    </div>
  );
};