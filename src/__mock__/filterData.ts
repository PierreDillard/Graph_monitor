
import { GpacNodeData } from '../types/gpac';
import { FilterMetric, RealTimeMetrics } from '../types/filterMonitor';

// Mock Filter Data representing different types of filters
export const mockFilterData: GpacNodeData[] = [
  {
    idx: 1,
    name: 'FFmpeg Demuxer',
    type: 'ffdmx',
    bytes_done: 1500000,
    status: 'Demuxing at 60fps, buffer: 85%',
    nb_ipid: 0,
    nb_opid: 2,
    itag: null,
    ID: null,
    pck_done: 1000,
    pck_sent: 950,
    ipid: {},
    opid: {
      'video_1': {
        buffer: 8192,
        buffer_total: 16384,
        codec: 'h264',
        width: 1920,
        height: 1080,
        fps: '60'
      },
      'audio_1': {
        buffer: 4096,
        buffer_total: 8192,
        codec: 'aac',
        samplerate: 48000,
        channels: 2
      }
    },
    gpac_args: []
  },
  {
    idx: 2,
    name: 'AVC Decoder',
    type: 'nvdec',
    bytes_done: 750000,
    status: 'Decoding h264, GPU usage: 45%',
    nb_ipid: 1,
    nb_opid: 1,
    itag: null,
    ID: null,
    pck_done: 500,
    pck_sent: 480,
    ipid: {
      'video_in': {
        buffer: 4096,
        buffer_total: 8192,
        source_idx: 1
      }
    },
    opid: {
      'raw_video': {
        buffer: 16384,
        buffer_total: 32768
      }
    },
    gpac_args: []
  },
  {
    idx: 3,
    name: 'AAC Decoder',
    type: 'faad',
    bytes_done: 250000,
    status: 'Decoding AAC, buffer stable',
    nb_ipid: 1,
    nb_opid: 1,
    itag: null,
    ID: null,
    pck_done: 300,
    pck_sent: 290,
    ipid: {
      'audio_in': {
        buffer: 2048,
        buffer_total: 4096,
        source_idx: 1
      }
    },
    opid: {
      'raw_audio': {
        buffer: 8192,
        buffer_total: 16384
      }
    },
    gpac_args: []
  },
  {
    idx: 4,
    name: 'Video Output',
    type: 'vout',
    bytes_done: 2000000,
    status: '1920x1080 YUV420 @ 60fps',
    nb_ipid: 1,
    nb_opid: 0,
    itag: null,
    ID: null,
    pck_done: 600,
    pck_sent: 0,
    ipid: {
      'video_in': {
        buffer: 8192,
        buffer_total: 16384,
        source_idx: 2
      }
    },
    opid: {},
    gpac_args: []
  },
  {
    idx: 5,
    name: 'Audio Output',
    type: 'aout',
    bytes_done: 500000,
    status: '48kHz stereo, buffer: 92ms',
    nb_ipid: 1,
    nb_opid: 0,
    itag: null,
    ID: null,
    pck_done: 400,
    pck_sent: 0,
    ipid: {
      'audio_in': {
        buffer: 4096,
        buffer_total: 8192,
        source_idx: 3
      }
    },
    opid: {},
    gpac_args: []
  }
];

// Mock Processing Metrics with different scenarios
export const mockProcessingMetrics: Record<string, RealTimeMetrics> = {
  '1': {
    previousBytes: 1400000,
    currentBytes: 1500000,
    lastUpdate: Date.now() - 1000, // 1 second ago
    bufferStatus: {
      current: 12288,
      total: 16384
    }
  },
  '2': {
    previousBytes: 700000,
    currentBytes: 750000,
    lastUpdate: Date.now() - 500, // 500ms ago
    bufferStatus: {
      current: 6144,
      total: 8192
    }
  },
  '3': {
    previousBytes: 240000,
    currentBytes: 250000,
    lastUpdate: Date.now() - 750, // 750ms ago
    bufferStatus: {
      current: 3072,
      total: 4096
    }
  },
  '4': {
    previousBytes: 1950000,
    currentBytes: 2000000,
    lastUpdate: Date.now() - 250, // 250ms ago
    bufferStatus: {
      current: 14336,
      total: 16384
    }
  },
  '5': {
    previousBytes: 490000,
    currentBytes: 500000,
    lastUpdate: Date.now() - 100, // 100ms ago
    bufferStatus: {
      current: 7168,
      total: 8192
    }
  }
};

