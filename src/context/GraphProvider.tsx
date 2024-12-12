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
import React, { useEffect, useRef, useState, useCallback } from 'react';
import Graph from '../services/Graph';
import { GraphContext } from './GraphContext';

interface GraphProviderProps {
  children: React.ReactNode;
}

interface ConnectionState {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

const GraphProvider: React.FC<GraphProviderProps> = ({ children }) => {
  const graphRef = useRef<Graph | null>(null);
  const mountedRef = useRef(true);
  const initializationAttemptedRef = useRef(false);

  const [state, setState] = useState<ConnectionState>({
    isConnected: false,
    isLoading: true,
    error: null
  });

  // Gestionnaire de connexion isolé
  const handleConnection = useCallback(() => {
    if (!mountedRef.current || initializationAttemptedRef.current) return;
    
    console.log('🚀 [GraphProvider] Starting connection sequence');
    initializationAttemptedRef.current = true;

    try {
      if (!graphRef.current) {
        console.log('📡 [GraphProvider] Creating graph instance');
        graphRef.current = new Graph({
          type: 'websocket',
          address: 'ws://127.0.0.1:17815/rmt'
        });

        const graph = graphRef.current;

        // Configuration des handlers
        const handleConnected = () => {
          if (!mountedRef.current) return;
          console.log('✅ [GraphProvider] Connection established');
          setState(prev => ({
            ...prev,
            isConnected: true,
            isLoading: false,
            error: null
          }));
        };

        const handleDisconnected = () => {
          if (!mountedRef.current) return;
          console.log('❌ [GraphProvider] Disconnected from GPAC');
          setState(prev => ({
            ...prev,
            isConnected: false,
            error: 'Disconnected from GPAC'
          }));
        };

        graph.on('connected', handleConnected);
        graph.on('disconnected', handleDisconnected);
        graph.on('error', err => {
          if (!mountedRef.current) return;
          console.error('🔥 [GraphProvider] Error:', err);
          setState(prev => ({
            ...prev,
            error: err ? err.toString() : 'Unknown error',
            isConnected: false,
            isLoading: false
          }));
        });

        // Connexion initiale
        console.log('🔌 [GraphProvider] Initiating connection');
        graph.connect();
      }
    } catch (error) {
      console.error('💥 [GraphProvider] Initialization error:', error);
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Failed to initialize graph',
          isLoading: false
        }));
      }
    }
  }, []); // Pas de dépendances pour éviter les re-renders

  // Effet d'initialisation unique
  useEffect(() => {
    mountedRef.current = true;
    console.log('🎯 [GraphProvider] Component mounted');

    // Initier la connexion immédiatement
    handleConnection();

    return () => {
      console.log('🧹 [GraphProvider] Starting cleanup...');
      mountedRef.current = false;
      initializationAttemptedRef.current = false;

      if (graphRef.current) {
        console.log('📴 [GraphProvider] Disconnecting graph...');
        graphRef.current.disconnect();
        graphRef.current.removeAllListeners();
        graphRef.current = null;
      }
    };
  }, [handleConnection]); // Ajouter handleConnection comme dépendance

  // Debug logs
  useEffect(() => {
    console.log('📊 [GraphProvider] State updated:', {
      isConnected: state.isConnected,
      isLoading: state.isLoading,
      error: state.error,
      hasGraph: !!graphRef.current
    });
  }, [state]);

  return (
    <GraphContext.Provider
      value={{
        graph: graphRef.current,
        isConnected: state.isConnected,
        isLoading: state.isLoading,
        error: state.error
      }}
    >
      {children}
    </GraphContext.Provider>
  );
};

export default GraphProvider;