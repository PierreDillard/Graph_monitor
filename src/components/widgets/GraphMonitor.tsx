import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from 'react';
import Graph from '../../services/Graph'

import { Node, Edge, useNodesState, useEdgesState } from '@xyflow/react';
import WidgetWrapper from '../common/WidgetWrapper';
import { WidgetProps } from '../../types/widget';

import LoadingState from '../common/LoadingState';
import ConnectionErrorState from '../common/ConnectionErrorState';
import GraphFlow from './GraphFlow';

/**
 * GraphMonitor component is a React functional component that monitors and displays a graph.
 * It uses the React Flow library to render nodes and edges and manages the state of the graph
 * through various hooks and callbacks.
 *
 * @component
 * @param {WidgetProps} props - The properties passed to the component.
 * @param {string} props.id - The unique identifier for the widget.
 * @param {string} props.title - The title of the widget.
 *
 * @returns {JSX.Element} The rendered GraphMonitor component.
 *
 * @example
 * <GraphMonitor id="graph-monitor-1" title="Graph Monitor" />
 *
 * @remarks
 * This component uses the `Graph` class to manage the graph data and WebSocket connection.
 * It handles various events emitted by the `Graph` class to update the state of nodes and edges.
 *
 * @internal
 * The component uses several internal state variables and refs to manage the graph's state:
 * - `graphRef`: A ref to the `Graph` instance.
 * - `nodesRef`: A ref to store the current state of nodes.
 * - `edgesRef`: A ref to store the current state of edges.
 * - `renderCount`: A ref to keep track of the number of renders.
 * - `isLoading`: A state variable to indicate if the graph is loading.
 * - `connectionError`: A state variable to store any connection errors.
 * - `localNodes`: A state variable to store the local state of nodes.
 * - `localEdges`: A state variable to store the local state of edges.
 *
 * The component also defines several callback functions to handle updates to nodes and edges,
 * as well as to handle node clicks.
 *
 * @see {@link Graph}
 * @see {@link useNodesState}
 * @see {@link useEdgesState}
 */
const GraphMonitor: React.FC<WidgetProps> = React.memo(({ id, title }) => {
  const graphRef = useRef<Graph | null>(null);
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const renderCount = useRef(0);

  // Local state for nodes and edges
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [localNodes, setLocalNodes, onNodesChange] = useNodesState<Node>([]);
  const [localEdges, setLocalEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Callbacks to update nodes and edges with positions and state
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

      // Update the selected node in the graph
      graphRef.current?.selectNode(nodeId);

      // Get the filter details for the selected node
      const filterId = parseInt(nodeId, 10);
      graphRef.current?.setCurrentFilterId(filterId);
      graphRef.current?.getFilterDetails(filterId);

      // Add the selected filter to the list of monitored filters
      const isAlreadyMonitored = graphRef.current
        ?.getSelectedFilters()
        .some((f) => f.id === nodeId);
      if (!isAlreadyMonitored && nodeData?.idx !== undefined) {
        graphRef.current?.addSelectedFilter(nodeData);
      }
    },
    [],
  );

  // handleNodesChange callback
  const handleNodesChange = useCallback(
    (changes: any[]) => {
      onNodesChange(changes);
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

  // Effect to initialize the Graph instance and connect to the WebSocket
  useEffect(() => {
    graphRef.current = new Graph({ type: 'websocket', address: 'ws://127.0.0.1:17815/rmt' });
    const graph = graphRef.current;

    // Événements émis par la classe Graph
    const handleNodesUpdated = (updatedNodes: Node[]) => {
      // Update nodes with positions
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

    const handleLoading = (loading: boolean) => {
      setIsLoading(loading);
    };

    const handleError = (error: string | null) => {
      if (error) {
        console.error('Erreur du graphique :', error);
        setConnectionError(error);
      } else {
        setConnectionError(null);
      }
      setIsLoading(false);
    };

    const handleSelectedNodeChanged = (nodeId: string | null) => {
      console.log('Nœud sélectionné changé :', nodeId);
    };

    const handleFilterDetails = (filterData: any) => {
      console.log('Détails du filtre reçus :', filterData);
      // Vous pouvez mettre à jour l'UI en fonction des détails du filtre
      // Par exemple, afficher un panneau d'info, etc.
    };

    graph.on('nodesUpdated', handleNodesUpdated);
    graph.on('edgesUpdated', handleEdgesUpdated);
    graph.on('loading', handleLoading);
    graph.on('error', handleError);
    graph.on('selectedNodeChanged', handleSelectedNodeChanged);
    graph.on('filterDetails', handleFilterDetails);

    // WEBSOCKET CONNECTION
    graph.connect();

    // Cleanup function
    return () => {
      graph.disconnect();
      graph.removeListener('nodesUpdated', handleNodesUpdated);
      graph.removeListener('edgesUpdated', handleEdgesUpdated);
      graph.removeListener('loading', handleLoading);
      graph.removeListener('error', handleError);
      graph.removeListener('selectedNodeChanged', handleSelectedNodeChanged);
      graph.removeListener('filterDetails', handleFilterDetails);
    };
  }, [setLocalNodes, setLocalEdges, updateNodesWithPositions, updateEdgesWithState]);

  if (isLoading) {
    return <LoadingState id={id} title={title} message="Connexion à GPAC..." />;
  }

  if (connectionError) {
    return (
      <ConnectionErrorState
        id={id}
        title={title}
        errorMessage={connectionError}
        onRetry={() => {
          setConnectionError(null);
          graphRef.current?.connect();
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

