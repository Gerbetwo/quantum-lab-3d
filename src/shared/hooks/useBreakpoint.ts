'use client';

import { useEffect, useState } from 'react';

export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const QUERIES: Record<Breakpoint, string> = {
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1280px)',
  xl: '(min-width: 1920px)',
  '2xl': '(min-width: 2560px)',
};

/**
 * Returns the current breakpoint (largest matching). SSR-safe: returns 'sm' on server.
 * Listens to all queries so a single resize updates once.
 */
export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>('sm');

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mqls = (Object.keys(QUERIES) as Breakpoint[]).map((k) => ({
      k,
      mql: window.matchMedia(QUERIES[k]),
    }));
    const compute = () => {
      const matched = mqls.filter((m) => m.mql.matches).map((m) => m.k);
      setBp((matched[matched.length - 1] as Breakpoint) ?? 'sm');
    };
    compute();
    mqls.forEach((m) => m.mql.addEventListener('change', compute));
    return () => mqls.forEach((m) => m.mql.removeEventListener('change', compute));
  }, []);

  return bp;
}

export function useIsDesktop(): boolean {
  const bp = useBreakpoint();
  return bp === 'lg' || bp === 'xl' || bp === '2xl';
}
