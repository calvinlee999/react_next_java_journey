/**
 * Service Worker Registration and Management Utilities
 * Provides client-side interface for Service Worker features
 */

// Service Worker message types
export const SW_MESSAGE_TYPES = {
  CACHE_UPDATE: 'CACHE_UPDATE',
  CACHE_DELETE: 'CACHE_DELETE',
  CACHE_CLEAR: 'CACHE_CLEAR',
  GET_CACHE_INFO: 'GET_CACHE_INFO'
} as const;

// Type definitions
type MessagePayload = Record<string, unknown>;
type CacheData = Record<string, unknown> | string | number | boolean | null;

// Service Worker registration state
interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  registration: ServiceWorkerRegistration | null;
  isOnline: boolean;
  cacheInfo: CacheInfo | null;
}

interface CacheInfo {
  [cacheType: string]: {
    name: string;
    count: number;
    urls: string[];
  };
}

// Extended Service Worker Registration for background sync
interface ExtendedServiceWorkerRegistration extends ServiceWorkerRegistration {
  sync?: {
    register(tag: string): Promise<void>;
  };
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private readonly updateCallbacks: ((registration: ServiceWorkerRegistration) => void)[] = [];
  private readonly onlineCallbacks: ((isOnline: boolean) => void)[] = [];

