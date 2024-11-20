import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Node, Edge } from '@xyflow/react';
import { GpacNodeData } from '@/types/gpac';
import { isEqual } from 'lodash';

interface GraphState {
  filters: GpacNodeData[];
  nodes: Node[];
  edges: Edge[];
  isLoading: boolean;
  error: string | null;
  redraw: boolean;
  selectedNodeId: string | null;
  lastUpdate: number;
}

const initialState: GraphState = {
  filters: [],
  nodes: [],
  edges: [],
  isLoading: false,
  error: null,
  redraw: false,
  selectedNodeId: null,
  lastUpdate: Date.now(),
};

function createNodeFromFilter(filter: GpacNodeData, index: number, existingNodes: Node[]): Node {
  const existingNode = existingNodes.find(n => n.id === filter.idx.toString());
  
  return {
    id: filter.idx.toString(),
    type: 'default',
    data: {
      label: filter.name,
      ...filter,
    },
    // Preserve existing position or create new
    position: existingNode?.position || {
      x: 150 + (index % 3) * 300,
      y: 100 + Math.floor(index / 3) * 200,
    },
    style: {
      background: filter.nb_ipid === 0 ? '#4ade80' : 
                 filter.nb_opid === 0 ? '#ef4444' : '#3b82f6',
      color: 'white',
      padding: '10px',
      borderRadius: '8px',
      border: '1px solid #4b5563',
      width: 180,
    },
    // Preserv selection state
    selected: existingNode?.selected,
  };
}

function createEdgesFromFilters(filters: GpacNodeData[], existingEdges: Edge[]): Edge[] {
  const newEdges: Edge[] = [];

  filters.forEach(filter => {
    if (filter.ipid) {
      Object.entries(filter.ipid).forEach(([pidName, pid]: [string, any]) => {
        if (pid.source_idx !== undefined) {
          const edgeId = `${pid.source_idx}-${filter.idx}-${pidName}`;
          const existingEdge = existingEdges.find(e => e.id === edgeId);
          
          newEdges.push({
            id: edgeId,
            source: pid.source_idx.toString(),
            target: filter.idx.toString(),
            label: pidName,
            animated: true,
            style: { stroke: '#4b5563' },
            // Preserve selection state
            selected: existingEdge?.selected,
          });
        }
      });
    }
  });

  return newEdges;
}

const THROTTLE_INTERVAL = 100; 

const graphSlice = createSlice({
  name: 'graph',
  initialState,
  reducers: {
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      state.isLoading = false;
    },
    updateGraphData: {
      reducer(state, action: PayloadAction<GpacNodeData[]>) {
        const now = Date.now();
        if (now - state.lastUpdate < THROTTLE_INTERVAL) {
          return;
        }

        if (!isEqual(state.filters, action.payload)) {
          state.filters = action.payload;
          state.nodes = action.payload.map((f, i) => 
            createNodeFromFilter(f, i, state.nodes)
          );
          state.edges = createEdgesFromFilters(action.payload, state.edges);
          state.isLoading = false;
          state.error = null;
          state.lastUpdate = now;
        }
      },
      prepare(data: GpacNodeData[]) {
        return {
          payload: data,
          meta: { throttle: THROTTLE_INTERVAL }
        };
      }
    },
    updateLayout(state, action: PayloadAction<{ nodes: Node[], edges: Edge[] }>) {
      // Update only the positions of existing nodes
      state.nodes = state.nodes.map(node => {
        const updatedNode = action.payload.nodes.find(n => n.id === node.id);
        return updatedNode ? { ...node, position: updatedNode.position } : node;
      });
      state.edges = action.payload.edges;
    },
    setSelectedNode(state, action: PayloadAction<string>) {
      if (state.selectedNodeId !== action.payload) {
        state.selectedNodeId = action.payload;
      }
    },
  },
});

export const {
  setLoading,
  setError,
  updateGraphData,
  updateLayout,
  setSelectedNode,
} = graphSlice.actions;

export default graphSlice.reducer;