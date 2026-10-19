'use client';

import { useEffect } from 'react';
import { useQuantumStore } from '@/store/useQuantumStore';
import type { MissionId } from '@/features/missions/missionRegistry';

export function MissionLauncher({ missionId }: { missionId: MissionId }) {
  const launchMission = useQuantumStore((s) => s.launchMission);

  useEffect(() => {
    launchMission(missionId);
  }, [missionId, launchMission]);

  return null;
}
