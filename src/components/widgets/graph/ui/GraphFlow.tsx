
import React from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Legend from '../../../common/Legend';

interface GraphFlowProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: any;
  onEdgesChange: any;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
}

const flowStyles = {
  background: '#111827',
  width: '100%',
  height: '100%',
};

const GraphFlow: React.FC<GraphFlowProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodeClick,
}) => {
  return (
    <div style={flowStyles}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        minZoom={0.1}
        maxZoom={4}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: true }}
        selectionKeyCode={null}
      >
        <Background
          color="#4b5563"
          gap={16}
          variant={BackgroundVariant.Dots}
        />
        <Controls
          className="bg-gray-800 border-gray-700 fill-gray-400"
          showInteractive={false}
        />
        <MiniMap
          nodeColor={(n) => {
            switch (n.type) {
              case 'input':
                return '#4ade80';
              case 'output':
                return '#ef4444';
              default:
                return '#3b82f6';
            }
          }}
          maskColor="rgba(0, 0, 0, 0.3)"
          className="bg-gray-800 border border-gray-700"
        />

        {/* Légende */}
        <Legend />
      </ReactFlow>
    </div>
  );
};

export default GraphFlow;
