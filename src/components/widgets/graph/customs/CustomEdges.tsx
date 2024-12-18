import React from 'react';
import { getBezierPath, EdgeLabelRenderer, EdgeProps } from '@xyflow/react';

interface CustomEdgeProps extends EdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  label: React.ReactNode;
  style?: React.CSSProperties;
}

const CustomEdge: React.FC<CustomEdgeProps> = React.memo(
    ({ id, sourceX, sourceY, targetX, targetY, label, style, data  }) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  return (
    <>
      <path
        id={id}
        d={edgePath}
        style={style}
        className="react-flow__edge-path"
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%)`,
            left: labelX,
            top: labelY,
            pointerEvents: 'none',
          }}
          className="react-flow__edge-label"
        >
          {label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

export default CustomEdge;
