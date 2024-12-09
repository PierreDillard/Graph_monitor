import React, { useCallback } from 'react';
import { Node, Edge, useNodesState, useEdgesState } from '@xyflow/react';
import WidgetWrapper from '../common/WidgetWrapper';
import { WidgetProps } from '../../types/widget';
import LoadingState from '../common/LoadingState';
import ConnectionErrorState from '../common/ConnectionErrorState';
import GraphFlow from './GraphFlow';
import { Graph } from '../../core/graph/graph'; 
import { useGraphOperations } from '../../hooks/useGraphOperations';

const GraphMonitor: React.FC<WidgetProps> = React.memo(({ id, title }) => {
  const {
    nodes: graphNodes,
    edges: graphEdges,
    isLoading,
    error,
    isConnected,
    onNodeClick
  } = useGraphOperations();

  // React Flow state
  const [localNodes, setLocalNodes, onNodesChange] = useNodesState<Node>(graphNodes);
  const [localEdges, setLocalEdges, onEdgesChange] = useEdgesState<Edge>(graphEdges);

  const handleNodesChange = useCallback((changes: any[]) => {
    onNodesChange(changes);
  }, [onNodesChange]);

  const handleEdgesChange = useCallback((changes: any[]) => {
    onEdgesChange(changes);
  }, [onEdgesChange]);

  // Update local state when graph data changes
  React.useEffect(() => {
    setLocalNodes(graphNodes);
    setLocalEdges(graphEdges);
  }, [graphNodes, graphEdges, setLocalNodes, setLocalEdges]);

  if (isLoading) {
    return (
      <LoadingState id={id} title={title} message="Connexion à GPAC..." />
    );
  }

  if (!isConnected && error) {
    return (
      <ConnectionErrorState
        id={id}
        title={title}
        errorMessage={error}
        onRetry={() => {
          Graph.getInstance().connect();
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