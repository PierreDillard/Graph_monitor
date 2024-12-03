
import ELK from 'elkjs/lib/elk.bundled';
import { LayoutOptions, LayoutNode, LayoutEdge } from '../types/layout';
import { defaultLayoutConfig, getElkLayoutOptions } from '../config/layoutConfig';

export class LayoutService {
  private elk: ELK;
  
  constructor() {
    this.elk = new ELK();
  }

  async calculateLayout(
    nodes: LayoutNode[],
    edges: LayoutEdge[],
    options: LayoutOptions,
    layoutConfig = defaultLayoutConfig
  ) {
    const graph = {
      id: 'root',
      layoutOptions: {
        'elk.direction': options.direction,
        ...getElkLayoutOptions(layoutConfig)
      },
      children: nodes.map(node => ({
        id: node.id,
        width: node.width,
        height: node.height
      })),
      edges: edges.map(edge => ({
        id: edge.id,
        sources: [edge.source],
        targets: [edge.target]
      }))
    };

    try {
      const layout = await this.elk.layout(graph);
      return layout;
    } catch (error) {
      console.error('Layout calculation error:', error);
      return null;
    }
  }
}