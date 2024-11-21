import React, { useCallback, useEffect, useState , useRef, useMemo} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import WidgetWrapper from '../common/WidgetWrapper';
import { Activity } from 'lucide-react';
import { WidgetProps } from '../../types/widget';
import { gpacWebSocket } from '../../services/gpacWebSocket';
import { setSelectedNode } from '../../store/slices/graphSlice';
import {
  selectNodesForGraphMonitor,
  selectEdges,
  selectIsLoading,
  selectError,
} from '../../store/selectors/graphSelectors';



const flowStyles = {
  background: '#111827',
  width: '100%',
  height: '100%',
};


const GraphMonitor: React.FC<WidgetProps> = React.memo(({ id, title }) => {
  const dispatch = useDispatch();
  const nodesRef = useRef<Node[]>([])
  const edgesRef = useRef<Edge[]>([])
  const renderCount = useRef(0);

  
  // Redux selectors
  const nodes = useSelector(selectNodesForGraphMonitor);
  const edges = useSelector(selectEdges);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // React Flow local state
  const [localNodes, setLocalNodes, onNodesChange] = useNodesState([]);
  const [localEdges, setLocalEdges, onEdgesChange] = useEdgesState([]);

   // Memoisatin Node update
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
  

  // Memoisation Edge update
  const updateEdgesWithState = useCallback((newEdges: Edge[]) => {
    return newEdges.map(edge => {
      const existingEdge = edgesRef.current.find(e => e.id === edge.id);
      if(existingEdge) {
        return {
          ...edge,
          selected: existingEdge.selected,
          animated: existingEdge.animated,
        };
      }
      return edge;
    });
  }, []);


 
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    console.log('Node clicked:', node);
    dispatch(setSelectedNode(node.id));
    gpacWebSocket.getFilterDetails(parseInt(node.id));
  }, [dispatch]);

   const handleNodesChange = useCallback((changes: any[]) => {
    onNodesChange(changes);
    // Update references
    nodesRef.current = localNodes.map(node => ({ ...node }));
  }, [localNodes, onNodesChange]);

  // Same logic for edges..
  const handleEdgesChange = useCallback((changes: any[]) => {
    onEdgesChange(changes);

    edgesRef.current = localEdges.map(edge => ({ ...edge }));
  }, [localEdges, onEdgesChange]);
  const updatedNodes = useMemo(() => updateNodesWithPositions(nodes), [nodes, updateNodesWithPositions]);
  const updatedEdges = useMemo(() => updateEdgesWithState(edges), [edges, updateEdgesWithState]);
  // update data
  useEffect(() => {
    if (updatedNodes.length > 0 || updatedEdges.length > 0) {
     

      
      setLocalNodes(updatedNodes);
      setLocalEdges(updatedEdges);
      
      // Update references
      nodesRef.current = updatedNodes;
      edgesRef.current = updatedEdges;

      renderCount.current++;
      console.log(`[GraphMonitor] Render #${renderCount.current}`, {
        nodesCount: nodes.length,
        edgesCount: edges.length
      });
    }
  }, [updatedNodes, updatedEdges]);

  // WebSocket Connection
  useEffect(() => {
    console.log('GraphMonitor: Mounting and connecting WebSocket');
    
    const connectionTimer = setTimeout(() => {
      gpacWebSocket.connect();
    }, 1000);

    return () => {
      console.log('GraphMonitor: Unmounting and cleaning up');
      clearTimeout(connectionTimer);
      gpacWebSocket.disconnect();
    };
  }, []);
 
 
  useEffect(() => {
    console.log('Loading state changed:', isLoading);
  }, [isLoading]);

  useEffect(() => {
    if (error) {
      console.error('Graph error:', error);
      setConnectionError(error);
    }
  }, [error]);



  if (isLoading) {
    return (
      <WidgetWrapper id={id} title={title}>
        <div className="flex flex-col items-center justify-center h-full p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4" />
          <div className="text-gray-400">Connecting to GPAC...</div>
        </div>
      </WidgetWrapper>
    );
  }

  if (connectionError) {
    return (
      <WidgetWrapper id={id} title={title}>
        <div className="flex flex-col items-center justify-center h-full p-4">
          <div className="text-red-500 mb-4">Connection Error</div>
          <div className="text-gray-400 text-center">
            {connectionError}
          </div>
          <button 
            onClick={() => {
              setConnectionError(null);
              gpacWebSocket.connect();
            }}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            Retry Connection
          </button>
        </div>
      </WidgetWrapper>
    );
  }

  return (
    <WidgetWrapper id={id} title={title}>
      <div style={flowStyles}>
        <ReactFlow
          nodes={localNodes}
          edges={localEdges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          minZoom={0.1}
          maxZoom={4}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          proOptions={{ hideAttribution: true }}
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
            nodeColor={n => {
              switch (n.type) {
                case 'input': return '#4ade80';
                case 'output': return '#ef4444';
                default: return '#3b82f6';
              }
            }}
            maskColor="rgba(0, 0, 0, 0.3)"
            className="bg-gray-800 border border-gray-700"
          />

          {/* Légende */}
          <div 
  className="absolute bottom-4 left-4 bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-700 z-50" 
  style={{
    backgroundColor: '#1f2937', 
    backdropFilter: 'blur(8px)', 
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  }}
>
  <div className="relative z-50"> 
    <h4 className="text-sm font-medium mb-2 text-gray-200">Légende</h4>
    <div className="space-y-2 text-sm text-gray-300">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-[#4ade80] shadow-sm" />
        <span className="relative z-50">Filtre d'entrée</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-[#3b82f6] shadow-sm" />
        <span className="relative z-50">Filtre de traitement</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-[#ef4444] shadow-sm" />
        <span className="relative z-50">Filtre de sortie</span>
      </div>
      <div className="flex items-center gap-2">
        <Activity className="w-3 h-3 text-gray-400" />
        <span className="relative z-50">Buffer actif</span>
      </div>
    </div>
  </div>
</div>
        </ReactFlow>
      </div>
    </WidgetWrapper>
  );
});

GraphMonitor.displayName = 'GraphMonitor';

export default GraphMonitor;