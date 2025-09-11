'use client';

import React, { 
  memo, 
  useMemo, 
  useCallback, 
  useEffect, 
  useRef, 
  useState,
  Suspense,
  lazy,
  startTransition
} from 'react';
import { useInView } from 'react-intersection-observer';
import { useVirtualizer } from '@tanstack/react-virtual';

// Memoized component wrapper for expensive renders
interface MemoWrapperProps {
  children: React.ReactNode;
  dependencies: unknown[];
  displayName?: string;
}

export const MemoWrapper = memo<MemoWrapperProps>(function MemoWrapper({ 
  children, 
  dependencies,
  displayName = 'MemoWrapper'
}) {
  return <>{children}</>;
}, (prevProps, nextProps) => {
  // Custom comparison for dependencies
  if (prevProps.dependencies.length !== nextProps.dependencies.length) {
    return false;
  }
  
  return prevProps.dependencies.every((dep, index) => 
    Object.is(dep, nextProps.dependencies[index])
  );
});

// Virtual list component for large datasets
interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  getItemKey?: (item: T, index: number) => string | number;
  overscan?: number;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  getItemKey = (_, index) => index,
  overscan = 5
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan
  });

  const memoizedItems = useMemo(() => 
    virtualizer.getVirtualItems()
  , [virtualizer, items]);

  return (
    <div
      ref={parentRef}
      style={{ height: containerHeight, overflow: 'auto' }}
      className="virtual-list-container"
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative'
        }}
      >
        {memoizedItems.map((virtualItem) => {
          const item = items[virtualItem.index];
          return (
            <div
              key={getItemKey(item, virtualItem.index)}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: virtualItem.size,
                transform: `translateY(${virtualItem.start}px)`
              }}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Lazy loading component with intersection observer
interface LazyLoadProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
  triggerOnce?: boolean;
}

export function LazyLoad({ 
  children, 
  fallback = <div>Loading...</div>,
  rootMargin = '50px',
  threshold = 0.1,
  triggerOnce = true
}: LazyLoadProps) {
  const { ref, inView } = useInView({
    threshold,
    rootMargin,
    triggerOnce
  });

  return (
    <div ref={ref}>
      {inView ? children : fallback}
    </div>
  );
}

// Optimized image component with lazy loading
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: string;
}

export const OptimizedImage = memo<OptimizedImageProps>(function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  placeholder
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const { ref: inViewRef, inView } = useInView({
    triggerOnce: true,
    rootMargin: '50px'
  });

  const shouldLoad = priority || inView;

  useEffect(() => {
    if (shouldLoad && imgRef.current && !isLoaded) {
      const img = imgRef.current;
      
      const handleLoad = () => setIsLoaded(true);
      const handleError = () => setError(true);
      
      img.addEventListener('load', handleLoad);
      img.addEventListener('error', handleError);
      
      return () => {
        img.removeEventListener('load', handleLoad);
        img.removeEventListener('error', handleError);
      };
    }
  }, [shouldLoad, isLoaded]);

  return (
    <div ref={inViewRef} className={`relative ${className || ''}`}>
      {placeholder && !isLoaded && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{ width, height }}
        />
      )}
      {shouldLoad && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${error ? 'hidden' : ''}`}
          loading={priority ? 'eager' : 'lazy'}
        />
      )}
      {error && (
        <div 
          className="flex items-center justify-center bg-gray-100 text-gray-500"
          style={{ width, height }}
        >
          Failed to load image
        </div>
      )}
    </div>
  );
});

// Performance monitoring component
export function PerformanceMonitor({ children }: { children: React.ReactNode }) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());
  
  useEffect(() => {
    renderCount.current += 1;
    const currentTime = performance.now();
    const renderTime = currentTime - lastRenderTime.current;
    
    if (renderTime > 16.67) { // Slower than 60fps
      console.warn(`Slow render detected: ${renderTime.toFixed(2)}ms`);
    }
    
    lastRenderTime.current = currentTime;
  });

  return <>{children}</>;
}

// Concurrent features wrapper
interface ConcurrentWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  errorBoundary?: boolean;
}

export function ConcurrentWrapper({ 
  children, 
  fallback = <div>Loading...</div>,
  errorBoundary = true
}: ConcurrentWrapperProps) {
  const [isPending, startTransition] = React.useTransition();
  const [content, setContent] = useState(children);

  useEffect(() => {
    startTransition(() => {
      setContent(children);
    });
  }, [children]);

  if (isPending) {
    return <>{fallback}</>;
  }

  return (
    <Suspense fallback={fallback}>
      {content}
    </Suspense>
  );
}

// Debounced component for frequent updates
interface DebouncedComponentProps {
  children: React.ReactNode;
  delay?: number;
  dependencies: unknown[];
}

export function DebouncedComponent({ 
  children, 
  delay = 300,
  dependencies 
}: DebouncedComponentProps) {
  const [debouncedChildren, setDebouncedChildren] = useState(children);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedChildren(children);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [children, delay, ...dependencies]);
  
  return <>{debouncedChildren}</>;
}