// Mock Filter Metrics History
export const mockFilterHistory: Record<string, FilterMetric[]> = {
  '1': Array.from({ length: 50 }, (_, i) => ({
    timestamp: Date.now() - (50 - i) * 1000,
    bytes_done: 1000000 + i * 10000,
    packets_sent: 900 + i,
    packets_done: 850 + i
  })),
  '2': Array.from({ length: 50 }, (_, i) => ({
    timestamp: Date.now() - (50 - i) * 1000,
    bytes_done: 500000 + i * 5000,
    packets_sent: 450 + i,
    packets_done: 430 + i
  }))
};

// Mock Error Scenarios
export const mockErrorFilters: GpacNodeData[] = [
  {
    // Filter with buffer overflow
    idx: 6,
    name: 'Overflow Filter',
    type: 'custom',
    bytes_done: 100000,
    status: 'Error: Buffer overflow',
    nb_ipid: 1,
    nb_opid: 1,
    itag: null,
    ID: null,
    pck_done: 100,
    pck_sent: 90,
    ipid: {
      'in': {
        buffer: 16384,
        buffer_total: 16384,
        source_idx: 1
      }
    },
    opid: {
      'out': {
        buffer: 32768,
        buffer_total: 32768
      }
    },
    gpac_args: []
  },
  {
    // Filter with no buffer (starved)
    idx: 7,
    name: 'Starved Filter',
    type: 'custom',
    bytes_done: 50000,
    status: 'Warning: Buffer underrun',
    nb_ipid: 1,
    nb_opid: 1,
    itag: null,
    ID: null,
    pck_done: 50,
    pck_sent: 45,
    ipid: {
      'in': {
        buffer: 0,
        buffer_total: 8192,
        source_idx: 1
      }
    },
    opid: {
      'out': {
        buffer: 1024,
        buffer_total: 16384
      }
    },
    gpac_args: []
  }
];

// Mock Dynamic Updates (simulating real-time changes)
export const mockDynamicUpdates = (baseFilter: GpacNodeData): GpacNodeData[] => {
  return Array.from({ length: 10 }, (_, i) => ({
    ...baseFilter,
    bytes_done: baseFilter.bytes_done + (i * 50000),
    status: `Processing frame ${i + 1}, buffer: ${75 + i}%`,
    pck_done: baseFilter.pck_done + (i * 10),
    pck_sent: baseFilter.pck_sent + (i * 9),
    ipid: {
      ...baseFilter.ipid,
      'in': {
        ...baseFilter.ipid['in'],
        buffer: Math.min(baseFilter.ipid['in'].buffer + (i * 512), baseFilter.ipid['in'].buffer_total)
      }
    }
  }));
};

// Mock Performance Metrics
export const mockPerformanceData = {
  cpu: Array.from({ length: 60 }, (_, i) => ({
    timestamp: Date.now() - (60 - i) * 1000,
    usage: 30 + Math.random() * 20
  })),
  memory: Array.from({ length: 60 }, (_, i) => ({
    timestamp: Date.now() - (60 - i) * 1000,
    usage: 512 + Math.random() * 256
  })),
  gpu: Array.from({ length: 60 }, (_, i) => ({
    timestamp: Date.now() - (60 - i) * 1000,
    usage: 40 + Math.random() * 30
  }))
};