'use client';

import React, { useEffect } from 'react';
import { useQuantumStore } from '@/store/useQuantumStore';

export function SessionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const interval = setInterval(() => {
      const state = useQuantumStore.getState();
      if (state && typeof state.tick === 'function') {
        state.tick();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return <>{children}</>;
}
