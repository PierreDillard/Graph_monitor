import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Node, Edge } from '@xyflow/react';
import { GpacNodeData } from '@/types/gpac';

interface GraphState {
  filters: GpacNodeData[];
  nodes: Node[];
  edges: Edge[];
  isLoading: boolean;
  error: string | null;
  redraw: boolean;
  selectedNodeId: string | null;
}

const initialState: GraphState = {
  filters: [],
  nodes: [],
  edges: [],
  isLoading: false,
  error: null,
  redraw: false,
  selectedNodeId: null,
};

function createNodeFromFilter(filter: GpacNodeData, index: number): Node {
  const position = {
    x: 150 + (index % 3) * 300,
    y: 100 + Math.floor(index / 3) * 200,
  };

  return {
    id: filter.idx.toString(),
    type: 'default',
    data: {
      label: filter.name,
      ...filter,
    },
    position,
    style: {
      background: filter.nb_ipid === 0 ? '#4ade80' : 
                 filter.nb_opid === 0 ? '#ef4444' : '#3b82f6',
      color: 'white',
      padding: '10px',
      borderRadius: '8px',
      border: '1px solid #4b5563',
      width: 180,
    },
  };
}

function createEdgesFromFilters(filters: GpacNodeData[]): Edge[] {
  const edges: Edge[] = [];

  filters.forEach(filter => {
    if (filter.ipid) {
      Object.entries(filter.ipid).forEach(([pidName, pid]: [string, any]) => {
        if (pid.source_idx !== undefined) {
          edges.push({
            id: `${pid.source_idx}-${filter.idx}-${pidName}`,
            source: pid.source_idx.toString(),
            target: filter.idx.toString(),
            label: pidName,
            animated: true,
            style: { stroke: '#4b5563' },
          });
        }
      });
    }
  });

  return edges;
}

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
    updateGraphData(state, action: PayloadAction<GpacNodeData[]>) {
      state.filters = action.payload;
      state.nodes = action.payload.map(createNodeFromFilter);
      state.edges = createEdgesFromFilters(action.payload);
      state.isLoading = false;
      state.error = null;
      state.redraw = true;
    },
    updateLayout(state, action: PayloadAction<{ nodes: Node[], edges: Edge[] }>) {
      state.nodes = action.payload.nodes;
      state.edges = action.payload.edges;
      state.redraw = false;
    },
    setSelectedNode(state, action: PayloadAction<string>) {
      state.selectedNodeId = action.payload;
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

export const selectGraphState = (state: { graph: GraphState }) => state.graph;
export const selectNodes = (state: { graph: GraphState }) => state.graph.nodes;
export const selectEdges = (state: { graph: GraphState }) => state.graph.edges;
export const selectIsLoading = (state: { graph: GraphState }) => state.graph.isLoading;
export const selectError = (state: { graph: GraphState }) => state.graph.error;
export const selectRedraw = (state: { graph: GraphState }) => state.graph.redraw;
export const selectSelectedNodeId = (state: { graph: GraphState }) => state.graph.selectedNodeId;