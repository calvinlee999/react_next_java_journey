import { atom, atomWithStorage } from 'jotai';

// User Atom
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
  };
}

export const userAtom = atomWithStorage<User | null>('user', null);

// Navigation Atom
export interface Navigation {
  currentPath: string;
  previousPath: string;
  isTransitioning: boolean;
  transitionDirection: 'forward' | 'backward' | 'none';
}

export const navigationAtom = atom<Navigation>({
  currentPath: '/',
  previousPath: '',
  isTransitioning: false,
  transitionDirection: 'none'
});

// Theme Atom with system preference detection
export const themeAtom = atomWithStorage<'light' | 'dark' | 'system'>('theme', 'system');

// Virtual DOM Optimization Atom
export interface VirtualDOMOptimization {
  batchUpdates: boolean;
  enableTimeSlicing: boolean;
  enableSuspense: boolean;
  enableConcurrentFeatures: boolean;
  renderPriority: 'normal' | 'high' | 'low';
  memoryOptimization: boolean;
}

export const virtualDomOptimizationAtom = atom<VirtualDOMOptimization>({
  batchUpdates: true,
  enableTimeSlicing: true,
  enableSuspense: true,
  enableConcurrentFeatures: true,
  renderPriority: 'normal',
  memoryOptimization: true
});

// Derived atoms for computed values
export const isDarkModeAtom = atom((get) => {
  const theme = get(themeAtom);
  if (theme === 'system') {
    // In a real app, you'd check window.matchMedia('(prefers-color-scheme: dark)')
    return false; // Default for SSR
  }
  return theme === 'dark';
});

export const isAuthenticatedAtom = atom((get) => {
  const user = get(userAtom);
  return user !== null;
});

// Performance tracking atom
export const performanceAtom = atom({
  renderTimes: [] as number[],
  componentCounts: [] as number[],
  memoryUsage: 0,
  lastOptimizationCheck: Date.now()
});
