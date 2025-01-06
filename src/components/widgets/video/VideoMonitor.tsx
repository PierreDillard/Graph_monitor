import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { WidgetProps } from '../../../types/widget';
import WidgetWrapper from '../../common/WidgetWrapper';
import { RootState } from '../../../store';
import { GpacNodeData } from '../../../types/gpac/model';
import {
  extractResolution,
  extractCodec,
  calculateBitrate,
  extractFPS,
} from './utils/videoUtils';
import { VideoStats } from '../video/type/videoTypes';

const VideoMonitor: React.FC<WidgetProps> = ({ id, title }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stats, setStats] = useState<VideoStats>({
    resolution: '1920x1080',
    codec: 'H.264',
    bitrate: 5.2,
    fps: 60,
    buffer: {
      current: 500,
      total: 1000,
    },
  });

  const selectedNode = useSelector(
    (state: RootState) => state.graph.selectedFilterDetails,
  );

  useEffect(() => {
    if (selectedNode && selectedNode.type.includes('video')) {
      updateVideoStats(selectedNode);
    }
  }, [selectedNode]);

  const updateVideoStats = (node: GpacNodeData) => {
    // Parse stats from GPAC node data
    const newStats: VideoStats = {
      resolution: extractResolution(node),
      codec: extractCodec(node),
      bitrate: calculateBitrate(node),
      fps: extractFPS(node),
      buffer: {
        current: node.ipid?.video?.buffer || 0,
        total: node.ipid?.video?.buffer_total || 0,
      },
    };
    setStats(newStats);
  };

  return (
    <WidgetWrapper id={id} title={title}>
      <div className="space-y-4">
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            autoPlay
            playsInline
            muted
          />
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="p-2 bg-gray-700 rounded">
            <span className="text-gray-400">Resolution</span>
            <div className="font-medium">{stats.resolution}</div>
          </div>
          <div className="p-2 bg-gray-700 rounded">
            <span className="text-gray-400">Codec</span>
            <div className="font-medium">{stats.codec}</div>
          </div>
          <div className="p-2 bg-gray-700 rounded">
            <span className="text-gray-400">Bitrate</span>
            <div className="font-medium">{stats.bitrate.toFixed(1)} Mbps</div>
          </div>
          <div className="p-2 bg-gray-700 rounded">
            <span className="text-gray-400">FPS</span>
            <div className="font-medium">{stats.fps}</div>
          </div>
          <div className="p-2 bg-gray-700 rounded">
            <span className="text-gray-400">Buffer</span>
            <div className="font-medium">
              {stats.buffer.current}/{stats.buffer.total}ms
            </div>
          </div>
          <div className="p-2 bg-gray-700 rounded">
            <span className="text-gray-400">Status</span>
            <div className="font-medium text-green-400">Playing</div>
          </div>
        </div>
      </div>
    </WidgetWrapper>
  );
};

export default React.memo(VideoMonitor);
