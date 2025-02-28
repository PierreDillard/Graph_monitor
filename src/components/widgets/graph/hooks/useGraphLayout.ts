import { useState, useCallback, useEffect, MutableRefObject } from 'react';
import { Node, Edge } from '@xyflow/react';
import { 
  LayoutType, 
  LayoutOptions, 
  applyGraphLayout, 
  suggestLayoutOptions 
} from '../utils/GraphLayout';

interface UseGraphLayoutProps {
  localNodes: Node[];
  localEdges: Edge[];
  setLocalNodes: (nodes: Node[]) => void;
  nodesRef: MutableRefObject<Node[]>;
  isApplyingLayout: MutableRefObject<boolean>;
}

/**
 * Hook for managing graph layout operations
 * Handles layout calculations, options, and persistence
 */
export const useGraphLayout = ({
  localNodes,
  localEdges,
  setLocalNodes,
  nodesRef,
  isApplyingLayout
}: UseGraphLayoutProps) => {
  // Layout state
  const [layoutOptions, setLayoutOptions] = useState<LayoutOptions>(() => {
    // Try to load saved layout from localStorage
    try {
      const savedLayout = localStorage.getItem('gpacMonitorLayout');
      if (savedLayout) {
        return JSON.parse(savedLayout) as LayoutOptions;
      }
    } catch (e) {
      console.error('Failed to load layout preferences:', e);
    }
    
    // Default layout options
    return {
      type: LayoutType.DAGRE,
      direction: 'LR',
      nodeSeparation: 80,
      rankSeparation: 200,
      respectExistingPositions: true,
    };
  });

  // Apply layout with current options
  const applyLayout = useCallback((respectPositions: boolean = true) => {
    if (localNodes.length === 0) return;
    
    // Set flag to prevent state overrides during layout application
    isApplyingLayout.current = true;
    
    const currentOptions = {
      ...layoutOptions,
      respectExistingPositions: respectPositions,
    };
    
    const layoutedNodes = applyGraphLayout(
      localNodes,
      localEdges,
      currentOptions
    );
    
    setLocalNodes(layoutedNodes);
    nodesRef.current = layoutedNodes;
    
    // Reset flag after React has processed state updates
    setTimeout(() => {
      isApplyingLayout.current = false;
    }, 100);
  }, [localNodes, localEdges, layoutOptions, setLocalNodes, nodesRef, isApplyingLayout]);

  // Auto-layout function - tries to determine the best layout
  const autoLayout = useCallback(() => {
    if (localNodes.length === 0) return;
    
    // Set flag to prevent state overrides
    isApplyingLayout.current = true;
    
    const suggestedOptions = suggestLayoutOptions(localNodes, localEdges);
    setLayoutOptions(suggestedOptions);
    
    // Apply the suggested layout immediately
    const layoutedNodes = applyGraphLayout(
      localNodes,
      localEdges,
      suggestedOptions
    );
    
    setLocalNodes(layoutedNodes);
    nodesRef.current = layoutedNodes;
    
    // Reset flag after React has processed state updates
    setTimeout(() => {
      isApplyingLayout.current = false;
    }, 100);
  }, [localNodes, localEdges, setLocalNodes, nodesRef, isApplyingLayout]);

  // Handle layout option changes
  const handleLayoutChange = useCallback((newOptions: LayoutOptions) => {
    // Set flag to prevent state overrides
    isApplyingLayout.current = true;
    
    setLayoutOptions(newOptions);
    
    // Apply the new layout
    const layoutedNodes = applyGraphLayout(
      localNodes,
      localEdges,
      newOptions
    );
    
    setLocalNodes(layoutedNodes);
    nodesRef.current = layoutedNodes;
    
    // Reset flag after React has processed state updates
    setTimeout(() => {
      isApplyingLayout.current = false;
    }, 100);
  }, [localNodes, localEdges, setLocalNodes, nodesRef, isApplyingLayout]);

  // Save layout preferences
  useEffect(() => {
    try {
      if (layoutOptions.type) {
        localStorage.setItem('gpacMonitorLayout', JSON.stringify(layoutOptions));
      }
    } catch (e) {
      console.error('Failed to save layout preferences:', e);
    }
  }, [layoutOptions]);

  return {
    layoutOptions,
    handleLayoutChange,
    autoLayout,
    applyLayout
  };
};