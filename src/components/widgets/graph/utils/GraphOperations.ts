import { FilterType, GpacNodeData } from '../../../../types/gpac/model';
import { Node, Edge, MarkerType, Handle, Position} from '@xyflow/react';



const determineFilterType = (
    filterName: string,
    filterType: string,
  ): FilterType => {
    const name = filterName.toLowerCase();
    const type = filterType.toLowerCase();
  
    if (
      name.includes('video') ||
      type.includes('vout') ||
      type.includes('vflip') ||
      type.includes('nvdec')
    ) {
      return 'video';
    }
    if (
      name.includes('audio') ||
      type.includes('aout') ||
      type.includes('aenc')
    ) {
      return 'audio';
    }
    if (name.includes('text') || name.includes('subt') || type.includes('text')) {
      return 'text';
    }
    if (name.includes('image') || type.includes('img')) {
      return 'image';
    }
    return 'other';
  };


const getFilterColor = (filterType: FilterType): string => {
    const colors = {
      video: '#3b82f6',
      audio: '#10b981',
      text: '#f59e0b',
      image: '#8b5cf6',
      other: '#6b7280',
    };
    return colors[filterType];
  };
  
// Create a node from a filter object
 export function createNodeFromFilter(
    filter: GpacNodeData,
    index: number,
    existingNodes: Node[],
  ): Node {
    const existingNode = existingNodes.find(
      (n) => n.id === filter.idx.toString(),
    );
    const filterType = determineFilterType(filter.name, filter.type);
  
    return {
      id: filter.idx.toString(),
      type: 'default',
      data: {
        label: filter.name,
        filterType,
        ...filter,
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      position: existingNode?.position || {
        x: 150 + index * 300, 
        y: 100,
      },
      className: `transition-all duration-200 ${
        existingNode?.selected
          ? 'ring-2 ring-offset-2 ring-blue-500 shadow-lg scale-105'
          : ''
      }`,
      
      selected: existingNode?.selected,
      style: {
        background:
          filter.nb_ipid === 0
            ? '#4ade80'
            : filter.nb_opid === 0
              ? '#ef4444'
              : getFilterColor(filterType),
        color: 'white',
        padding: '10px',
        borderRadius: '8px',
        border: '1px solid #4b5563',
        width: 180,
      },
    };
  }
  
  // Create edges from a list of filters
  export function createEdgesFromFilters(
    filters: GpacNodeData[],
    existingEdges: Edge[],
  ): Edge[] {
    const newEdges: Edge[] = [];
  
    filters.forEach((filter) => {
      if (filter.ipid) {
        Object.entries(filter.ipid).forEach(([pidName, pid]: [string, any]) => {
          if (pid.source_idx !== undefined) {
            const edgeId = `${pid.source_idx}-${filter.idx}-${pidName}`;
 
            const existingEdge = existingEdges.find((e) => e.id === edgeId);
  
            const filterType = determineFilterType(filter.name, filter.type);
            const filterColor = getFilterColor(filterType);
  
      
  
            newEdges.push({
              id: edgeId,
              source: pid.source_idx.toString(),
              target: filter.idx.toString(),
              type: 'simplebezier',
     /*          labelStyle: {
          
                fontFamily: 'sans-serif',
                fontSize: '12px',
                minWidth: '80px',
                color: 'black',
                textAlign: 'center',
                padding: '4px 8px',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                borderRadius: '4px',
                display: 'inline-block'
            },
              label: `${pidName}`, */
              data: {
                filterType,
             
              },
              animated: true,
              style: {
                stroke: filterColor,
                strokeWidth: 2,
                opacity: 0.8,
              },
           
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: filterColor,
              },
              selected: existingEdge?.selected,
            });
          }
        });
      }
    });
  
    return newEdges;
  }
  

  
  