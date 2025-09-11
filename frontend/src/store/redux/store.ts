import { configureStore, createSlice, type PayloadAction } from '@reduxjs/toolkit';

// Navigation Slice
interface NavigationState {
  currentPath: string;
  previousPath: string;
  breadcrumbs: Array<{ label: string; path: string }>;
  isNavigating: boolean;
  history: string[];
}

const initialNavigationState: NavigationState = {
  currentPath: '/',
  previousPath: '',
  breadcrumbs: [],
  isNavigating: false,
  history: []
};

const navigationSlice = createSlice({
  name: 'navigation',
  initialState: initialNavigationState,
  reducers: {
    setCurrentPath: (state, action: PayloadAction<string>) => {
      state.previousPath = state.currentPath;
      state.currentPath = action.payload;
      state.history.push(action.payload);
      
      // Keep history size manageable
      if (state.history.length > 50) {
        state.history = state.history.slice(-25);
      }
    },
    setBreadcrumbs: (state, action: PayloadAction<Array<{ label: string; path: string }>>) => {
      state.breadcrumbs = action.payload;
    },
    setNavigating: (state, action: PayloadAction<boolean>) => {
      state.isNavigating = action.payload;
    },
    clearHistory: (state) => {
      state.history = [];
    }
  }
});

// UI State Slice
interface UIState {
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  modalOpen: boolean;
  loading: Record<string, boolean>;
  errors: Record<string, string>;
}

const initialUIState: UIState = {
  theme: 'system',
  sidebarOpen: false,
  modalOpen: false,
  loading: {},
  errors: {}
};

const uiSlice = createSlice({
  name: 'ui',
  initialState: initialUIState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.theme = action.payload;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setModalOpen: (state, action: PayloadAction<boolean>) => {
      state.modalOpen = action.payload;
    },
    setLoading: (state, action: PayloadAction<{ key: string; loading: boolean }>) => {
      state.loading[action.payload.key] = action.payload.loading;
    },
    setError: (state, action: PayloadAction<{ key: string; error: string }>) => {
      state.errors[action.payload.key] = action.payload.error;
    },
    clearError: (state, action: PayloadAction<string>) => {
      delete state.errors[action.payload];
    }
  }
});

// Virtual DOM Optimization Slice
interface VirtualDOMState {
  renderOptimizations: {
    enableConcurrentMode: boolean;
    enableStrictMode: boolean;
    enableProfiling: boolean;
  };
  performance: {
    renderCount: number;
    lastRenderTime: number;
    avgRenderTime: number;
  };
  memoryUsage: {
    componentCount: number;
    memoryPressure: 'low' | 'medium' | 'high';
  };
}

const initialVirtualDOMState: VirtualDOMState = {
  renderOptimizations: {
    enableConcurrentMode: true,
    enableStrictMode: true,
    enableProfiling: false
  },
  performance: {
    renderCount: 0,
    lastRenderTime: 0,
    avgRenderTime: 0
  },
  memoryUsage: {
    componentCount: 0,
    memoryPressure: 'low'
  }
};

const virtualDOMSlice = createSlice({
  name: 'virtualDOM',
  initialState: initialVirtualDOMState,
  reducers: {
    updateRenderMetrics: (state, action: PayloadAction<{ renderTime: number }>) => {
      state.performance.renderCount += 1;
      state.performance.lastRenderTime = action.payload.renderTime;
      
      // Calculate rolling average
      const count = state.performance.renderCount;
      const prevAvg = state.performance.avgRenderTime;
      state.performance.avgRenderTime = (prevAvg * (count - 1) + action.payload.renderTime) / count;
    },
    updateComponentCount: (state, action: PayloadAction<number>) => {
      state.memoryUsage.componentCount = action.payload;
      
      // Update memory pressure based on component count
      if (action.payload > 1000) {
        state.memoryUsage.memoryPressure = 'high';
      } else if (action.payload > 500) {
        state.memoryUsage.memoryPressure = 'medium';
      } else {
        state.memoryUsage.memoryPressure = 'low';
      }
    },
    toggleOptimization: (state, action: PayloadAction<keyof VirtualDOMState['renderOptimizations']>) => {
      state.renderOptimizations[action.payload] = !state.renderOptimizations[action.payload];
    }
  }
});

// Export actions
export const navigationActions = navigationSlice.actions;
export const uiActions = uiSlice.actions;
export const virtualDOMActions = virtualDOMSlice.actions;

// Configure store
export const store = configureStore({
  reducer: {
    navigation: navigationSlice.reducer,
    ui: uiSlice.reducer,
    virtualDOM: virtualDOMSlice.reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE']
      }
    })
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
