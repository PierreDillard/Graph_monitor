import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Node, Edge } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';
import { GpacNodeData, PIDInfo } from '@/types/gpac';

interface GraphState {
    rawData: GpacNodeData[];
    nodes: Node [];
    edges: Edge[];
    isLoading: boolean;
    error: string | null;
    selectedNodeId: string | null;
}

const initialState: GraphState = {
    rawData: [],
    nodes: [],
    edges: [],
    isLoading: false,
    error: null,
    selectedNodeId: null,
};

const calculatteNodePosition = (index: number, total: number) => {

    const GRID_SIZE = Math.ceil(Math.sqrt(total));
    const X_SPACING = 250;
    const Y_SPACING = 150;

    const row = Math.floor(index / GRID_SIZE);
    const col = index % GRID_SIZE;

    return {
        x: col * X_SPACING + 50,
        y: row * Y_SPACING + 50
    };
};

const getNodeType =(filter: GpacNodeData) : 'input' | 'filter' | 'output' => {
    if (filter.nb_ipid === 0) return 'input';
    if (filter.nb_opid === 0) return 'output';
    return 'filter';
};

const transformGpacData = (data: GpacNodeData[]): { nodes: Node[], edges: Edge[] } => { 
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    data.forEach((filter, index) => {
       
        const position = calculatteNodePosition(index, data.length);
        const nodeType = getNodeType(filter);
       
        nodes.push({
            id: filter.idx.toString(),
            type: nodeType,
            position,
            data: {
                ...filter,
                label: filter.name,
            },
            style: {
                background: nodeType === 'input' ? '#4ade80' : 
                           nodeType === 'output' ? '#ef4444' : '#3b82f6',
                color: 'white',
                border: '1px solid #4b5563',
                borderRadius: '0.5rem',
                padding: '0.5rem'
              },
            });

            Object.entries(filter.ipid).forEach(([pidName, pid]) => {
                if (pid.source_idx !== undefined) {
                  const edgeId = `e${pid.source_idx}-${filter.idx}-${pidName}`;
                  edges.push({
                    id: edgeId,
                    source: pid.source_idx.toString(),
                    target: filter.idx.toString(),
                    type: 'smoothstep',
                    animated: true,
                    label: `${pidName} (${(pid.buffer / pid.buffer_total * 100).toFixed(0)}%)`,
                    labelBgStyle: { fill: '#1f2937' },
                    labelStyle: { fill: '#ffffff', fontSize: 12 },
                    markerEnd: {
                      type: MarkerType.ArrowClosed,
                      color: pidName.includes('video') ? '#3b82f6' : '#10b981'
                    },
                    style: {
                      stroke: pidName.includes('video') ? '#3b82f6' : '#10b981',
                      strokeWidth: 2
                    }
                  });
                }
              });
            });
          
            return { nodes, edges };
          };

          const graphSlice = createSlice({
            name: 'graph',
            initialState,
            reducers: {
              setLoading(state, action: PayloadAction<boolean>) {
                state.isLoading = action.payload;
              },
              setError(state, action: PayloadAction<string>) {
                state.error = action.payload;
              },
              updateGraphData: (state, action: PayloadAction<GpacNodeData[]>) => {
                state.rawData = action.payload;
                const { nodes, edges } = transformGpacData(action.payload);
                state.nodes = nodes;
                state.edges = edges;
                state.isLoading = false;
                state.error = null;
              },

              setSelectedNode(state, action: PayloadAction<string>) {
                state.selectedNodeId = action.payload;
              },
              updateNodeData: (state, action: PayloadAction<{
                nodeId: string;
                data: Partial<GpacNodeData>;
              }>) => {
                const { nodeId, data } = action.payload;

                 // update the node data in the raw data

                const rawIndex = state.rawData.findIndex((node) => node.idx.toString() === nodeId);
                if (rawIndex !== -1) {
                  state.rawData[rawIndex] = {
                    ...state.rawData[rawIndex],
                    ...data
                  };
                }

                // update the node in React Flow
                const nodeIndex = state.nodes.findIndex((node) => node.id === nodeId);
                if(nodeIndex !== -1) {
                  state.nodes[nodeIndex].data = {
                    ...state.nodes[nodeIndex].data,
                    ...data
                  };
                }

                if('ipid' in data || 'opid' in data) {
                    const { nodes, edges } = transformGpacData(state.rawData);
                    state.nodes = nodes;
                    state.edges = edges;
                }
                }
            }
            });

            //Selectors
            export const selectGraphData = (state: { graph: GraphState }) => state.graph;
            export const selectNodes = (state: { graph: GraphState }) => state.graph.nodes;
            export const selectEdges = (state: { graph: GraphState }) => state.graph.edges;
            export const selectIsLoading = (state: { graph: GraphState }) => state.graph.isLoading;
            export const selectError = (state: { graph: GraphState }) => state.graph.error;
            export const selectSelectedNodeId = (state: { graph: GraphState }) => state.graph.selectedNodeId;

            export const {
                setLoading,
                setError,
                updateGraphData,
                setSelectedNode,
                updateNodeData          
            } = graphSlice.actions;

            export default graphSlice.reducer;