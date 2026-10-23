'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'ql-theme';

/** Window event used to keep every mounted useTheme() instance in sync. */
export const THEME_CHANGE_EVENT = 'ql-theme-change';

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark';
}

/**
 * Client-only theme preference lookup (storage first, then OS media query).
 * MUST only be called after mount — never during render — to keep SSR/hydration aligned.
 */
export function readPreferredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isTheme(stored)) return stored;
    if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
  } catch {
    // Storage access might fail in certain environments
  }
  return 'dark';
}

function applyThemeToDom(targetTheme: Theme): void {
  if (typeof document === 'undefined') return;
  const isDark = targetTheme === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.classList.toggle('theme-dark', isDark);
  document.documentElement.classList.toggle('theme-light', !isDark);
}

function persistAndBroadcast(next: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Storage access may fail in private mode or non-browser environments
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<Theme>(THEME_CHANGE_EVENT, { detail: next }));
  }
}

/**
 * Native DOM theme hook that directly controls classes on document.documentElement.
 * Does not require external theme context providers.
 * Renders 'dark' on the server and first client frame (matches layout.tsx); the stored /
 * OS preference is applied post-mount and is never overwritten by the initial render.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [isMounted, setIsMounted] = useState(false);
  const themeRef = useRef<Theme>('dark');

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const preferred = readPreferredTheme();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate post-hydration sync with browser storage
    setThemeState(preferred);
    setIsMounted(true);
    applyThemeToDom(preferred);

    const onThemeChange = (e: Event) => {
      const next = (e as CustomEvent<Theme>).detail;
      if (isTheme(next)) setThemeState(next);
    };
    window.addEventListener(THEME_CHANGE_EVENT, onThemeChange);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, onThemeChange);
  }, []);

  useEffect(() => {
    if (isMounted) applyThemeToDom(theme);
  }, [theme, isMounted]);

  const setTheme = useCallback((next: Theme) => {
    themeRef.current = next;
    setThemeState(next);
    applyThemeToDom(next);
    persistAndBroadcast(next);
  }, []);

  const toggle = useCallback(() => {
    setTheme(themeRef.current === 'dark' ? 'light' : 'dark');
  }, [setTheme]);

  return {
    theme,
    isDark: theme === 'dark',
    isMounted,
    toggle,
    toggleTheme: toggle,
    setTheme,
  };
}

export default useTheme;
