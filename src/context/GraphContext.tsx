// src/context/GraphContext.tsx
import React, { createContext} from 'react';
import Graph from '../services/Graph';

interface GraphContextValue {
  graph: Graph | null;
}
console.log('GraphContextValue', Graph);

// On crée un contexte avec une valeur par défaut (graph: null)
export const GraphContext = createContext<GraphContextValue>({ graph: null });
