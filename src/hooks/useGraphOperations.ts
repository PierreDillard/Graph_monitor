import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setSelectedFilterDetails } from '../store/slices/graphSlice';
import { addSelectedFilter } from '../store/slices/multiFilterSlice';
import { Graph } from '../core/graph/graph';
import { GraphState } from '../core/graph/types';
import { Node, Edge } from '@xyflow/react';
import { gpacWebSocket } from '../services/gpacWebSocket';

export const useGraphOperations = () => {
    const dispatch = useDispatch();
    const graph = Graph.getInstance();
    const monitoredFilters = useSelector(
      (state: RootState) => state.multiFilter.selectedFilters
    );
  
    const [graphState, setGraphState] = useState<GraphState>({
      nodes: {},
      edges: {},
      selectedNodeId: null,
      isProcessing: false,
      error: null
    });
  
    // Souscription aux changements du Graph
    useEffect(() => {
      console.log("*GraphState updated:", graphState); 
      const unsubscribe = graph.subscribe(setGraphState);
      return () => {
        unsubscribe();
      };
    }, []);
  
    // Connection WebSocket
    useEffect(() => {
      console.log('*GraphOperations: Initializing WebSocket connection');
      const timer = setTimeout(() => {
        gpacWebSocket.connect();
        console.log('WebSocket connection initiated*');
      }, 1000);
  
      return () => {
        clearTimeout(timer);
        gpacWebSocket.disconnect();
      };
    }, []);
    const nodes = Object.values(graphState.nodes);
    const edges = Object.values(graphState.edges);
    console.log('*Current nodes:', nodes);
    console.log('*Current edges:', edges);
  
    const onNodeClick = useCallback(async (event: React.MouseEvent, node: Node) => {
      const nodeId = node.id;
      const nodeData = node.data;
  
      try {
        // Update the selected filter details
        dispatch(setSelectedFilterDetails(nodeData));
        gpacWebSocket.setCurrentFilterId(parseInt(nodeId));
        gpacWebSocket.getFilterDetails(parseInt(nodeId));
  
        // Multi-monitoring logic
        const isAlreadyMonitored = monitoredFilters.some((f) => f.id === nodeId);
        if (!isAlreadyMonitored) {
          dispatch(addSelectedFilter(nodeData));
          gpacWebSocket.subscribeToFilter(nodeId);
        }
  
        // Update Graph state
        graph.setSelectedNodeId(nodeId);
        
      } catch (error) {
        console.error('Error handling node click:', error);
      }
    }, [dispatch, monitoredFilters]);

  // Actions
  const addNode = useCallback(async (node: Node) => {
    try {
      await graph.addNode(node);
    } catch (error) {
      console.error('Error adding node:', error);
    }
  }, []);

  const removeNode = useCallback(async (nodeId: string) => {
    try {
      await graph.removeNode(nodeId);
    } catch (error) {
      console.error('Error removing node:', error);
    }
  }, []);

  const addEdge = useCallback(async (edge: Edge) => {
    try {
      await graph.addEdge(edge);
    } catch (error) {
      console.error('Error adding edge:', error);
    }
  }, []);

  return {
    // État
    nodes: Object.values(graphState.nodes),
    edges: Object.values(graphState.edges),
    isLoading: graphState.isProcessing,
    error: graphState.error,
    selectedNodeId: graphState.selectedNodeId,
    monitoredFilters, 
    
    // Actions
    onNodeClick,
    addNode,
    removeNode,
    addEdge,
    
    // État WebSocket
    isConnected: gpacWebSocket.isConnected?.() || false,
  };
};