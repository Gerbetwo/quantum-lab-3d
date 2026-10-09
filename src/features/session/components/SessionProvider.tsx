'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserSession, loadSession, saveSession, getDefaultSession } from '@/features/session/lib/session';

interface SessionContextType {
  session: UserSession;
  isHydrated: boolean;
  setActiveMission: (missionId: string) => void;
  completeMission: (missionId: string) => void;
  updateMissionState: (missionId: string, state: Record<string, unknown>) => void;
  resetSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<UserSession>(getDefaultSession());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadSession();
    setSession(loaded);
    setIsHydrated(true);
  }, []);

  const persist = useCallback((updater: (prev: UserSession) => UserSession) => {
    setSession(prev => {
      const next = updater(prev);
      saveSession(next);
      return next;
    });
  }, []);

  const setActiveMission = useCallback((missionId: string) => {
    persist(prev => ({ ...prev, activeMission: missionId }));
  }, [persist]);

  const completeMission = useCallback((missionId: string) => {
    persist(prev => {
      const completed = prev.completed.includes(missionId) ? prev.completed : [...prev.completed, missionId];
      return { ...prev, completed };
    });
  }, [persist]);

  const updateMissionState = useCallback((missionId: string, state: Record<string, unknown>) => {
    persist(prev => ({
      ...prev,
      missionState: { ...prev.missionState, [missionId]: { ...(prev.missionState[missionId] || {}), ...(state as Record<string, unknown>) } }
    }));
  }, [persist]);

  const resetSession = useCallback(() => {
    const fresh = getDefaultSession();
    setSession(fresh);
    saveSession(fresh);
  }, []);

  return (
    <SessionContext.Provider value={{ session, isHydrated, setActiveMission, completeMission, updateMissionState, resetSession }}>
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