

type Listener<T = any> = (data: T) => void;
type UnsubscribeFn = () => void;

export class EventEmitter<Events extends Record<string, any>> {
  private listeners: Map<keyof Events, Set<Listener<Events[keyof Events]>>> = new Map();

  protected emit<K extends keyof Events>(event: K, data?: Events[K]): void {
    const listeners = this.listeners.get(event);
    if (!listeners) return;
    
    listeners.forEach(listener => {
      try {
        listener(data as Events[K]);
      } catch (error) {
        console.error(`Error in event listener for ${String(event)}:`, error);
      }
    });
  }

  public subscribe<K extends keyof Events>(
    event: K, 
    listener: Listener<Events[K]>
  ): UnsubscribeFn {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const listeners = this.listeners.get(event)!;
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  public unsubscribe<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  public unsubscribeAll(): void {
    this.listeners.clear();
  }
}