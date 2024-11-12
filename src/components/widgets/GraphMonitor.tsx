import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  NodeMouseHandler,
  BackgroundVariant,
  Node,
  Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import WidgetWrapper from '../common/WidgetWrapper';
import { Gauge } from 'lucide-react';
import { WidgetProps } from '../../types/widget';
import {  GpacNodeData } from '../../types/gpac';
import { setSelectedNode } from '../../store/slices/widgetsSlice';

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
  position: 'absolute' as const,
  bottom: '1rem',
  left: '1rem',
  background: '#1f2937',
  padding: '0.75rem',
  borderRadius: '0.5rem',
  border: '1px solid #374151'
};


const createMockGpacData = (): GpacNodeData[] => [
  {
    name: "ffdmx",
    type: "ffdmx",
    itag: null,
    ID: "demux_1",
    nb_ipid: 0,
    nb_opid: 2,
    status: "Demuxing: input.mp4",
    bytes_done: Math.floor(Math.random() * 1000000),
    idx: 1,
    gpac_args: ["-i", "input.mp4"],
    ipid: {},
    opid: {
      "video_1": {
        buffer: Math.floor(Math.random() * 100),
        buffer_total: 100,
        codec: "h264",
        width: 1920,
        height: 1080,
        fps: "29.97"
      },
      "audio_1": {
        buffer: Math.floor(Math.random() * 100),
        buffer_total: 100,
        codec: "aac",
        samplerate: 48000,
        channels: 2
      }
    }
  },
  {
    name: "NVidia H264 Decoder",
    type: "nvdec",
    itag: null,
    ID: "dec_1",
    nb_ipid: 1,
    nb_opid: 1,
    status: `Decoding: ${Math.floor(Math.random() * 100)} fps`,
    bytes_done: Math.floor(Math.random() * 2000000),
    idx: 2,
    gpac_args: [],
    ipid: {
      "video_in": {
        buffer: Math.floor(Math.random() * 100),
        buffer_total: 100,
        source_idx: 1,
        codec: "h264"
      }
    },
    opid: {
      "video_out": {
        buffer: Math.floor(Math.random() * 100),
        buffer_total: 100,
        width: 1920,
        height: 1080,
        pixel_format: "nv12"
      }
    }
  },
  {
    name: "AAC Decoder",
    type: "ffdec:aac",
    itag: null,
    ID: "dec_2",
    nb_ipid: 1,
    nb_opid: 1,
    status: "Decoding AAC",
    bytes_done: Math.floor(Math.random() * 500000),
    idx: 3,
    gpac_args: [],
    ipid: {
      "audio_in": {
        buffer: Math.floor(Math.random() * 100),
        buffer_total: 100,
        source_idx: 1,
        codec: "aac"
      }
    },
    opid: {
      "audio_out": {
        buffer: Math.floor(Math.random() * 100),
        buffer_total: 100,
        samplerate: 48000,
        channels: 2,
        format: "flt"
      }
    }
  },
  {
    name: "Video Output",
    type: "vout",
    itag: null,
    ID: "out_1",
    nb_ipid: 1,
    nb_opid: 0,
    status: `Rendering: ${Math.floor(20 + Math.random() * 10)} FPS`,
    bytes_done: Math.floor(Math.random() * 3000000),
    idx: 4,
    gpac_args: [],
    ipid: {
      "video_in": {
        buffer: Math.floor(Math.random() * 100),
        buffer_total: 100,
        source_idx: 2
      }
    },
    opid: {}
  },
  {
    name: "Audio Output",
    type: "aout",
    itag: null,
    ID: "out_2",
    nb_ipid: 1,
    nb_opid: 0,
    status: "Playing audio",
    bytes_done: Math.floor(Math.random() * 1000000),
    idx: 5,
    gpac_args: [],
    ipid: {
      "audio_in": {
        buffer: Math.floor(Math.random() * 100),
        buffer_total: 100,
        source_idx: 3
      }
    },
    opid: {}
  }
];

const GraphMonitor: React.FC<WidgetProps> = React.memo(({ id, title }) => {
  const dispatch = useDispatch();
  const [mockData, setMockData] = useState<GpacNodeData[]>(createMockGpacData());

  useEffect(() => {
    const interval = setInterval(() => {
      const newData = createMockGpacData();
      setMockData(newData);
      
      const selectedNode = localStorage.getItem('selectedNodeId');
      if (selectedNode) {
        const updatedNode = newData.find(n => n.idx.toString() === selectedNode);
        if (updatedNode) {
          dispatch(setSelectedNode(updatedNode));
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [dispatch]);

  const initialNodes: Node[] = useMemo(() => 
    mockData.map((gpacNode): Node => {
      let xPos = 0;
      let yPos = 100;
      
      switch (gpacNode.type) {
        case 'ffdmx':
          xPos = 100;
          break;
        case 'nvdec':
          xPos = 400;
          yPos = 50;
          break;
        case 'ffdec:aac':
          xPos = 400;
          yPos = 200;
          break;
        case 'vout':
          xPos = 700;
          yPos = 50;
          break;
        case 'aout':
          xPos = 700;
          yPos = 200;
          break;
      }

      return {
        id: gpacNode.idx.toString(),
        type: 'default',
        data: {
          ...gpacNode,
          icon: <Gauge className="w-4 h-4 text-blue-400" />,
          label: (
            <div className="text-center">
              <div className="font-medium">{gpacNode.name}</div>
              <div className="text-xs text-gray-400 mt-1">{gpacNode.status}</div>
            </div>
          )
        },
        position: { x: xPos, y: yPos },
        style: nodeStyle
      };
    })
  , [mockData]);

  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    mockData.forEach(node => {
      Object.entries(node.ipid).forEach(([pidName, pidData]) => {
        if (pidData.source_idx !== undefined) {
          edges.push({
            id: `e${pidData.source_idx}-${node.idx}`,
            source: pidData.source_idx.toString(),
            target: node.idx.toString(),
            label: (
              <div className="text-xs bg-gray-800 px-2 py-1 rounded">
                {`${pidName} (${pidData.buffer}%)`}
              </div>
            ),
            type: 'smoothstep',
            animated: true,
            style: { stroke: pidName.includes('video') ? '#3b82f6' : '#10b981' },
            markerEnd: { 
              type: MarkerType.ArrowClosed, 
              color: pidName.includes('video') ? '#3b82f6' : '#10b981' 
            }
          });
        }
      });
    });
    return edges;
  }, [mockData]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [mockData, setNodes, setEdges, initialNodes, initialEdges]);

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    const gpacNodeData = mockData.find(n => n.idx.toString() === node.id);
    if (gpacNodeData) {
      localStorage.setItem('selectedNodeId', node.id);
      dispatch(setSelectedNode(gpacNodeData));
    }
  }, [dispatch, mockData]);

  const getNodeColor = useCallback((_node: Node): string => {
    return '#6b7280';
  }, []);

  return (
    <WidgetWrapper id={id} title={title}>
         <div className="w-full h-[500px] relative" style={flowStyles}>
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
  fitViewOptions={{ padding: 0.2 }}
  nodesDraggable={true}
  nodesConnectable={false}
  elementsSelectable={true}
>
          <Controls 
            className="bg-gray-800 border-gray-700 fill-gray-400"
            showInteractive={false}
          />
          <MiniMap 
            className="bg-gray-800 border border-gray-700"
            nodeColor={getNodeColor}
            nodeStrokeWidth={3}
            maskColor="rgba(0, 0, 0, 0.3)"
          />
          <Background 
            color="#4b5563" 
            gap={16} 
            variant={BackgroundVariant.Dots} 
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