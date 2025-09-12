/**
 * API Client with Comprehensive Caching and Pagination
 * Implements multiple caching strategies and REST API pagination
 */

// Types for pagination and caching
export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, string | number | boolean>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  meta?: {
    cached?: boolean;
    cacheTime?: number;
    source?: 'memory' | 'indexeddb' | 'service-worker' | 'network';
  };
}

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  strategy?: 'cache-first' | 'network-first' | 'cache-only' | 'network-only';
  staleWhileRevalidate?: boolean;
  tags?: string[]; // For cache invalidation
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  cached?: boolean;
  cacheTime?: number;
}

/**
 * Memory Cache Implementation
 * Fast in-memory caching for frequently accessed data
 */
class MemoryCache {
  private readonly cache = new Map<string, { data: unknown; expiry: number; tags: string[] }>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl: number = this.defaultTTL, tags: string[] = []): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl,
      tags
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidateByTag(tag: string): void {
    for (const [key, value] of this.cache.entries()) {
      if (value.tags.includes(tag)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * IndexedDB Cache Implementation
 * Persistent storage for larger datasets and offline capability
 */
class IndexedDBCache {
  private readonly dbName = 'ApiCache';
  private readonly version = 1;
  private readonly storeName = 'cache';

  private async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(new Error(request.error?.message || 'IndexedDB open error'));
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' });
          store.createIndex('expiry', 'expiry');
          store.createIndex('tags', 'tags', { multiEntry: true });
        }
      };
    });
  }

  async set<T>(key: string, data: T, ttl: number = 30 * 60 * 1000, tags: string[] = []): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      store.put({
        key,
        data,
        expiry: Date.now() + ttl,
        tags,
        timestamp: Date.now()
      });
      
      return new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(new Error('Transaction failed'));
      });
    } catch (error) {
      console.warn('IndexedDB cache set failed:', error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onerror = () => reject(new Error(request.error?.message || 'IndexedDB error'));
        request.onsuccess = () => {
          const result = request.result;
          if (!result) {
            resolve(null);
            return;
          }
          
          if (Date.now() > result.expiry) {
            this.invalidate(key);
            resolve(null);
            return;
          }
          
          resolve(result.data as T);
        };
      });
    } catch (error) {
      console.warn('IndexedDB cache get failed:', error);
      return null;
    }
  }

  async invalidate(key: string): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.delete(key);
        request.onerror = () => reject(new Error(request.error?.message || 'IndexedDB delete error'));
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.warn('IndexedDB cache invalidate failed:', error);
    }
  }

  async invalidateByTag(tag: string): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('tags');
      
      const request = index.openCursor(IDBKeyRange.only(tag));
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
    } catch (error) {
      console.warn('IndexedDB cache invalidateByTag failed:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const db = await this.getDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      return new Promise((resolve, reject) => {
        const request = store.clear();
        request.onerror = () => reject(new Error(request.error?.message || 'IndexedDB clear error'));
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.warn('IndexedDB cache clear failed:', error);
    }
  }
}

/**
 * HTTP Client with Advanced Caching
 * Implements multiple caching strategies with HTTP headers
 */
