// src/components/GraphMonitorUI.tsx
import React from 'react';
import WidgetWrapper from '../../../common/WidgetWrapper';
import LoadingState from '../../../common/LoadingState';
import ConnectionErrorState from '../../../common/ConnectionErrorState';
import GraphFlow from './GraphFlow';
import { WidgetProps } from '../../../../types/ui/widget';
import { Node, Edge } from '@xyflow/react';

interface GraphMonitorUIProps extends WidgetProps {
  isLoading: boolean;
  connectionError: string | null;
  retryConnection: () => void;
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: any[]) => void;
  onEdgesChange: (changes: any[]) => void;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
}

const GraphMonitorUI: React.FC<GraphMonitorUIProps> = ({
  id,
  title,
  isLoading,
  connectionError,
  retryConnection,
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodeClick,
}) => {
  if (isLoading) {
    return <LoadingState id={id} title={title} message="Connexion à GPAC..." />;
  }

  if (connectionError) {
    return (
      <ConnectionErrorState
        id={id}
        title={title}
        errorMessage={connectionError}
        onRetry={retryConnection}
      />
    );
  }

  return (
    <WidgetWrapper id={id} title={title}>
      <GraphFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
      />
    </WidgetWrapper>
  );
};

export default React.memo(GraphMonitorUI);
