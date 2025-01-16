import React from 'react';
import { WidgetProps } from '../../../types/widget';
import useGraphMonitor from './hooks/useGraphMonitor';
import GraphMonitorUI from '../graph/ui/GraphMonitorUI';


const GraphMonitor: React.FC<WidgetProps> = ({ id, title, config }) => {
  const {
    isLoading,
    connectionError,
    retryConnection,
    localNodes,
    localEdges  ,
    handleNodesChange,
    handleEdgesChange,
    onNodeClick,
  } = useGraphMonitor();


  return (
    <GraphMonitorUI
      id={id}
      title={title}
      config={config}
      isLoading={isLoading}
      connectionError={connectionError}
      retryConnection={retryConnection}
      nodes={localNodes}
      edges={localEdges}
      onNodesChange={handleNodesChange}
      onEdgesChange={handleEdgesChange}
      onNodeClick={onNodeClick}
    />
  );
};

export default React.memo(GraphMonitor);
