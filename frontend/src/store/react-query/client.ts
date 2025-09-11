import { QueryClient } from '@tanstack/react-query';

// Create a client with optimized defaults for Virtual DOM performance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time - data considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache time - data kept in cache for 10 minutes after becoming stale
      gcTime: 10 * 60 * 1000,
      // Retry failed requests 3 times with exponential backoff
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus for fresh data
      refetchOnWindowFocus: true,
      // Don't refetch on reconnect to avoid unnecessary re-renders
      refetchOnReconnect: false,
      // Optimize for Virtual DOM by reducing unnecessary re-renders
      refetchOnMount: 'always',
      // Enable suspense for better UX with React 18
      suspense: false, // Enable when using Suspense boundaries
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      // Network mode for handling offline scenarios
      networkMode: 'online',
    }
  }
});

// Query keys factory for type safety and consistency
export const queryKeys = {
  // User-related queries
  user: {
    all: ['user'] as const,
    profile: (userId: string) => [...queryKeys.user.all, 'profile', userId] as const,
    preferences: (userId: string) => [...queryKeys.user.all, 'preferences', userId] as const,
  },
  
  // Navigation-related queries
  navigation: {
    all: ['navigation'] as const,
    routes: () => [...queryKeys.navigation.all, 'routes'] as const,
    breadcrumbs: (path: string) => [...queryKeys.navigation.all, 'breadcrumbs', path] as const,
  },
  
  // Performance metrics
  performance: {
    all: ['performance'] as const,
    metrics: () => [...queryKeys.performance.all, 'metrics'] as const,
    vitals: () => [...queryKeys.performance.all, 'vitals'] as const,
  }
} as const;

// Prefetch utilities for route-based prefetching
export const prefetchUtils = {
  // Prefetch user data
  prefetchUser: async (userId: string) => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.user.profile(userId),
      queryFn: () => fetch(`/api/users/${userId}`).then(res => res.json()),
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  },
  
  // Prefetch navigation data
  prefetchRoutes: async () => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.navigation.routes(),
      queryFn: () => fetch('/api/navigation/routes').then(res => res.json()),
      staleTime: 30 * 60 * 1000, // 30 minutes - routes don't change often
    });
  },
  
  // Invalidate and refetch data
  invalidateUser: (userId?: string) => {
    if (userId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.profile(userId) });
    } else {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
    }
  }
};

// Performance monitoring for React Query
export const monitorQueryPerformance = () => {
  const queryCache = queryClient.getQueryCache();
  
  return {
    getActiveQueries: () => queryCache.getAll().filter(query => query.getObserversCount() > 0),
    getCacheSize: () => queryCache.getAll().length,
    clearStaleQueries: () => queryClient.removeQueries({ stale: true }),
    getMemoryUsage: () => {
      const queries = queryCache.getAll();
      return queries.reduce((acc, query) => {
        const data = query.state.data;
        if (data) {
          // Rough estimation of memory usage
          acc += JSON.stringify(data).length * 2; // 2 bytes per character (UTF-16)
        }
        return acc;
      }, 0);
    }
  };
};
