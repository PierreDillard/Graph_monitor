import { memo } from 'react';
import { EdgeProps, BaseEdge, EdgeLabelRenderer, Position } from '@xyflow/react';
import { EdgeData } from '../types/gpac/model';

interface CustomEdgeProps extends EdgeProps {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  style?: React.CSSProperties;
  data: EdgeData;
  markerEnd?: string;
}

const CustomEdge = memo(({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  data,
  ...props
}: CustomEdgeProps) => {

  if (!data?.labelData) return null;

  return (
    <>
      <BaseEdge
        path={`M ${sourceX},${sourceY} L ${targetX},${targetY}`}
        style={style}
        markerEnd={markerEnd}
        {...props}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${(sourceX + targetX) / 2}px, ${(sourceY + targetY) / 2}px)`,
            pointerEvents: 'none',
          }}
          className="nodrag nopan bg-gray-900/75 px-2 py-1 rounded text-xs"
        >
          {data.labelData.text}
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

CustomEdge.displayName = 'CustomEdge';

export default CustomEdge;