class CachedAPIClient {
  private readonly memoryCache = new MemoryCache();
  private readonly indexedDBCache = new IndexedDBCache();
  private readonly baseURL: string;

  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
  }

  /**
   * Generate cache key from URL and params
   */
  private generateCacheKey(url: string, params?: Record<string, unknown>): string {
    const paramStr = params ? JSON.stringify(params) : '';
    return `${url}${paramStr}`;
  }

  /**
   * Check if data is stale
   */
  private isStale(cacheTime: number, maxAge: number): boolean {
    return Date.now() - cacheTime > maxAge;
  }

  /**
   * Fetch with comprehensive caching strategies
   */
  async fetchWithCache<T>(
    url: string,
    options: RequestInit = {},
    cacheOptions: CacheOptions = {}
  ): Promise<APIResponse<T>> {
    const {
      ttl = 5 * 60 * 1000, // 5 minutes default
      strategy = 'cache-first',
      staleWhileRevalidate = false,
      tags = []
    } = cacheOptions;

    const cacheKey = this.generateCacheKey(url, options.body ? { 
      body: typeof options.body === 'string' ? options.body : JSON.stringify(options.body) 
    } : undefined);
    const fullUrl = `${this.baseURL}${url}`;

    // Set default headers for HTTP caching
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Cache-Control': 'max-age=300, must-revalidate', // 5 minutes
      ...options.headers
    };

    const fetchOptions: RequestInit = {
      ...options,
      headers: defaultHeaders
    };

    switch (strategy) {
      case 'cache-first':
        return this.cacheFirstStrategy(fullUrl, fetchOptions, cacheKey, ttl, tags, staleWhileRevalidate);
      
      case 'network-first':
        return this.networkFirstStrategy(fullUrl, fetchOptions, cacheKey, ttl, tags);
      
      case 'cache-only':
        return this.cacheOnlyStrategy(cacheKey);
      
      case 'network-only':
        return this.networkOnlyStrategy(fullUrl, fetchOptions);
      
      default:
        return this.cacheFirstStrategy(fullUrl, fetchOptions, cacheKey, ttl, tags, staleWhileRevalidate);
    }
  }

  /**
   * Cache-first strategy: Check cache first, fallback to network
   */
  private async cacheFirstStrategy<T>(
    url: string,
    options: RequestInit,
    cacheKey: string,
    ttl: number,
    tags: string[],
    staleWhileRevalidate: boolean
  ): Promise<APIResponse<T>> {
    // Try memory cache first
    let cachedData = this.memoryCache.get<T>(cacheKey);
    if (cachedData) {
      if (staleWhileRevalidate) {
        // Return cached data immediately, fetch in background
        this.networkFetch(url, options, cacheKey, ttl, tags).catch(console.warn);
      }
      return {
        success: true,
        data: cachedData,
        cached: true,
        cacheTime: Date.now()
      };
    }

    // Try IndexedDB cache
    cachedData = await this.indexedDBCache.get<T>(cacheKey);
    if (cachedData) {
      // Store in memory cache for faster access
      this.memoryCache.set(cacheKey, cachedData, ttl, tags);
      
      if (staleWhileRevalidate) {
        this.networkFetch(url, options, cacheKey, ttl, tags).catch(console.warn);
      }
      
      return {
        success: true,
        data: cachedData,
        cached: true,
        cacheTime: Date.now()
      };
    }

    // Fallback to network
    return this.networkFetch(url, options, cacheKey, ttl, tags);
  }

  /**
   * Network-first strategy: Try network first, fallback to cache
   */
  private async networkFirstStrategy<T>(
    url: string,
    options: RequestInit,
    cacheKey: string,
    ttl: number,
    tags: string[]
  ): Promise<APIResponse<T>> {
    try {
      return await this.networkFetch(url, options, cacheKey, ttl, tags);
    } catch (error) {
      // Network failed, try cache
      const cachedData = this.memoryCache.get<T>(cacheKey) ?? 
                        await this.indexedDBCache.get<T>(cacheKey);
      
      if (cachedData) {
        return {
          success: true,
          data: cachedData,
          cached: true,
          cacheTime: Date.now()
        };
      }
      
      throw error;
    }
  }

  /**
   * Cache-only strategy: Only return cached data
   */
  private async cacheOnlyStrategy<T>(cacheKey: string): Promise<APIResponse<T>> {
    const cachedData = this.memoryCache.get<T>(cacheKey) ?? 
                      await this.indexedDBCache.get<T>(cacheKey);
    
    if (!cachedData) {
      throw new Error('No cached data available');
    }
    
    return {
      success: true,
      data: cachedData,
      cached: true,
      cacheTime: Date.now()
    };
  }

  /**
   * Network-only strategy: Always fetch from network
   */
  private async networkOnlyStrategy<T>(
    url: string,
    options: RequestInit
  ): Promise<APIResponse<T>> {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      success: true,
      data,
      cached: false,
      cacheTime: Date.now()
    };
  }

  /**
   * Network fetch with caching
   */
  private async networkFetch<T>(
    url: string,
    options: RequestInit,
    cacheKey: string,
    ttl: number,
    tags: string[]
  ): Promise<APIResponse<T>> {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Read HTTP cache headers for future use
    // const cacheControl = response.headers.get('cache-control');
    // const etag = response.headers.get('etag');
    // const lastModified = response.headers.get('last-modified');

    const data = await response.json();

    // Cache the response
    this.memoryCache.set(cacheKey, data, ttl, tags);
    await this.indexedDBCache.set(cacheKey, data, ttl * 6, tags); // Longer TTL for persistent storage

    return {
      success: true,
      data,
      cached: false,
      cacheTime: Date.now()
    };
  }

  /**
   * Paginated fetch with caching
   */
  async fetchPaginated<T>(
    endpoint: string,
    params: PaginationParams,
    cacheOptions?: CacheOptions
  ): Promise<PaginatedResponse<T>> {
    const queryParams = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString(),
      ...(params.sort && { sort: params.sort }),
      ...(params.order && { order: params.order }),
      ...(params.search && { search: params.search }),
      ...params.filters
    });

    const url = `${endpoint}?${queryParams.toString()}`;
    
    const response = await this.fetchWithCache<PaginatedResponse<T>>(
      url,
      { method: 'GET' },
      {
        ...cacheOptions,
        tags: [...(cacheOptions?.tags || []), `paginated-${endpoint}`, `page-${params.page}`]
      }
    );

    return {
      ...response.data,
      meta: {
        cached: response.cached,
        cacheTime: response.cacheTime,
        source: response.cached ? 'memory' : 'network'
      }
    };
  }

  /**
   * Invalidate cache by tags
   */
  invalidateCache(tags: string[]): void {
    tags.forEach(tag => {
      this.memoryCache.invalidateByTag(tag);
      this.indexedDBCache.invalidateByTag(tag).catch(console.warn);
    });
  }

  /**
   * Clear all caches
   */
  async clearCache(): Promise<void> {
    this.memoryCache.clear();
    await this.indexedDBCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      memorySize: this.memoryCache.size(),
      // IndexedDB size would require additional implementation
    };
  }
}

// Export singleton instance
export const apiClient = new CachedAPIClient();
export default apiClient;
