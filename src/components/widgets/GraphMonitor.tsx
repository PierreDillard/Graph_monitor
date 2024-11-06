import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import WidgetWrapper from '../common/WidgetWrapper';
import { Gauge } from 'lucide-react';
import { WidgetProps } from '../../types/widget';

// Styles mémorisés
const flowStyles = {
  background: '#111827',
  height: '500px',
  width: '100%',
};

const nodeStyle = {
  background: '#1f2937',
  color: 'white',
  border: '1px solid #4b5563',
  borderRadius: '0.5rem',
  padding: '0.5rem'
};

const legendStyle = {
  position: 'absolute',
  bottom: '1rem',
  left: '1rem',
  background: '#1f2937',
  padding: '0.75rem',
  borderRadius: '0.5rem',
  border: '1px solid #374151'
};

const GraphMonitor = React.memo(({ id, title }) => {
  // Nœuds initiaux mémorisés
  const initialNodes = useMemo(() => [
    {
      id: '1',
      type: 'input',
      data: { 
        label: 'File Input (input.mp4)', // Représente le filtre de source
        icon: <Gauge className="w-4 h-4 text-blue-400" />,
        gpacCommand: '-i input.mp4'
      },
      position: { x: 100, y: 100 },
      style: nodeStyle
    },
    {
      id: '2',
      type: 'default',
      data: { 
        label: 'ffdec', // Filtre GPAC pour le décodage H.264
        details: 'H.264 Video Decoding',
        gpacCommand: 'ffdec:h264'
      },
      position: { x: 300, y: 50 },
      style: nodeStyle
    },
    {
      id: '3',
      type: 'default',
      data: { 
        label: 'ffdec', // Filtre GPAC pour le traitement AAC
        details: 'AAC Audio Processing',
        gpacCommand: 'ffdec:aac'
      },
      position: { x: 300, y: 150 },
      style: nodeStyle
    },
    {
      id: '4',
      type: 'output',
      data: { 
        label: 'output', // Filtre de sortie pour RTMP
        details: 'RTMP Output Stream',
        gpacCommand: '-o rtmp://server/live/stream'
      },
      position: { x: 500, y: 100 },
      style: nodeStyle
    },
  ], []);
  
  // Liens initiaux mémorisés
  const initialEdges = useMemo(() => [
    {
      id: 'e1-2',
      source: '1',
      target: '2',
      label: 'Video Stream',
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#3b82f6' },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' }
    },
    {
      id: 'e1-3',
      source: '1',
      target: '3',
      label: 'Audio Stream',
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#10b981' },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' }
    },
    {
      id: 'e2-4',
      source: '2',
      target: '4',
      label: 'Processed Video',
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#3b82f6' },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' }
    },
    {
      id: 'e3-4',
      source: '3',
      target: '4',
      label: 'Processed Audio',
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#10b981' },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' }
    },
  ], []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback((event, node) => {
    console.log('Node clicked:', node);
  }, []);

  // Mémorisation des options de la minimap
  const minimapNodeColor = useCallback((node) => {
    switch (node.type) {
      case 'input': return '#3b82f6';
      case 'output': return '#ef4444';
      default: return '#6b7280';
    }
  }, []);

  return (
    <WidgetWrapper id={id} title={title}>
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
          style={{ background: '#111827' }}
        >
          <Controls 
            className="bg-gray-800 border-gray-700 fill-gray-400"
            showInteractive={false}
          />
          <MiniMap 
            className="bg-gray-800 border border-gray-700"
            nodeColor={minimapNodeColor}
            nodeStrokeWidth={3}
            maskColor="rgba(0, 0, 0, 0.3)"
          />
          <Background 
            color="#4b5563" 
            gap={16} 
            variant="dots"
          />
        </ReactFlow>

        <div style={legendStyle}>
          <h4 className="text-sm font-medium mb-2 text-gray-200">Légende</h4>
          <div className="space-y-2 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>Flux vidéo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Flux audio</span>
            </div>
          </div>
        </div>
      </div>
    </WidgetWrapper>
  );
});

GraphMonitor.displayName = 'GraphMonitor';

export default GraphMonitor;