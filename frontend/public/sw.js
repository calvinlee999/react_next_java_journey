/**
 * Service Worker for Advanced Caching Strategies
 * Provides offline capabilities and sophisticated caching
 */

// Cache names for different types of content
const CACHE_NAMES = {
  static: 'static-cache-v1',
  api: 'api-cache-v1',
  images: 'image-cache-v1',
  fonts: 'font-cache-v1'
};

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
};

// Cache configuration for different resource types
const CACHE_CONFIG = {
  static: {
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    maxEntries: 100
  },
  api: {
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    maxAge: 5 * 60 * 1000, // 5 minutes
    maxEntries: 200
  },
  images: {
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxEntries: 100
  },
  fonts: {
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    maxEntries: 50
  }
};

/**
 * Install event - Cache initial resources
 */
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(CACHE_NAMES.static).then(cache => {
        return cache.addAll([
          '/',
          '/manifest.json',
          '/favicon.ico',
          // Add other critical static resources
        ]);
      }),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

/**
 * Activate event - Clean up old caches
 */
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!Object.values(CACHE_NAMES).includes(cacheName)) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all pages immediately
      self.clients.claim()
    ])
  );
});

/**
 * Fetch event - Handle all network requests
 */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Determine cache strategy based on request type
  let strategy = CACHE_STRATEGIES.NETWORK_FIRST;
  let cacheName = CACHE_NAMES.static;
  
  if (url.pathname.startsWith('/api/')) {
    strategy = CACHE_CONFIG.api.strategy;
    cacheName = CACHE_NAMES.api;
  } else if (url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) {
    strategy = CACHE_CONFIG.images.strategy;
    cacheName = CACHE_NAMES.images;
  } else if (url.pathname.match(/\.(woff|woff2|ttf|eot)$/)) {
    strategy = CACHE_CONFIG.fonts.strategy;
    cacheName = CACHE_NAMES.fonts;
  } else if (url.pathname.match(/\.(js|css|html)$/)) {
    strategy = CACHE_CONFIG.static.strategy;
    cacheName = CACHE_NAMES.static;
  }

  event.respondWith(
    handleRequest(request, strategy, cacheName)
  );
});

/**
 * Handle request with specified caching strategy
 */
async function handleRequest(request, strategy, cacheName) {
  const cache = await caches.open(cacheName);
  
  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request, cache);
    
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request, cache);
    
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request, cache);
    
    case CACHE_STRATEGIES.NETWORK_ONLY:
      return fetch(request);
    
    case CACHE_STRATEGIES.CACHE_ONLY:
      return cache.match(request);
    
    default:
      return networkFirst(request, cache);
  }
}

/**
 * Cache First Strategy
 * Serve from cache, fallback to network
 */
async function cacheFirst(request, cache) {
  const cached = await cache.match(request);
  
  if (cached && !isExpired(cached)) {
    console.log('Serving from cache:', request.url);
    return cached;
  }
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      // Clone response before caching
      const responseClone = response.clone();
      await cache.put(request, responseClone);
      console.log('Cached new response:', request.url);
    }
    
    return response;
  } catch (error) {
    // Network failed, return cached version if available
    if (cached) {
      console.log('Network failed, serving stale cache:', request.url);
      return cached;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html') || new Response('Offline', {
        status: 503,
        statusText: 'Service Unavailable'
      });
    }
    
    throw error;
  }
}

/**
 * Network First Strategy
 * Try network first, fallback to cache
 */
async function networkFirst(request, cache) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      // Clone response before caching
      const responseClone = response.clone();
      await cache.put(request, responseClone);
      console.log('Updated cache from network:', request.url);
    }
    
    return response;
  } catch (error) {
    // Network failed, try cache
    const cached = await cache.match(request);
    
    if (cached) {
      console.log('Network failed, serving from cache:', request.url);
      return cached;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html') || new Response('Offline', {
        status: 503,
        statusText: 'Service Unavailable'
      });
    }
    
    throw error;
  }
}

/**
 * Stale While Revalidate Strategy
 * Serve from cache immediately, update cache in background
 */
