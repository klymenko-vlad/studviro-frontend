import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { THEME_STORAGE_KEY } from '@/shared/config';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

/**
 * Reference Zustand store: small, one concern, persisted to localStorage.
 *
 * Note what is *not* here — no server data. Anything the API owns belongs in the
 * TanStack Query cache; copying it into a store gives you a second source of
 * truth that goes stale the moment the first one refetches.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    set => ({
      // `system` follows the OS until the user makes an explicit choice.
      theme: 'system',
      setTheme: theme => {
        set({ theme });
        applyTheme(theme);
      },
    }),
    {
      name: THEME_STORAGE_KEY,
      onRehydrateStorage: () => state => {
        if (state) applyTheme(state.theme);
      },
    },
  ),
);

/**
 * Toggles the `dark` class the design tokens key off. Kept outside React because
 * it must also run during rehydration, before any component renders.
 */
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;

  const resolved =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;

  document.documentElement.classList.toggle('dark', resolved === 'dark');
  document.documentElement.style.colorScheme = resolved;
}
