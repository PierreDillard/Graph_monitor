import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Node, Edge, useNodesState, useEdgesState } from '@xyflow/react';
import { RootState } from '../../../../store';
import { GpacService, gpacService } from '../../../../services/gpacService';
import {
  
    ConnectionStatus,
    GpacMessage,
    GpacCommunicationError,
} from '../../../../services/communication/types/IgpacCommunication';
import { IGpacMessageHandler } from '../../../../services/communication/types/IGpacMessageHandler';
import {
    setSelectedFilterDetails,
    setSelectedNode,
    setLoading,
    setError,
} from '../../../../store/slices/graphSlice';
import {
    selectNodesForGraphMonitor,
    selectEdges,
    selectIsLoading,
    selectError,
} from '../../../../store/selectors/graphSelectors';
import { addSelectedFilter } from '../../../../store/slices/multiFilterSlice';

const useGraphMonitor = () => {
    // Références et états existants préservés
    const dispatch = useDispatch();
    const nodesRef = useRef<Node[]>([]);
    const edgesRef = useRef<Edge[]>([]);
    const renderCount = useRef(0);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [localNodes, setLocalNodes, onNodesChange] = useNodesState<Node>([]);
    const [localEdges, setLocalEdges, onEdgesChange] = useEdgesState([]);

    // Sélecteurs Redux existants
    const nodes = useSelector(selectNodesForGraphMonitor);
    const edges = useSelector(selectEdges);
    const isLoading = useSelector(selectIsLoading);
    const error = useSelector(selectError);
    const monitoredFilters = useSelector(
        (state: RootState) => state.multiFilter.selectedFilters,
    );

    // Intégration de la nouvelle communication
    const service = useMemo(() => gpacService as GpacService, []);
    const communication = useMemo(() => {
        return service.getCommunicationAdapter();
    }, [service]);

    // Fonctions utilitaires existantes préservées
    const updateNodesWithPositions = useCallback((newNodes: Node[]) => {
        return newNodes.map((node) => {
            const existingNode = nodesRef.current.find((n) => n.id === node.id);
            if (existingNode) {
                return {
                    ...node,
                    position: existingNode.position,
                    selected: existingNode.selected,
                    dragging: existingNode.dragging,
                };
            }
            return node;
        });
    }, []);

    const updateEdgesWithState = useCallback((newEdges: Edge[]) => {
        return newEdges.map((edge) => {
            const existingEdge = edgesRef.current.find((e) => e.id === edge.id);
            if (existingEdge) {
                return {
                    ...edge,
                    selected: existingEdge.selected,
                    animated: existingEdge.animated,
                };
            }
            return edge;
        });
    }, []);

    // Handler de message WebSocket intégré à l'architecture
    const messageHandler = useMemo<IGpacMessageHandler>(() => ({
        onMessage(message: GpacMessage) {
            console.log(`[GraphMonitor] Message received #${++renderCount.current}`, message);
        },
        onStatusChange(status: ConnectionStatus) {
            dispatch(setLoading(status === ConnectionStatus.CONNECTING));
        },
        onError(error: GpacCommunicationError) {
            console.error('[GraphMonitor] Error:', error);
            setConnectionError(error.message);
            dispatch(setError(error.message));
        }
    }), [dispatch]);

    // Gestionnaires d'événements existants préservés
    const handleNodesChange = useCallback(
        (changes: any[]) => {
            onNodesChange(changes);
            nodesRef.current = localNodes.map((node) =>
                typeof node === 'object' ? { ...node } : node,
            );
        },
        [localNodes, onNodesChange],
    );

    const handleEdgesChange = useCallback(
        (changes: any[]) => {
            onEdgesChange(changes);
            edgesRef.current = localEdges.map((edge) => ({ ...edge }));
        },
        [localEdges, onEdgesChange],
    );

    const onNodeClick = useCallback(
        (event: React.MouseEvent, node: Node) => {
            const nodeId = node.id;
            const nodeData = node.data;

            dispatch(setSelectedFilterDetails(nodeData));
            service.setCurrentFilterId(parseInt(nodeId));
            service.getFilterDetails(parseInt(nodeId));

            const isAlreadyMonitored = monitoredFilters.some((f) => f.id === nodeId);
            if (!isAlreadyMonitored) {
                dispatch(addSelectedFilter(nodeData));
                service.subscribeToFilter(nodeId);
            }

            dispatch(setSelectedNode(nodeId));
        },
        [dispatch, monitoredFilters],
    );

    // Memoization des données
    const updatedNodes = useMemo(
        () => updateNodesWithPositions(nodes),
        [nodes, updateNodesWithPositions],
    );
    const updatedEdges = useMemo(
        () => updateEdgesWithState(edges),
        [edges, updateEdgesWithState],
    );

    // Effets React existants avec nouvelle intégration
    useEffect(() => {
        if (updatedNodes.length > 0 || updatedEdges.length > 0) {
            setLocalNodes(updatedNodes);
            setLocalEdges(updatedEdges);
            nodesRef.current = updatedNodes;
            edgesRef.current = updatedEdges;
        }
    }, [updatedNodes, updatedEdges, setLocalNodes, setLocalEdges]);

    useEffect(() => {
        const cleanup = communication.registerHandler(messageHandler);
        
        const connectionTimer = setTimeout(() => {
            communication.connect({
                address: 'ws://127.0.0.1:17815/rmt',
                maxReconnectAttempts: 5,
                reconnectDelay: 1000,
                maxDelay: 10000
            });
        }, 1000);

        return () => {
            cleanup();
            clearTimeout(connectionTimer);
            communication.disconnect();
        };
    }, [communication, messageHandler]);

    useEffect(() => {
        if (error) {
            console.error('[GraphMonitor] Error:', error);
            setConnectionError(error);
        }
    }, [error]);

    const retryConnection = useCallback(() => {
        setConnectionError(null);
        communication.connect({
            address: 'ws://127.0.0.1:17815/rmt',
            maxReconnectAttempts: 5,
            reconnectDelay: 1000
        });
    }, [communication]);

    return {
        isLoading,
        connectionError,
        retryConnection,
        localNodes,
        localEdges,
        handleNodesChange,
        handleEdgesChange,
        onNodeClick,
    };
};

export default useGraphMonitor;