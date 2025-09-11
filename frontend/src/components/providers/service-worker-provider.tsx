'use client';

import { useEffect } from 'react';
import { initServiceWorker } from '@/lib/service-worker';

/**
 * Service Worker Initialization Component
 * Registers and manages Service Worker for the application
 */
export function ServiceWorkerProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  useEffect(() => {
    // Only initialize Service Worker in production or when explicitly enabled
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      initServiceWorker().then((registration) => {
        if (registration) {
          console.log('Service Worker registered successfully');
        }
      }).catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
    }
  }, []);

  return <>{children}</>;
}
