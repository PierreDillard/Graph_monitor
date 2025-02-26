export interface VideoStats {
  resolution: string;
  codec: string;
  bitrate: number;
  fps: number;
  buffer: {
    current: number;
    total: number;
  };
}

export interface VideoStreamStats {
  resolution: {
    width: number;
    height: number;
  };
  codec: string;
  bitrate: {
    current: number;
    average: number;
    peak: number;
  };
  framerate: {
    current: number;
    target: number;
  };
  bufferHealth: {
    current: number;
    total: number;
    percentage: number;
  };
  errors: {
    count: number;
    lastError?: string;
  };
}

export interface UseVideoMonitorOptions {
  updateInterval?: number;
  enablePeakTracking?: boolean;
}
