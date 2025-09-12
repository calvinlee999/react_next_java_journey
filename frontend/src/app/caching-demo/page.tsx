'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import { usePagination, useInfiniteQuery } from '@/hooks/usePagination';
import { useServiceWorker } from '@/lib/service-worker';

/**
 * Comprehensive Caching Demo Page
 * Demonstrates all caching strategies and their performance
 */

interface User {
  id: number;
  name: string;
  email: string;
  company?: {
    name: string;
  };
}

interface PerformanceMetrics {
  [key: string]: number;
}

const CachingDemo: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<'cache-first' | 'network-first' | 'network-only' | 'cache-only'>('cache-first');
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({});
  const [isMounted, setIsMounted] = useState(false);

  // Track client-side hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Memoize cache options to prevent infinite re-renders
  const memoizedCacheOptions = useMemo(() => ({
    strategy: selectedStrategy,
    ttl: 5 * 60 * 1000 
  }), [selectedStrategy]);

  // Service Worker integration
  const {
    isSupported: swSupported,
    isRegistered: swRegistered,
    isOnline,
    updateAvailable,
    cacheInfo,
    applyUpdate,
    refreshCache
  } = useServiceWorker();

  // Pagination with caching
  const {
    data: users,
    isLoading: usersLoading,
    error: usersError,
    pagination,
    setPage,
    refresh: refreshUsers
  } = usePagination<User>('/api/users', {
    initialLimit: 10,
    cacheOptions: memoizedCacheOptions
  });

  // Infinite scroll
  const {
    data: infiniteUsers,
    isFetching: infiniteLoading,
    fetchNextPage: loadMoreInfinite,
    hasNextPage: hasMoreInfinite
  } = useInfiniteQuery<User>('/api/users', {
    initialLimit: 5
  });

  // Generate display text functions to avoid hydration mismatches
  const getServiceWorkerStatus = () => {
    if (!isMounted) return '⚠ Loading...';
    if (!swSupported) return '✗ Not Supported';
    if (!swRegistered) return '⚠ Not Registered';
    return '✓ Active';
  };

  const getNetworkStatus = () => {
    if (!isMounted) return '🟡 Checking...';
    return isOnline ? '🟢 Online' : '🔴 Offline';
  };

  const getUpdateStatus = () => {
    if (!isMounted) return '⚪ Checking...';
    return updateAvailable ? '🔄 Yes' : '✓ Latest';
  };

  const getCacheStatus = () => {
    if (!isMounted) return '⚪ Loading...';
    return Object.keys(performanceMetrics).length > 0 ? '💾 Active' : '⚪ Empty';
  };

  // Measure performance
  const measurePerformance = useCallback(async (operation: string, fn: () => Promise<unknown>) => {
    const start = Date.now();
    try {
      await fn();
      const duration = Date.now() - start;
      setPerformanceMetrics(prev => ({ ...prev, [operation]: duration }));
    } catch (error) {
      console.error(`Performance measurement failed for ${operation}:`, error);
    }
  }, []);

  // Cache operations
  const testCacheFirst = useCallback(async () => {
    setIsLoading(true);
    await measurePerformance('cache-first', async () => {
      await apiClient.fetchWithCache('/api/users/1', {}, { strategy: 'cache-first' });
    });
    setIsLoading(false);
  }, [measurePerformance]);

  const testNetworkFirst = useCallback(async () => {
    setIsLoading(true);
    await measurePerformance('network-first', async () => {
      await apiClient.fetchWithCache('/api/users/1', {}, { strategy: 'network-first' });
    });
    setIsLoading(false);
  }, [measurePerformance]);

  const testNetworkOnly = useCallback(async () => {
    setIsLoading(true);
    await measurePerformance('network-only', async () => {
      await apiClient.fetchWithCache('/api/users/1', {}, { strategy: 'network-only' });
    });
    setIsLoading(false);
  }, [measurePerformance]);

  const testCacheOnly = useCallback(async () => {
    setIsLoading(true);
    await measurePerformance('cache-only', async () => {
      await apiClient.fetchWithCache('/api/users/1', {}, { strategy: 'cache-only' });
    });
    setIsLoading(false);
  }, [measurePerformance]);

  const clearAllCaches = useCallback(async () => {
    setIsLoading(true);
    try {
      await apiClient.clearCache();
      await refreshCache();
      setPerformanceMetrics({});
    } catch (error) {
      console.error('Failed to clear caches:', error);
    }
    setIsLoading(false);
  }, [refreshCache]);

  const prefetchData = useCallback(async () => {
    await apiClient.fetchWithCache('/api/users/2', {}, { strategy: 'cache-first' });
    await apiClient.fetchWithCache('/api/users/3', {}, { strategy: 'cache-first' });
    await apiClient.fetchWithCache('/api/posts/1', {}, { strategy: 'cache-first' });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              React/Next.js REST API Pagination & Caching Demo
            </h1>

            {/* Status Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800">Service Worker</h3>
                <p className="text-2xl font-bold text-blue-900" suppressHydrationWarning>
                  {getServiceWorkerStatus()}
                </p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-800">Network Status</h3>
                <p className="text-2xl font-bold text-green-900" suppressHydrationWarning>
                  {getNetworkStatus()}
                </p>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-yellow-800">Update Available</h3>
                <p className="text-2xl font-bold text-yellow-900" suppressHydrationWarning>
                  {getUpdateStatus()}
                </p>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-purple-800">Cache Status</h3>
                <p className="text-2xl font-bold text-purple-900" suppressHydrationWarning>
                  {getCacheStatus()}
                </p>
              </div>
            </div>

            {updateAvailable && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-8">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      New version available
                    </h3>
                    <div className="mt-2">
                      <button
                        onClick={applyUpdate}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
                      >
                        Update Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Cache Strategy Selection */}
            <div className="mb-8">
              <label htmlFor="cache-strategy" className="block text-sm font-medium text-gray-700 mb-2">
                Select Caching Strategy:
              </label>
              <select
                id="cache-strategy"
                value={selectedStrategy}
                onChange={(e) => setSelectedStrategy(e.target.value as typeof selectedStrategy)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                title="Choose caching strategy"
              >
                <option value="cache-first">Cache First</option>
                <option value="network-first">Network First</option>
                <option value="cache-only">Cache Only</option>
                <option value="network-only">Network Only</option>
              </select>
            </div>

            {/* Performance Testing */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Cache Performance Testing</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={testCacheFirst}
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Test Cache First
                </button>
                
                <button
                  onClick={testNetworkFirst}
                  disabled={isLoading}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                >
                  Test Network First
                </button>
                
                <button
                  onClick={testNetworkOnly}
                  disabled={isLoading}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 disabled:bg-gray-400"
                >
                  Test Network Only
                </button>
                
                <button
                  onClick={testCacheOnly}
                  disabled={isLoading}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-400"
                >
                  Test Cache Only
                </button>
              </div>
              
              <div className="mt-4">
                <button
                  onClick={prefetchData}
                  disabled={isLoading}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 mr-4"
                >
                  Prefetch Data
                </button>
                
                <button
                  onClick={clearAllCaches}
                  disabled={isLoading}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:bg-gray-400"
                >
                  Clear All Caches
                </button>
              </div>
            </div>

            {/* Performance Metrics */}
            {Object.keys(performanceMetrics).length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Results (ms)</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(performanceMetrics).map(([operation, duration]) => (
                    <div key={operation} className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-600">{operation}</h3>
                      <p className="text-2xl font-bold text-gray-900">{duration}ms</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Service Worker Cache Info */}
            {cacheInfo && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Service Worker Caches</h2>
                <div className="space-y-4">
                  {Object.entries(cacheInfo).map(([cacheType, cache]) => (
                    <div key={cacheType} className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{cache.name}</h3>
                      <p className="text-sm text-gray-600 mb-2">{cache.count} cached items</p>
                      <details className="text-sm">
                        <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                          View cached URLs
                        </summary>
                        <ul className="mt-2 space-y-1">
                          {cache.urls.map((url) => (
                            <li key={url} className="text-xs text-gray-500 truncate">{url}</li>
                          ))}
                        </ul>
                      </details>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Paginated Users */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Paginated Users ({selectedStrategy})</h2>
              {usersLoading && <div className="text-blue-600">Loading users...</div>}
              {usersError && <div className="text-red-600">Error: {usersError.message}</div>}
              
              {users && users.length > 0 && (
                <div className="space-y-4">
                  <div className="grid gap-4">
                    {users.map((user) => (
                      <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-gray-900">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        {user.company && (
                          <p className="text-sm text-gray-500">{user.company.name}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex space-x-4">
                    {pagination && pagination.hasNext && (
                      <button
                        onClick={() => setPage(pagination.page + 1)}
                        disabled={usersLoading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        Next Page
                      </button>
                    )}
                    
                    {pagination && pagination.hasPrev && (
                      <button
                        onClick={() => setPage(pagination.page - 1)}
                        disabled={usersLoading}
                        className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:bg-gray-400"
                      >
                        Previous Page
                      </button>
                    )}
                    
                    <button
                      onClick={refreshUsers}
                      disabled={usersLoading}
                      className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                    >
                      Refresh
                    </button>
                  </div>
                  
                  {pagination && (
                    <p className="text-sm text-gray-600">
                      Page {pagination.page} of {pagination.totalPages} 
                      ({pagination.total} total users)
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Infinite Scroll Users */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Infinite Scroll Users</h2>
              {infiniteLoading && <div className="text-blue-600">Loading more users...</div>}
              
              {infiniteUsers && infiniteUsers.length > 0 && (
                <div className="space-y-4">
                  <div className="grid gap-4 max-h-96 overflow-y-auto">
                    {infiniteUsers.map((user) => (
                      <div key={`infinite-${user.id}`} className="bg-white border border-gray-200 rounded-lg p-4">
                        <h3 className="text-lg font-medium text-gray-900">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        {user.company && (
                          <p className="text-sm text-gray-500">{user.company.name}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {hasMoreInfinite && (
                    <button
                      onClick={loadMoreInfinite}
                      disabled={infiniteLoading}
                      className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-400"
                    >
                      Load More (Infinite)
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Caching Strategies Explanation */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Caching Strategies Explained</h2>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900">Cache First</h3>
                  <p className="text-sm text-blue-800">
                    Try cache first, fallback to network if not found. Best for static content.
                  </p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-medium text-green-900">Network First</h3>
                  <p className="text-sm text-green-800">
                    Always try network first, fallback to cache if offline. Best for dynamic content.
                  </p>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-medium text-yellow-900">Network Only</h3>
                  <p className="text-sm text-yellow-800">
                    Always fetch from network, no caching. Best for real-time data.
                  </p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-medium text-purple-900">Cache Only</h3>
                  <p className="text-sm text-purple-800">
                    Only return cached data, fail if not available. Best for offline scenarios.
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900">Service Worker</h3>
                  <p className="text-sm text-gray-800">
                    Advanced caching with offline support and background sync.
                  </p>
                </div>

                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h3 className="font-medium text-indigo-900">Key Front-End Caching Methods</h3>
                  <ul className="text-sm text-indigo-800 mt-2 space-y-1">
                    <li>• <strong>Browser Caching:</strong> HTTP headers control browser cache behavior</li>
                    <li>• <strong>Memory Cache:</strong> Fast in-memory storage for current session</li>
                    <li>• <strong>IndexedDB:</strong> Persistent client-side database storage</li>
                    <li>• <strong>Service Workers:</strong> Programmable network proxy for advanced caching</li>
                    <li>• <strong>CDN:</strong> Geographic distribution of cached content</li>
                    <li>• <strong>Local Storage:</strong> Simple key-value persistent storage</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CachingDemo;
