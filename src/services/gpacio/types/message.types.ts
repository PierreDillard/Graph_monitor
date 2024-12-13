export interface GPACMessage {
    type: GPACMessageType;
    payload: unknown;
  }
  
  export enum GPACMessageType {
    ERROR = 'ERROR',
    FILTERS = 'filters',
    UPDATE = 'update',
    DETAILS = 'details',
    GET_ALL_FILTERS = 'get_all_filters',
    GET_DETAILS = 'get_details',
    STOP_DETAILS = 'stop_details',
  }

  export interface GPACFilterMessage {
    message: 'filters' | 'update' | 'details' | 'get_all_filters' | 'get_details' | 'stop_details';
    idx?: number;
    filters?: unknown[];
    filter?: {
      idx?: number;
      [key: string]: unknown;
    };
  }