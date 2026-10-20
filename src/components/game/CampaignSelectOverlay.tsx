'use client';

import { useQuantumStore } from '@/store/useQuantumStore';
import { soundEngine } from '@/lib/soundEngine';
import { useTranslation, DICTIONARY } from '@/lib/i18n';
import {
  isMissionUnlocked,
  getMissionById,
  type MissionId,
} from '@/features/missions/missionRegistry';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Beaker,
  ShieldCheck,
  Lock,
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
  const { t, language } = useTranslation();
  const appViewState = useQuantumStore((s) => s.appViewState);
  const setAppViewState = useQuantumStore((s) => s.setAppViewState);
  const returnToTitle = useQuantumStore((s) => s.returnToTitle);
  const selectMission = useQuantumStore((s) => s.selectMission);
  const completedMissions = useQuantumStore((s) => s.completedMissions);

  if (appViewState !== 'CAMPAIGN_SELECT' && !forceVisible) {
    return null;
  }

  const handleLaunch = (id: MissionId) => {
    const config = getMissionById(id);
    if (config && !isMissionUnlocked(config.index, completedMissions)) {
      return;
    }
    soundEngine.unlock();
    soundEngine.playVectorSnap();
    selectMission(id);
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
      className="fixed inset-0 z-40 flex flex-col bg-background/80 backdrop-blur-md overflow-y-auto p-4 md:p-8 select-none"
    >
      <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
        {/* Flight-Deck Top Bar */}
        <header className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl hud-panel">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                returnToTitle();
              }}
              data-testid="return-to-title-button"
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-surface-2 hover:bg-surface-3 text-muted-foreground hover:text-foreground border border-border flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t('hud.exit_title')}</span>
            </button>
            <div className="border-l border-border pl-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-quantum-cyan" />
                <h2 className="text-sm font-bold tracking-wide text-foreground uppercase font-mono">
                  {t('campaign.roster_title')}
                </h2>
              </div>
              <p className="text-[11px] text-muted-foreground font-mono">
                {t('campaign.roster_subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-2 border border-border text-xs font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-success" />
              <span className="text-muted-foreground">{t('campaign.progression_label')}</span>
              <span className="text-quantum-cyan font-bold">{completedCount} / 7 Mastered</span>
            </div>

            <button
              type="button"
              onClick={handleGoToSandbox}
              data-testid="topbar-sandbox-button"
              className="px-4 py-2 rounded-xl text-xs font-mono font-bold hud-badge-purple hover:opacity-90 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Beaker className="w-4 h-4 text-quantum-purple" />
              <span>{t('campaign.sandbox_mode')}</span>
            </button>
          </div>
        </header>

        {/* Tactical Mission Grid: Missions 0-6 + Sandbox */}
        <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {CAMPAIGN_NODES.map((node) => {
            const isCompleted = completedMissions.includes(node.index);
            const isUnlocked = isMissionUnlocked(node.index, completedMissions);
            const missionData = DICTIONARY[language]?.missions[node.id];
            const title = missionData?.title ?? node.title;
            const subtitle = missionData?.subtitle ?? node.subtitle;

            return (
              <div
                key={node.id}
                data-testid={`mission-card-${node.id}`}
                className={`p-5 rounded-xl border flex flex-col justify-between gap-4 transition-all duration-200 hud-panel ${
                  !isUnlocked
                    ? 'opacity-50 cursor-not-allowed border-border'
                    : isCompleted
                    ? 'border-success/60 glow-emerald'
                    : 'hover:border-quantum-cyan/60 hover:glow-cyan'
                }`}
              >
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-3 border border-border text-quantum-cyan font-semibold">
                      {node.code} · Mission {node.index}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-medium flex items-center gap-1 ${
                        !isUnlocked ? 'hud-badge-amber' : node.difficultyColor
                      }`}
                    >
                      {!isUnlocked ? (
                        <>
                          <Lock className="w-3 h-3 text-warning" />
                          <span>LOCKED</span>
                        </>
                      ) : (
                        node.difficulty
                      )}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-foreground">{title}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                      {subtitle}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex flex-col">
                  <button
                    type="button"
                    disabled={!isUnlocked}
                    onClick={() => {
                      if (isUnlocked) {
                        handleLaunch(node.id);
                      }
                    }}
                    data-testid={`launch-mission-${node.id}`}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all ${
                      !isUnlocked
                        ? 'bg-surface-3 text-muted-foreground border border-border cursor-not-allowed'
                        : 'hud-badge-cyan hover:opacity-90 active:scale-95 cursor-pointer'
                    }`}
                  >
                    {!isUnlocked ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>LOCKED</span>
                      </>
                    ) : (
                      <>
                        <span>{t('campaign.launch_simulation')}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}

          <div
            data-testid="mission-card-sandbox"
            className="p-5 rounded-xl border hud-panel flex flex-col justify-between gap-4 transition-all duration-200 hover:border-quantum-purple/60 hover:glow-purple"
          >
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-3 border border-border text-quantum-purple font-semibold">
                  {t('campaign.sandbox_card.code')}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-medium hud-badge-purple">
                  UNCONSTRAINED
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-foreground">{t('mission_header.sandbox_title')}</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                  {t('campaign.sandbox_card.subtitle')}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-border flex flex-col">
              <button
                type="button"
                onClick={handleGoToSandbox}
                data-testid="launch-sandbox-button"
                className="w-full py-2 px-3 rounded-lg text-xs font-mono font-bold hud-badge-purple hover:opacity-90 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Beaker className="w-3.5 h-3.5 text-quantum-purple" />
                <span>{t('campaign.launch_simulation')}</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
