import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Navigation Store for routing and navigation state
interface NavigationState {
  currentRoute: string;
  previousRoute: string;
  params: Record<string, string>;
  searchParams: URLSearchParams;
  isLoading: boolean;
  prefetchedRoutes: Set<string>;
  navigationHistory: Array<{
    route: string;
    timestamp: number;
    duration?: number;
  }>;
  // Actions
  setCurrentRoute: (route: string, params?: Record<string, string>) => void;
  setSearchParams: (params: URLSearchParams) => void;
  setLoading: (loading: boolean) => void;
  addPrefetchedRoute: (route: string) => void;
  recordNavigation: (route: string, duration?: number) => void;
  clearHistory: () => void;
}

export const useNavigationStore = create<NavigationState>()(
  devtools(
    (set, get) => ({
      currentRoute: '/',
      previousRoute: '',
      params: {},
      searchParams: new URLSearchParams(),
      isLoading: false,
      prefetchedRoutes: new Set(),
      navigationHistory: [],
      
      setCurrentRoute: (route, params = {}) =>
        set((state) => ({
          previousRoute: state.currentRoute,
          currentRoute: route,
          params
        }), false, 'setCurrentRoute'),
        
      setSearchParams: (params) =>
        set({ searchParams: params }, false, 'setSearchParams'),
        
      setLoading: (loading) =>
        set({ isLoading: loading }, false, 'setLoading'),
        
      addPrefetchedRoute: (route) =>
        set((state) => ({
          prefetchedRoutes: new Set([...state.prefetchedRoutes, route])
        }), false, 'addPrefetchedRoute'),
        
      recordNavigation: (route, duration) =>
        set((state) => {
          const newHistory = [
            ...state.navigationHistory,
            {
              route,
              timestamp: Date.now(),
              duration
            }
          ];
          
          // Keep only last 100 navigation records
          return {
            navigationHistory: newHistory.slice(-100)
          };
        }, false, 'recordNavigation'),
        
      clearHistory: () =>
        set({ navigationHistory: [] }, false, 'clearHistory')
    })
  )
);
