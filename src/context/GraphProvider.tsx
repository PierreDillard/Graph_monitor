/**
 * GraphProvider component is responsible for managing the state and lifecycle of a Graph instance.
 * It provides the Graph instance and connection states to its children via GraphContext.
 *
 * @component
 *
 * @prop {React.ReactNode} children - The child components that will have access to the Graph context.
 *
 * @state {React.RefObject<Graph | null>} graphRef - A reference to the Graph instance.
 * @state {boolean} isConnected - Indicates whether the WebSocket connection is established.
 * @state {boolean} isLoading - Indicates whether the connection is in progress.
 * @state {string | null} error - Contains an error message if the connection fails.
 *
 * @useEffect
 * - On mount:
 *   - Creates a Graph instance with specified options.
 *   - Sets up handlers for 'connected', 'disconnected', 'error', and 'loading' events.
 *   - Establishes the connection by calling graph.connect().
 * - On unmount:
 *   - Disconnects the WebSocket and removes event listeners.
 *
 * @returns {JSX.Element} The provider component that supplies the Graph instance and connection states to its children.
 */


import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { GraphContext } from './GraphContext';
import Graph from '../services/Graph';

interface GraphProviderProps {
  children: React.ReactNode;
}

const GraphProvider: React.FC<GraphProviderProps> = ({ children }) => {
  const [graph] = useState(() => new Graph({
    type: 'websocket',
    address: 'ws://127.0.0.1:17815/rmt'
  }));

  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Connection state management
  const handleConnected = useCallback(() => {
    console.log('🟢 GraphProvider: Connected to GPAC');
    setIsConnected(true);
    setIsLoading(false);
    setError(null);
  }, []);

  const handleDisconnected = useCallback(() => {
    console.log('🔴 GraphProvider: Disconnected from GPAC');
    setIsConnected(false);
    setError('Disconnected from GPAC');
    setIsLoading(false);
  }, []);

  const handleError = useCallback((err: string | null) => {
    console.error('❌ GraphProvider: Connection error:', err);
    setError(err);
    setIsConnected(false);
    setIsLoading(false);
  }, []);

  const handleLoading = useCallback((loading: boolean) => {
    console.log(`⏳ GraphProvider: Loading state changed to ${loading}`);
    setIsLoading(loading);
  }, []);

  // Context value memoization
  const contextValue = useMemo(() => ({
    graph,
    isConnected,
    isLoading,
    error
  }), [graph, isConnected, isLoading, error]);

  // Event listeners setup
  useEffect(() => {
    console.log('🔄 GraphProvider: Setting up event listeners');
    
    graph.on('connected', handleConnected);
    graph.on('disconnected', handleDisconnected);
    graph.on('error', handleError);
    graph.on('loading', handleLoading);

    // Attempt initial connection
    graph.connect();

    // Cleanup
    return () => {
      console.log('🧹 GraphProvider: Cleaning up event listeners');
      graph.disconnect();
      graph.removeListener('connected', handleConnected);
      graph.removeListener('disconnected', handleDisconnected);
      graph.removeListener('error', handleError);
      graph.removeListener('loading', handleLoading);
    };
  }, [graph, handleConnected, handleDisconnected, handleError, handleLoading]);

  // Debug logging for state changes
  useEffect(() => {
    console.log('📊 GraphProvider State:', {
      isConnected,
      isLoading,
      error,
      hasGraph: !!graph
    });
  }, [isConnected, isLoading, error, graph]);

  return (
    <GraphContext.Provider value={contextValue}>
      {children}
    </GraphContext.Provider>
  );
};

export default GraphProvider;