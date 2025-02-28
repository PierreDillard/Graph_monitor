// Core hook implementation with modular composition
import {  useEffect, useRef } from 'react';
import { Node, Edge, useNodesState, useEdgesState } from '@xyflow/react';
import { useToast } from '@/hooks/useToast';
import { useGpacService } from '@/hooks/useGpacService';
import { useAppDispatch } from '@/hooks/redux';

// Modularized hooks
import { useGraphLayout } from './useGraphLayout';
import { useGraphState } from './useGraphState';
import { useGraphConnection } from './useGraphConnection';
import { useGraphHandlers } from './useGraphHandlers';
import { useGraphNotifications } from './useGraphNotifications';

/**
 * Primary hook for GPAC graph monitoring functionality
 * Composes specialized sub-hooks for improved maintainability
 */
const useGraphMonitor = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const service = useGpacService(); 
  
  // Refs to track component state
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const isApplyingLayout = useRef(false);
  
  // Local state for nodes and edges with React Flow's state management
  const [localNodes, setLocalNodes, onNodesChange] = useNodesState<Node>([]);
  const [localEdges, setLocalEdges, onEdgesChange] = useEdgesState<Edge>([]);
  
  // Use specialized hooks for different aspects of functionality
  const { 
    nodes, 
    edges, 
    isLoading, 
    error, 
    connectionError, 
    setConnectionError 
  } = useGraphState(nodesRef, edgesRef);
  
  const {
    layoutOptions,
    handleLayoutChange,
    autoLayout,
    applyLayout
  } = useGraphLayout({
    localNodes,
    localEdges,
    setLocalNodes,
    nodesRef,
    isApplyingLayout
  });
  
  const { retryConnection } = useGraphConnection({
    setConnectionError,
   
  });
  
  
  const {
    handleNodesChange,
    handleEdgesChange,
    onNodeClick
  } = useGraphHandlers({
    onNodesChange,
    onEdgesChange,
    localNodes,
    localEdges,
    nodesRef,
    edgesRef,
    setLocalNodes,
    dispatch,
    service
   
  });


  
  // Use notification system
  useGraphNotifications({
    nodes,
    error,
    isLoading,
    toast
  });
  
  // Effect to update local nodes and edges from Redux
  useEffect(() => {
    // Only update if not currently applying a layout
    if ((nodes.length > 0 || edges.length > 0) && !isApplyingLayout.current) {
      setLocalNodes(nodes);
      setLocalEdges(edges);

      nodesRef.current = nodes;
      edgesRef.current = edges;
    }
  }, [nodes, edges, setLocalNodes, setLocalEdges]);
  
  // Apply layout when nodes change significantly
  useEffect(() => {
    if (nodes.length > 0 && nodes.length !== nodesRef.current.length) {
      // Only auto-layout for significant changes to prevent layout jumps
      autoLayout();
    }
  }, [nodes.length, autoLayout]);
  
  return {
    isLoading,
    connectionError,
    retryConnection,
    localNodes,
    localEdges,
    handleNodesChange,
    handleEdgesChange,
    onNodeClick,
    layoutOptions,
    handleLayoutChange,
    autoLayout,
    applyLayout
  };
};

export default useGraphMonitor;