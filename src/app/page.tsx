'use client';

import React from 'react';
import { useQuantumStore } from '@/store/useQuantumStore';
import { TitleScreenOverlay } from '@/components/game/TitleScreenOverlay';
import { CampaignSelectOverlay } from '@/components/game/CampaignSelectOverlay';
import { MissionWorkspace } from '@/features/missions/MissionWorkspace';
import { CelebrationModal } from '@/components/ui/CelebrationModal';
import Link from 'next/link';
import { Beaker, Sparkles, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const appViewState = useQuantumStore((s) => s.appViewState);
  const setAppViewState = useQuantumStore((s) => s.setAppViewState);
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
        <div className="w-full max-w-4xl mx-auto my-auto p-4 pointer-events-auto flex flex-col gap-4">
          <MissionWorkspace missionId={currentMissionId} />
        </div>
      )}

      {/* 4. Sandbox Mode Tactical HUD */}
      {appViewState === 'SANDBOX' && (
        <div className="w-full max-w-2xl mx-auto my-auto p-6 rounded-2xl border border-purple-500/40 bg-card/85 backdrop-blur-md shadow-2xl flex flex-col items-center text-center gap-4 pointer-events-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/40 border border-purple-500/40 text-purple-300 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" /> UNCONSTRAINED SANDBOX ACTIVE
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans text-foreground">
            Quantum Sandbox Lab
          </h2>

          <p className="text-xs sm:text-sm font-mono text-muted-foreground max-w-md leading-relaxed">
            Directly manipulate the state vector in the persistent 3D Bloch sphere viewport behind this HUD. Experiment with custom unitaries, cryogenic sweeps, and measurement collapse.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setAppViewState('CAMPAIGN_SELECT')}
              className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-cyan/15 hover:bg-cyan/25 text-cyan border border-cyan/40 transition-all active:scale-95"
            >
              MISSION SELECTOR
            </button>
            <Link
              href="/sandbox"
              className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-purple-600 hover:bg-purple-500 text-white border border-purple-400/40 shadow-[0_0_20px_rgba(168,85,247,0.25)] flex items-center gap-2 transition-all active:scale-95"
            >
              <Beaker className="w-4 h-4" /> ADVANCED LAB CONTROLS <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}