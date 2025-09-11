'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState } from '@/store/redux/store';
import { virtualDOMActions } from '@/store/redux/store';

// Hook for monitoring component render performance
export function useRenderPerformance(componentName?: string) {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());
  const dispatch = useDispatch();

  useEffect(() => {
    renderCount.current += 1;
    const renderTime = performance.now() - startTime.current;
    
    // Dispatch render metrics to Redux store
    dispatch(virtualDOMActions.updateRenderMetrics({ renderTime }));
    
    // Log slow renders in development
    if (process.env.NODE_ENV === 'development' && renderTime > 16.67) {
      console.warn(
        `🐌 Slow render detected in ${componentName || 'Unknown Component'}: ${renderTime.toFixed(2)}ms`
      );
    }
    
    startTime.current = performance.now();
  });

  return {
    renderCount: renderCount.current,
    componentName: componentName || 'Unknown'
  };
}

// Hook for Virtual DOM optimization settings
export function useVirtualDOMOptimization() {
  const optimization = useSelector((state: RootState) => state.virtualDOM);
  const dispatch = useDispatch();

  const toggleOptimization = useCallback((key: keyof typeof optimization.renderOptimizations) => {
    dispatch(virtualDOMActions.toggleOptimization(key));
  }, [dispatch]);

  const updateComponentCount = useCallback((count: number) => {
    dispatch(virtualDOMActions.updateComponentCount(count));
  }, [dispatch]);

  return {
    ...optimization,
    toggleOptimization,
    updateComponentCount
  };
}

// Hook for memory usage monitoring
export function useMemoryMonitoring() {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  } | null>(null);

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMemoryInfo({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        });
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const formatBytes = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  return {
    memoryInfo,
    formatBytes,
    isMemoryAPISupported: 'memory' in performance
  };
}

// Hook for detecting and preventing memory leaks
export function useMemoryLeakDetection(componentName: string) {
  const mountTime = useRef(Date.now());
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    const checkForLeaks = () => {
      const timeAlive = Date.now() - mountTime.current;
      
      // Warn if component has been alive for more than 10 minutes
      if (timeAlive > 10 * 60 * 1000) {
        const warning = `Component ${componentName} has been alive for ${Math.round(timeAlive / 60000)} minutes. Check for memory leaks.`;
        setWarnings(prev => [...prev, warning]);
        console.warn(warning);
      }
    };

    const interval = setInterval(checkForLeaks, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [componentName]);

  return {
    warnings,
    timeAlive: Date.now() - mountTime.current
  };
}

// Hook for React 18 Concurrent Features
export function useConcurrentFeatures() {
  const [isPending, setIsPending] = useState(false);
  const [transitions, setTransitions] = useState<Array<{
    id: string;
    startTime: number;
    endTime?: number;
    duration?: number;
  }>>([]);

  const startTransition = useCallback((callback: () => void, transitionId?: string) => {
    const id = transitionId || `transition-${Date.now()}`;
    const startTime = performance.now();
    
    setIsPending(true);
    setTransitions(prev => [...prev, { id, startTime }]);

    // Use React's startTransition with our wrapper
    React.startTransition(() => {
      callback();
      
      // Track completion
      setTimeout(() => {
        const endTime = performance.now();
        setTransitions(prev => 
          prev.map(t => 
            t.id === id 
              ? { ...t, endTime, duration: endTime - startTime }
              : t
          )
        );
        setIsPending(false);
      }, 0);
    });
  }, []);

  return {
    isPending,
    transitions,
    startTransition
  };
}

// Hook for Virtual Scrolling optimization
export function useVirtualScrolling<T>(
  items: T[], 
  containerHeight: number, 
  itemHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });

  useEffect(() => {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    setVisibleRange({ start: visibleStart, end: visibleEnd });
  }, [scrollTop, itemHeight, containerHeight, items.length]);

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const visibleItems = items.slice(visibleRange.start, visibleRange.end);
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.start * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll,
    visibleRange
  };
}

// Hook for debounced state updates (helps reduce re-renders)
export function useDebouncedState<T>(initialValue: T, delay: number = 300) {
  const [immediateValue, setImmediateValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(immediateValue);
    }, delay);

    return () => clearTimeout(timer);
  }, [immediateValue, delay]);

  return [debouncedValue, setImmediateValue] as const;
}

// Hook for intersection observer (lazy loading optimization)
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
      setEntry(entry);
    }, options);

    observer.observe(element);

    return () => observer.disconnect();
  }, [options]);

  return {
    ref: elementRef,
    isIntersecting,
    entry
  };
}
