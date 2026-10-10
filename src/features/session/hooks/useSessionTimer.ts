/**
 * Canonical Session Timer Hook
 * Provides synchronized elapsed time in seconds, pause/resume controls, 
 * action tracking, and formatted representation for header consumption.
 */
'use client';

import { useMemo } from 'react';
import { useSession } from '@/features/session/components/SessionProvider';

export interface UseSessionTimerResult {
  elapsedSeconds: number;
  formattedTime: string;
  isRunning: boolean;
  pauseTimer: () => void;
  resumeTimer: () => void;
  recordAction: (actionType: string) => void;
}

export function useSessionTimer(): UseSessionTimerResult {
  const { 
    elapsedSeconds, 
    isRunning, 
    pauseSession, 
    resumeSession, 
    incrementActionCount 
  } = useSession();

  // Format elapsed seconds into MM:SS or HH:MM:SS for header consumption
  const formattedTime = useMemo(() => {
    const hrs = Math.floor(elapsedSeconds / 3600);
    const mins = Math.floor((elapsedSeconds % 3600) / 60);
    const secs = elapsedSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (hrs > 0) {
      return `${hrs}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  }, [elapsedSeconds]);

  return {
    elapsedSeconds,
    formattedTime,
    isRunning,
    pauseTimer: pauseSession,
    resumeTimer: resumeSession,
    recordAction: incrementActionCount,
  };
}