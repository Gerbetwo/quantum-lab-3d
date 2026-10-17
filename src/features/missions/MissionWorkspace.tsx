'use client';

import React, { useState } from 'react';
import { useQuantumStore } from '@/store/useQuantumStore';
import { isMissionId, type MissionId } from './missionRegistry';
import { FoundationsControls } from './FoundationsControls';
import { AlgorithmControls } from './AlgorithmControls';
import { MissionHeader } from '@/components/game/MissionHeader';
import { MathDock } from '@/features/quantum-core/MathDock';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';

interface MissionWorkspaceProps {
  missionId?: string;
  className?: string;
}

/**
 * Tactical In-Mission Workspace HUD (HU-MVP-03, HU-MVP-12).
 * Perimeter-anchored HUD architecture clearing center 90%+ for 3D Bloch canvas interaction:
 * - Top edge: MissionHeader (ID, objective ticker, ES/EN switch, ESC Pause)
 * - Bottom-left: Floating Gate Controls & angle sliders (fixed bottom-4 left-4 z-20 w-80)
 * - Bottom-right: Dirac Math Dock (fixed bottom-4 right-4 z-20 w-80)
 */
export function MissionWorkspace({ missionId: propMissionId, className = '' }: MissionWorkspaceProps) {
  const storeMissionId = useQuantumStore((s) => s.currentMissionId ?? s.activeMissionId ?? 'superposition');
  const rawId = propMissionId || storeMissionId;
  const activeMissionId: MissionId = isMissionId(rawId) ? rawId : 'superposition';

  const theta = useQuantumStore((s) => s.theta);
  const phi = useQuantumStore((s) => s.phi);
  const setTheta = useQuantumStore((s) => s.setTheta);
  const setPhi = useQuantumStore((s) => s.setPhi);
  const applyGate = useQuantumStore((s) => s.applyGate);
  const resetState = useQuantumStore((s) => s.resetState);
  const measure = useQuantumStore((s) => s.measure);
  const lastOutcome = useQuantumStore((s) => s.lastOutcome);
  const userPredictionProb0 = useQuantumStore((s) => s.userPredictionProb0);
  const setUserPrediction = useQuantumStore((s) => s.setUserPrediction);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [predictedP0, setPredictedP0] = useState<number>(userPredictionProb0 !== null ? Math.round(userPredictionProb0 * 100) : 50);
  const [isLocked, setIsLocked] = useState<boolean>(userPredictionProb0 !== null);

  const safeTheta = Number.isFinite(theta) ? theta : 0;
  const safePhi = Number.isFinite(phi) ? phi : 0;
  const actualProb0 = Math.round(Math.cos(safeTheta / 2) ** 2 * 100);

  const handleLockPrediction = () => {
    setUserPrediction(predictedP0 / 100);
    setIsLocked(true);
  };

  const isFoundation = ['superposition', 'entanglement', 'decoherence', 'gates'].includes(activeMissionId);

  return (
    <div
      data-testid="mission-workspace"
      className={`pointer-events-none select-none relative ${className}`.trim()}
    >
      {/* 1. Edge Navigation Header (fixed top-0 left-0 right-0 z-20) */}
      <MissionHeader missionId={activeMissionId} />

      {/* 2. Floating Gate Controls Bar & Qubit Angle Sliders (fixed bottom-4 left-4 z-20) */}
      <aside
        data-testid="floating-gate-controls"
        aria-label="Quantum Gate Controls Bar"
        className="fixed bottom-4 left-4 z-20 w-80 pointer-events-auto select-none"
      >
        <GlassCard
          title="Gate Controls"
          badge="U(θ,φ)"
          telemetryId="CTRL.01"
          cornerNotch={true}
          variant="telemetry"
          headerRight={
            <button
              type="button"
              onClick={() => setIsCollapsed((prev) => !prev)}
              data-testid="gate-controls-toggle"
              aria-expanded={!isCollapsed}
              aria-label={isCollapsed ? 'Expand Gate Controls' : 'Collapse Gate Controls'}
              title={isCollapsed ? 'Expand Controls' : 'Collapse Controls'}
              className="p-1 rounded text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-cyan-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              {isCollapsed ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          }
        >
          {!isCollapsed && (
            <div data-testid="gate-controls-content" className="space-y-3 font-mono text-xs max-h-[calc(100vh-10rem)] overflow-y-auto pr-0.5">
              {/* Qubit Angle Sliders (θ, φ) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                  <span>Qubit Spherical Angles</span>
                  <button
                    type="button"
                    onClick={() => resetState()}
                    data-testid="reset-qubit-button"
                    title="Reset to ground state |0⟩"
                    className="text-[10px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset |0⟩
                  </button>
                </div>

                {/* Theta slider */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-600 dark:text-slate-400">θ (Polar):</span>
                    <span className="font-bold tabular-nums text-sky-700 dark:text-cyan-400">
                      {((safeTheta * 180) / Math.PI).toFixed(1)}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={Math.PI}
                    step="0.01"
                    value={safeTheta}
                    onChange={(e) => setTheta(parseFloat(e.target.value))}
                    data-testid="slider-theta"
                    aria-label="Theta angle slider"
                    className="w-full accent-cyan cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
                    <span>0° (|0⟩)</span>
                    <span>90° (|+⟩)</span>
                    <span>180° (|1⟩)</span>
                  </div>
                </div>

                {/* Phi slider */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-600 dark:text-slate-400">φ (Azimuthal):</span>
                    <span className="font-bold tabular-nums text-purple-700 dark:text-purple-400">
                      {((safePhi * 180) / Math.PI).toFixed(1)}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={2 * Math.PI}
                    step="0.01"
                    value={safePhi}
                    onChange={(e) => setPhi(parseFloat(e.target.value))}
                    data-testid="slider-phi"
                    aria-label="Phi angle slider"
                    className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
                    <span>0°</span>
                    <span>180°</span>
                    <span>360°</span>
                  </div>
                </div>
              </div>

              {/* Quantum Gate Action Buttons (X, Y, Z, H) */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
                <div className="flex items-center justify-between text-[10px] tracking-wider text-slate-500 dark:text-slate-400 uppercase mb-1.5">
                  <span>Unitary Gates</span>
                  <span className="text-slate-400">SU(2)</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['X', 'Y', 'Z', 'H'] as const).map((gate) => (
                    <Button
                      key={gate}
                      variant="secondary"
                      cornerNotch
                      onClick={() => applyGate(gate)}
                      data-testid={`gate-button-${gate}`}
                      className="py-1 px-1.5 text-xs font-mono font-bold"
                    >
                      [{gate}]
                    </Button>
                  ))}
                </div>
              </div>

              {/* Mission-Specific Tactical Controls */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
                {activeMissionId === 'superposition' ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                      <span>Zero-Spoiler Hypothesis</span>
                      <span className="text-[10px] text-slate-400">{isLocked ? '🔒 Locked' : '✏️ Unlocked'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500">P(|0⟩):</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        disabled={isLocked}
                        value={predictedP0}
                        onChange={(e) => setPredictedP0(Number(e.target.value))}
                        data-testid="prediction-slider"
                        className="flex-1 accent-cyan cursor-pointer disabled:opacity-50 h-1.5 bg-slate-200 dark:bg-slate-800"
                      />
                      <span className="text-xs font-bold w-9 text-right tabular-nums">{predictedP0}%</span>
                    </div>

                    <div className="flex gap-1.5">
                      {!isLocked ? (
                        <Button
                          variant="secondary"
                          cornerNotch
                          onClick={handleLockPrediction}
                          data-testid="lock-guess-button"
                          className="flex-1 text-xs py-1"
                        >
                          Lock Guess
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          cornerNotch
                          onClick={() => setIsLocked(false)}
                          data-testid="unlock-guess-button"
                          className="flex-1 text-xs py-1"
                        >
                          Unlock
                        </Button>
                      )}
                      <Button
                        variant="primary"
                        cornerNotch
                        onClick={() => measure()}
                        data-testid="measure-collapse-button"
                        className="flex-1 text-xs py-1"
                      >
                        Measure
                      </Button>
                    </div>

                    {lastOutcome !== null && (
                      <div className="p-1.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] font-mono flex items-center justify-between">
                        <span>Outcome: <b className="text-sky-600 dark:text-cyan-400">|{lastOutcome}⟩</b> (P₀: {actualProb0}%)</span>
                        <span className={Math.abs(predictedP0 - actualProb0) <= 20 ? 'text-emerald-500 font-bold' : 'text-amber-500'}>
                          {Math.abs(predictedP0 - actualProb0) <= 20 ? '✨ Match!' : 'Diverged'}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {isFoundation ? (
                      <FoundationsControls missionId={activeMissionId} />
                    ) : (
                      <AlgorithmControls missionId={activeMissionId} />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </GlassCard>
      </aside>

      {/* 3. Floating Telemetry Math Dock at Bottom-Right (fixed bottom-4 right-4 z-20) */}
      <MathDock className="pointer-events-auto" />
    </div>
  );
}

export const MissionRegistry = MissionWorkspace;
export default MissionWorkspace;
