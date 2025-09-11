import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// Theme Store for UI theming and preferences
interface ThemeState {
  theme: 'light' | 'dark' | 'system';
  primaryColor: string;
  fontSize: 'sm' | 'md' | 'lg';
  animations: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setPrimaryColor: (color: string) => void;
  setFontSize: (size: 'sm' | 'md' | 'lg') => void;
  toggleAnimations: () => void;
  toggleReducedMotion: () => void;
  toggleHighContrast: () => void;
  resetToDefaults: () => void;
}

const defaultThemeState = {
  theme: 'system' as const,
  primaryColor: '#3b82f6',
  fontSize: 'md' as const,
  animations: true,
  reducedMotion: false,
  highContrast: false
};

export const useThemeStore = create<ThemeState>()(
  devtools(
    persist(
      (set) => ({
        ...defaultThemeState,
        
        setTheme: (theme) =>
          set({ theme }, false, 'setTheme'),
          
        setPrimaryColor: (color) =>
          set({ primaryColor: color }, false, 'setPrimaryColor'),
          
        setFontSize: (size) =>
          set({ fontSize: size }, false, 'setFontSize'),
          
        toggleAnimations: () =>
          set((state) => ({ animations: !state.animations }), false, 'toggleAnimations'),
          
        toggleReducedMotion: () =>
          set((state) => ({ reducedMotion: !state.reducedMotion }), false, 'toggleReducedMotion'),
          
        toggleHighContrast: () =>
          set((state) => ({ highContrast: !state.highContrast }), false, 'toggleHighContrast'),
          
        resetToDefaults: () =>
          set(defaultThemeState, false, 'resetToDefaults')
      }),
      {
        name: 'theme-store'
      }
    )
  )
);
