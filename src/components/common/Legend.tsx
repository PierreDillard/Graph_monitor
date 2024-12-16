import React from 'react';
import { Activity } from 'lucide-react';

const Legend: React.FC = () => (
  <div
    className="absolute bottom-4 left-4 bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-700 z-50"
    style={{
      backgroundColor: '#1f2937',
      backdropFilter: 'blur(8px)',
      boxShadow:
        '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    }}
  >
    <div className="relative z-50">
      <h4 className="text-sm font-medium mb-2 text-gray-200">Legend</h4>
      <div className="space-y-2 text-sm text-gray-300">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#4ade80] shadow-sm" />
          <span className="relative z-50">Input Filter</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#3b82f6] shadow-sm" />
          <span className="relative z-50">Processing Filter</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ef4444] shadow-sm" />
          <span className="relative z-50">Output Filter</span>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="w-3 h-3 text-gray-400" />
          <span className="relative z-50">Active Buffer</span>
        </div>
      </div>
    </div>
  </div>
);

export default React.memo(Legend);
