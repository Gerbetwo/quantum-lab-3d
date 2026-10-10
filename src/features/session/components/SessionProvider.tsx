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

interface SessionContextType {
  session: UserSession;
  isHydrated: boolean;
  storageWarning: string | null;
  setActiveMission: (missionId: string) => void;
  completeMission: (missionId: string) => void;
  updateMissionState: (missionId: string, state: Record<string, unknown>) => void;
  recordAction: (actionName: string, payload?: unknown) => void;
  recordMissionTime: (missionId: string, durationMs: number) => void;
  resetSession: () => void;
  deleteAllProgress: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<UserSession>(() => getDefaultSession());
  const [isHydrated, setIsHydrated] = useState(false);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadSession();
    setSession(loaded);
    setIsHydrated(true);
  }, []);

  const updateAndSave = useCallback((updater: (prev: UserSession) => UserSession) => {
    let nextState!: UserSession;
    setSession(prev => {
      nextState = toCanonicalSession(updater(prev), prev.userId);
      return nextState;
    });

    const outcome = saveSession(nextState);
    if (!outcome.success) {
      setStorageWarning(outcome.error ?? 'Failed to persist session storage.');
    } else {
      setStorageWarning(null);
    }
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

  const resetSession = useCallback(() => {
    const fresh = resetCanonicalSession();
    setSession(fresh);
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
    setStorageWarning(null);
  }, []);

  return (
    <SessionContext.Provider
      value={{
        session,
        isHydrated,
        storageWarning,
        setActiveMission,
        completeMission,
        updateMissionState,
        recordAction,
        recordMissionTime,
        resetSession,
        deleteAllProgress,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}