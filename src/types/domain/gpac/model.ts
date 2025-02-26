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
  FPS?: string;
  samplerate?: number;
  channels?: number;
  format?: string;
}
export interface TimeFraction {
  n: number;
  d: number;
}
export interface PIDPropertyValue {
  type?: string;
  val?: number | string | TimeFraction;
}

export interface GpacNodeData extends Record<string, unknown> {
  name: string;
  type: string;
  tasks: number;
  itag: string | null;
  ID: string | null;
  nb_ipid: number;
  nb_opid: number;
  status: string;
  codec?: string;
  streamtype?: string;
  bytes_done: number;
  errors: number;
  pck_ifce_sent: number;
  time: number;
  pck_done: number;
  pck_sent: number;
  class?: string;
  last_ts_sent?: TimeFraction;
  idx: number;
  gpac_args?: GpacArgument[];
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

export interface GpacArgument {
  /** The name of the argument, used as the identifier when updating */
  name: string;

  /** Optional description of the argument's purpose and functionality */
  desc?: string;

  /** The current value of the argument */
  value?: any;

  /** The data type of the argument (e.g., 'bool', 'uint', 'str', etc.) */
  type?: string;

  /** Default value for the argument when not explicitly set */
  default?: any;

  /** Additional information about the argument's usage or purpose */
  hint?: string;

  /** String representing constraints like min/max values or enumeration options */
  min_max_enum?: string;

  /** Indicates whether this argument can be updated at runtime */
  update?: boolean;

  /** Indicates whether updates to this argument need to be synchronized */
  update_sync?: boolean;

  /** Minimum allowed value for numeric arguments */
  min?: number;

  /** Maximum allowed value for numeric arguments */
  max?: number;

  /** Step size for numeric argument inputs */
  step?: number;

  /** For enumeration types, the list of possible values */
  enum_values?: string[];
}
