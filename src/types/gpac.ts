import { Node, Edge, EdgeProps } from '@xyflow/react';

export interface FilterMetadata {
  CodecID?: string;
  AvgFrameSize?: number;
  Bitrate?: number;
  ClockID?: number;
  Duration?: number;
  Extension?: string;
  Height?: number;
  Width?: number;
  ISOBrand?: string;
  Language?: string;
  MIMEType?: string;
  MovieTime?: number;
  MaxFrameSize?: number;
}

export interface PIDData {
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
}

export interface GpacNodeData extends FilterMetadata {
  name: string;
  type: string;
  itag: string | null;
  ID: string | null;
  nb_ipid: number;
  nb_opid: number;
  status: string;
  bytes_done: number;
  pck_sent: number;  
  pck_done: number;  
  idx: number;
  gpac_args: string[];
  ipid: Record<string, PIDData>;
  opid: Record<string, PIDData>;
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
