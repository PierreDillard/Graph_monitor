import React from 'react';
import Graph from '../services/Graph';

interface GraphContextValue {
  graph: Graph | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export const GraphContext = React.createContext<GraphContextValue>({
  graph: null,
  isConnected: false,
  isLoading: true,
  error: null,
});
