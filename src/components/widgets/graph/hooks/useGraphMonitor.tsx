import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { GpacNodeData } from '../../../../types/gpac'; // Adjust the import path as necessary
import { useDispatch, useSelector } from 'react-redux';
import { Node, Edge, useNodesState, useEdgesState } from '@xyflow/react';
import { isEqual, throttle } from 'lodash';

import { useGraphData } from './useGraphData';
import { RootState } from '../../../../store';
import { gpacService } from '../../../../services/gpacService';
import {
  setSelectedFilterDetails,
  setSelectedNode,
} from '../../../../store/slices/graphSlice';
import {

  selectIsLoading,
  selectError,
} from '../../../../store/selectors/graphSelectors';
import { addSelectedFilter } from '../../../../store/slices/multiFilterSlice';


const THROTTLE_DELAY = 100;


const useGraphMonitor = () => {
  const dispatch = useDispatch();
  
  // Persistent references to nodes and edges
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const renderCount = useRef(0);
  const frameRequestRef = useRef<number>();

  // Redux selectors
  const filters = useSelector((state: RootState) => state.graph.filters);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);
  const monitoredFilters = useSelector(
    (state: RootState) => state.multiFilter.selectedFilters
  );

  // local state for connection error
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // React FLow State with optimized handlers
  const [localNodes, setLocalNodes, onNodesChange] = useNodesState<Node>([]);
  const [localEdges, setLocalEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Graph data generation
  const { nodes: updatedNodes, edges: updatedEdges } = useGraphData({
    filters,
    existingNodes: nodesRef.current,
    existingEdges: edgesRef.current,
  });

  // click Handler
  const onNodeClick = useCallback(
    throttle((event: React.MouseEvent, node: Node) => {
      const nodeId = node.id;
      const nodeData = node.data as unknown as GpacNodeData;

      dispatch(setSelectedFilterDetails(nodeData));
      gpacService.setCurrentFilterId(parseInt(nodeId));
      gpacService.getFilterDetails(parseInt(nodeId));

      const isAlreadyMonitored = monitoredFilters.some(f => f.id === nodeId);
      if (!isAlreadyMonitored) {
        dispatch(addSelectedFilter(nodeData));
        gpacService.subscribeToFilter(nodeId);
      }

      dispatch(setSelectedNode(nodeId));
    }, THROTTLE_DELAY),
    [dispatch, monitoredFilters]
  );

  // Node change handler
  const handleNodesChange = useCallback((changes: any[]) => {
    if (frameRequestRef.current) {
      cancelAnimationFrame(frameRequestRef.current);
    }

    frameRequestRef.current = requestAnimationFrame(() => {
      onNodesChange(changes);
      nodesRef.current = changes.reduce((acc, change) => {
        if (change.type === 'position' && change.dragging) {
            const nodeIndex: number = acc.findIndex((n: Node) => n.id === change.id);
          if (nodeIndex !== -1) {
            acc[nodeIndex] = { 
              ...acc[nodeIndex], 
              position: change.position 
            };
          }
        }
        return acc;
      }, [...nodesRef.current]);
    });
  }, [onNodesChange]);

  //Edges change handler
  const handleEdgesChange = useCallback(
    throttle((changes: any[]) => {
      onEdgesChange(changes);
      edgesRef.current = localEdges.map(edge => ({
        ...edge,
        type: edge.type || 'customEdge',
      }));
    }, THROTTLE_DELAY),
    [localEdges, onEdgesChange]
  );

  // Sync local state with updated nodes and edges
  useEffect(() => {
    const hasChanges = 
      !isEqual(updatedNodes, nodesRef.current) || 
      !isEqual(updatedEdges, edgesRef.current);

    if (hasChanges) {
      setLocalNodes(updatedNodes);
      setLocalEdges(updatedEdges);
      nodesRef.current = updatedNodes;
      edgesRef.current = updatedEdges;

      renderCount.current++;

        console.log(`[GraphMonitor] Render #${renderCount.current}`, {
          nodesCount: updatedNodes.length,
          edgesCount: updatedEdges.length
        });
      
    }
  }, [updatedNodes, updatedEdges, setLocalNodes, setLocalEdges]);

  //  WebSocket
  useEffect(() => {
    const connectionTimer = setTimeout(() => {
      gpacService.connect();
    }, 1000);

    return () => {
      clearTimeout(connectionTimer);
      if (frameRequestRef.current) {
        cancelAnimationFrame(frameRequestRef.current);
      }
      gpacService.disconnect();
    };
  }, []);

  //error handling
  useEffect(() => {
    if (error) {
      console.error('[GraphMonitor] Error:', error);
      setConnectionError(error);
    }
  }, [error]);

  // Retry connection
  const retryConnection = useCallback(() => {
    setConnectionError(null);
    gpacService.connect();
  }, []);

  return {
    isLoading,
    connectionError,
    retryConnection,
    localNodes,
    localEdges,
    handleNodesChange,
    handleEdgesChange,
    onNodeClick,
  };
};

export default useGraphMonitor;