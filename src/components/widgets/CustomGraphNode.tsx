import React from 'react';
import { Handle, Position } from '@xyflow/react';

const CustomGraphNode = ({ data, selected }) => {
  const style = data?.style || {};
  const background = style.background || '#3b82f6';

  return (
    <div
      style={{
        ...style,
        background,
      }}
      className={`
        relative 
        p-4 
        rounded-lg 
        shadow
        transition-all
        duration-200
        ${selected ? 'ring-2 ring-white ring-opacity-70 shadow-lg scale-[1.02]' : 'ring-1 ring-gray-700'}
      `}
    >
      <Handle
        type="target"
        position={Position.Left}
        className={`w-2 h-2 border-2 ${selected ? 'border-white' : 'border-gray-600'}`}
        style={{ background: background }}
      />
      <Handle
        type="source"
        position={Position.Right}
        className={`w-2 h-2 border-2 ${selected ? 'border-white' : 'border-gray-600'}`}
        style={{ background: background }}
      />

      <div className="text-white">
        <div className="font-medium">{data.label}</div>
        <div className="text-xs text-gray-300 mt-1">{data.type}</div>
        {data.status && (
          <div className="text-xs mt-1 text-gray-300 opacity-70 truncate max-w-[160px]">
            {data.status}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(CustomGraphNode);
