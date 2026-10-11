'use client';

import { useState } from 'react';

export type Theme = 'light' | 'dark';
const STORAGE_KEY = 'ql-theme';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        document.documentElement.classList.toggle('dark', stored === 'dark');
        return stored;
      }
    } catch { /* ignore */ }
    document.documentElement.classList.toggle('dark', true);
    return 'dark';
  });
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
