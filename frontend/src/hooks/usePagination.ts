/**
 * React Hooks for Pagination with Advanced Caching
 * Integrates with the API client for optimized data fetching
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient, PaginationParams, PaginatedResponse, CacheOptions } from '@/lib/api-client';

// Type aliases for filter values
export type FilterValue = string | number | boolean;
export type FilterMap = Record<string, FilterValue>;

// Types for pagination hooks
export interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
  initialSort?: string;
  initialOrder?: 'asc' | 'desc';
  initialSearch?: string;
  initialFilters?: FilterMap;
  cacheOptions?: CacheOptions;
  refetchOnWindowFocus?: boolean;
  refetchInterval?: number;
  staleTime?: number;
}

export interface PaginationState {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  filters?: FilterMap;
}

export interface UsePaginationResult<T> {
  // Data
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null;
  
  // Loading states
  isLoading: boolean;
  isRefetching: boolean;
  isFetching: boolean;
  
  // Error handling
  error: Error | null;
  
  // Cache information
  isCached: boolean;
  cacheTime?: number;
  
  // Actions
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSort: (sort: string, order?: 'asc' | 'desc') => void;
  setSearch: (search: string) => void;
  setFilters: (filters: FilterMap) => void;
  refresh: () => Promise<void>;
  invalidateCache: () => void;
  
  // State
  params: PaginationState;
}

/**
 * Hook for paginated data fetching with caching
 */
