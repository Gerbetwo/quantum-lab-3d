'use client';

import React from 'react';
import { useQuantumStore } from '@/store/useQuantumStore';
import { TitleScreenOverlay } from '@/components/game/TitleScreenOverlay';
import { CampaignSelectOverlay } from '@/components/game/CampaignSelectOverlay';
import { MissionWorkspace } from '@/features/missions/MissionWorkspace';
import { CelebrationModal } from '@/components/ui/CelebrationModal';

export default function HomePage() {
  const appViewState = useQuantumStore((s) => s.appViewState);
  const currentMissionId = useQuantumStore((s) => s.currentMissionId ?? s.activeMissionId ?? 'superposition');

  return (
    <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full min-h-full">
      {/* Course Completion Confetti Modal */}
      <CelebrationModal />

      {/* 1. Title Screen State Overlay */}
      {appViewState === 'TITLE' && <TitleScreenOverlay />}

      {/* 2. Tactical Campaign Mission Roster Overlay */}
      {appViewState === 'CAMPAIGN_SELECT' && <CampaignSelectOverlay />}

      {/* 3. In-Mission Active Tactical HUD */}
      {appViewState === 'IN_MISSION' && (
        <MissionWorkspace missionId={currentMissionId} />
      )}

      {/* 4. Sandbox Mode Tactical HUD */}
      {appViewState === 'SANDBOX' && (
        <MissionWorkspace missionId="superposition" />
      )}
    </div>
  );
}