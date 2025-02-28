import { useState, useRef, useMemo, MutableRefObject } from 'react';
import { Node, Edge } from '@xyflow/react';
import { useAppSelector } from '@/hooks/redux';
import {
  selectNodesForGraphMonitor,
  selectEdges,
  selectIsLoading,
  selectError,
} from '../../../../store/selectors/graphSelectors';
import { updateNodesWithPositions, updateEdgesWithState } from './useGraphMonitor.helpers';

/**
 * Hook for managing graph state
 * Handles state selection from Redux and local state transformations
 */
export const useGraphState = (
  nodesRef: MutableRefObject<Node[]>,
  edgesRef: MutableRefObject<Edge[]>
) => {
  // Local connection error state
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // Redux selectors
  const reduxNodes = useAppSelector(selectNodesForGraphMonitor);
  const reduxEdges = useAppSelector(selectEdges);
  const isLoading = useAppSelector(selectIsLoading);
  const error = useAppSelector(selectError);
  
  // Performance tracking (debug only)
  const renderCount = useRef(0);
  
  // Transformed nodes and edges with proper positioning and state
  const nodes = useMemo(
    () => updateNodesWithPositions(reduxNodes, nodesRef),
    [reduxNodes, nodesRef]
  );

  const edges = useMemo(
    () => updateEdgesWithState(reduxEdges, edgesRef),
    [reduxEdges, edgesRef]
  );

  return {
    nodes,
    edges,
    isLoading,
    error,
    connectionError,
    setConnectionError,
    renderCount
  };
};