export interface LayoutConfig {
    nodeSpacing: number;
    rankSpacing: number;
    padding: number;
    edgeEdgeSpacing: number;
    edgeNodeSpacing: number;
    componentSpacing: number;
  }
  
  export const defaultLayoutConfig: LayoutConfig = {
    nodeSpacing: 150,
    rankSpacing: 100,
    padding: 50,
    edgeEdgeSpacing: 30,
    edgeNodeSpacing: 50,
    componentSpacing: 100
  };
  
  export const getElkLayoutOptions = (config: LayoutConfig) => ({
    'elk.spacing.nodeNode': config.nodeSpacing,
    'elk.layered.spacing': config.rankSpacing,
    'elk.padding': config.padding,
    'elk.layered.spacing.edgeEdge': config.edgeEdgeSpacing,
    'elk.layered.spacing.edgeNode': config.edgeNodeSpacing,
    'elk.spacing.componentComponent': config.componentSpacing,
    'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
    'elk.layered.spacing.baseValue': 50,
    'elk.spacing.individual':50
  });