import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Node, Edge, useNodesState, useEdgesState } from '@xyflow/react';
import { RootState } from '../../../../store';
import { gpacService } from '../../../../services/gpacService';
import { useToast } from '../../../../hooks/useToast';

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
  const dispatch = useDispatch();

  // Refs
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const renderCount = useRef(0);

  // Local states
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [localNodes, setLocalNodes, onNodesChange] = useNodesState<Node>([]);
  const [localEdges, setLocalEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Redux selectors
  const nodes = useSelector(selectNodesForGraphMonitor);
  const edges = useSelector(selectEdges);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);

  const monitoredFilters = useSelector(
    (state: RootState) => state.multiFilter.selectedFilters,
  );

  // Services
  const service = useMemo(() => gpacService as GpacService, []);
  const communication = useMemo(() => {
    return service.getCommunicationAdapter();
  }, [service]);

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

  // Handlers p
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

  //Connexion
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

  useEffect(() => {
    if (updatedNodes.length > 0 || updatedEdges.length > 0) {
      setLocalNodes(updatedNodes);
      setLocalEdges(updatedEdges);

      nodesRef.current = updatedNodes;
      edgesRef.current = updatedEdges;
    }
  }, [updatedNodes, updatedEdges, setLocalNodes, setLocalEdges]);

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
  };
};

export default useGraphMonitor;
