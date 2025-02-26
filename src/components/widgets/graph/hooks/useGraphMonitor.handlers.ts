import { useCallback } from 'react';
import { Node, Edge } from '@xyflow/react';
import { GpacNodeData } from '../../../../types/domain/gpac';
import { MonitoredFilter } from '../../../../store/slices/multiFilterSlice';

// =========================
//       NODES HANDLER
// =========================
interface NodesHandlerParams {
  onNodesChange: (changes: any[]) => void;
  localNodes: Node[];
  setLocalNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  nodesRef: React.MutableRefObject<Node[]>;
}

export function createHandleNodesChange({
  onNodesChange,
  localNodes,
  setLocalNodes,
  nodesRef,
}: NodesHandlerParams) {
  return useCallback(
    (changes: any[]) => {
      onNodesChange(changes);

      // Update local nodes with new positions
      setLocalNodes((prevNodes) =>
        prevNodes.map((node) => {
          const change = changes.find((c) => c.id === node.id);
          return change && change.position
            ? { ...node, position: change.position }
            : node;
        }),
      );

      nodesRef.current = localNodes;
    },
    [onNodesChange, localNodes, setLocalNodes, nodesRef],
  );
}

// =========================
//       EDGES HANDLER
// =========================
interface EdgesHandlerParams {
  onEdgesChange: (changes: any[]) => void;
  localEdges: Edge[];
  edgesRef: React.MutableRefObject<Edge[]>;
}

export function createHandleEdgesChange({
  onEdgesChange,
  localEdges,
  edgesRef,
}: EdgesHandlerParams) {
  return useCallback(
    (changes: any[]) => {
      onEdgesChange(changes);
      // Update localEdges ref
      edgesRef.current = localEdges.map((edge) => ({ ...edge }));
    },
    [onEdgesChange, localEdges, edgesRef],
  );
}

// =========================
//    ON NODE CLICK HANDLER
// =========================
interface OnNodeClickParams {
  dispatch: Function;
  monitoredFilters: MonitoredFilter[];
  service: any;
  addSelectedFilter: (payload: MonitoredFilter) => void;
  setSelectedNode: (nodeId: string) => { payload: string; type: string };
  setSelectedFilterDetails: (data: GpacNodeData) => {
    payload: GpacNodeData;
    type: string;
  };
}

export function createOnNodeClick({
  dispatch,
  monitoredFilters,
  service,
  addSelectedFilter,
  setSelectedNode,
  setSelectedFilterDetails,
}: OnNodeClickParams) {
  return useCallback(
    (event: React.MouseEvent, node: Node) => {
      const nodeId = node.id;
      const nodeData = node.data;

      dispatch(setSelectedFilterDetails(nodeData as GpacNodeData));
      service.setCurrentFilterId(parseInt(nodeId));
      service.getFilterDetails(parseInt(nodeId));

      const isAlreadyMonitored = monitoredFilters.some((f) => f.id === nodeId);
      if (!isAlreadyMonitored) {
        const monitoredFilter: MonitoredFilter = {
          id: nodeId,
          nodeData: nodeData as GpacNodeData,
        };

        dispatch(addSelectedFilter(monitoredFilter));
        service.subscribeToFilter(nodeId);
      }

      dispatch(setSelectedNode(nodeId));
    },
    [
      dispatch,
      monitoredFilters,
      service,
      addSelectedFilter,
      setSelectedFilterDetails,
      setSelectedNode,
    ],
  );
}
