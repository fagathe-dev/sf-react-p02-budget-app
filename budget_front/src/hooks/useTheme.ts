import { darkTheme, lightTheme } from '@/ui/theme';
import { AppTheme } from '@/ui/types';
import { useCallback } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Thème effectivement appliqué (jamais 'system'). */
export type ThemeMode = 'light' | 'dark';

/** Choix de l'utilisateur : 'system' suit le réglage de l'appareil / du navigateur. */
export type ThemePreference = ThemeMode | 'system';

const DARK_QUERY = '(prefers-color-scheme: dark)';

const getSystemMode = (): ThemeMode =>
  typeof window !== 'undefined' && window.matchMedia?.(DARK_QUERY).matches ? 'dark' : 'light';

interface ThemeState {
  preference: ThemePreference;
  /** Réglage courant de l'appareil, mis à jour en direct (voir le listener plus bas). */
  systemMode: ThemeMode;
  setPreference: (preference: ThemePreference) => void;
  setSystemMode: (mode: ThemeMode) => void;
}

/** Transforme la préférence en thème réellement appliqué. */
export const resolveMode = ({ preference, systemMode }: Pick<ThemeState, 'preference' | 'systemMode'>): ThemeMode =>
  preference === 'system' ? systemMode : preference;

const syncDocumentTheme = (mode: ThemeMode): void => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  root.setAttribute('data-theme', mode);
  root.setAttribute('data-ds-theme', mode);
  root.style.colorScheme = mode;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: 'system',
      systemMode: getSystemMode(),
      setPreference: (preference) => set({ preference }),
      setSystemMode: (systemMode) => set({ systemMode }),
    }),
    {
      name: 'ds-app-theme',
      version: 1,
      // Seule la préférence est persistée : le réglage système est relu à chaque démarrage
      partialize: (state) => ({ preference: state.preference }),
      migrate: (persisted, version) => {
        // v0 : { mode: 'light' | 'dark' } -> v1 : { preference }
        if (version === 0) {
          const legacy = persisted as { mode?: ThemeMode } | null;
          return { preference: legacy?.mode === 'dark' ? 'dark' : 'light' } as {
            preference: ThemePreference;
          };
        }
        return persisted as { preference: ThemePreference };
      },
    }
  )
);

// Garde l'attribut data-theme / color-scheme du <html> aligné sur le thème appliqué
syncDocumentTheme(resolveMode(useThemeStore.getState()));
useThemeStore.subscribe((state, previous) => {
  const next = resolveMode(state);
  if (next !== resolveMode(previous)) syncDocumentTheme(next);
});

// Suit le réglage système en direct (changement dans l'OS, bascule jour/nuit automatique…)
if (typeof window !== 'undefined' && window.matchMedia) {
  window.matchMedia(DARK_QUERY).addEventListener('change', (event) => {
    useThemeStore.getState().setSystemMode(event.matches ? 'dark' : 'light');
  });
}

export interface UseThemeReturn {
  theme: AppTheme;
  /** Thème effectivement appliqué : 'light' ou 'dark' (jamais 'system'). */
  mode: ThemeMode;
  /** Choix de l'utilisateur : 'light', 'dark' ou 'system'. */
  preference: ThemePreference;
  isDark: boolean;
  setPreference: (preference: ThemePreference) => void;
  /** Alias de setPreference, conservé pour compatibilité (accepte aussi 'system'). */
  setMode: (preference: ThemePreference) => void;
  /** Bascule clair <-> sombre à partir du thème appliqué (fixe un choix explicite). */
  toggleTheme: () => void;
}

export const useTheme = (): UseThemeReturn => {
  const preference = useThemeStore((state) => state.preference);
  const systemMode = useThemeStore((state) => state.systemMode);
  const setPreference = useThemeStore((state) => state.setPreference);

  const mode = resolveMode({ preference, systemMode });
  const theme: AppTheme = mode === 'dark' ? darkTheme : lightTheme;

  const toggleTheme = useCallback(() => {
    setPreference(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setPreference]);

  return {
    theme,
    mode,
    preference,
    isDark: mode === 'dark',
    setPreference,
    setMode: setPreference,
    toggleTheme,
  };
};
