'use client';

import React, { useState } from 'react';
import { useQuantumStore } from '@/store/useQuantumStore';
import { getMissionById, isMissionId, type MissionId } from './missionRegistry';
import { FoundationsControls } from './FoundationsControls';
import { AlgorithmControls } from './AlgorithmControls';

interface MissionWorkspaceProps {
  missionId?: string;
  className?: string;
}

export function MissionWorkspace({ missionId: propMissionId, className = '' }: MissionWorkspaceProps) {
  const storeMissionId = useQuantumStore((s) => s.currentMissionId ?? s.activeMissionId ?? 'superposition');
  const rawId = propMissionId || storeMissionId;
  const activeMissionId: MissionId = isMissionId(rawId) ? rawId : 'superposition';
  const mission = getMissionById(activeMissionId);

  const theta = useQuantumStore((s) => s.theta);
  const userPredictionProb0 = useQuantumStore((s) => s.userPredictionProb0);
  const setUserPrediction = useQuantumStore((s) => s.setUserPrediction);
  const lastOutcome = useQuantumStore((s) => s.lastOutcome);
  const measure = useQuantumStore((s) => s.measure);

  const [predictedP0, setPredictedP0] = useState<number>(userPredictionProb0 !== null ? Math.round(userPredictionProb0 * 100) : 50);
  const [isLocked, setIsLocked] = useState<boolean>(userPredictionProb0 !== null);

  const actualProb0 = Math.round(Math.cos(theta / 2) ** 2 * 100);

  const handleLockPrediction = () => {
    setUserPrediction(predictedP0 / 100);
    setIsLocked(true);
  };

  const handleMeasure = () => {
    measure();
  };

  const isFoundation = ['superposition', 'entanglement', 'decoherence', 'gates'].includes(activeMissionId);

  return (
    <div
      data-testid="mission-workspace"
      className={`p-4 rounded-xl border border-border bg-card/75 backdrop-blur-md flex flex-col gap-3 shadow-lg ${className}`}
    >
      {/* Mission Header */}
      <div className="flex items-center justify-between border-b border-border/80 pb-2">
        <span className="text-xs font-mono font-semibold text-accent px-2.5 py-0.5 rounded bg-accent/10 border border-accent/30">
          Mission {activeMissionId}
        </span>
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          HU-MVP-03 Pedagogical Flow
        </span>
      </div>

      <div>
        <h2 className="text-sm font-bold text-foreground tracking-tight">
          {mission?.title ?? `Mission: ${activeMissionId}`}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {mission?.description ?? mission?.subtitle ?? 'Explore quantum phenomena.'}
        </p>
      </div>

      {mission?.learningObjective && (
        <div className="p-2 rounded bg-background/60 border border-border text-xs text-muted-foreground">
          <span className="font-semibold text-accent">Objective: </span>
          {mission.learningObjective}
        </div>
      )}

      {/* Zero-Spoiler Gamification Barrier */}
      <div className="p-3 rounded-lg bg-surface-2 border border-edge flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-semibold text-cyan uppercase">
            1. Student Hypothesis (Zero-Spoiler)
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">
            {isLocked ? '🔒 Locked' : '✏️ Guessing'}
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
              Lock Prediction
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsLocked(false)}
              className="px-3 py-1.5 rounded text-xs font-mono bg-surface-3 text-muted-foreground border border-edge hover:bg-muted"
            >
              Unlock / Re-guess
            </button>
          )}

          <button
            type="button"
            onClick={handleMeasure}
            className="flex-1 px-3 py-1.5 rounded text-xs font-mono font-bold bg-accent hover:bg-accent/90 text-accent-foreground shadow-md transition-all active:scale-95"
          >
            Measure State |ψ⟩ Collapse
          </button>
        </div>

        {lastOutcome !== null && (
          <div className="p-2 rounded bg-surface-3 border border-edge text-xs font-mono flex items-center justify-between">
            <span>Collapsed: <b className="text-cyan">|{lastOutcome}⟩</b> (Born P₀: {actualProb0}%)</span>
            <span className={Math.abs(predictedP0 - actualProb0) <= 20 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
              {Math.abs(predictedP0 - actualProb0) <= 20 ? '✨ Hypothesis Validated!' : 'Try Again'}
            </span>
          </div>
        )}
      </div>

      {/* Dynamic Controls Sub-Panel */}
      <div className="mt-1">
        {isFoundation ? (
          <FoundationsControls missionId={activeMissionId} />
        ) : (
          <AlgorithmControls missionId={activeMissionId} />
        )}
      </div>
    </div>
  );
}

export const MissionRegistry = MissionWorkspace;