  /**
   * Register Service Worker
   */
  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) {
      console.warn('Service Workers are not supported in this browser');
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered successfully');

      // Listen for updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, notify user
              this.notifyUpdate();
            }
          });
        }
      });

      // Listen for controlling worker change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Page will reload when new service worker takes control
        window.location.reload();
      });

      // Setup online/offline listeners
      this.setupOnlineListeners();

      return this.registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }

  /**
   * Check if Service Workers are supported
   */
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'caches' in window;
  }

  /**
   * Check if Service Worker is registered
   */
  isRegistered(): boolean {
    return this.registration !== null;
  }

  /**
   * Unregister Service Worker
   */
  async unregister(): Promise<boolean> {
    if (this.registration) {
      const success = await this.registration.unregister();
      if (success) {
        this.registration = null;
        console.log('Service Worker unregistered');
      }
      return success;
    }
    return false;
  }

  /**
   * Update Service Worker
   */
  async update(): Promise<void> {
    if (this.registration) {
      await this.registration.update();
    }
  }

  /**
   * Skip waiting and activate new Service Worker
   */
  async skipWaiting(): Promise<void> {
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  /**
   * Send message to Service Worker
   */
  async sendMessage<T = unknown>(type: string, payload?: MessagePayload): Promise<T | null> {
    if (!this.registration?.active) {
      console.warn('No active Service Worker to send message to');
      return null;
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };

      this.registration!.active!.postMessage(
        { type, payload },
        [messageChannel.port2]
      );

      // Timeout after 5 seconds
      setTimeout(() => resolve(null), 5000);
    });
  }

  /**
   * Update cache with new data
   */
  async updateCache(url: string, data: CacheData, cacheName?: string): Promise<void> {
    await this.sendMessage(SW_MESSAGE_TYPES.CACHE_UPDATE, {
      url,
      data,
      cacheName
    });
  }

  /**
   * Delete from cache
   */
  async deleteFromCache(url: string, cacheName?: string): Promise<void> {
    await this.sendMessage(SW_MESSAGE_TYPES.CACHE_DELETE, {
      url,
      cacheName
    });
  }

  /**
   * Clear cache
   */
  async clearCache(cacheName?: string): Promise<void> {
    await this.sendMessage(SW_MESSAGE_TYPES.CACHE_CLEAR, {
      cacheName
    });
  }

  /**
   * Get cache information
   */
  async getCacheInfo(): Promise<CacheInfo | null> {
    return this.sendMessage<CacheInfo>(SW_MESSAGE_TYPES.GET_CACHE_INFO);
  }

  /**
   * Register for cache available event
   */
  async requestPersistentStorage(): Promise<boolean> {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      try {
        const granted = await navigator.storage.persist();
        console.log('Persistent storage:', granted ? 'granted' : 'denied');
        return granted;
      } catch (error) {
        console.error('Persistent storage request failed:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Get storage estimate
   */
  async getStorageEstimate(): Promise<StorageEstimate | null> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        return await navigator.storage.estimate();
      } catch (error) {
        console.error('Storage estimate failed:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Setup online/offline event listeners
   */
  private setupOnlineListeners(): void {
    const handleOnline = () => {
      console.log('Connection restored');
      this.onlineCallbacks.forEach(callback => callback(true));
      
      // Trigger background sync if supported
      const extendedRegistration = this.registration as ExtendedServiceWorkerRegistration;
      if (extendedRegistration?.sync) {
        extendedRegistration.sync.register('api-sync').catch(console.error);
      }
    };

    const handleOffline = () => {
      console.log('Connection lost');
      this.onlineCallbacks.forEach(callback => callback(false));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }

  /**
   * Notify about Service Worker update
   */
  private notifyUpdate(): void {
    this.updateCallbacks.forEach(callback => {
      if (this.registration) {
        callback(this.registration);
      }
    });
  }

  /**
   * Subscribe to Service Worker updates
   */
  onUpdate(callback: (registration: ServiceWorkerRegistration) => void): () => void {
    this.updateCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.updateCallbacks.indexOf(callback);
      if (index > -1) {
        this.updateCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to online/offline status changes
   */
  onOnlineChange(callback: (isOnline: boolean) => void): () => void {
    this.onlineCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.onlineCallbacks.indexOf(callback);
      if (index > -1) {
        this.onlineCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get current online status
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Get Service Worker state
   */
  getState(): ServiceWorkerState {
    return {
      isSupported: this.isSupported(),
      isRegistered: this.isRegistered(),
      registration: this.registration,
      isOnline: this.isOnline(),
      cacheInfo: null // Would be populated by getCacheInfo()
    };
  }
}

// Singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();

/**
 * React Hook for Service Worker management
 */
import { useState, useEffect } from 'react';

export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>(() => 
    serviceWorkerManager.getState()
  );
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Register Service Worker
    serviceWorkerManager.register();

    // Subscribe to updates
    const unsubscribeUpdate = serviceWorkerManager.onUpdate(() => {
      setUpdateAvailable(true);
      setState(serviceWorkerManager.getState());
    });

    // Subscribe to online changes
    const unsubscribeOnline = serviceWorkerManager.onOnlineChange((isOnline) => {
      setState(prev => ({ ...prev, isOnline }));
    });

    // Update cache info periodically
    const updateCacheInfo = async () => {
      const cacheInfo = await serviceWorkerManager.getCacheInfo();
      setState(prev => ({ ...prev, cacheInfo }));
    };

    updateCacheInfo();
    const interval = setInterval(updateCacheInfo, 30000); // Every 30 seconds

    return () => {
      unsubscribeUpdate();
      unsubscribeOnline();
      clearInterval(interval);
    };
  }, []);

  const applyUpdate = async () => {
    await serviceWorkerManager.skipWaiting();
    setUpdateAvailable(false);
  };

  const refreshCache = async () => {
    await serviceWorkerManager.clearCache();
    window.location.reload();
  };

  return {
    ...state,
    updateAvailable,
    applyUpdate,
    refreshCache,
    updateCache: serviceWorkerManager.updateCache.bind(serviceWorkerManager),
    deleteFromCache: serviceWorkerManager.deleteFromCache.bind(serviceWorkerManager),
    clearCache: serviceWorkerManager.clearCache.bind(serviceWorkerManager)
  };
}

/**
 * Initialize Service Worker (call this in your app initialization)
 */
export async function initServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  return serviceWorkerManager.register();
}

export default serviceWorkerManager;
