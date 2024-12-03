
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Node, Edge, useNodesState, useEdgesState } from '@xyflow/react';
import { RootState } from '../../store';
import WidgetWrapper from '../common/WidgetWrapper';
import { WidgetProps } from '../../types/widget';
import { gpacWebSocket } from '../../services/gpacWebSocket';
import {
  setSelectedFilterDetails,
  setSelectedNode,
} from '../../store/slices/graphSlice';
import {
  selectNodesForGraphMonitor,
  selectEdges,
  selectIsLoading,
  selectError,
} from '../../store/selectors/graphSelectors';
import {
  addSelectedFilter,
} from '../../store/slices/multiFilterSlice';
import LoadingState from '../common/LoadingState';
import ConnectionErrorState from '../common/ConnectionErrorState';
import GraphFlow from './GraphFlow';

const GraphMonitor: React.FC<WidgetProps> = React.memo(({ id, title }) => {
  const dispatch = useDispatch();
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const renderCount = useRef(0);

  // Redux selectors
  const nodes = useSelector(selectNodesForGraphMonitor);
  const edges = useSelector(selectEdges);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);
  const monitoredFilters = useSelector(
    (state: RootState) => state.multiFilter.selectedFilters,
  );
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // React Flow local state
  const [localNodes, setLocalNodes, onNodesChange] = useNodesState<Node>([]);
  const [localEdges, setLocalEdges, onEdgesChange] = useEdgesState<Edge>([]);


  // Memoization of node updates
  const updateNodesWithPositions = useCallback((newNodes: Node[]) => {
    return newNodes.map((node) => {
      const existingNode = nodesRef.current.find((n) => n.id === node.id);
      if (existingNode) {
        return {
          ...node,
          position: existingNode.position,
          selected: existingNode.selected,
          dragging: existingNode.dragging,
        };
      }
      return node;
    });
  }, []);

    // Memoization of edge updates
  const updateEdgesWithState = useCallback((newEdges: Edge[]) => {
    return newEdges.map((edge) => {
      const existingEdge = edgesRef.current.find((e) => e.id === edge.id);
      if (existingEdge) {
        return {
          ...edge,
          selected: existingEdge.selected,
          animated: existingEdge.animated,
        };
      }
      return edge;
    });
  }, []);

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const nodeId = node.id;
      const nodeData = node.data;

      // 1. Mettre à jour les détails du filtre sélectionné
      dispatch(setSelectedFilterDetails(nodeData));
      gpacWebSocket.setCurrentFilterId(parseInt(nodeId));
      gpacWebSocket.getFilterDetails(parseInt(nodeId));

      // 2. Gérer le multi-monitoring
      const isAlreadyMonitored = monitoredFilters.some((f) => f.id === nodeId);
      if (!isAlreadyMonitored) {
        dispatch(addSelectedFilter(nodeData));
        gpacWebSocket.subscribeToFilter(nodeId);
      }

      // 3. Mettre à jour le nœud sélectionné
      dispatch(setSelectedNode(nodeId));
    },
    [dispatch, monitoredFilters],
  );

  const handleNodesChange = useCallback(
    (changes: any[]) => {
      onNodesChange(changes);
      // Mettre à jour les références
      nodesRef.current = localNodes.map((node) =>
        typeof node === 'object' ? { ...node } : node,
      );
    },
    [localNodes, onNodesChange],
  );

  const handleEdgesChange = useCallback(
    (changes: any[]) => {
      onEdgesChange(changes);
      edgesRef.current = localEdges.map((edge) => ({ ...edge }));
    },
    [localEdges, onEdgesChange],
  );

  const updatedNodes = useMemo(
    () => updateNodesWithPositions(nodes),
    [nodes, updateNodesWithPositions],
  );
  const updatedEdges = useMemo(
    () => updateEdgesWithState(edges),
    [edges, updateEdgesWithState],
  );

  // Update the datas 
  useEffect(() => {
    if (updatedNodes.length > 0 || updatedEdges.length > 0) {
      setLocalNodes(updatedNodes);
      setLocalEdges(updatedEdges);

      // References updates
      nodesRef.current = updatedNodes;
      edgesRef.current = updatedEdges;

      renderCount.current++;
      console.log(`[GraphMonitor] Render #${renderCount.current}`, {
        nodesCount: nodes.length,
        edgesCount: edges.length,
      });
    }
  }, [updatedNodes, updatedEdges]);

  // WebSocket connexion
  useEffect(() => {
    console.log('GraphMonitor: Montage et connexion WebSocket');

    const connectionTimer = setTimeout(() => {
      gpacWebSocket.connect();
    }, 1000);

    return () => {
      console.log('GraphMonitor: Démontage et nettoyage');
      clearTimeout(connectionTimer);
      gpacWebSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    console.log('État de chargement modifié :', isLoading);
  }, [isLoading]);

  useEffect(() => {
    if (error) {
      console.error('Erreur du graphique :', error);
      setConnectionError(error);
    }
  }, [error]);

  if (isLoading) {
    return (
      <LoadingState id={id} title={title} message="Connexion à GPAC..." />
    );
  }

  if (connectionError) {
    return (
      <ConnectionErrorState
        id={id}
        title={title}
        errorMessage={connectionError}
        onRetry={() => {
          setConnectionError(null);
          gpacWebSocket.connect();
        }}
      />
    );
  }

  return (
    <WidgetWrapper id={id} title={title}>
      <GraphFlow
        nodes={localNodes}
        edges={localEdges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onNodeClick={onNodeClick}
      />
    </WidgetWrapper>
  );
});

GraphMonitor.displayName = 'GraphMonitor';

export default GraphMonitor;
