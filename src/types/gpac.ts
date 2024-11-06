// src/types/gpac.ts
import { Node, Edge } from '@xyflow/react';
import { ReactNode } from 'react';

export interface NodeData {
  label: string;
  icon?: ReactNode;
  details?: string;
  gpacCommand?: string;
  [key: string]: unknown;
}

export type GpacNode = Node<NodeData>;
export type GpacEdge = Edge & {
  label?: string;
  animated?: boolean;
  style?: {
    stroke: string;
  };
};