async function staleWhileRevalidate(request, cache) {
  const cached = await cache.match(request);
  
  // Fetch from network in background
  const networkPromise = fetch(request).then(response => {
    if (response.ok) {
      const responseClone = response.clone();
      cache.put(request, responseClone);
      console.log('Background cache update:', request.url);
    }
    return response;
  }).catch(() => {
    // Ignore network errors in background update
  });
  
  // Return cached version immediately if available
  if (cached && !isExpired(cached)) {
    console.log('Serving from cache (SWR):', request.url);
    return cached;
  }
  
  // If no cache, wait for network
  console.log('No cache, waiting for network:', request.url);
  return networkPromise;
}

/**
 * Check if cached response is expired
 */
function isExpired(response) {
  const cacheControl = response.headers.get('cache-control');
  const date = response.headers.get('date');
  
  if (!cacheControl || !date) {
    return false; // No expiry info, assume fresh
  }
  
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  if (!maxAgeMatch) {
    return false;
  }
  
  const maxAge = parseInt(maxAgeMatch[1]) * 1000; // Convert to milliseconds
  const responseTime = new Date(date).getTime();
  const now = Date.now();
  
  return (now - responseTime) > maxAge;
}

/**
 * Message handling for cache management
 */
self.addEventListener('message', event => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'CACHE_UPDATE':
      handleCacheUpdate(payload);
      break;
    
    case 'CACHE_DELETE':
      handleCacheDelete(payload);
      break;
    
    case 'CACHE_CLEAR':
      handleCacheClear(payload);
      break;
    
    case 'GET_CACHE_INFO':
      handleGetCacheInfo().then(info => {
        event.ports[0].postMessage(info);
      });
      break;
  }
});

/**
 * Update cache with new data
 */
async function handleCacheUpdate({ url, data, cacheName = CACHE_NAMES.api }) {
  try {
    const cache = await caches.open(cacheName);
    const response = new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Date': new Date().toISOString(),
        'Cache-Control': 'max-age=300' // 5 minutes
      }
    });
    
    await cache.put(url, response);
    console.log('Cache updated via message:', url);
  } catch (error) {
    console.error('Cache update failed:', error);
  }
}

/**
 * Delete specific cache entry
 */
async function handleCacheDelete({ url, cacheName }) {
  try {
    if (cacheName) {
      const cache = await caches.open(cacheName);
      await cache.delete(url);
    } else {
      // Delete from all caches
      for (const name of Object.values(CACHE_NAMES)) {
        const cache = await caches.open(name);
        await cache.delete(url);
      }
    }
    console.log('Cache deleted:', url);
  } catch (error) {
    console.error('Cache delete failed:', error);
  }
}

/**
 * Clear specific cache or all caches
 */
async function handleCacheClear({ cacheName }) {
  try {
    if (cacheName) {
      await caches.delete(cacheName);
      console.log('Cache cleared:', cacheName);
    } else {
      // Clear all caches
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('All caches cleared');
    }
  } catch (error) {
    console.error('Cache clear failed:', error);
  }
}

/**
 * Get cache information
 */
async function handleGetCacheInfo() {
  const info = {};
  
  for (const [type, name] of Object.entries(CACHE_NAMES)) {
    try {
      const cache = await caches.open(name);
      const keys = await cache.keys();
      info[type] = {
        name,
        count: keys.length,
        urls: keys.map(req => req.url)
      };
    } catch (error) {
      info[type] = { error: error.message };
    }
  }
  
  return info;
}

/**
 * Background sync for offline actions
 */
self.addEventListener('sync', event => {
  if (event.tag === 'api-sync') {
    event.waitUntil(syncOfflineActions());
  }
});

/**
 * Sync offline actions when connection is restored
 */
async function syncOfflineActions() {
  try {
    // Get offline actions from IndexedDB
    const actions = await getOfflineActions();
    
    for (const action of actions) {
      try {
        await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        });
        
        // Remove successful action
        await removeOfflineAction(action.id);
        console.log('Synced offline action:', action.url);
      } catch (error) {
        console.error('Failed to sync action:', action.url, error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

/**
 * Helper functions for offline action storage
 * These would interface with IndexedDB
 */
async function getOfflineActions() {
  // Implementation would retrieve from IndexedDB
  return [];
}

async function removeOfflineAction(id) {
  // Implementation would remove from IndexedDB
}

/**
 * Push notification handling
 */
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon || '/icon-192x192.png',
        badge: '/badge-72x72.png',
        data: data.data
      })
    );
  }
});

/**
 * Notification click handling
 */
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});
