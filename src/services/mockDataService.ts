// src/services/mockDataService.ts

interface GpacFilter {
    name: string;
    type: string;
    idx: number;
    nb_ipid: number;
    nb_opid: number;
    status: string;
    bytes_done: number;
    ipid: Record<string, { buffer: number; buffer_total: number; source_idx?: number }>;
    opid: Record<string, { buffer: number; buffer_total: number }>;
  }
  
  // Données de test simulées
  const mockData: GpacFilter[] = [
    {
      name: "ffdmx",
      type: "ffdmx",
      idx: 0,
      nb_ipid: 0,
      nb_opid: 2,
      status: "reading input.mp4",
      bytes_done: 1024000,
      ipid: {},
      opid: {
        "video1": { buffer: 85, buffer_total: 100 },
        "audio1": { buffer: 90, buffer_total: 100 }
      }
    },
    {
      name: "video_decoder",
      type: "decoder",
      idx: 1,
      nb_ipid: 1,
      nb_opid: 1,
      status: "decoding H264",
      bytes_done: 512000,
      ipid: {
        "video1": { buffer: 75, buffer_total: 100, source_idx: 0 }
      },
      opid: {
        "video1": { buffer: 80, buffer_total: 100 }
      }
    },
    {
      name: "audio_decoder",
      type: "decoder",
      idx: 2,
      nb_ipid: 1,
      nb_opid: 1,
      status: "decoding AAC",
      bytes_done: 256000,
      ipid: {
        "audio1": { buffer: 95, buffer_total: 100, source_idx: 0 }
      },
      opid: {
        "audio1": { buffer: 85, buffer_total: 100 }
      }
    },
    {
      name: "video_output",
      type: "output",
      idx: 3,
      nb_ipid: 1,
      nb_opid: 0,
      status: "rendering 1920x1080@60fps",
      bytes_done: 2048000,
      ipid: {
        "video1": { buffer: 70, buffer_total: 100, source_idx: 1 }
      },
      opid: {}
    },
    {
      name: "audio_output",
      type: "output",
      idx: 4,
      nb_ipid: 1,
      nb_opid: 0,
      status: "playing 48kHz stereo",
      bytes_done: 128000,
      ipid: {
        "audio1": { buffer: 88, buffer_total: 100, source_idx: 2 }
      },
      opid: {}
    }
  ];
  
  class MockDataService {
    private subscribers = new Set<(data: GpacFilter[]) => void>();
    private currentData: GpacFilter[] = [...mockData];
    private updateInterval: NodeJS.Timeout | null = null;
  
    constructor() {
      this.startUpdates();
    }
  
    private startUpdates() {
      this.updateInterval = setInterval(() => {
        // Mettre à jour les données simulées
        this.currentData = this.currentData.map(filter => ({
          ...filter,
          bytes_done: filter.bytes_done + Math.floor(Math.random() * 1000),
          ipid: Object.entries(filter.ipid).reduce((acc, [key, pid]) => ({
            ...acc,
            [key]: {
              ...pid,
              buffer: Math.min(100, Math.max(0, pid.buffer + (Math.random() * 20 - 10)))
            }
          }), {}),
          opid: Object.entries(filter.opid).reduce((acc, [key, pid]) => ({
            ...acc,
            [key]: {
              ...pid,
              buffer: Math.min(100, Math.max(0, pid.buffer + (Math.random() * 20 - 10)))
            }
          }), {})
        }));
  
        this.notifySubscribers();
      }, 1000);
    }
  
    subscribe(callback: (data: GpacFilter[]) => void) {
      this.subscribers.add(callback);
      callback(this.currentData);
      return () => this.subscribers.delete(callback);
    }
  
    private notifySubscribers() {
      this.subscribers.forEach(callback => callback(this.currentData));
    }
  
    cleanup() {
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
      }
      this.subscribers.clear();
    }
  }
  
  export const mockDataService = new MockDataService();