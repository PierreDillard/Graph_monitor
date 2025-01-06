import { Node, Edge } from '@xyflow/react';
import { GpacNodeData, PIDData, FilterType } from '../types/gpac/model';

export class Graph {
  private filters: GpacNodeData[] = [];
  private nodes: Node[] = [];
  private edges: Edge[] = [];
  private selectedNodeId: string | null = null;
  private selectedFilterDetails: GpacNodeData | null = null;

  // Access methods
  public getFilters(): GpacNodeData[] {
    return this.filters;
  }

  public getNodes(): Node[] {
    return this.nodes;
  }

  public getEdges(): Edge[] {
    return this.edges;
  }

  public getSelectedNodeId(): string | null {
    return this.selectedNodeId;
  }

  // Graph manipulation methods
  private determineFilterType(
    filterName: string,
    filterType: string,
  ): FilterType {
    const name = filterName.toLowerCase();
    const type = filterType.toLowerCase();

    if (
      name.includes('video') ||
      type.includes('vout') ||
      type.includes('vflip')
    ) {
      return 'video';
    }
    if (name.includes('audio') || type.includes('aout')) {
      return 'audio';
    }
    if (name.includes('text') || name.includes('subt')) {
      return 'text';
    }
    if (name.includes('image')) {
      return 'image';
    }
    return 'other';
  }

  private getFilterColor(filterType: FilterType): string {
    const colors = {
      video: '#3b82f6',
      audio: '#10b981',
      text: '#f59e0b',
      image: '#8b5cf6',
      other: '#6b7280',
    };
    return colors[filterType];
  }

  private createNodeFromFilter(filter: GpacNodeData, index: number): Node {
    const filterType = this.determineFilterType(filter.name, filter.type);

    return {
      id: filter.idx.toString(),
      type: 'default',
      data: {
        label: filter.name,
        filterType,
        ...filter,
      },
      position: {
        x: 150 + (index % 3) * 300,
        y: 100 + Math.floor(index / 3) * 200,
      },
      style: {
        background:
          filter.nb_ipid === 0
            ? '#4ade80'
            : filter.nb_opid === 0
              ? '#ef4444'
              : this.getFilterColor(filterType),
        color: 'white',
        padding: '10px',
        borderRadius: '8px',
        border: '1px solid #4b5563',
        width: 180,
      },
    };
  }

  private createEdgesFromFilters(filters: GpacNodeData[]): Edge[] {
    const newEdges: Edge[] = [];

    filters.forEach((filter) => {
      if (filter.ipid) {
        Object.entries(filter.ipid).forEach(
          ([pidName, pid]: [string, PIDData]) => {
            if (pid.source_idx !== undefined) {
              const filterType = this.determineFilterType(
                filter.name,
                filter.type,
              );
              const filterColor = this.getFilterColor(filterType);

              const bufferPercentage =
                pid.buffer_total > 0
                  ? Math.round((pid.buffer / pid.buffer_total) * 100)
                  : 0;

              newEdges.push({
                id: `${pid.source_idx}-${filter.idx}-${pidName}`,
                source: pid.source_idx.toString(),
                target: filter.idx.toString(),
                type: 'simplebezier',
                label: `${pidName} (${bufferPercentage}%)`,
                data: { filterType, bufferPercentage, pidName },
                animated: true,
                style: {
                  stroke: filterColor,
                  strokeWidth: 2,
                  opacity: 0.8,
                },
              });
            }
          },
        );
      }
    });

    return newEdges;
  }

  // Public update methods
  public updateGraphData(newFilters: GpacNodeData[]): void {
    this.filters = newFilters;
    this.nodes = newFilters.map((f, i) => this.createNodeFromFilter(f, i));
    this.edges = this.createEdgesFromFilters(newFilters);
  }

  public selectNode(nodeId: string): void {
    this.selectedNodeId = nodeId;
  }

  public updateNodePositions(updatedNodes: Node[]): void {
    this.nodes = this.nodes.map((node) => {
      const updatedNode = updatedNodes.find((n) => n.id === node.id);
      return updatedNode ? { ...node, position: updatedNode.position } : node;
    });
  }

  // Filter details management methods
  public setFilterDetails(filterDetails: GpacNodeData | null): void {
    this.selectedFilterDetails = filterDetails;

    // If there are filter details, also update the corresponding node
    if (filterDetails) {
      const nodeIndex = this.nodes.findIndex(
        (node) => node.id === filterDetails.idx.toString(),
      );
      if (nodeIndex !== -1) {
        this.nodes[nodeIndex] = {
          ...this.nodes[nodeIndex],
          data: {
            ...this.nodes[nodeIndex].data,
            ...filterDetails,
          },
        };
      }
    }
  }

  public getFilterDetails(): GpacNodeData | null {
    return this.selectedFilterDetails;
  }

  public clearFilterDetails(): void {
    this.selectedFilterDetails = null;
  }

  public getFilterById(id: string): GpacNodeData | undefined {
    return this.filters.find((filter) => filter.idx.toString() === id);
  }
}

export const createGraph = (): Graph => new Graph();
