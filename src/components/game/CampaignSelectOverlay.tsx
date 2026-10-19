'use client';

import React from 'react';
import { useQuantumStore } from '@/store/useQuantumStore';
import { soundEngine } from '@/lib/soundEngine';
import { useTranslation, DICTIONARY } from '@/lib/i18n';
import type { MissionId } from '@/features/missions/missionRegistry';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Beaker,
  ShieldCheck,
} from 'lucide-react';

interface MissionNodeData {
  id: MissionId;
  index: number;
  order: number;
  code: string;
  concept: string;
  title: string;
  subtitle: string;
  difficulty: 'FOUNDATIONAL' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  difficultyColor: string;
}

const CAMPAIGN_NODES: MissionNodeData[] = [
  {
    id: 'superposition',
    index: 0,
    order: 1,
    code: 'MSN-01',
    concept: 'Superposition',
    title: 'Superposición Cuántica',
    subtitle: '|0⟩, |1⟩ & Bloch Sphere Geometry',
    difficulty: 'FOUNDATIONAL',
    difficultyColor: 'hud-badge-emerald',
  },
  {
    id: 'entanglement',
    index: 1,
    order: 2,
    code: 'MSN-02',
    concept: 'Entanglement',
    title: 'Entrelazamiento Cuántico',
    subtitle: 'Bell States & Correlated Collapse',
    difficulty: 'INTERMEDIATE',
    difficultyColor: 'hud-badge-cyan',
  },
  {
    id: 'decoherence',
    index: 2,
    order: 3,
    code: 'MSN-03',
    concept: 'Decoherence',
    title: 'Decoherencia y Ruido',
    subtitle: 'Thermal Bath & T2 Dephasing',
    difficulty: 'INTERMEDIATE',
    difficultyColor: 'hud-badge-amber',
  },
  {
    id: 'gates',
    index: 3,
    order: 4,
    code: 'MSN-04',
    concept: 'Unitary Gates',
    title: 'Puertas Cuánticas',
    subtitle: 'Pauli X, Z, Hadamard Rotations',
    difficulty: 'INTERMEDIATE',
    difficultyColor: 'hud-badge-cyan',
  },
  {
    id: 'grover',
    index: 4,
    order: 5,
    code: 'MSN-05',
    concept: 'Grover Search',
    title: 'Algoritmo de Grover',
    subtitle: 'Amplitude Amplification & Diffusion',
    difficulty: 'ADVANCED',
    difficultyColor: 'hud-badge-purple',
  },
  {
    id: 'applications',
    index: 5,
    order: 6,
    code: 'MSN-06',
    concept: 'Shor Factorization',
    title: 'Factorización de Shor',
    subtitle: 'Period Finding & N=15 Factorization',
    difficulty: 'ADVANCED',
    difficultyColor: 'hud-badge-purple',
  },
  {
    id: 'error-correction',
    index: 6,
    order: 7,
    code: 'MSN-07',
    concept: '3-Qubit QEC',
    title: 'Corrección de Errores',
    subtitle: 'Bit-Flip Code & Syndrome Recovery',
    difficulty: 'EXPERT',
    difficultyColor: 'hud-badge-rose',
  },
];

interface CampaignSelectOverlayProps {
  forceVisible?: boolean;
}

