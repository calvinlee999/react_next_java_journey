/**
 * Centralized State Management Hub
 * Supports multiple state management patterns for different use cases
 */

// Redux Toolkit Store
export { store, type RootState, type AppDispatch } from './redux/store';

// Zustand Stores
export { useAppStore } from './zustand/app-store';
export { useNavigationStore } from './zustand/navigation-store';
export { useThemeStore } from './zustand/theme-store';

// Jotai Atoms
export { 
  userAtom, 
  navigationAtom, 
  themeAtom,
  virtualDomOptimizationAtom 
} from './jotai/atoms';

// React Query Client
export { queryClient } from './react-query/client';

// Store Providers
export { StoreProvider } from './providers/store-provider';
