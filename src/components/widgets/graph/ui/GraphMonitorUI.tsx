// src/components/GraphMonitorUI.tsx
import React from 'react';
import WidgetWrapper from '../../../common/WidgetWrapper';
import LoadingState from '../../../common/LoadingState';
import ConnectionErrorState from '../../../common/ConnectionErrorState';
import GraphFlow from './GraphFlow';
import GraphLayoutControls from './GraphLayoutControl';
import { WidgetProps } from '../../../../types/ui/widget';
import { Node, Edge } from '@xyflow/react';
import { LayoutOptions } from '../utils/GraphLayout';

interface GraphMonitorUIProps extends WidgetProps {
  isLoading: boolean;
  connectionError: string | null;
  retryConnection: () => void;
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: any[]) => void;
  onEdgesChange: (changes: any[]) => void;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  layoutOptions: LayoutOptions;
  onLayoutChange: (options: LayoutOptions) => void;
  onAutoLayout: () => void;
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
  layoutOptions,
  onLayoutChange,
  onAutoLayout,
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
      <div className="relative h-full w-full">
        <GraphFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
        />
        
        {/* Add the layout controls */}
        <GraphLayoutControls
          currentLayout={layoutOptions}
          onLayoutChange={onLayoutChange}
          onAutoLayout={onAutoLayout}
        />
      </div>
    </WidgetWrapper>
  );
};

export default React.memo(GraphMonitorUI);
