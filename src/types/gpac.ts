// src/types/gpac.ts
import { Node, Edge } from '@xyflow/react';
import { ReactNode } from 'react';

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
  format?: string;
  pixel_format?: string;
}

export interface GpacNodeData extends Record<string, unknown> {
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
  label?: ReactNode;
  details?: string;
  icon?: ReactNode;
}

export type GpacNode = Node<GpacNodeData>;

export interface GpacEdgeData {
  label?: ReactNode;
}

export type GpacEdge = Edge & GpacEdgeData;
