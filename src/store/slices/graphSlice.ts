import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Node, Edge } from '@xyflow/react';
import { throttle } from 'lodash';
import { GpacNodeData } from '@/types/gpac';
import { createNodeFromFilter, createEdgesFromFilters } from '../../components/widgets/graph/utils/GraphOperations';

export interface GraphState {
  filters: GpacNodeData[];
  nodes: Node[];
  edges: Edge[];
  isLoading: boolean;
  error: string | null;
  redraw: boolean;
  selectedNodeId: string | null;
  lastUpdate: number;
  selectedFilterDetails: GpacNodeData | null;
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
  selectedFilterDetails: null,
};

const THROTTLE_INTERVAL = 500;

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
     
        state.filters = [];
        state.nodes = [];
        state.edges = [];

      
        state.filters = action.payload;
        state.nodes = action.payload.map((f, i) =>
          createNodeFromFilter(f, i, []),
        );
        state.edges = createEdgesFromFilters(action.payload, []);
        state.lastUpdate = Date.now();
      },
      prepare: throttle((data: GpacNodeData[]) => ({
        payload: data,
        meta: { throttle: THROTTLE_INTERVAL }
      }), THROTTLE_INTERVAL)
    },

    updateLayout(
      state,
      action: PayloadAction<{ nodes: Node[]; edges: Edge[] }>,
    ) {
      // Update only the positions of existing nodes
      state.nodes = state.nodes.map((node) => {
        const updatedNode = action.payload.nodes.find((n) => n.id === node.id);
        return updatedNode ? { ...node, position: updatedNode.position } : node;
      });
      state.edges = action.payload.edges;
    },
    setSelectedNode(state, action: PayloadAction<string>) {
      if (state.selectedNodeId !== action.payload) {
        state.selectedNodeId = action.payload;
      }
    },
    setFilterDetails: (state, action: PayloadAction<GpacNodeData | null>) => {
      console.log('[GraphSlice] Updating filter details:', action.payload);
      state.selectedFilterDetails = action.payload;
    },

    selectSelectedFilterDetails: (state, action: PayloadAction<any>) => {
      state.selectedFilterDetails = action.payload;
    },
    clearFilterDetails: (state) => {
      state.selectedFilterDetails = null;
    },
    setSelectedFilterDetails: (state, action: PayloadAction<GpacNodeData>) => {
      state.selectedFilterDetails = action.payload;
      console.log('DETAILS DU FILTRE SÉLECTIONNÉ :', action.payload);
    },
  },
});
export const {
  setLoading,
  setError,
  updateGraphData,
  updateLayout,
  setSelectedNode,
  setFilterDetails,
  clearFilterDetails,
  setSelectedFilterDetails,
  selectSelectedFilterDetails,
} = graphSlice.actions;

export default graphSlice.reducer;
