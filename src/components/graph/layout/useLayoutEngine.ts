import { useState, useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import { LayoutOptions, LayoutDirection } from '../../../types/graphLayout';
import ELK from 'elkjs/lib/elk.bundled.js';

interface LayoutOptions {
    'elk.algorithm': string;
    'elk.direction'?: LayoutDirection;
    'elk.layered.spacing.nodeNodeBetweenLayers': number;
    'elk.spacing.nodeNode': number;
    'elk.padding': string;
  }
  
  const defaultOptions: LayoutOptions = {
    'elk.algorithm': 'layered',
    'elk.layered.spacing.nodeNodeBetweenLayers': 100,
    'elk.spacing.nodeNode': 80,
    'elk.padding': '[top=50,left=50,bottom=50,right=50]'
  };
  
  export const useLayoutEngine = () => {
    const { getNodes, getEdges, setNodes, fitView } = useReactFlow();
    const [isLayouting, setIsLayouting] = useState(false);
    const elk = new ELK();
  
    const applyLayout = useCallback(async (direction: LayoutDirection) => {
      if (isLayouting) {
        console.warn('Layout calculation already in progress');
        return;
      }
  
      try {
        setIsLayouting(true);
  
        // Préparation des options de layout
        const layoutOptions = {
          ...defaultOptions,
          'elk.direction': direction,
        };
  
        // Préparation du graphe pour ELK
        const nodes = getNodes();
        const edges = getEdges();
  
        const elkNodes = nodes.map(node => ({
          id: node.id,
          width: node.width || 180,
          height: node.height || 60,
          // Ajout des propriétés ELK nécessaires
          layoutOptions: {
            'elk.node.padding': '[top=10,left=10,bottom=10,right=10]'
          }
        }));
  
        const elkEdges = edges.map(edge => ({
          id: edge.id,
          sources: [edge.source],
          targets: [edge.target]
        }));
  
        const elkGraph = {
          id: 'root',
          layoutOptions: layoutOptions,
          children: elkNodes,
          edges: elkEdges
        };
  
        // Calcul du layout avec ELK
        const { children } = await elk.layout(elkGraph);
  
        if (!children) {
          throw new Error('No layout results received from ELK');
        }
  
        // Application des nouvelles positions
        const newNodes = nodes.map(node => {
          const elkNode = children.find(n => n.id === node.id);
          if (!elkNode) return node;
  
          return {
            ...node,
            position: {
              x: elkNode.x || 0,
              y: elkNode.y || 0
            }
          };
        });
  
        // Mise à jour des positions des nœuds
        setNodes(newNodes);
  
        // Ajustement de la vue
        window.requestAnimationFrame(() => {
          fitView({
            padding: 0.2,
            duration: 800,
            animation: {
              easing: 'easeInOutCubic'
            }
          });
        });
  
      } catch (error) {
        console.error('Layout calculation failed:', error);
        // Ici, vous pourriez dispatcher une action Redux pour gérer l'erreur
      } finally {
        setIsLayouting(false);
      }
    }, [getNodes, getEdges, setNodes, fitView]);
  
    return {
      applyLayout,
      isLayouting
    };
  };
  