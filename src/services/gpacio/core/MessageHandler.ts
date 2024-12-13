
import { GPACMessage, GPACMessageType } from '../types/message.types';

type MessageCallback = (payload: unknown) => void;

export class MessageHandler {
  private handlers: Map<GPACMessageType, Set<MessageCallback>>;

  constructor() {
    this.handlers = new Map();
  }

  public registerHandler(
    type: GPACMessageType,
    handler: MessageCallback
  ): () => void {
    const handlers = this.handlers.get(type) || new Set();
    handlers.add(handler);
    this.handlers.set(type, handlers);

    return () => this.unregisterHandler(type, handler);
  }

  public handleMessage(message: GPACMessage): void {
    const handlers = this.handlers.get(message.type);
    handlers?.forEach(handler => handler(message.payload));
  }

  private unregisterHandler(
    type: GPACMessageType,
    handler: MessageCallback
  ): void {
    const handlers = this.handlers.get(type);
    handlers?.delete(handler);
    if (handlers?.size === 0) {
      this.handlers.delete(type);
    }
  }
}