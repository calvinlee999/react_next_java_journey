/**
 * Event Bus for inter-micro-frontend communication
 * Provides a pub/sub mechanism for loose coupling between micro-frontends
 */

type EventCallback = (data: any) => void;

class MicroFrontendEventBus {
  private events: Map<string, EventCallback[]> = new Map();

  /**
   * Subscribe to an event
   */
  subscribe(eventName: string, callback: EventCallback): void {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }
    this.events.get(eventName)?.push(callback);
  }

  /**
   * Unsubscribe from an event
   */
  unsubscribe(eventName: string, callback?: EventCallback): void {
    if (!this.events.has(eventName)) return;

    if (callback) {
      const callbacks = this.events.get(eventName) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    } else {
      // Remove all callbacks for this event
      this.events.delete(eventName);
    }
  }

  /**
   * Emit an event to all subscribers
   */
  emit(eventName: string, data?: any): void {
    const callbacks = this.events.get(eventName);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event callback for ${eventName}:`, error);
        }
      });
    }
  }

  /**
   * Emit an event with a delay
   */
  emitAsync(eventName: string, data?: any, delay: number = 0): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        this.emit(eventName, data);
        resolve();
      }, delay);
    });
  }

  /**
   * Get all event names
   */
  getEventNames(): string[] {
    return Array.from(this.events.keys());
  }

  /**
   * Get subscriber count for an event
   */
  getSubscriberCount(eventName: string): number {
    return this.events.get(eventName)?.length || 0;
  }

  /**
   * Clear all events and subscribers
   */
  clear(): void {
    this.events.clear();
  }
}

// Global singleton instance
export const EventBus = new MicroFrontendEventBus();

// Export types for TypeScript support
export type { EventCallback };
export { MicroFrontendEventBus };

// Global event types for better TypeScript support
export interface GlobalEvents {
  navigate: { route: string };
  'health-update': { mfId: string; status: 'healthy' | 'degraded' | 'unhealthy' };
  notification: {
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    duration?: number;
  };
  'user-authenticated': { userId: string; token: string };
  'user-logout': void;
  'theme-changed': { theme: 'light' | 'dark' };
  'micro-frontend-loaded': { mfId: string; version: string };
  'micro-frontend-error': { mfId: string; error: string };
}

// Type-safe event emission
export function emitTypedEvent<K extends keyof GlobalEvents>(
  eventName: K,
  data: GlobalEvents[K]
): void {
  EventBus.emit(eventName, data);
}

// Type-safe event subscription
export function subscribeToTypedEvent<K extends keyof GlobalEvents>(
  eventName: K,
  callback: (data: GlobalEvents[K]) => void
): void {
  EventBus.subscribe(eventName, callback);
}
