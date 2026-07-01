import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

export type ThemePreset = 'reference-inspired' | 'professional-light' | 'focus-dark';

export const THEME_STORAGE_KEY = 'meeting-web-theme';

export const themePresets: Array<{ id: ThemePreset; label: string; description: string }> = [
  { id: 'reference-inspired', label: '科技', description: '参考页风格' },
  { id: 'professional-light', label: '浅色', description: '办公 SaaS' },
  { id: 'focus-dark', label: '专注', description: '深色阅读' },
];

type ThemeContextValue = {
  theme: ThemePreset;
  setTheme: (theme: ThemePreset) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function normalizeTheme(value: string | null | undefined): ThemePreset {
  return themePresets.some((preset) => preset.id === value)
    ? (value as ThemePreset)
    : 'reference-inspired';
}

function getInitialTheme(): ThemePreset {
  if (typeof window === 'undefined') return 'reference-inspired';
  return normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreset>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(() => ({
    theme,
    setTheme: (nextTheme) => setThemeState(normalizeTheme(nextTheme)),
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return context;
}
