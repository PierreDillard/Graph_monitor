import { useState, useCallback } from "react";
import { LayoutService } from "../services/layoutService";
import { LayoutOptions, LayoutNode, LayoutEdge } from "../types/layout";


    const defaultOptions: LayoutOptions = {
        direction: 'TB',
        nodeSpacing: 150,
        rankSpacing: 100,
        animate: true,
      
      };
      
      export const useGraphLayout = () => {
        const [isCalculating, setIsCalculating] = useState(false);
        const layoutService = new LayoutService();
      
        const applyLayout = useCallback(async (
          nodes: LayoutNode[],
          edges: LayoutEdge[],
          options: Partial<LayoutOptions> = {}
        ) => {
          setIsCalculating(true);
          
          try {
            const layout = await layoutService.calculateLayout(
              nodes,
              edges,
              { ...defaultOptions, ...options }
            );
            
            if (!layout) return null;
      
            // Transform the layout result into React Flow format
            const newNodes = layout.children?.map(node => ({
              id: node.id,
              position: { 
                x: node.x || 0, 
                y: node.y || 0 
              }
            }));
      
            return newNodes;
          } catch (error) {
            console.error('Layout calculation failed:', error);
            return null;
          } finally {
            setIsCalculating(false);
          }
        }, []);
      
        return {
          applyLayout,
          isCalculating
        };
      };