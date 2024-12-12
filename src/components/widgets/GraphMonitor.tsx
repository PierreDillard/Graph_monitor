// src/components/monitoring/GraphMonitor.tsx
import React, {
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { Node, Edge, useNodesState, useEdgesState } from '@xyflow/react';
import WidgetWrapper from '../common/WidgetWrapper';
import { WidgetProps } from '../../types/widget';
import LoadingState from '../common/LoadingState';
import { GpacNodeData } from '@/types/gpac';
import ConnectionErrorState from '../common/ConnectionErrorState';
import GraphFlow from './GraphFlow';
import { GraphContext } from '../../context/GraphContext';

const GraphMonitor: React.FC<WidgetProps> = React.memo(({ id, title }) => {
  const { graph, isConnected, isLoading, error } = React.useContext(GraphContext);

  


  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const renderCount = useRef(0);

  const [localNodes, setLocalNodes, onNodesChange] = useNodesState<Node>([]);
  const [localEdges, setLocalEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Fonction pour mettre à jour les positions des nœuds
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

  // Fonction pour mettre à jour l'état des arêtes
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

  // Handler pour le clic sur un nœud
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (!graph) return;

      const nodeId = node.id;
      const nodeData = node.data;

      // Update the selected node in the graph
      graph.selectNode(nodeId);

      // Get details of the selected filter
      const filterId = parseInt(nodeId, 10);
      graph.setCurrentFilterId(filterId);
      graph.getFilterDetails(filterId);

      // Add the filter to the monitored list if not already present
      const isAlreadyMonitored = graph
        .getSelectedFilters()
        .some((f) => f.id === nodeId);
      if (!isAlreadyMonitored && nodeData?.idx !== undefined) {
        graph.addSelectedFilter(nodeData as unknown as GpacNodeData);
      }
    },
    [graph],
  );

  const handleNodesChange = useCallback(
    (changes: any[]) => {
      onNodesChange(changes);
      // Update the references
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


  useEffect(() => {
    if (!isConnected || !graph) return;

    const handleNodesUpdated = (updatedNodes: Node[]) => {
      const positionedNodes = updateNodesWithPositions(updatedNodes);
      setLocalNodes(positionedNodes);
      nodesRef.current = positionedNodes;
      renderCount.current++;
      console.log(`[GraphMonitor] Render #${renderCount.current}`, {
        nodesCount: positionedNodes.length,
      });
    };

    const handleEdgesUpdated = (updatedEdges: Edge[]) => {
      const updated = updateEdgesWithState(updatedEdges);
      setLocalEdges(updated);
      edgesRef.current = updated;
      console.log(`[GraphMonitor] Updated edges`, { edgesCount: updated.length });
    };

    const handleSelectedNodeChanged = (nodeId: string | null) => {
      console.log('Nœud sélectionné changé :', nodeId);
    };

    const handleFilterDetails = (filterData: any) => {
      console.log('Détails du filtre reçus :', filterData);
      // Vous pouvez mettre à jour l'UI en fonction des détails du filtre
      // Par exemple, afficher un panneau d'info, etc.
    };

    // Attacher les listeners d'événements
    graph.on('nodesUpdated', handleNodesUpdated);
    graph.on('edgesUpdated', handleEdgesUpdated);
    graph.on('selectedNodeChanged', handleSelectedNodeChanged);
    graph.on('filterDetails', handleFilterDetails);

    // Optionnel : Demander des données supplémentaires si nécessaire
    // graph.getAllFilters(); // Ou une autre méthode appropriée

    return () => {
      // Clean up
      graph.removeListener('nodesUpdated', handleNodesUpdated);
      graph.removeListener('edgesUpdated', handleEdgesUpdated);
      graph.removeListener('selectedNodeChanged', handleSelectedNodeChanged);
      graph.removeListener('filterDetails', handleFilterDetails);
    };
  }, [isConnected, graph, updateNodesWithPositions, updateEdgesWithState, setLocalNodes, setLocalEdges]);


  if (isLoading) {
    return <LoadingState id={id} title={title} message="Connexion à GPAC..." />;
  }

  if (error) {
    console.log("J'ai pas acces au context !", error);
    return (
      <ConnectionErrorState
        id={id}
        title={title}
        errorMessage={error}
        onRetry={() => {
          if (graph) {
            graph.connect();
          }
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
