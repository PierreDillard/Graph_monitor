import React, { useCallback } from 'react';     
import ELK from 'elkjs/lib/elk.bundled.js';
import { Node, Edge, ReactFlowProvider } from '@xyflow/react';
import { LayoutControls } from './LayoutControls';
import { useLayoutEngine } from './useLayoutEngine';
import { LayoutOptions, LayoutDirection } from '../../../types/graphLayout';

const elk = new ELK();

const defaultOptions: LayoutOptions = {
  'elk.algorithm': 'layered',
  'elk.layered.spacing.nodeNodeBetweenLayers': 100,
  'elk.spacing.nodeNode': 80,
  'elk.padding': '[top=50,left=50,bottom=50,right=50]',
  'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
  'elk.layered.nodePlacement.strategy': 'BRANDES_KOEPF'
};

interface GraphLayoutManagerProps {
  children: React.ReactNode;
  onLayoutChange?: (direction: LayoutDirection) => void;
}

export const GraphLayoutManager: React.FC<GraphLayoutManagerProps> = ({ 
  children, 
  onLayoutChange 
}) => {
  const { 
    applyLayout, 
    isLayouting,
    currentDirection,
    setCurrentDirection 
  } = useLayoutEngine(elk, defaultOptions);

  const handleDirectionChange = useCallback((direction: LayoutDirection) => {
    setCurrentDirection(direction);
    onLayoutChange?.(direction);
  }, [onLayoutChange, setCurrentDirection]);

  return (
    <div className="relative w-full h-full">
      <ReactFlowProvider>
        {children}
        <LayoutControls
          isLayouting={isLayouting}
          currentDirection={currentDirection}
          onDirectionChange={handleDirectionChange}
          onApplyLayout={applyLayout}
        />
      </ReactFlowProvider>
    </div>
  );
}