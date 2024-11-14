import React, { useEffect, useRef } from 'react';
import WidgetWrapper from '../common/WidgetWrapper';

interface VideoMonitorProps {
  id: string;
  title: string;
}

const VideoMonitor: React.FC<VideoMonitorProps> = ({ id, title }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Simuler un flux vidéo
    if (videoRef.current) {
      videoRef.current.srcObject = null; // À remplacer par le vrai flux
    }

    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

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
            <div className="font-medium">1920x1080</div>
          </div>
          <div className="p-2 bg-gray-700 rounded">
            <span className="text-gray-400">Codec</span>
            <div className="font-medium">H.264</div>
          </div>
          <div className="p-2 bg-gray-700 rounded">
            <span className="text-gray-400">Bitrate</span>
            <div className="font-medium">5.2 Mbps</div>
          </div>
          <div className="p-2 bg-gray-700 rounded">
            <span className="text-gray-400">FPS</span>
            <div className="font-medium">60</div>
          </div>
          <div className="p-2 bg-gray-700 rounded">
            <span className="text-gray-400">Buffer</span>
            <div className="font-medium">500ms</div>
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

export default VideoMonitor;
