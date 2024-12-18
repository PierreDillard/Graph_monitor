import { GpacNodeData , FilterType} from "../../../../types/gpac"; 
import { Node, Edge, Position } from "@xyflow/react";


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
  

 export function createNodeFromFilter(
    filter: GpacNodeData,
    index: number,
    existingNodes: Node[],
  ): Node {
    const existingNode = existingNodes.find(
      (n) => n.id === filter.idx.toString(),
    );
    const position = existingNode?.position || calculateDefaultPosition(index);
    const sanitizedPosition = {
      x: Number.isFinite(position.x) ? position.x : index * 300,
      y: Number.isFinite(position.y) ? position.y : 100
    };
    const filterType = determineFilterType(filter.name, filter.type);
  
    return {
      id: filter.idx.toString(),
      type: 'default',
      data: {
        label: filter.name,
        filterType,
        ...filter,
      },
      position:  sanitizedPosition,
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
  
  export function createEdgesFromFilters(
filters: GpacNodeData[], existingEdges: Edge[], nodes?: unknown,
  ): Edge[] {
    const edgeMap = new Map<string, Edge>();

    existingEdges.forEach(edge => {
      if (edge.source && edge.target) {
        edgeMap.set(`${edge.source}-${edge.target}`, edge);
      }
    });
  
    return filters.flatMap(filter => 
      Object.entries(filter.ipid || {}).flatMap(([pidName, pid]: [string, any]) => {
        if (!isValidSourceIndex(pid.source_idx)) return [];
  
        const sourceId = String(pid.source_idx);
        const targetId = String(filter.idx);
        const edgeId = `${sourceId}-${targetId}-${pidName}`;
        
        // Validation et conversion des coordonnées
        const coordinates = computeEdgeCoordinates({
          source: sourceId,
          target: targetId,
          existingEdge: edgeMap.get(`${sourceId}-${targetId}`)
        });
  
        if (!coordinates) return [];
  
        return [{
          id: edgeId,
          source: sourceId,
          target: targetId,
          type: 'simplebezier',
          ...coordinates,
          style: {
            stroke: getFilterColor(determineFilterType(filter.name, filter.type)),
            strokeWidth: 2,
          }
        }];
      })
    );
  }
  
  function isValidSourceIndex(index: unknown): boolean {
    return typeof index === 'number' && Number.isFinite(index);
  }
  
  function computeEdgeCoordinates(params: {
    source: string;
    target: string;
    existingEdge?: Edge;
  }): { sourcePosition: Position; targetPosition: Position } | null {

    try {

      return {
        sourcePosition: Position.Right,
        targetPosition: Position.Left
      };
    } catch (error) {
      console.error('Edge coordinate computation failed:', error);
      return null;
    }
  }
export  const sanitizeNodePosition = (pos: unknown): { x: number, y: number } => {
    if (typeof pos === 'object' && pos !== null && 'x' in pos && 'y' in pos) {
      return {
        x: typeof pos.x === 'number' ? pos.x : 0,
        y: typeof pos.y === 'number' ? pos.y : 0
      };
    }
    return { x: 0, y: 0 };
  };

 export function calculateDefaultPosition(index: number): { x: number, y: number } {
    return {
      x: 150 + (index * 300), // Espacement horizontal
      y: 100 + (Math.floor(index / 3) * 200) // Distribution verticale
    };
  }