import { Node, Edge } from '@xyflow/react';

export interface GraphState {
  nodes: Record<string, Node>;
  edges: Record<string, Edge>;
  selectedNodeId: string | null;
  isProcessing: boolean;
  error: string | null;
}