export function CampaignSelectOverlay({ forceVisible = false }: CampaignSelectOverlayProps = {}) {
  const { language } = useTranslation();
  const appViewState = useQuantumStore((s) => s.appViewState);
  const setAppViewState = useQuantumStore((s) => s.setAppViewState);
  const returnToTitle = useQuantumStore((s) => s.returnToTitle);
  const launchMission = useQuantumStore((s) => s.launchMission);
  const completedMissions = useQuantumStore((s) => s.completedMissions);

  if (appViewState !== 'CAMPAIGN_SELECT' && !forceVisible) {
    return null;
  }

  const handleLaunch = (id: MissionId) => {
    soundEngine.unlock();
    soundEngine.playVectorSnap();
    launchMission(id);
  };

  const handleGoToSandbox = () => {
    soundEngine.unlock();
    soundEngine.playVectorSnap();
    setAppViewState('SANDBOX');
  };

  const completedCount = completedMissions.length;

  return (
    <div
      data-testid="campaign-select-overlay"
      className="fixed inset-0 z-40 flex flex-col bg-background/90 backdrop-blur-md overflow-y-auto p-4 md:p-8 select-none"
    >
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
        {/* Flight-Deck Top Bar */}
        <header className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card/60 backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                returnToTitle();
              }}
              data-testid="return-to-title-button"
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-surface-2 hover:bg-surface-3 text-muted-foreground hover:text-foreground border border-edge flex items-center gap-1.5 transition-all active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>TITLE</span>
            </button>
            <div className="border-l border-border/80 pl-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan" />
                <h2 className="text-sm font-bold tracking-wide text-foreground uppercase font-mono">
                  Flight-Deck Campaign Roster
                </h2>
              </div>
              <p className="text-[11px] text-muted-foreground font-mono">
                Select a tactical mission node or launch the sandbox simulation harness.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-2 border border-edge text-xs font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-muted-foreground">Progression:</span>
              <span className="text-cyan font-bold">{completedCount} / 7 Mastered</span>
            </div>

            {/* Top-bar button to jump directly to SANDBOX mode */}
            <button
              type="button"
              onClick={handleGoToSandbox}
              data-testid="topbar-sandbox-button"
              className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center gap-2 border border-purple-400/40 shadow-[0_0_20px_rgba(168,85,247,0.25)] transition-all active:scale-95"
            >
              <Beaker className="w-4 h-4 text-purple-200" />
              <span>SANDBOX MODE</span>
            </button>
          </div>
        </header>

        {/* Tactical Mission Grid: Missions 0-6 + Sandbox */}
        <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {CAMPAIGN_NODES.map((node) => {
            const isCompleted = completedMissions.includes(node.index);
            const missionData = DICTIONARY[language]?.missions[node.id];
            const title = missionData?.title ?? node.title;
            const subtitle = missionData?.subtitle ?? node.subtitle;

            return (
              <div
                key={node.id}
                data-testid={`mission-card-${node.id}`}
                className={`p-5 rounded-xl border flex flex-col justify-between gap-4 transition-all duration-200 border-slate-300 dark:border-slate-800 bg-white/95 dark:bg-[#0B0E14]/95 ${
                  isCompleted
                    ? 'border-emerald-500/60 dark:border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.08)]'
                    : 'hover:border-cyan-500/60 dark:hover:border-cyan-400/60 hover:shadow-[0_0_15px_rgba(0,243,255,0.08)]'
                }`}
              >
                <div className="flex flex-col gap-2.5">
                  {/* Card Header: Mission Code & Difficulty */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-3 border border-edge text-cyan font-semibold">
                      {node.code} · Mission {node.index}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-medium ${node.difficultyColor}`}
                    >
                      {node.difficulty}
                    </span>
                  </div>

                  {/* Titles */}
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{title}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                      {subtitle}
                    </p>
                  </div>
                </div>

                {/* Direct Launch Control */}
                <div className="pt-3 border-t border-edge flex flex-col">
                  <button
                    type="button"
                    onClick={() => handleLaunch(node.id)}
                    data-testid={`launch-mission-${node.id}`}
                    className="w-full py-2 px-3 rounded-lg text-xs font-mono font-bold bg-cyan/15 hover:bg-cyan/25 text-cyan border border-cyan/40 hover:border-cyan flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
                  >
                    <span>LAUNCH SIMULATION</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Sandbox Node */}
          <div
            data-testid="mission-card-sandbox"
            className="p-5 rounded-xl border border-slate-300 dark:border-slate-800 bg-white/95 dark:bg-[#0B0E14]/95 flex flex-col justify-between gap-4 transition-all duration-200 hover:border-purple-400 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]"
          >
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-3 border border-edge text-purple-400 font-semibold">
                  LAB-00 · Sandbox
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-medium hud-badge-purple">
                  UNCONSTRAINED
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-foreground">Quantum Sandbox Lab</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                  Full 3D Bloch sphere, thermal noise sweeps & custom gates
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-edge flex flex-col">
              <button
                type="button"
                onClick={handleGoToSandbox}
                data-testid="launch-sandbox-button"
                className="w-full py-2 px-3 rounded-lg text-xs font-mono font-bold bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 hover:border-purple-400 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
              >
                <Beaker className="w-3.5 h-3.5 text-purple-400" />
                <span>LAUNCH SIMULATION</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
