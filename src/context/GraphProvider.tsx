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
import React, { useEffect, useRef, useState } from 'react';
import Graph from '../services/Graph';
import { GraphContext } from './GraphContext';




interface GraphProviderProps {
  children: React.ReactNode;
}

const GraphProvider: React.FC<GraphProviderProps> = ({ children }) => {
  const graphRef = useRef<Graph | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create a new Graph instance
    graphRef.current = new Graph({ type: 'websocket', address: 'ws://127.0.0.1:17815/rmt' });
    const graph = graphRef.current;

    const handleConnected = () => {
      console.log('GraphProvider: Graph connected');
      setIsConnected(true);
      setIsLoading(false);
      setError(null);
    };

    const handleDisconnected = () => {
      console.log('GraphProvider: Graph disconnected');
      setIsConnected(false);
      setError('Disconnected from GPAC');
      setIsLoading(false);
    };

    const handleError = (err: string | null) => {
      console.error('GraphProvider: Graph connection error:', err);
      setError(err);
      setIsConnected(false);
      setIsLoading(false);
    };

    const handleLoading = (loading: boolean) => {
      console.log(`GraphProvider: Loading state changed to ${loading}`);
      setIsLoading(loading);
    };

    // listeners
    graph.on('connected', handleConnected);
    graph.on('disconnected', handleDisconnected);
    graph.on('error', handleError);
    graph.on('loading', handleLoading);

   
    graph.connect();

    // Clean up
    return () => {
      graph.disconnect();
      graph.removeListener('connected', handleConnected);
      graph.removeListener('disconnected', handleDisconnected);
      graph.removeListener('error', handleError);
      graph.removeListener('loading', handleLoading);
    };
  }, []);

  return (
    <GraphContext.Provider value={{ graph: graphRef.current, isConnected, isLoading, error }}>
      {children}
    </GraphContext.Provider>
  );
};

export default GraphProvider;
