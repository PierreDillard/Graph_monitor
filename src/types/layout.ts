export interface LayoutOptions {
    direction: 'TB' | 'LR';  // Top-to-Bottom or Left-to-Right
    nodeSpacing: number;    
    rankSpacing: number;    
    animate: boolean;      
  }
  
  export interface LayoutNode {
    id: string;
    width: number;
    height: number;
    position?: { x: number, y: number };
  }
  
  export interface LayoutEdge {
    id: string;
    source: string;
    target: string;
  }

  