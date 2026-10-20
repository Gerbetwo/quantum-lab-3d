'use client';

import React from 'react';
import { useQuantumStore } from '@/store/useQuantumStore';
import { TitleScreenOverlay } from '@/components/game/TitleScreenOverlay';
import { CampaignSelectOverlay } from '@/components/game/CampaignSelectOverlay';
import { CelebrationModal } from '@/components/ui/CelebrationModal';
import { MissionCanvasShell } from '@/components/framework/MissionCanvasShell';
import { Mission01StateVector } from '@/components/missions/Mission01StateVector';
import { Mission02GateRotations } from '@/components/missions/Mission02GateRotations';
import { Mission03Measurement } from '@/components/missions/Mission03Measurement';
import { Mission04Interference } from '@/components/missions/Mission04Interference';
import { Mission05Entanglement } from '@/components/missions/Mission05Entanglement';
import { Mission06Decoherence } from '@/components/missions/Mission06Decoherence';
import { Mission07GroverSearch } from '@/components/missions/Mission07GroverSearch';

function renderMissionView(missionId: string) {
  switch (missionId) {
    case 'gates':
      return <Mission02GateRotations />;
    case 'measurement':
      return <Mission03Measurement missionId="measurement" />;
    case 'interference':
      return <Mission04Interference missionId="interference" />;
    case 'entanglement':
      return <Mission05Entanglement missionId="entanglement" />;
    case 'decoherence':
      return <Mission06Decoherence missionId="decoherence" />;
    case 'grover':
      return <Mission07GroverSearch missionId="grover" />;
    case 'superposition':
      return <Mission01StateVector />;
    default:
      return (
        <MissionCanvasShell missionId={missionId}>
          <Mission01StateVector />
        </MissionCanvasShell>
      );
  }
}

export default function HomePage() {
  const appViewState = useQuantumStore((s) => s.appViewState);
  const currentMissionId = useQuantumStore((s) => s.currentMissionId ?? 'superposition');

  return (
    <div className="relative z-10 flex-1 flex flex-col items-center justify-center w-full min-h-full">
      {/* Course Completion Confetti Modal */}
      <CelebrationModal />

      {/* 1. Title Screen State Overlay */}
      {appViewState === 'TITLE' && <TitleScreenOverlay />}

      {/* 2. Tactical Campaign Mission Roster Overlay */}
      {appViewState === 'CAMPAIGN_SELECT' && <CampaignSelectOverlay />}

      {/* 3. In-Mission Active Tactical HUD */}
      {appViewState === 'IN_MISSION' && renderMissionView(currentMissionId)}

      {/* 4. Sandbox Mode Tactical HUD */}
      {appViewState === 'SANDBOX' && renderMissionView('superposition')}
    </div>
  );
}