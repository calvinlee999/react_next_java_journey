'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigationStore } from '@/store/zustand/navigation-store';
import { useThemeStore } from '@/store/zustand/theme-store';

// Enhanced Link component with prefetching and analytics
interface SmartLinkProps {
  href: string;
  children: React.ReactNode;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
  className?: string;
  onClick?: () => void;
}

export function SmartLink({ 
  href, 
  children, 
  prefetch = true, 
  replace = false,
  scroll = true,
  className,
  onClick
}: SmartLinkProps) {
  const router = useRouter();
  const { addPrefetchedRoute, recordNavigation } = useNavigationStore();
  const [isPending, startTransition] = useTransition();
  const [startTime, setStartTime] = useState<number>(0);

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) onClick();
    
    setStartTime(performance.now());
    
    startTransition(() => {
      if (replace) {
        router.replace(href, { scroll });
      } else {
        router.push(href, { scroll });
      }
    });
  };

  useEffect(() => {
    if (!isPending && startTime > 0) {
      const duration = performance.now() - startTime;
      recordNavigation(href, duration);
      setStartTime(0);
    }
  }, [isPending, startTime, href, recordNavigation]);

  const handleMouseEnter = () => {
    if (prefetch) {
      addPrefetchedRoute(href);
      router.prefetch(href);
    }
  };

  return (
    <Link 
      href={href}
      className={className}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      data-pending={isPending}
    >
      {children}
    </Link>
  );
}

// Breadcrumb navigation component
interface BreadcrumbItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface BreadcrumbNavigationProps {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
}

export function BreadcrumbNavigation({ 
  items, 
  separator = '/' 
}: BreadcrumbNavigationProps) {
  const { animations } = useThemeStore();

  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-sm">
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <motion.div
            key={item.href}
            initial={animations ? { opacity: 0, x: -10 } : false}
            animate={{ opacity: 1, x: 0 }}
            exit={animations ? { opacity: 0, x: 10 } : false}
            transition={{ duration: 0.2, delay: index * 0.05 }}
            className="flex items-center space-x-2"
          >
            {index > 0 && (
              <span className="text-gray-400" aria-hidden="true">
                {separator}
              </span>
            )}
            <div className="flex items-center space-x-1">
              {item.icon && (
                <span className="w-4 h-4 text-gray-500">{item.icon}</span>
              )}
              {index < items.length - 1 ? (
                <SmartLink 
                  href={item.href} 
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {item.label}
                </SmartLink>
              ) : (
                <span className="text-gray-900 font-medium">{item.label}</span>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </nav>
  );
}

// Navigation progress indicator
export function NavigationProgress() {
  const { isLoading } = useNavigationStore();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isLoading) {
      const timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 100);

      return () => clearInterval(timer);
    } else {
      setProgress(100);
      const timer = setTimeout(() => setProgress(0), 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (progress === 0) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-blue-600 z-50 origin-left"
      initial={{ scaleX: 0 }}
      animate={{ scaleX: progress / 100 }}
      transition={{ duration: 0.2 }}
    />
  );
}

// Route change detector hook
export function useRouteChange() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setCurrentRoute, setSearchParams, setLoading } = useNavigationStore();

  useEffect(() => {
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    setCurrentRoute(url);
    setSearchParams(searchParams);
  }, [pathname, searchParams, setCurrentRoute, setSearchParams]);

  // Simulate loading state for route changes
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, [pathname, setLoading]);
}
