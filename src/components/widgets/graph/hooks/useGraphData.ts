import { useMemo } from 'react';
import { Node, Edge } from '@xyflow/react';
import { createNodeFromFilter, createEdgesFromFilters } from '../utils/graphOperations';
import { GpacNodeData } from '../../../../types/gpac';

interface UseGraphDataProps {
  filters: GpacNodeData[];
  existingNodes: Node[];
  existingEdges: Edge[];
}

export const useGraphData = ({ filters, existingNodes, existingEdges }: UseGraphDataProps) => {

  const nodes = useMemo(() => {
    return filters.map((filter, index) => 
      createNodeFromFilter(filter, index, existingNodes)
    );
  }, [filters, existingNodes]);

  const edges = useMemo(() => {
    return createEdgesFromFilters(filters, existingEdges).map((edge) => ({
        ...edge,
        label: edge.label || '', 
        style: {
          stroke: edge.style?.stroke || 'blue', 
          strokeWidth: 2,
        },
      }));
    }, [filters, existingEdges]);

  return { nodes, edges };
};
