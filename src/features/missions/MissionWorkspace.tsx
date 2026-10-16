'use client';

import React, { useState } from 'react';
import { useQuantumStore } from '@/store/useQuantumStore';
import { getMissionById, isMissionId, type MissionId, getMissionIndex } from './missionRegistry';
import { FoundationsControls } from './FoundationsControls';
import { AlgorithmControls } from './AlgorithmControls';
import { CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';

interface MissionWorkspaceProps {
  missionId?: string;
  className?: string;
}

export function MissionWorkspace({ missionId: propMissionId, className = '' }: MissionWorkspaceProps) {
  const storeMissionId = useQuantumStore((s) => s.currentMissionId ?? s.activeMissionId ?? 'superposition');
  const rawId = propMissionId || storeMissionId;
  const activeMissionId: MissionId = isMissionId(rawId) ? rawId : 'superposition';
  const mission = getMissionById(activeMissionId);
  const missionIndex = getMissionIndex(activeMissionId);

  const theta = useQuantumStore((s) => s.theta);
  const userPredictionProb0 = useQuantumStore((s) => s.userPredictionProb0);
  const setUserPrediction = useQuantumStore((s) => s.setUserPrediction);
  const lastOutcome = useQuantumStore((s) => s.lastOutcome);
  const measure = useQuantumStore((s) => s.measure);
  const completedMissions = useQuantumStore((s) => s.completedMissions);
  const markMissionCompleted = useQuantumStore((s) => s.markMissionCompleted);

  const isCompleted = completedMissions.includes(missionIndex);
  const [predictedP0, setPredictedP0] = useState<number>(userPredictionProb0 !== null ? Math.round(userPredictionProb0 * 100) : 50);
  const [isLocked, setIsLocked] = useState<boolean>(userPredictionProb0 !== null);

  const actualProb0 = Math.round(Math.cos(theta / 2) ** 2 * 100);

  const handleLockPrediction = () => {
    setUserPrediction(predictedP0 / 100);
    setIsLocked(true);
  };

  const isFoundation = ['superposition', 'entanglement', 'decoherence', 'gates'].includes(activeMissionId);

  return (
    <div
      data-testid="mission-workspace"
      className={`p-4 rounded-xl border border-border bg-card/75 backdrop-blur-md flex flex-col gap-3 shadow-lg ${className}`}
    >
      {/* Focused Mission Header */}
      <div className="flex items-center justify-between border-b border-border/80 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold text-accent px-2.5 py-0.5 rounded bg-accent/10 border border-accent/30">
            Mission {missionIndex >= 0 ? missionIndex : 0}
          </span>
          <span className="text-xs font-bold text-foreground">{mission?.title ?? activeMissionId}</span>
        </div>
        {isCompleted ? (
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Done
          </span>
        ) : (
          <button
            type="button"
            onClick={() => markMissionCompleted(missionIndex)}
            className="text-[11px] font-mono text-cyan hover:text-cyan/80 bg-cyan/15 hover:bg-cyan/25 border border-cyan/40 px-2.5 py-0.5 rounded-full transition-colors flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3" /> Mark Completed
          </button>
        )}
      </div>

      {mission?.learningObjective && (
        <div className="p-2.5 rounded-lg bg-background/60 border border-border text-xs text-muted-foreground">
          <span className="font-semibold text-accent">Active Objective: </span>
          {mission.learningObjective}
        </div>
      )}

      {/* Primary Mission HUD Controls */}
      <div className="flex flex-col gap-2">
        {isFoundation ? (
          <FoundationsControls missionId={activeMissionId} />
        ) : (
          <AlgorithmControls missionId={activeMissionId} />
        )}
      </div>

      {/* Zero-Spoiler Hypothesis Panel for Superposition & Measurement Discovery */}
      {activeMissionId === 'superposition' && (
        <div className="p-3 rounded-lg bg-surface-2 border border-edge flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-cyan uppercase">
              Hypothesis Prediction (Zero-Spoiler)
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              {isLocked ? '🔒 Locked' : '✏️ Unlocked'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-muted-foreground">Guess P(|0⟩):</span>
            <input
              type="range"
              min={0}
              max={100}
              disabled={isLocked}
              value={predictedP0}
              onChange={(e) => setPredictedP0(Number(e.target.value))}
              className="flex-1 accent-cyan cursor-pointer disabled:opacity-50"
            />
            <span className="text-xs font-mono font-bold w-10 text-right">{predictedP0}%</span>
          </div>

          <div className="flex gap-2">
            {!isLocked ? (
              <button
                type="button"
                onClick={handleLockPrediction}
                className="px-3 py-1.5 rounded text-xs font-mono font-semibold bg-cyan/20 hover:bg-cyan/30 text-cyan border border-cyan/50 transition-colors"
              >
                Lock Guess
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsLocked(false)}
                className="px-3 py-1.5 rounded text-xs font-mono bg-surface-3 text-muted-foreground border border-edge hover:bg-muted"
              >
                Unlock
              </button>
            )}

            <button
              type="button"
              onClick={() => measure()}
              className="flex-1 px-3 py-1.5 rounded text-xs font-mono font-bold bg-accent hover:bg-accent/90 text-accent-foreground shadow-md transition-all active:scale-95"
            >
              Measure |ψ⟩ Collapse
            </button>
          </div>

          {lastOutcome !== null && (
            <div className="p-2 rounded bg-surface-3 border border-edge text-xs font-mono flex items-center justify-between">
              <span>Outcome: <b className="text-cyan">|{lastOutcome}⟩</b> (Born P₀: {actualProb0}%)</span>
              <span className={Math.abs(predictedP0 - actualProb0) <= 20 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                {Math.abs(predictedP0 - actualProb0) <= 20 ? '✨ Match!' : 'Diverged'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Quick Measurement Collapse for non-superposition missions */}
      {activeMissionId !== 'superposition' && (
        <div className="pt-1 flex items-center justify-between gap-2 border-t border-border/60">
          <button
            type="button"
            onClick={() => measure()}
            className="flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-medium bg-surface-2 hover:bg-surface-3 text-foreground border border-edge flex items-center justify-center gap-1.5 transition-all active:scale-95"
          >
            Trigger Wavefunction Collapse
            <ChevronRight className="w-3.5 h-3.5 text-cyan" />
          </button>
          {lastOutcome !== null && (
            <span className="text-xs font-mono text-cyan bg-cyan/10 border border-cyan/30 px-2.5 py-1 rounded-md">
              Collapsed: |{lastOutcome}⟩
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export const MissionRegistry = MissionWorkspace;
