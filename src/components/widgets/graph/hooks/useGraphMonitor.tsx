import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Node, Edge, useNodesState, useEdgesState } from '@xyflow/react';
import { RootState } from '../../../../store';
import { gpacService } from '../../../../services/gpacService';
import {
  setSelectedFilterDetails,
  setSelectedNode,
} from '../../../../store/slices/graphSlice';
import {
  selectNodesForGraphMonitor,
  selectEdges,
  selectIsLoading,
  selectError,
} from '../../../../store/selectors/graphSelectors';
import { addSelectedFilter } from '../../../../store/slices/multiFilterSlice';

const useGraphMonitor = () => {
  const dispatch = useDispatch();
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const renderCount = useRef(0);

  // Sélecteurs Redux
  const nodes = useSelector(selectNodesForGraphMonitor);
  const edges = useSelector(selectEdges);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);
  const monitoredFilters = useSelector(
    (state: RootState) => state.multiFilter.selectedFilters,
  );

  const [connectionError, setConnectionError] = useState<string | null>(null);

  // États locaux de React Flow
  const [localNodes, setLocalNodes, onNodesChange] = useNodesState<Node>([]);
  const [localEdges, setLocalEdges, onEdgesChange] = useEdgesState([]);

  // Mémoïsation des mises à jour des nœuds
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

  // Mémoïsation des mises à jour des arêtes
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
      gpacService.setCurrentFilterId(parseInt(nodeId));
      gpacService.getFilterDetails(parseInt(nodeId));

      // 2. Gérer le multi-monitoring
      const isAlreadyMonitored = monitoredFilters.some((f) => f.id === nodeId);
      if (!isAlreadyMonitored) {
        dispatch(addSelectedFilter(nodeData));
        gpacService.subscribeToFilter(nodeId);
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

  // Mettre à jour les données locales
  useEffect(() => {
    if (updatedNodes.length > 0 || updatedEdges.length > 0) {
      setLocalNodes(updatedNodes);
      setLocalEdges(updatedEdges);

      // Mise à jour des références
      nodesRef.current = updatedNodes;
      edgesRef.current = updatedEdges;

      renderCount.current++;
      console.log(`[useGraphMonitor] Render #${renderCount.current}`, {
        nodesCount: nodes.length,
        edgesCount: edges.length,
      });
    }
  }, [
    updatedNodes,
    updatedEdges,
    setLocalNodes,
    setLocalEdges,
    nodes.length,
    edges.length,
  ]);

  // Connexion WebSocket
  useEffect(() => {
    console.log('useGraphMonitor: Montage et connexion WebSocket');

    const connectionTimer = setTimeout(() => {
      gpacService.connect();
    }, 1000);

    return () => {
      console.log('useGraphMonitor: Démontage et nettoyage');
      clearTimeout(connectionTimer);
      gpacService.disconnect();
    };
  }, []);

  // Gestion des erreurs de chargement
  useEffect(() => {
    console.log('État de chargement modifié :', isLoading);
  }, [isLoading]);

  useEffect(() => {
    if (error) {
      console.error('Erreur du graphique :', error);
      setConnectionError(error);
    }
  }, [error]);

  // Fonction de retry en cas d'erreur
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
