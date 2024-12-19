import React from 'react';
import { GpacNodeData } from '../../../../types/gpac';

interface PIDMetricsCardProps {
  data: GpacNodeData;
}

export const PIDMetricsCard: React.FC<PIDMetricsCardProps> = ({ data }) => {
  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
      {/* PID Metrics Panel */}
      <div className="bg-black p-4 rounded-lg ">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm text-center font-medium text-gray-300">PID Distribution </h4>
    
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col bg-gray-700/50 p-3 rounded-lg">
            <span className="text-xs text-gray-400 mb-1">Input PIDs</span>
            <div className="flex items-baseline">
              <span className="text-2xl font-semibold text-blue-400">
                {data.nb_ipid}
              </span>
            </div>
            {Object.keys(data.ipid || {}).length > 0 && (
              <span className="text-xs text-gray-500 mt-1">
                Active: {Object.keys(data.ipid).length}
              </span>
            )}
          </div>
          
          <div className="flex flex-col bg-gray-700/50 p-3 rounded-lg">
            <span className="text-xs text-gray-400 mb-1">Output PIDs</span>
            <div className="flex items-baseline">
              <span className="text-2xl font-semibold text-green-400">
                {data.nb_opid}
              </span>
            </div>
            {Object.keys(data.opid || {}).length > 0 && (
              <span className="text-xs text-gray-500 mt-1">
                Active: {Object.keys(data.opid).length}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Processing Status */}
      <div className="bg-black flex items-center p-4 rounded-lg">
      
        <div className="space-y-2">
     
          <div className="flex flex-col items-center justify-between bg-gray-700/50 p-2 rounded">
 
          <span className="text-sm text-gray-400 mx-2 ">Type</span>
          <span className="text-sm">{data.type}</span>
  
           
          </div>
        </div>
      </div>
    </div>
  );
};