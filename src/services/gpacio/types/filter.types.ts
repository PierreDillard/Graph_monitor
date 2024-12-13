import { GpacNodeData } from '../../../types/gpac';        


export interface FilterSubscription {
    filterId: string;
    callbacks: Set<(data: GpacNodeData) => void>;
  }