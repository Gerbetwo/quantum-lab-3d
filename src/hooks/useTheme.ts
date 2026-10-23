'use client';

import { useEffect, useState, useCallback } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'ql-theme';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
  } catch {
    // Storage access might fail in certain environments
  }
  return 'dark';
}

/**
 * Native DOM theme hook that directly controls classes on document.documentElement.
 * Does not require external theme context providers.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  const applyThemeToDom = useCallback((targetTheme: Theme) => {
    if (typeof document === 'undefined') return;
    const isDark = targetTheme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('theme-dark', isDark);
    document.documentElement.classList.toggle('theme-light', !isDark);
    try {
      localStorage.setItem(STORAGE_KEY, targetTheme);
    } catch {
      // Storage access may fail in private mode or non-browser environments
    }
  }, []);

  useEffect(() => {
    applyThemeToDom(theme);
  }, [theme, applyThemeToDom]);

  const setTheme = useCallback(
    (next: Theme) => {
      setThemeState(next);
      applyThemeToDom(next);
    },
    [applyThemeToDom]
  );

  const toggle = useCallback(() => {
    setThemeState((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      applyThemeToDom(next);
      return next;
    });
  }, [applyThemeToDom]);

  return {
    theme,
    isDark: theme === 'dark',
    toggle,
    toggleTheme: toggle,
    setTheme,
  };
}

export default useTheme;
