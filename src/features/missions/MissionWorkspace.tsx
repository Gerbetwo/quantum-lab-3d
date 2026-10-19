'use client';

import React, { useState, useEffect } from 'react';
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
- Tactical In-Mission Workspace HUD (HU-MVP-03, HU-MVP-12).
- Perimeter-anchored HUD architecture clearing center 90%+ for 3D Bloch canvas interaction:
- Top edge: MissionHeader (ID, objective ticker, ES/EN switch, ESC Pause)
- Bottom-left: Floating Gate Controls & angle sliders (fixed bottom-4 left-4 z-20 w-80)
- Bottom-right: Dirac Math Dock (fixed bottom-4 right-4 z-20 w-80)
 */
export function MissionWorkspace({ missionId: propMissionId, className = '' }: MissionWorkspaceProps) {
  const appViewState = useQuantumStore((s) => s.appViewState);
  const isSandbox = appViewState === 'SANDBOX';

  const storeMissionId = useQuantumStore((s) => s.currentMissionId ?? s.activeMissionId ?? 'superposition');
  const rawId = propMissionId || storeMissionId;
  const activeMissionId: MissionId = isMissionId(rawId) ? rawId : 'superposition';

  const launchMission = useQuantumStore((s) => s.launchMission);
  useEffect(() => {
    if (appViewState !== 'SANDBOX' && propMissionId && isMissionId(propMissionId) && propMissionId !== storeMissionId) {
      launchMission(propMissionId);
    }
  }, [appViewState, propMissionId, storeMissionId, launchMission]);

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

  const temperatureK = useQuantumStore((s) => s.temperatureK);
  const coherenceTimeUs = useQuantumStore((s) => s.coherenceTimeUs);
  const setTemperatureK = useQuantumStore((s) => s.setTemperatureK);
  const isEntangled = useQuantumStore((s) => s.isEntangled);
  const setEntangled = useQuantumStore((s) => s.setEntangled);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [predictedP0, setPredictedP0] = useState<number>(
    userPredictionProb0 !== null ? Math.round(userPredictionProb0 * 100) : 50
  );
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
          title={isSandbox ? 'Sandbox Controls' : 'Gate Controls'}
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
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
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
            <div
              data-testid="gate-controls-content"
              className="space-y-3 telemetry-mono text-xs max-h-[calc(100vh-10rem)] overflow-y-auto pr-0.5"
            >
              {/* Qubit Angle Sliders (θ, φ) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] tracking-wider text-muted-foreground uppercase">
                  <span>Qubit Spherical Angles</span>
                  <button
                    type="button"
                    onClick={() => resetState()}
                    data-testid="reset-qubit-button"
                    title="Reset to ground state |0⟩"
                    className="text-[10px] text-warning hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset |0⟩
                  </button>
                </div>

                {/* Theta slider */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-muted-foreground">θ (Polar):</span>
                    <span className="font-bold tabular-nums text-quantum-cyan">
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
                    className="w-full accent-cyan cursor-pointer h-1.5 bg-surface-3"
                  />
                  <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
                    <span>0° (|0⟩)</span>
                    <span>90° (|+⟩)</span>
                    <span>180° (|1⟩)</span>
                  </div>
                </div>

                {/* Phi slider */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-muted-foreground">φ (Azimuthal):</span>
                    <span className="font-bold tabular-nums text-quantum-purple">
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
                    className="w-full accent-quantum-purple cursor-pointer h-1.5 bg-surface-3"
                  />
                  <div className="flex justify-between text-[9px] text-muted-foreground mt-0.5">
                    <span>0°</span>
                    <span>180°</span>
                    <span>360°</span>
                  </div>
                </div>
              </div>

              {/* Quantum Gate Action Buttons (X, Y, Z, H) */}
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between text-[10px] tracking-wider text-muted-foreground uppercase mb-1.5">
                  <span>Unitary Gates</span>
                  <span className="text-muted-foreground">SU(2)</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['X', 'Y', 'Z', 'H'] as const).map((gate) => (
                    <Button
                      key={gate}
                      variant="secondary"
                      cornerNotch
                      onClick={() => applyGate(gate)}
                      data-testid={`gate-button-${gate}`}
                      className="py-1 px-1.5 text-xs telemetry-mono font-bold"
                    >
                      [{gate}]
                    </Button>
                  ))}
                </div>
              </div>

              {/* Mission-Specific or Sandbox Tactical Controls */}
              <div className="pt-2 border-t border-border space-y-2">
                {isSandbox ? (
                  <div className="space-y-3 telemetry-mono text-xs">
                    {/* Thermal Decoherence Chamber */}
                    <div className="p-2.5 rounded-lg bg-surface-2 border border-border flex flex-col gap-2">
                      <div className="flex items-center justify-between text-[10px] uppercase font-bold text-warning">
                        <span>Thermal Chamber (15 mK – 300 K)</span>
                        <span>
                          {temperatureK >= 1
                            ? `${temperatureK.toFixed(1)} K`
                            : `${Math.round(temperatureK * 1000)} mK`}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.015"
                        max="300"
                        step="0.5"
                        value={temperatureK}
                        onChange={(e) => setTemperatureK(parseFloat(e.target.value))}
                        className="w-full accent-warning cursor-pointer h-1.5 bg-surface-3"
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        <span>
                          T₂(T): <b className="text-quantum-emerald font-bold">{coherenceTimeUs.toFixed(1)} μs</b>
                        </span>
                      </div>
                    </div>

                    {/* Entanglement & Collapse */}
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => setEntangled(!isEntangled)}
                        className={`w-full py-1.5 px-2 rounded text-xs telemetry-mono font-semibold transition-all cursor-pointer ${
                          isEntangled
                            ? 'hud-badge-purple'
                            : 'bg-surface-2 text-muted-foreground border border-border hover:bg-surface-3'
                        }`}
                      >
                        {isEntangled ? '⚡ Bell Pair |Φ⁺⟩ Active' : 'Enable Bell Entanglement'}
                      </button>

                      <Button
                        variant="primary"
                        cornerNotch
                        onClick={() => measure()}
                        data-testid="measure-collapse-button"
                        className="w-full text-xs py-1.5"
                      >
                        Measure & Collapse Wavefunction
                      </Button>

                      {lastOutcome !== null && (
                        <div className="p-1.5 rounded bg-surface-2 border border-border text-[11px] telemetry-mono flex items-center justify-between">
                          <span>
                            Outcome: <b className="text-quantum-cyan">|{lastOutcome}⟩</b>
                          </span>
                          <span className="text-muted-foreground">P₀: {actualProb0}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : activeMissionId === 'superposition' ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] tracking-wider text-muted-foreground uppercase">
                      <span>Zero-Spoiler Hypothesis</span>
                      <span className="text-[10px] text-muted-foreground">
                        {isLocked ? '🔒 Locked' : '✏️ Unlocked'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">P(|0⟩):</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        disabled={isLocked}
                        value={predictedP0}
                        onChange={(e) => setPredictedP0(Number(e.target.value))}
                        data-testid="prediction-slider"
                        className="flex-1 accent-cyan cursor-pointer disabled:opacity-50 h-1.5 bg-surface-3"
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
                      <div className="p-1.5 rounded bg-surface-2 border border-border text-[11px] telemetry-mono flex items-center justify-between">
                        <span>
                          Outcome: <b className="text-quantum-cyan">|{lastOutcome}⟩</b> (P₀: {actualProb0}%)
                        </span>
                        <span
                          className={
                            Math.abs(predictedP0 - actualProb0) <= 20
                              ? 'text-success font-bold'
                              : 'text-warning'
                          }
                        >
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