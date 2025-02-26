import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../../../store';
import { GpacNodeData } from '../../../../types/domain/gpac';
import {
  VideoStreamStats,
  UseVideoMonitorOptions,
} from '../../../../types/ui/videoTypes';

export const useVideoMonitor = (options: UseVideoMonitorOptions = {}) => {
  const { updateInterval = 1000, enablePeakTracking = true } = options;

  const [stats, setStats] = useState<VideoStreamStats>({
    resolution: {
      width: 0,
      height: 0,
    },
    codec: 'H.264',
    bitrate: {
      current: 0,
      average: 0,
      peak: 0,
    },
    framerate: {
      current: 0,
      target: 0,
    },
    bufferHealth: {
      current: 0,
      total: 0,
      percentage: 0,
    },
    errors: {
      count: 0,
    },
  });

  const selectedNode = useSelector(
    (state: RootState) => state.graph.selectedFilterDetails,
  );

  const calculateStats = useCallback(
    (node: GpacNodeData): VideoStreamStats => {
      // Extract resolution
      const resMatch = node.status?.match(/(\d+)x(\d+)/);
      const resolution = {
        width: resMatch ? parseInt(resMatch[1]) : 0,
        height: resMatch ? parseInt(resMatch[2]) : 0,
      };

      // Extract framerate
      const fpsMatch = node.status?.match(/(\d+\.?\d*)\s*FPS/);
      const currentFps = fpsMatch ? parseFloat(fpsMatch[1]) : 0;

      // Calculate buffer health
      const bufferCurrent = node.ipid?.video?.buffer || 0;
      const bufferTotal = node.ipid?.video?.buffer_total || 0;
      const bufferPercentage =
        bufferTotal > 0 ? (bufferCurrent / bufferTotal) * 100 : 0;

      // Calculate bitrate
      const currentBitrate = calculateInstantBitrate(node);
      const averageBitrate = calculateAverageBitrate(node);
      const peakBitrate = enablePeakTracking
        ? Math.max(stats.bitrate.peak, currentBitrate)
        : currentBitrate;

      return {
        resolution,
        codec: node.codec || 'Unknown',
        bitrate: {
          current: currentBitrate,
          average: averageBitrate,
          peak: peakBitrate,
        },
        framerate: {
          current: currentFps,
          target: extractTargetFramerate(node),
        },
        bufferHealth: {
          current: bufferCurrent,
          total: bufferTotal,
          percentage: bufferPercentage,
        },
        errors: {
          count: node.errors || 0,
          lastError: node.status?.includes('error') ? node.status : undefined,
        },
      };
    },
    [stats.bitrate.peak, enablePeakTracking],
  );

  const calculateInstantBitrate = (node: GpacNodeData): number => {
    if (!node.bytes_done) return 0;
    const timeDiff = node.time || 1; // Fallback to 1 to avoid division by zero
    return (node.bytes_done * 8) / (1024 * 1024 * timeDiff); // Mbps
  };

  const calculateAverageBitrate = (node: GpacNodeData): number => {
    // Implementation depends on how you want to calculate the average
    // Could use a rolling window or total average
    return calculateInstantBitrate(node);
  };

  const extractTargetFramerate = (node: GpacNodeData): number => {
    // Extract target framerate from PID properties or node configuration
    // Default to 0 if not found
    return node.ipid?.video?.FPS?.val?.n || 0;
  };

  useEffect(() => {
    if (!selectedNode || !selectedNode.type.includes('video')) return;

    const updateTimer = setInterval(() => {
      setStats(calculateStats(selectedNode));
    }, updateInterval);

    return () => clearInterval(updateTimer);
  }, [selectedNode, updateInterval, calculateStats]);

  return {
    stats,
    isVideoNode: selectedNode?.type.includes('video') || false,
    hasErrors: stats.errors.count > 0,
    bufferStatus:
      stats.bufferHealth.percentage > 80
        ? 'healthy'
        : stats.bufferHealth.percentage > 50
          ? 'warning'
          : 'critical',
  };
};
