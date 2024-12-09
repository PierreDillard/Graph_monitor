import { Node, Edge } from '@xyflow/react';
import { GraphState } from './types';
import { gpacWebSocket } from '../../services/gpacWebSocket';

export class Graph {
  private static instance: Graph | null = null;
  private state: GraphState;
  private subscribers: Set<(state: GraphState) => void>;

  private constructor() {
    this.state = {
      nodes: {},
      edges: {},
      selectedNodeId: null,
      isProcessing: false,
      error: null
    };
    this.subscribers = new Set();
  }

  static getInstance(): Graph {
    if (!Graph.instance) {
      Graph.instance = new Graph();
    }
    return Graph.instance;
  }

  public async connect(): Promise<void> {
    try {
      this.state.isProcessing = true;
      this.notify();
      
      // Utiliser gpacWebSocket pour établir la connexion
      await gpacWebSocket.connect();
    } catch (error) {
      this.state.error = error instanceof Error ? error.message : 'Connection failed';
      this.notify();
    } finally {
      this.state.isProcessing = false;
      this.notify();
    }
  }

  public disconnect(): void {
    gpacWebSocket.disconnect();
  }

  private notify(): void {
    this.subscribers.forEach(cb => cb(this.state));
  }

  public subscribe(callback: (state: GraphState) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  public async addNode(node: Node): Promise<void> {
    try {
      this.state.isProcessing = true;
      this.notify();

      if (node.id) {
        this.state.nodes[node.id] = node;
        await this.recalculateGraph();
      }

    } catch (error: any) {
      this.state.error = error?.message || 'Unknown error';
    } finally {
      this.state.isProcessing = false;
      this.notify();
    }
  }

  public async removeNode(nodeId: string): Promise<void> {
    if (!this.state.nodes[nodeId]) return;

    try {
      this.state.isProcessing = true;
      this.notify();

      delete this.state.nodes[nodeId];

      // Delete all edges connected to this node
      const edgeEntries = Object.entries(this.state.edges);
      edgeEntries.forEach(([edgeId, edge]) => {
        if (edge.source === nodeId || edge.target === nodeId) {
          delete this.state.edges[edgeId];
        }
      });

      await this.recalculateGraph();

    } catch (error: any) {
      this.state.error = error?.message || 'Unknown error';
    } finally {
      this.state.isProcessing = false;
      this.notify();
    }
  }

  public async addEdge(edge: Edge): Promise<void> {
    if (!edge.id || !edge.source || !edge.target) return;
    
    // Basic validation
    if (!this.state.nodes[edge.source] || !this.state.nodes[edge.target]) {
      return;
    }

    try {
      this.state.isProcessing = true;
      this.notify();

      this.state.edges[edge.id] = edge;
      await this.recalculateGraph();

    } catch (error: any) {
      this.state.error = error?.message || 'Unknown error';
    } finally {
      this.state.isProcessing = false;
      this.notify();
    }
  }

  private async recalculateGraph(): Promise<void> {
    // Ici on appellerait gpacWebSocket.recalculate()
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  public getNodes(): Node[] {
    return Object.values(this.state.nodes);
  }

  public getEdges(): Edge[] {
    return Object.values(this.state.edges);
  }

  public isLoading(): boolean {
    return this.state.isProcessing;
  }

  public getError(): string | null {
    return this.state.error;
  }

  public getSelectedNodeId(): string | null {
    return this.state.selectedNodeId;
  }

  public setSelectedNodeId(nodeId: string | null): void {
    this.state.selectedNodeId = nodeId;
    this.notify();
  }
}