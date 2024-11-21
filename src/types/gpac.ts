// src/types/gpac.ts
import { Node, Edge, EdgeProps } from '@xyflow/react';


export interface PIDInfo {
  buffer: number;
  buffer_total: number;
  source_idx?: number;
  codec?: string;
  width?: number;
  height?: number;
  fps?: string;
  samplerate?: number;
  channels?: number;
}

export interface GpacNodeData {
  name: string;
  type: string;
  itag: string | null;
  ID: string | null;
  nb_ipid: number;
  nb_opid: number;
  status: string;
  bytes_done: number;
  idx: number;
  gpac_args: string[];
  ipid: Record<string, PIDInfo>;
  opid: Record<string, PIDInfo>;
}

export type GpacNode = Node<GpacNodeData>;

export type FilterType = 'video' | 'audio' | 'text' | 'image' | 'other';

export interface EdgeData extends Record<string, unknown> {
  id: string;
  source: string;
  target: string;
  filterType: FilterType;
  bufferPercentage: number;
  pidName: string;
}

export type GpacEdge = Edge<EdgeData>;

export interface GpacEdgeProps extends EdgeProps<EdgeData> {
  data: EdgeData;
}


