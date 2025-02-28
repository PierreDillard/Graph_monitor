import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { Node, Edge, useNodesState, useEdgesState } from '@xyflow/react';
import { gpacService } from '../../../../services/gpacService';
import { useToast } from '../../../../hooks/useToast';
import { 
  LayoutType, 
  LayoutOptions, 
  applyGraphLayout, 
  suggestLayoutOptions
} from '../utils/GraphLayout';

import {
  ConnectionStatus,
  GpacMessage,
  GpacCommunicationError,
} from '../../../../types/communication/IgpacCommunication';
import { IGpacMessageHandler } from '../../../../types/communication/IGpacMessageHandler';

import {
  setSelectedFilterDetails,
  setSelectedNode,
  setLoading,
  setError,
} from '../../../../store/slices/graphSlice';
import { addSelectedFilter } from '../../../../store/slices/multiFilterSlice';

import {
  selectNodesForGraphMonitor,
  selectEdges,
  selectIsLoading,
  selectError,
} from '../../../../store/selectors/graphSelectors';

import {
  updateNodesWithPositions,
  updateEdgesWithState,
} from './useGraphMonitor.helpers';
import {
  createHandleNodesChange,
  createHandleEdgesChange,
  createOnNodeClick,
} from './useGraphMonitor.handlers';
import {
  useGraphMonitorConnection,
  useGraphMonitorErrorEffect,
} from './useGraphMonitor.effects';

type GpacService = typeof gpacService;

const useGraphMonitor = () => {
  const { toast } = useToast();
  const dispatch = useAppDispatch();

  // Refs
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const renderCount = useRef(0);
  const isApplyingLayout = useRef(false); 

  // Local states
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [localNodes, setLocalNodes, onNodesChange] = useNodesState<Node>([]);
  const [localEdges, setLocalEdges, onEdgesChange] = useEdgesState<Edge>([]);

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

  // Redux selectors
  const nodes = useAppSelector(selectNodesForGraphMonitor);
  const edges = useAppSelector(selectEdges);
  const isLoading = useAppSelector(selectIsLoading);
  const error = useAppSelector(selectError);

  const monitoredFilters = useAppSelector(
    (state) => state.multiFilter.selectedFilters,
  );

  // Services
  const service = useMemo(() => gpacService as GpacService, []);
  const communication = useMemo(() => {
    return service.getCommunicationAdapter();
  }, [service]);

  // Apply layout function
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
      localEdges.flat(),
      currentOptions
    );
    
    setLocalNodes(layoutedNodes);
    nodesRef.current = layoutedNodes;
    
    // Reset flag after React has processed state updates
    setTimeout(() => {
      isApplyingLayout.current = false;
    }, 100);
  }, [localNodes, localEdges, layoutOptions, setLocalNodes]);

  // Auto-layout function - Corrected implementation
  const autoLayout = useCallback(() => {
    if (localNodes.length === 0) return;
    
    // Set flag to prevent state overrides
    isApplyingLayout.current = true;
    
    const suggestedOptions = suggestLayoutOptions(localNodes, localEdges.flat());
    setLayoutOptions(suggestedOptions);
    
    // Apply the suggested layout immediately
    const layoutedNodes = applyGraphLayout(
      localNodes,
      localEdges.flat(),
      suggestedOptions
    );
    
    setLocalNodes(layoutedNodes);
    nodesRef.current = layoutedNodes;
    
    // Reset flag after React has processed state updates
    setTimeout(() => {
      isApplyingLayout.current = false;
    }, 100);
  }, [localNodes, localEdges, setLocalNodes]);

  // Handle layout option changes - Implementation is correct
  const handleLayoutChange = useCallback((newOptions: LayoutOptions) => {
    // Set flag to prevent state overrides
    isApplyingLayout.current = true;
    
    setLayoutOptions(newOptions);
    
    // Apply the new layout
    const layoutedNodes = applyGraphLayout(
      localNodes,
      localEdges.flat(),
      newOptions
    );
    
    setLocalNodes(layoutedNodes);
    nodesRef.current = layoutedNodes;
    
    // Reset flag after React has processed state updates
    setTimeout(() => {
      isApplyingLayout.current = false;
    }, 100);
  }, [localNodes, localEdges, setLocalNodes]);
  // Handlers de message
  const messageHandler = useMemo<IGpacMessageHandler>(
    () => ({
      onMessage(message: GpacMessage) {
        console.log(
          `[GraphMonitor] Message received #${++renderCount.current}`,
          message,
        );
      },
      onStatusChange(status: ConnectionStatus) {
        dispatch(setLoading(status === ConnectionStatus.CONNECTING));
      },
      onError(gpacError: GpacCommunicationError) {
        console.error('[GraphMonitor] Error:', gpacError);
        setConnectionError(gpacError.message);
        dispatch(setError(gpacError.message));
      },
    }),
    [dispatch],
  );

  // Handlers
  const handleNodesChange = createHandleNodesChange({
    onNodesChange,
    localNodes,
    setLocalNodes,
    nodesRef,
  });

  const handleEdgesChange = createHandleEdgesChange({
    onEdgesChange,
    localEdges,
    edgesRef,
  });

  // Handler pour le clic sur un nœud
  const onNodeClick = createOnNodeClick({
    dispatch,
    monitoredFilters,
    service,
    addSelectedFilter,
    setSelectedNode,
    setSelectedFilterDetails,
  });

  // Mise à jour mémorisée des nœuds et arêtes (positions, états)
  const updatedNodes = useMemo(
    () => updateNodesWithPositions(nodes, nodesRef),
    [nodes, nodesRef],
  );

  const updatedEdges = useMemo(
    () => updateEdgesWithState(edges, edgesRef),
    [edges, edgesRef],
  );

  // Connexion
  useGraphMonitorConnection({
    service,
    setConnectionError,
    messageHandler,
  });

  // Error
  useGraphMonitorErrorEffect({
    error,
    setConnectionError,
  });

  // Notifications
  useEffect(() => {
    if (nodes.length > 0 && !isLoading) {
      toast({
        title: 'Graph loaded',
        description: `${nodes.length} node have been loaded`,
        variant: 'default',
      });
    }
  }, [nodes.length, isLoading, toast]);

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  // Update local nodes and edges from redux
  useEffect(() => {
    // Only update if not currently applying a layout
    if ((updatedNodes.length > 0 || updatedEdges.length > 0) && !isApplyingLayout.current) {
      setLocalNodes(updatedNodes);
      setLocalEdges(updatedEdges);

      nodesRef.current = updatedNodes;
      edgesRef.current = updatedEdges;
    }
  }, [updatedNodes, updatedEdges, setLocalNodes, setLocalEdges]);

  // Apply layout when nodes change significantly
  useEffect(() => {
    if (updatedNodes.length > 0 && updatedNodes.length !== nodesRef.current.length) {
      // Only auto-layout for significant changes to prevent layout jumps
      autoLayout();
    }
  }, [updatedNodes.length, autoLayout]);

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

  // Reconnexion
  const retryConnection = useCallback(() => {
    setConnectionError(null);
    communication
      .connect({
        address: 'ws://127.0.0.1:17815/rmt',
        maxReconnectAttempts: 5,
        reconnectDelay: 1000,
        maxDelay: 10000,
      })
      .then(() => console.log('[useGraphMonitor] Retry connection success'))
      .catch((err) => {
        console.error('[useGraphMonitor] Retry connection failed:', err);
        setConnectionError(err.message);
      });
  }, [communication]);

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