import React, {
  useCallback,
  useEffect,
  useState,
  useRef,
  useMemo,
} from 'react';
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
import { GpacNodeData } from '../../types/gpac';
import { RootState } from '../../store';
import WidgetWrapper from '../common/WidgetWrapper';
import { Activity } from 'lucide-react';
import { WidgetProps } from '../../types/widget';
import { gpacWebSocket } from '../../services/gpacWebSocket';
import {
  setSelectedFilterDetails,
  setSelectedNode,
} from '../../store/slices/graphSlice';

import {
  selectNodesForGraphMonitor,
  selectEdges,
  selectIsLoading,
  selectError,
} from '../../store/selectors/graphSelectors';
import {
  addSelectedFilter,
  removeSelectedFilter,
} from '../../store/slices/multiFilterSlice';
import { useGraphLayout } from '../../hooks/useGraphLayout';

const flowStyles = {
  background: '#111827',
  width: '100%',
  height: '100%',
};

const GraphMonitor: React.FC<WidgetProps> = React.memo(({ id, title }) => {
  const { applyLayout, isCalculating } = useGraphLayout();
  const dispatch = useDispatch();
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const renderCount = useRef(0);

  // Redux selectors
  const nodes = useSelector(selectNodesForGraphMonitor);
  const edges = useSelector(selectEdges);
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);
  const monitoredFilters = useSelector(
    (state: RootState) => state.multiFilter.selectedFilters,
  );
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // React Flow local state
  const [localNodes, setLocalNodes, onNodesChange] = useNodesState<Node>([]);
  const [localEdges, setLocalEdges, onEdgesChange] = useEdgesState<Edge>([]);

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

  // Handlers
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const nodeId = node.id;
      const nodeData = node.data as GpacNodeData;

      // 1.Update active filter details
      dispatch(setSelectedFilterDetails(nodeData));
      gpacWebSocket.setCurrentFilterId(parseInt(nodeId));
      gpacWebSocket.getFilterDetails(parseInt(nodeId));

      // 2. Manage multi-monitoring
      const isAlreadyMonitored = monitoredFilters.some((f) => f.id === nodeId);
      if (!isAlreadyMonitored) {
        dispatch(addSelectedFilter(nodeData));
        gpacWebSocket.subscribeToFilter(nodeId);
      }

      // 3. Update selected node
      dispatch(setSelectedNode(nodeId));
    },
    [dispatch, monitoredFilters],
  );

  interface LayoutState {
    isCustomLayout: boolean;
    currentLayout: 'default' | 'horizontal' | 'vertical';
    originalPositions: Record<string, { x: number; y: number }>;
  }

  const [layoutState, setLayoutState] = useState<LayoutState>({
    isCustomLayout: false,
  currentLayout: 'default',
  originalPositions: {}
  });

  const handleAutoLayout = useCallback(async () => {
    console.log('[Layout] Current layout state:', layoutState);
  
    if (!nodes.length) {
      console.warn('[Layout] No nodes available');
      return;
    }
  
    // Toggle between layouts
    const nextLayout = layoutState.currentLayout === 'default' ? 'horizontal' : 'default';
    
    if (nextLayout === 'default' && layoutState.originalPositions) {
      console.log('[Layout] Restoring original layout');
      const resetNodes = nodes.map(node => ({
        ...node,
        position: layoutState.originalPositions[node.id] || node.position
      }));
      setLocalNodes(resetNodes);
      setLayoutState(prev => ({
        ...prev,
        currentLayout: 'default',
        isCustomLayout: false
      }));
      return;
    }
  
    // Store current positions before applying new layout
    const currentPositions = nodes.reduce<Record<string, { x: number; y: number }>>(
      (acc, node) => ({
        ...acc,
        [node.id]: { ...node.position }
      }), 
      {}
    );
  
    try {
      const layoutNodes = nodes.map(node => ({
        id: node.id,
        width: 180,
        height: 40
      }));
  
      const newLayout = await applyLayout(layoutNodes, edges);
      console.log('[Layout] New layout calculated:', newLayout);
  
      if (newLayout) {
        const updatedNodes = nodes.map(node => {
          const layoutNode = newLayout.find(n => n.id === node.id);
          return layoutNode ? {
            ...node,
            position: layoutNode.position
          } : node;
        });
  
        setLocalNodes(updatedNodes);
        setLayoutState(prev => ({
          ...prev,
          currentLayout: nextLayout,
          isCustomLayout: true,
          originalPositions: currentPositions
        }));
      }
    } catch (error) {
      console.error('[Layout] Layout calculation failed:', error);
    }
  }, [nodes, edges, applyLayout, layoutState, setLocalNodes]);
/*   const onNodeDoubleClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const nodeId = node.id;

      // Delete the filter from the monitored filters
      dispatch(removeSelectedFilter(nodeId));
      gpacWebSocket.unsubscribeFromFilter(nodeId);

      // if active filter is the one being deleted, clear the details
      const currentId = gpacWebSocket.getCurrentFilterId();
      if (currentId === parseInt(nodeId)) {
        dispatch(setSelectedFilterDetails(null));
        gpacWebSocket.setCurrentFilterId(null);
      }
    },
    [dispatch],
  ); */

  const handleNodesChange = useCallback(
    (changes: any[]) => {
      onNodesChange(changes);
      // Update references
      nodesRef.current = localNodes.map((node) =>
        typeof node === 'object' ? { ...node } : node,
      );
    },
    [localNodes, onNodesChange],
  );

  // Same logic for edges..
  const handleEdgesChange = useCallback(
    (changes: any[]) => {
      onEdgesChange(changes);

      edgesRef.current = localEdges.map((edge) => ({ ...edge }));
    },
    [localEdges, onEdgesChange],
  );
  const updatedNodes = useMemo(
    () => updateNodesWithPositions(nodes),
    [nodes, updateNodesWithPositions],
  );
  const updatedEdges = useMemo(
    () => updateEdgesWithState(edges),
    [edges, updateEdgesWithState],
  );



// Layout control
const LayoutControl: React.FC = () => (
  <div className="absolute top-4 right-4 z-10 flex gap-2">
    <button 
      onClick={handleAutoLayout}
      disabled={isCalculating}
      className={`
        px-4 py-2 
        rounded-lg
        font-medium
        transition-colors
        flex items-center gap-2
        ${layoutState.currentLayout !== 'default' 
          ? 'bg-blue-600 hover:bg-blue-700' 
          : 'bg-gray-700 hover:bg-gray-600'}
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {isCalculating ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
          <span>Calculating...</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d={layoutState.currentLayout === 'default' 
                     ? "M8 13h8M8 17h8M8 9h8" 
                     : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
          <span>
            {layoutState.currentLayout === 'default' ? 'Apply Layout' : 'Reset Layout'}
          </span>
        </>
      )}
    </button>
  </div>
);
  
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
        edgesCount: edges.length,
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
          <div className="text-gray-400 text-center">{connectionError}</div>
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
      <LayoutControl />
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

          {/* Legend */}
          <div
            className="absolute bottom-4 left-4 bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-700 z-50"
            style={{
              backgroundColor: '#1f2937',
              backdropFilter: 'blur(8px)',
              boxShadow:
                '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            }}
          >
            <div className="relative z-50">
              <h4 className="text-sm font-medium mb-2 text-gray-200">
                Legend
              </h4>
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
