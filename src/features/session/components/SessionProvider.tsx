'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  UserSession,
  loadSession,
  saveSession,
  getDefaultSession,
  resetCanonicalSession,
  toCanonicalSession,
  toCanonicalMissionId,
  completeMissionInSession,
  recordMissionTimeInSession,
  deleteAllLocalProgress,
} from '@/features/session/lib/sessionService';

export interface SessionContextType {
  session: UserSession;
  isHydrated: boolean;
  storageWarning: string | null;
  elapsedSeconds: number;
  isRunning: boolean;
  setActiveMission: (missionId: string) => void;
  completeMission: (missionId: string) => void;
  updateMissionState: (missionId: string, state: Record<string, unknown>) => void;
  recordAction: (actionName: string, payload?: unknown) => void;
  recordMissionTime: (missionId: string, durationMs: number) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  incrementActionCount: (actionType: string) => void;
  resetSession: () => void;
  deleteAllProgress: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<UserSession>(() => getDefaultSession());
  const [isHydrated, setIsHydrated] = useState(false);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);

  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(true);

  useEffect(() => {
    const loaded = loadSession();
    setSession(loaded);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isRunning || !isHydrated) return;
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, isHydrated]);

  const updateAndSave = useCallback((updater: (prev: UserSession) => UserSession) => {
    setSession(prev => {
      const nextState = toCanonicalSession(updater(prev), prev.userId);
      const outcome = saveSession(nextState);

      if (!outcome.success) {
        setTimeout(() => {
          setStorageWarning(outcome.error ?? 'Failed to persist session storage.');
        }, 0);
      } else {
        setTimeout(() => {
          setStorageWarning(null);
        }, 0);
      }

      return nextState;
    });
  }, []);

  const setActiveMission = useCallback((missionId: string) => {
    const canonical = toCanonicalMissionId(missionId);
    if (!canonical) return;
    updateAndSave(prev => ({ ...prev, activeMission: canonical }));
  }, [updateAndSave]);

  const completeMission = useCallback((missionId: string) => {
    updateAndSave(prev => completeMissionInSession(prev, missionId));
  }, [updateAndSave]);

  const updateMissionState = useCallback((missionId: string, state: Record<string, unknown>) => {
    const canonical = toCanonicalMissionId(missionId);
    if (!canonical) return;
    updateAndSave(prev => ({
      ...prev,
      missionState: {
        ...prev.missionState,
        [canonical]: { ...((prev.missionState[canonical] as Record<string, unknown> | undefined) || {}), ...state },
      },
    }));
  }, [updateAndSave]);

  const recordAction = useCallback((actionName: string, payload?: unknown) => {
    updateAndSave(prev => ({
      ...prev,
      events: [...prev.events, { type: actionName, timestamp: Date.now(), payload }],
    }));
  }, [updateAndSave]);

  const recordMissionTime = useCallback((missionId: string, durationMs: number) => {
    updateAndSave(prev => recordMissionTimeInSession(prev, missionId, durationMs));
  }, [updateAndSave]);

  const pauseSession = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resumeSession = useCallback(() => {
    setIsRunning(true);
  }, []);

  const incrementActionCount = useCallback((actionType: string) => {
    recordAction(actionType);
  }, [recordAction]);

  const resetSession = useCallback(() => {
    const fresh = resetCanonicalSession();
    setSession(fresh);
    setElapsedSeconds(0);
    setIsRunning(true);
    const outcome = saveSession(fresh);
    if (!outcome.success) {
      setStorageWarning(outcome.error ?? 'Failed to persist session storage.');
    } else {
      setStorageWarning(null);
    }
  }, []);

  const deleteAllProgress = useCallback(() => {
    deleteAllLocalProgress();
    const fresh = resetCanonicalSession();
    setSession(fresh);
    setElapsedSeconds(0);
    setIsRunning(true);
    setStorageWarning(null);
  }, []);

  return (
    <SessionContext.Provider
      value={{
        session,
        isHydrated,
        storageWarning,
        elapsedSeconds,
        isRunning,
        setActiveMission,
        completeMission,
        updateMissionState,
        recordAction,
        recordMissionTime,
        pauseSession,
        resumeSession,
        incrementActionCount,
        resetSession,
        deleteAllProgress,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

const DEFAULT_SESSION_CONTEXT: SessionContextType = {
  session: getDefaultSession(),
  isHydrated: true,
  storageWarning: null,
  elapsedSeconds: 0,
  isRunning: false,
  setActiveMission: () => {},
  completeMission: () => {},
  updateMissionState: () => {},
  recordAction: () => {},
  recordMissionTime: () => {},
  pauseSession: () => {},
  resumeSession: () => {},
  incrementActionCount: () => {},
  resetSession: () => {},
  deleteAllProgress: () => {},
};

export function useSession(): SessionContextType {
  const context = useContext(SessionContext);
  if (!context) {
    return DEFAULT_SESSION_CONTEXT;
  }
  return context;
}
