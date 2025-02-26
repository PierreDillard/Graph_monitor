import dagre from 'dagre';
import { Node, Edge } from '@xyflow/react';

export enum LayoutType {
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical',
  DAGRE = 'dagre',
}

export interface LayoutOptions {
  type: LayoutType;
  direction?: 'LR' | 'RL' | 'TB' | 'BT';
  nodeSeparation?: number;
  rankSeparation?: number;
  respectExistingPositions?: boolean;
}

export function applyGraphLayout(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = { type: LayoutType.HORIZONTAL }
): Node[] {
  switch (options.type) {
    case LayoutType.DAGRE:
      return applyDagreLayout(nodes, edges, options);
    case LayoutType.VERTICAL:
      return applyVerticalLayout(nodes);
    case LayoutType.HORIZONTAL:
    default:
      return applyHorizontalLayout(nodes);
  }
}

function applyHorizontalLayout(nodes: Node[]): Node[] {
  return nodes.map((node, index) => ({
    ...node,
    position: {
      x: 150 + index * 300,
      y: 100,
    },
  }));
}

function applyVerticalLayout(nodes: Node[]): Node[] {
  return nodes.map((node, index) => ({
    ...node,
    position: {
      x: 150,
      y: 100 + index * 150,
    },
  }));
}

function applyDagreLayout(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions
): Node[] {
  // Create a new directed graph
  const g = new dagre.graphlib.Graph();
  
  // Set graph direction and spacing options
  g.setGraph({
    rankdir: options.direction || 'LR',
    nodesep: options.nodeSeparation || 80,
    ranksep: options.rankSeparation || 200,
    marginx: 20,
    marginy: 20,
  });
 
  g.setDefaultEdgeLabel(() => ({}));

  // Add nodes to the graph
  nodes.forEach((node) => {
    g.setNode(node.id, {
      width: node.style?.width || 180,
      height: node.style?.height || 60,
    });
  });

  // Add edges to the graph
  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  // Calculate the layout
  dagre.layout(g);

  // Apply the calculated layout to the nodes
  return nodes.map((node) => {
    const nodeWithPosition = { ...node };
    
    // Respect existing positions if configured and the node already has a position
    if (options.respectExistingPositions && 
        node.position && 
        node.position.x !== 0 && 
        node.position.y !== 0) {
      return nodeWithPosition;
    }
    
    const dagreNode = g.node(node.id);
    
    // Center the node on the calculated position
    nodeWithPosition.position = {
      x: dagreNode.x - (node.style?.width || 180) / 2,
      y: dagreNode.y - (node.style?.height || 60) / 2,
    };
    
    return nodeWithPosition;
  });
}