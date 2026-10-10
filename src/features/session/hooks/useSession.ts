'use client';

import { useCallback } from 'react';
import { useSession as useSessionContext } from '@/features/session/components/SessionProvider';
import { MissionId, isMissionId } from '@/features/missions/config/missions';

const MISSION_ORDER: MissionId[] = [
  'superposition',
  'entanglement',
  'decoherence',
  'applications',
  'gates',
  'grover',
  'error-correction',
];

export function useSession() {
  const {
    session,
    isHydrated,
    setActiveMission: setCanonicalActiveMission,
    completeMission,
    recordMissionTime,
    resetSession,
  } = useSessionContext();

  const setActiveMission = useCallback(
    (missionId: MissionId | null) => {
      if (missionId) {
        setCanonicalActiveMission(missionId);
      } else if (session.activeMission) {
        setCanonicalActiveMission(session.activeMission);
      }
    },
    [setCanonicalActiveMission, session.activeMission]
  );

  const recordTime = useCallback(
    (missionId: MissionId, seconds: number) => {
      recordMissionTime(missionId, seconds);
    },
    [recordMissionTime]
  );

  const isUnlocked = useCallback(
    (missionId: MissionId): boolean => {
      if (!isMissionId(missionId)) return false;
      const index = MISSION_ORDER.indexOf(missionId);
      if (index <= 0) return true;
      const prevMission = MISSION_ORDER[index - 1];
      return session.completed.includes(prevMission);
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