export function usePagination<T>(
  endpoint: string,
  options: UsePaginationOptions = {}
): UsePaginationResult<T> {
  const {
    initialPage = 1,
    initialLimit = 10,
    initialSort,
    initialOrder = 'asc',
    initialSearch = '',
    initialFilters = {},
    cacheOptions = { strategy: 'cache-first', ttl: 5 * 60 * 1000 },
    refetchOnWindowFocus = false,
    refetchInterval,
    staleTime = 5 * 60 * 1000
  } = options;

  // State management
  const [params, setParams] = useState<PaginationState>({
    page: initialPage,
    limit: initialLimit,
    sort: initialSort,
    order: initialOrder,
    search: initialSearch,
    filters: initialFilters
  });

  const [data, setData] = useState<T[]>([]);
  const [pagination, setPagination] = useState<PaginatedResponse<T>['pagination'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [cacheTime, setCacheTime] = useState<number>();

  // Refs for cleanup and debouncing
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTime = useRef<number>(0);
  const hasDataRef = useRef<boolean>(false); // Track if data has been loaded

  /**
   * Fetch data with caching
   */
  const fetchData = useCallback(async (
    fetchParams: PaginationState,
    isRefresh = false
  ) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Set loading states
      if (isRefresh) {
        setIsRefetching(true);
      } else if (!hasDataRef.current) {
        setIsLoading(true);
      } else {
        setIsFetching(true);
      }

      setError(null);

      // Prepare pagination parameters
      const paginationParams: PaginationParams = {
        page: fetchParams.page,
        limit: fetchParams.limit,
        ...(fetchParams.sort && { sort: fetchParams.sort }),
        ...(fetchParams.order && { order: fetchParams.order }),
        ...(fetchParams.search && { search: fetchParams.search }),
        ...(fetchParams.filters && Object.keys(fetchParams.filters).length > 0 && { 
          filters: fetchParams.filters 
        })
      };

      // Check if data is stale
      const now = Date.now();
      const isStale = now - lastFetchTime.current > staleTime;

      // Adjust cache strategy based on staleness
      const effectiveCacheOptions: CacheOptions = {
        ...cacheOptions,
        strategy: isStale || isRefresh ? 'network-first' : cacheOptions.strategy
      };

      // Fetch data
      const response = await apiClient.fetchPaginated<T>(
        endpoint,
        paginationParams,
        effectiveCacheOptions
      );

      // Check if request was aborted
      if (controller.signal.aborted) {
        return;
      }

      // Update state
      setData(response.data);
      setPagination(response.pagination);
      setIsCached(response.meta?.cached ?? false);
      setCacheTime(response.meta?.cacheTime);
      lastFetchTime.current = now;
      hasDataRef.current = true; // Mark that data has been loaded

    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err);
        console.error('Pagination fetch error:', err);
      }
    } finally {
      setIsLoading(false);
      setIsRefetching(false);
      setIsFetching(false);
    }
  }, [endpoint, cacheOptions, staleTime]); // Removed data.length to prevent infinite re-renders

  /**
   * Debounced fetch for search and filters
   */
  const debouncedFetch = useCallback((
    fetchParams: PaginationState,
    delay = 300
  ) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      fetchData(fetchParams);
    }, delay);
  }, [fetchData]);

  // Effect for initial load and parameter changes
  useEffect(() => {
    // For search and filters, use debounced fetch
    if (params.search || Object.keys(params.filters || {}).length > 0) {
      debouncedFetch(params);
    } else {
      // For pagination, sorting, immediate fetch
      fetchData(params);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [params, fetchData, debouncedFetch]);

  // Window focus refetch
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      const now = Date.now();
      if (now - lastFetchTime.current > staleTime) {
        fetchData(params, true);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnWindowFocus, staleTime, fetchData, params]);

  // Interval refetch
  useEffect(() => {
    if (!refetchInterval) return;

    const interval = setInterval(() => {
      fetchData(params, true);
    }, refetchInterval);

    return () => clearInterval(interval);
  }, [refetchInterval, fetchData, params]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Action handlers
  const setPage = useCallback((page: number) => {
    setParams(prev => ({ ...prev, page }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setParams(prev => ({ ...prev, limit, page: 1 })); // Reset to first page
  }, []);

  const setSort = useCallback((sort: string, order: 'asc' | 'desc' = 'asc') => {
    setParams(prev => ({ ...prev, sort, order, page: 1 })); // Reset to first page
  }, []);

  const setSearch = useCallback((search: string) => {
    setParams(prev => ({ ...prev, search, page: 1 })); // Reset to first page
  }, []);

  const setFilters = useCallback((filters: FilterMap) => {
    setParams(prev => ({ ...prev, filters, page: 1 })); // Reset to first page
  }, []);

  const refresh = useCallback(async () => {
    await fetchData(params, true);
  }, [fetchData, params]);

  const invalidateCache = useCallback(() => {
    const tags = [`paginated-${endpoint}`, `page-${params.page}`];
    apiClient.invalidateCache(tags);
    refresh();
  }, [endpoint, params.page, refresh]);

  return {
    // Data
    data,
    pagination,
    
    // Loading states
    isLoading,
    isRefetching,
    isFetching,
    
    // Error handling
    error,
    
    // Cache information
    isCached,
    cacheTime,
    
    // Actions
    setPage,
    setLimit,
    setSort,
    setSearch,
    setFilters,
    refresh,
    invalidateCache,
    
    // State
    params
  };
}

/**
 * Hook for infinite scrolling with caching
 */
export function useInfiniteQuery<T>(
  endpoint: string,
  options: UsePaginationOptions = {}
): {
  data: T[];
  hasNextPage: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  error: Error | null;
  fetchNextPage: () => Promise<void>;
  refresh: () => Promise<void>;
  invalidateCache: () => void;
} {
  const [allData, setAllData] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);

  const paginationResult = usePagination<T>(endpoint, {
    ...options,
    initialPage: currentPage
  });

  // Merge data for infinite scroll
  useEffect(() => {
    if (currentPage === 1) {
      setAllData(paginationResult.data);
    } else {
      setAllData(prev => [...prev, ...paginationResult.data]);
    }
    
    setHasNextPage(paginationResult.pagination?.hasNext ?? false);
    setIsFetchingNextPage(false);
  }, [paginationResult.data, paginationResult.pagination?.hasNext, currentPage]);

  const fetchNextPage = useCallback(async () => {
    if (!hasNextPage || isFetchingNextPage) return;
    
    setIsFetchingNextPage(true);
    setCurrentPage(prev => prev + 1);
  }, [hasNextPage, isFetchingNextPage]);

  const refresh = useCallback(async () => {
    setCurrentPage(1);
    setAllData([]);
    await paginationResult.refresh();
  }, [paginationResult]);

  const invalidateCache = useCallback(() => {
    setCurrentPage(1);
    setAllData([]);
    paginationResult.invalidateCache();
  }, [paginationResult]);

  return {
    data: allData,
    hasNextPage,
    isFetching: paginationResult.isFetching,
    isFetchingNextPage,
    error: paginationResult.error,
    fetchNextPage,
    refresh,
    invalidateCache
  };
}

/**
 * Hook for prefetching next page
 */
export function usePrefetch<T>(
  endpoint: string,
  currentPage: number,
  options: UsePaginationOptions = {}
) {
  const prefetchNext = useCallback(() => {
    const nextPageParams: PaginationParams = {
      page: currentPage + 1,
      limit: options.initialLimit || 10,
      ...(options.initialSort && { sort: options.initialSort }),
      ...(options.initialOrder && { order: options.initialOrder }),
      ...(options.initialSearch && { search: options.initialSearch }),
      ...(options.initialFilters && { filters: options.initialFilters })
    };

    // Prefetch with cache-first strategy
    apiClient.fetchPaginated<T>(endpoint, nextPageParams, {
      strategy: 'cache-first',
      ttl: 10 * 60 * 1000, // 10 minutes for prefetched data
      ...options.cacheOptions
    }).catch(() => {
      // Silently handle prefetch errors
    });
  }, [endpoint, currentPage, options]);

  return { prefetchNext };
}
