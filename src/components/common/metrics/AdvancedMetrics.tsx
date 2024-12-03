import React from 'react';
import { GpacNodeData } from '../../../types/gpac';
import { Activity, Cpu, Package } from 'lucide-react';
import FPSMetric from './FPSMetric';



interface AdvancedMetricsProps {
    data: GpacNodeData;
}

const AdvancedMetrics: React.FC<AdvancedMetricsProps> = React.memo(({ data }) => {
    // Find the first PID that has FPS information
    const firstPidWithFPS = Object.values(data.ipid as Record<string, any>).find(pid => pid.FPS && 'val' in pid.FPS) || 
    Object.values(data.opid as Record<string, any>).find(pid => pid.FPS && 'val' in pid.FPS);

    const processingTime = data.time / 1000; // Convert to seconds
    const codecInfo = data.codec || 'Unknown';
    const streamType = data.streamtype || 'Unknown';

    return (
        <div className="space-y-4 mt-4">
          {/* Grille principale des métriques */}
          <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
            {/* Codec Information */}
            <div className="bg-gray-800/50 p-4 rounded-lg backdrop-blur-sm border border-gray-700/50">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-blue-400" />
                <h4 className="text-sm font-medium text-gray-300">Codec Information</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm min-w-0">
                  <span className="text-gray-400">Codec:</span>
                  <span className="font-medium text-blue-400 text-right">
                    {codecInfo}
                  </span>
                </div>
                <div className="flex justify-between text-sm min-w-0">
                  <span className="text-gray-400">Stream Type:</span>
                  <span className="font-medium text-green-400 text-right">
                    {streamType}
                  </span>
                </div>
              </div>
            </div>
    
            {/* Processing Stats */}
            <div className="bg-gray-800/50 p-4 rounded-lg backdrop-blur-sm w-full border border-gray-700/50">
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="w-4 h-4 text-purple-400" />
                <h4 className="text-sm font-medium text-gray-300">Processing Stats</h4>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm min-w-0">
                  <span className="text-gray-400 ">Processing Time:</span>
                  <span className="font-medium text-purple-400 ">
                    {processingTime.toFixed(2)}s
                  </span>
                </div>
                <div className="flex justify-between text-sm min-w-0">
                  <span className="text-gray-400">Packets Done:</span>
                  <span className="font-medium text-cyan-400 ">
                    {data.pck_done?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
    
          {/* FPS Metrics */}
          {firstPidWithFPS?.FPS && (
            <div className="bg-gray-800/50 p-4 rounded-lg backdrop-blur-sm border border-gray-700/50">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-yellow-400" />
                <h4 className="text-sm font-medium text-gray-300">Performance</h4>
              </div>
              <FPSMetric fps={firstPidWithFPS.FPS} />
            </div>
          )}
    
          {/* Statistiques supplémentaires */}
          <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
            <div className="bg-gray-800/50 p-3 rounded-lg text-center">
              <div className="text-xs text-gray-400 mb-1">Packets Sent</div>
              <div className="font-medium text-orange-400">
                {data.pck_sent?.toLocaleString()}
              </div>
            </div>
            <div className="bg-gray-800/50 p-3 rounded-lg text-center">
              <div className="text-xs text-gray-400 mb-1">Tasks</div>
              <div className="font-medium text-teal-400">
                {data.tasks?.toLocaleString() ?? 0}
              </div>
            </div>
            <div className="bg-gray-800/50 p-3 rounded-lg text-center">
              <div className="text-xs text-gray-400 mb-1">Errors</div>
              <div className="font-medium text-red-400">
                {data.errors?.toLocaleString() ?? 0}
              </div>
            </div>
            <div className="bg-gray-800/50 p-3 rounded-lg text-center">
              <div className="text-xs text-gray-400 mb-1">Interface Packets</div>
              <div className="font-medium text-indigo-400">
                {data.pck_ifce_sent?.toLocaleString() ?? 0}
              </div>
            </div>
          </div>
        </div>
      );
    });
    
    AdvancedMetrics.displayName = 'AdvancedMetrics';
    
    export default AdvancedMetrics;
