'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Session,
  loadSession,
  saveSession,
  completeMissionInSession,
  recordMissionTimeInSession,
  resetCanonicalSession,
  createEmptySession,
} from '@/lib/session';
import { MissionId, isMissionId } from '@/config/missions';

export function useSession() {
  const [session, setSession] = useState<Session>(() => createEmptySession());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setSession(loadSession());
    setIsHydrated(true);
  }, []);

  const setActiveMission = useCallback((missionId: MissionId | null) => {
    setSession(prev => {
      const next: Session = { ...prev, activeMission: missionId ?? prev.activeMission };
      saveSession(next);
      return next;
    });
  }, []);

  const completeMission = useCallback((missionId: MissionId) => {
    setSession(prev => completeMissionInSession(prev, missionId));
  }, []);

  const recordTime = useCallback((missionId: MissionId, seconds: number) => {
    setSession(prev => recordMissionTimeInSession(prev, missionId, seconds));
  }, []);

  const resetSession = useCallback(() => {
    setSession(resetCanonicalSession());
  }, []);

  const isUnlocked = useCallback(
    (missionId: MissionId): boolean => {
      if (!isMissionId(missionId)) return false;
      if (missionId === 'superposition') return true;
      if (missionId === 'entanglement') return session.completed.includes('superposition');
      if (missionId === 'decoherence') return session.completed.includes('entanglement');
      if (missionId === 'applications') return session.completed.includes('decoherence');
      return true;
    },
    [session.completed]
  );

  return {
    session,
    isHydrated,
    setActiveMission,
    completeMission,
    recordTime,
    resetSession,
    isUnlocked,
  };
}
