import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

// App Store for global application state
interface AppState {
  user: {
    id: string | null;
    name: string | null;
    email: string | null;
    preferences: Record<string, any>;
  };
  settings: {
    language: string;
    timezone: string;
    notifications: boolean;
  };
  // Actions
  setUser: (user: Partial<AppState['user']>) => void;
  updateSettings: (settings: Partial<AppState['settings']>) => void;
  clearUser: () => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        user: {
          id: null,
          name: null,
          email: null,
          preferences: {}
        },
        settings: {
          language: 'en',
          timezone: 'UTC',
          notifications: true
        },
        setUser: (user) =>
          set((state) => ({
            user: { ...state.user, ...user }
          }), false, 'setUser'),
        updateSettings: (settings) =>
          set((state) => ({
            settings: { ...state.settings, ...settings }
          }), false, 'updateSettings'),
        clearUser: () =>
          set({
            user: {
              id: null,
              name: null,
              email: null,
              preferences: {}
            }
          }, false, 'clearUser')
      }),
      {
        name: 'app-store',
        partialize: (state) => ({
          user: state.user,
          settings: state.settings
        })
      }
    )
  )
);
