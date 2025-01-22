import { Node, Edge } from '@xyflow/react';

export function updateNodesWithPositions(
  newNodes: Node[],
  nodesRef: React.MutableRefObject<Node[]>
) {
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
}

export function updateEdgesWithState(
  newEdges: Edge[],
  edgesRef: React.MutableRefObject<Edge[]>
) {
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
}
