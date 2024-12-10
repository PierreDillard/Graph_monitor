import { GpacNodeData } from '../../../../types/gpac';
 
 
 // Utility functions for extracting video information
  export const extractResolution = (node: GpacNodeData): string => {
    // Extract from status or PID properties
    const match = node.status?.match(/(\d+)x(\d+)/);
    return match ? `${match[1]}x${match[2]}` : 'Unknown';
  };

 export  const extractCodec = (node: GpacNodeData): string => {
    return node.codec || 'Unknown';
  };

export   const calculateBitrate = (node: GpacNodeData): number => {
    // Calculate from bytes_done and time
    return node.bytes_done ? node.bytes_done / 1024 / 1024 : 0;
  };

export   const extractFPS = (node: GpacNodeData): number => {
    const match = node.status?.match(/(\d+\.?\d*)\s*FPS/);
    return match ? parseFloat(match[1]) : 0;
  };