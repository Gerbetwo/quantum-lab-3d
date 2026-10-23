"use client";

import React, { useState, useMemo } from "react";
import { useQuantumStore } from "@/store/useQuantumStore";
import { useTranslation } from "@/lib/i18n";
import { MissionCanvasShell } from "@/components/framework/MissionCanvasShell";
import { CoreBlochSphere } from "@/components/canvas/CoreBlochSphere";
import { isVectorInBlochTarget } from "@/components/canvas/TargetZone3D";
import { useSpatialTelemetryBridge } from "@/hooks/useSpatialTelemetryBridge";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, Lock, Unlock, Compass, Crosshair } from "lucide-react";

export interface Mission01StateVectorProps {
  className?: string;
}

/**
 * Mission 01: State Vector & Superposition
 * Upgraded with direct 3D canvas interaction, Slerp pole contact,
 * translucent 3D target zone on the Bloch sphere equator,
 * MissionCanvasShell 3-tier layout, and real-time useSpatialTelemetryBridge synchronization.
 */
export const Mission01StateVector: React.FC<Mission01StateVectorProps> = ({
  className = "",
}) => {
  const { t } = useTranslation();
  const theta = useQuantumStore((s) => s.theta);
  const phi = useQuantumStore((s) => s.phi);
  const lastOutcome = useQuantumStore((s) => s.lastOutcome);
  const measure = useQuantumStore((s) => s.measure);
  const userPredictionProb0 = useQuantumStore((s) => s.userPredictionProb0);
  const setUserPrediction = useQuantumStore((s) => s.setUserPrediction);

  const activeMapping = useSpatialTelemetryBridge((s) => s.getActiveMapping());

  // Dirac & Born Math Invariants
  const safeTheta = Number.isFinite(theta) ? theta : 0;
  const safePhi = Number.isFinite(phi) ? phi : 0;
  const alpha = Math.cos(safeTheta / 2);
  const beta = Math.sin(safeTheta / 2);
  const p0 = alpha * alpha;
  const p1 = beta * beta;
  const actualProb0Percent = Math.round(p0 * 100);

  // 3D Target Prediction Zone: Equatorial Superposition |+⟩
  const TARGET_ZONE = useMemo(() => ({ theta: Math.PI / 2, phi: 0 }), []);
  const isTargetAligned = isVectorInBlochTarget(
    safeTheta,
    safePhi,
    TARGET_ZONE.theta,
    TARGET_ZONE.phi,
    0.35
  );

  // Zero-Spoiler Prediction State
  const [predictedP0, setPredictedP0] = useState<number>(
    userPredictionProb0 !== null ? Math.round(userPredictionProb0 * 100) : 50
  );
  const [isLocked, setIsLocked] = useState<boolean>(userPredictionProb0 !== null);

  const handleLockGuess = () => {
    setUserPrediction(predictedP0 / 100);
    setIsLocked(true);
  };

  const handleUnlockGuess = () => {
    setIsLocked(false);
  };

  return (
    <MissionCanvasShell
      missionId="superposition"
      className={className}
      tier2Canvas={
        <CoreBlochSphere
          showArcs
          showAxes
          showPoleLabels
          interactive
          targetZone={TARGET_ZONE}
        />
      }
      tier2Overlays={
        <div className="absolute inset-0 pointer-events-none max-h-full overflow-y-auto pt-16 px-4 pb-4 sm:pt-20 sm:px-6 sm:pb-6 flex flex-col md:flex-row justify-between items-start gap-4 select-none">
          {/* Left Side: State Vector Navigation & Focus Telemetry */}
          <div className="w-full md:w-80 lg:w-96 pointer-events-auto shrink-0">
            <GlassCard
              title="State Vector Navigation"
              badge="3D Direct Touch"
            >
              <div className="space-y-2 text-xs font-mono">
                <p className="text-muted-foreground text-[11px] leading-relaxed flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-quantum-cyan shrink-0" />
                  <span>
                    Drag the vector tip directly on the Bloch sphere surface to rotate |ψ⟩.
                  </span>
                </p>

                {/* Spatial Telemetry Bridge Dynamic Binding */}
                {activeMapping ? (
                  <div
                    data-testid="spatial-telemetry-card"
                    className="p-2 rounded-lg border border-quantum-cyan/50 bg-quantum-cyan/10 text-quantum-cyan space-y-1 transition-all"
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                      <span>Focused: {activeMapping.label}</span>
                      <span className="font-mono">{activeMapping.symbol}</span>
                    </div>
                    <div className="text-[11px] font-mono text-foreground font-semibold">
                      LaTeX: <code className="text-quantum-cyan">{activeMapping.latex}</code>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      {activeMapping.description}
                    </p>
                  </div>
                ) : (
                  <div className="p-2 rounded-lg border border-white/5 bg-surface-2/60 text-[10px] text-muted-foreground">
                    Hover sphere features (arcs, poles, tip) to bind live telemetry.
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Right Side: Dirac & Born Telemetry Card */}
          <div className="w-full md:w-80 lg:w-96 pointer-events-auto shrink-0 space-y-2.5">
            <GlassCard title={t("math_dock.dirac_telemetry_title")} badge="|ψ⟩">
              <div className="space-y-2.5 font-mono text-xs">
                {/* 1. Dirac State Vector Readout */}
                <div>
                  <div className="flex justify-between text-[10px] text-muted-foreground uppercase mb-1">
                    <span>{t("math_dock.state_vector_label")}</span>
                    <span className="tabular-nums text-quantum-cyan">
                      θ={((safeTheta * 180) / Math.PI).toFixed(1)}° φ={((safePhi * 180) / Math.PI).toFixed(1)}°
                    </span>
                  </div>
                  <div
                    data-testid="state-vector-formula"
                    className="p-1.5 rounded border border-white/10 bg-surface-2/80 text-quantum-cyan font-bold tabular-nums text-xs"
                  >
                    |ψ⟩ = {alpha.toFixed(3)}|0⟩ + {beta.toFixed(3)}e<sup>{"iφ"}</sup>|1⟩
                  </div>
                </div>

                {/* 2. Born Probabilities */}
                <div className="pt-2 border-t border-border">
                  <div className="flex justify-between text-[10px] text-muted-foreground uppercase mb-1">
                    <span>{t("math_dock.born_probabilities")}</span>
                    <span>{"P₀ + P₁ = 1"}</span>
                  </div>
                  <div
                    data-testid="born-probabilities-readout"
                    className="flex justify-between items-center p-1.5 rounded border border-white/10 bg-surface-2/80 tabular-nums text-xs"
                  >
                    <span className="text-quantum-cyan font-bold">
                      P(|0⟩): {(p0 * 100).toFixed(1)}%
                    </span>
                    <span className="text-muted-foreground">|</span>
                    <span className="text-quantum-purple font-bold">
                      P(|1⟩): {(p1 * 100).toFixed(1)}%
                    </span>
                  </div>

                  {/* Dual-tone ratio split bar */}
                  <div className="w-full h-1.5 bg-surface-3 rounded-none overflow-hidden flex mt-1.5">
                    <div
                      className="h-full bg-quantum-cyan transition-all duration-200"
                      style={{ width: `${p0 * 100}%` }}
                    />
                    <div
                      className="h-full bg-quantum-purple transition-all duration-200"
                      style={{ width: `${p1 * 100}%` }}
                    />
                  </div>
                </div>

                {/* 3. 3D Spatial Target Prediction Zone */}
                <div
                  data-testid="target-zone-status"
                  className="p-2 rounded border border-white/10 bg-surface-2/80 space-y-1"
                >
                  <div className="flex justify-between items-center text-[10px] uppercase text-muted-foreground">
                    <span className="flex items-center gap-1 font-bold">
                      <Crosshair className="w-3 h-3 text-quantum-cyan" />
                      <span>3D Target Zone</span>
                    </span>
                    <span
                      data-testid="target-alignment-badge"
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 ${
                        isTargetAligned ? "hud-badge-emerald" : "hud-badge-cyan"
                      }`}
                    >
                      {isTargetAligned ? <CheckCircle2 className="w-2.5 h-2.5 text-success" /> : null}
                      <span>{isTargetAligned ? "TARGET LOCKED" : "ALIGNING"}</span>
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    {isTargetAligned
                      ? "Spatial threshold reached: |ψ⟩ is aligned with the equatorial target zone."
                      : "Rotate the vector tip into the translucent target ring on the sphere."}
                  </p>
                </div>

                {/* 4. Zero-Spoiler Prediction & Collapse Hypothesis */}
                <div className="pt-2 border-t border-border space-y-2">
                  <div className="flex justify-between items-center text-[10px] uppercase text-muted-foreground">
                    <span>{t("workspace.hypothesis_title")}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 ${
                        isLocked ? "hud-badge-amber" : "hud-badge-cyan"
                      }`}
                    >
                      {isLocked ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                      <span>{isLocked ? t("workspace.locked") : t("workspace.unlocked")}</span>
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
                    <span className="text-xs font-bold w-8 text-right tabular-nums">{predictedP0}%</span>
                  </div>

                  <div className="flex gap-1.5">
                    {!isLocked ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleLockGuess}
                        data-testid="lock-guess-button"
                        className="flex-1 text-xs py-1"
                      >
                        {t("workspace.lock_guess")}
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleUnlockGuess}
                        data-testid="unlock-guess-button"
                        className="flex-1 text-xs py-1"
                      >
                        {t("workspace.unlock")}
                      </Button>
                    )}
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => measure()}
                      data-testid="measure-collapse-button"
                      className="flex-1 text-xs py-1"
                    >
                      Measure
                    </Button>
                  </div>

                  {lastOutcome !== null && (
                    <div className="p-1.5 rounded bg-surface-2 border border-border text-[11px] font-mono flex items-center justify-between">
                      <span>
                        Outcome: <b className="text-quantum-cyan">|{lastOutcome}⟩</b> (P₀: {actualProb0Percent}%)
                      </span>
                      <span
                        className={
                          isTargetAligned || Math.abs(predictedP0 - actualProb0Percent) <= 20
                            ? "text-success font-bold flex items-center gap-1"
                            : "text-warning font-medium"
                        }
                      >
                        {isTargetAligned || Math.abs(predictedP0 - actualProb0Percent) <= 20 ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-success shrink-0" />
                            <span>{t("workspace.match")}</span>
                          </>
                        ) : (
                          t("workspace.diverged")
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      }
    />
  );
};

export default Mission01StateVector;