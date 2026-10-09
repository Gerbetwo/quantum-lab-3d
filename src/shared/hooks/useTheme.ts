'use client';

import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';
const STORAGE_KEY = 'ql-theme';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('dark');
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let initial: Theme = 'dark';
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') initial = stored;
    } catch { /* ignore */ }
    setTheme(initial);
    document.documentElement.classList.toggle('dark', initial === 'dark');
  }, []);
  const toggle = () => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      if (typeof document !== 'undefined') document.documentElement.classList.toggle('dark', next === 'dark');
      try { window.localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
      return next;
    });
  };
  return { theme, toggle };
}
