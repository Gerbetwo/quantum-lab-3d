"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import * as THREE from "three";
import { useQuantumStore } from "@/store/useQuantumStore";
import { MissionCanvasShell } from "@/components/framework/MissionCanvasShell";
import { acquireRenderer } from "@/features/quantum-core/BlochViewport";
import {
  computeMeanAmplitude,
  applyOraclePhaseInversion,
  applyDiffusionReflection,
  computeGroverProbabilities,
  createAmplitudeBarGraphGroup,
  BASIS_LABELS_4,
} from "@/components/canvas/AmplitudeBarGraph3D";
import { createBarTargetZoneMesh, isBarInTargetZone } from "@/components/canvas/TargetZone3D";
import { useSpatialTelemetryBridge } from "@/hooks/useSpatialTelemetryBridge";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { soundEngine } from "@/lib/soundEngine";
import {
  Crosshair,
  ArrowDownUp,
  RefreshCw,
  CheckCircle2,
  TrendingUp,
  Zap,
} from "lucide-react";

export type GroverAlgorithmStep =
  | "superposition"
  | "inversion"
  | "amplification"
  | "measured";

export interface Mission07GroverSearchProps {
  className?: string;
  missionId?: string;
}

interface GroverViewportProps {
  amplitudes: readonly number[];
  targetIndex: number;
  isPhaseInverted: boolean;
  onSelectTarget: (index: number) => void;
  onReadyGraph: (graph: ReturnType<typeof createAmplitudeBarGraphGroup>) => void;
}

const GroverViewport: React.FC<GroverViewportProps> = ({
  amplitudes, targetIndex, isPhaseInverted, onSelectTarget, onReadyGraph,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const ampsRef = useRef(amplitudes);
  const targetRef = useRef(targetIndex);
  const invertedRef = useRef(isPhaseInverted);

  useEffect(() => {
    ampsRef.current = amplitudes;
    targetRef.current = targetIndex;
    invertedRef.current = isPhaseInverted;
  }, [amplitudes, targetIndex, isPhaseInverted]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = acquireRenderer(container);
    const scene = new THREE.Scene();
    const w = container.clientWidth || 800;
    const h = container.clientHeight || 600;

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    camera.position.set(0, 2.2, 5.2);
    camera.lookAt(0, 0.6, 0);
    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const dirLight = new THREE.DirectionalLight(0x00f3ff, 0.5);
    dirLight.position.set(3, 8, 5);
    scene.add(dirLight);

    const stepX = 3.6 / 3, startX = -1.8;
    const barGraph = createAmplitudeBarGraphGroup(4, targetRef.current);
    const targetZone = createBarTargetZoneMesh(startX + targetRef.current * stepX, 2.0, 0.85, 0.85);
    scene.add(barGraph.group, targetZone.group);
    onReadyGraph(barGraph);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const getMouseNDC = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const interactiveObjects = [...barGraph.bars, barGraph.meanPlane];

    const onPointerMove = (e: PointerEvent) => {
      getMouseNDC(e);
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(interactiveObjects, false);
      if (hits.length > 0 && hits[0].object.userData?.spatialId) {
        useSpatialTelemetryBridge.getState().setActiveFocusId(hits[0].object.userData.spatialId);
        renderer.domElement.style.cursor = "pointer";
      } else {
        renderer.domElement.style.cursor = "default";
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      getMouseNDC(e);
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(barGraph.bars, false);
      if (hits.length > 0 && typeof hits[0].object.userData?.stateIndex === "number") {
        onSelectTarget(hits[0].object.userData.stateIndex);
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener("pointermove", onPointerMove);
    dom.addEventListener("pointerdown", onPointerDown);

    let animId = 0;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      barGraph.update(dt, ampsRef.current, targetRef.current, invertedRef.current);
      targetZone.group.position.x = startX + targetRef.current * stepX;
      const targetAmp = ampsRef.current[targetRef.current] ?? 0.5;
      targetZone.updateAlignment(isBarInTargetZone(Math.abs(targetAmp) * 2.4, 1.4));

      renderer.render(scene, camera);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener("pointermove", onPointerMove);
      dom.removeEventListener("pointerdown", onPointerDown);
      scene.remove(barGraph.group, targetZone.group);
      targetZone.dispose();
      barGraph.dispose();
    };
  }, [onReadyGraph, onSelectTarget]);

  return (
    <div
      ref={containerRef}
      data-testid="grover-bar-viewport"
      className="relative w-full h-full select-none overflow-hidden touch-none"
    />
  );
};

/**
 * Mission 07: Quantum Algorithms & Grover's Search
 */
export const Mission07GroverSearch: React.FC<Mission07GroverSearchProps> = ({
  className = "",
  missionId = "grover",
}) => {
  const setLastOutcome = useQuantumStore((s) => s.setLastOutcome);
  const activeMapping = useSpatialTelemetryBridge((s) => s.getActiveMapping());

  // Target index in computational basis (|00⟩: 0, |01⟩: 1, |10⟩: 2, |11⟩: 3)
  const [targetIndex, setTargetIndex] = useState<number>(2);
  const [currentStep, setCurrentStep] = useState<GroverAlgorithmStep>("superposition");

  // State amplitudes
  const [amplitudes, setAmplitudes] = useState<number[]>([0.5, 0.5, 0.5, 0.5]);
  const [outcome, setOutcome] = useState<number | null>(null);

  const graphRef = useRef<ReturnType<typeof createAmplitudeBarGraphGroup> | null>(null);

  const meanAmplitude = computeMeanAmplitude(amplitudes);
  const probabilities = computeGroverProbabilities(amplitudes);
  const targetProb = probabilities[targetIndex] ?? 0;
  const baselineProb = 1 / amplitudes.length;
  const multiplier = baselineProb > 0 ? targetProb / baselineProb : 1;
  const targetAmp = amplitudes[targetIndex] ?? 0.5;
  const isTargetAligned = isBarInTargetZone(Math.abs(targetAmp) * 2.4, 1.4);

  // Set Target State
  const handleSelectTarget = useCallback((index: number) => {
    setTargetIndex(index);
    setCurrentStep("superposition");
    setAmplitudes([0.5, 0.5, 0.5, 0.5]);
    setOutcome(null);
    setLastOutcome(null);
    soundEngine.playVectorSnap();
  }, [setLastOutcome]);

  // Step 1: Oracle Phase Inversion
  const handlePhaseInversion = useCallback(() => {
    setAmplitudes(applyOraclePhaseInversion([0.5, 0.5, 0.5, 0.5], targetIndex));
    setCurrentStep("inversion");
    setOutcome(null);
    soundEngine.playVectorSnap();
  }, [targetIndex]);

  // Step 2: Amplitude Amplification (Diffusion Inversion About Mean)
  const handleAmplitudeAmplification = useCallback(() => {
    const baseAmps =
      currentStep === "inversion"
        ? amplitudes
        : applyOraclePhaseInversion([0.5, 0.5, 0.5, 0.5], targetIndex);

    const { amplitudes: reflected } = applyDiffusionReflection(baseAmps);
    setAmplitudes(reflected);
    setCurrentStep("amplification");
    setOutcome(null);
    graphRef.current?.triggerBouncePulse();
    soundEngine.playVectorSnap();
  }, [currentStep, amplitudes, targetIndex]);

  // Step 3: Measurement Collapse
  const handleMeasure = useCallback(() => {
    const roll = Math.random();
    let cumulative = 0;
    let chosen = targetIndex;
    for (let i = 0; i < probabilities.length; i++) {
      cumulative += probabilities[i];
      if (roll <= cumulative) {
        chosen = i;
        break;
      }
    }
    setOutcome(chosen);
    setCurrentStep("measured");
    setLastOutcome(chosen === targetIndex ? 1 : 0);
    soundEngine.playStateCollapse();
  }, [probabilities, targetIndex, setLastOutcome]);

  // Reset back to initial equal superposition
  const handleReset = useCallback(() => {
    setAmplitudes([0.5, 0.5, 0.5, 0.5]);
    setCurrentStep("superposition");
    setOutcome(null);
    setLastOutcome(null);
    soundEngine.playVectorSnap();
  }, [setLastOutcome]);

  return (
    <MissionCanvasShell
      missionId={missionId}
      className={className}
      tier2Canvas={
        <GroverViewport
          amplitudes={amplitudes}
          targetIndex={targetIndex}
          isPhaseInverted={currentStep === "inversion"}
          onSelectTarget={handleSelectTarget}
          onReadyGraph={(g) => {
            graphRef.current = g;
          }}
        />
      }
      pipelineRibbonProps={{
        activePhase: currentStep === "measured" ? "measure" : "transform",
        onTransformGate: () => {
          if (currentStep === "superposition") handlePhaseInversion();
          else if (currentStep === "inversion") handleAmplitudeAmplification();
        },
        onMeasure: handleMeasure,
      }}
      tier2Overlays={
        <div className="absolute inset-0 pointer-events-none max-h-full overflow-y-auto pt-16 px-4 pb-4 sm:pt-20 sm:px-6 sm:pb-6 flex flex-col md:flex-row justify-between items-start gap-4 select-none">
          {/* Top Left: Strategy Deck & Spatial Telemetry Bridge */}
          <div className="w-full md:w-80 lg:w-96 pointer-events-auto shrink-0 space-y-2">
            <GlassCard
              title="Grover Search Strategy"
              badge={`Phase: ${currentStep.toUpperCase()}`}
            >
              <div className="space-y-3 font-mono text-xs">
                {/* 1. Target State Selector */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase font-bold">
                    <span className="flex items-center gap-1">
                      <Crosshair className="w-3 h-3 text-quantum-cyan" />
                      Oracle Target State (x*)
                    </span>
                    <span className="text-quantum-cyan font-bold">
                      {BASIS_LABELS_4[targetIndex]}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {BASIS_LABELS_4.map((label, idx) => (
                      <Button
                        key={label}
                        variant={targetIndex === idx ? "primary" : "secondary"}
                        size="sm"
                        onClick={() => handleSelectTarget(idx)}
                        data-testid={`target-selector-${idx}`}
                        className="py-1 px-1 text-[11px] font-mono"
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 2. Grover Algorithm Step Controls */}
                <div className="pt-2 border-t border-border flex flex-col gap-1.5">
                  <Button
                    variant={currentStep === "superposition" ? "primary" : "secondary"}
                    size="sm"
                    onClick={handlePhaseInversion}
                    data-testid="oracle-inversion-button"
                    className="w-full text-xs py-1.5 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1.5"><ArrowDownUp className="w-3.5 h-3.5 text-warning" />Oracle Phase Invert (O_f)</span>
                    <span className="text-[10px] opacity-75">α → -α</span>
                  </Button>

                  <Button
                    variant={currentStep === "inversion" ? "primary" : "secondary"}
                    size="sm"
                    onClick={handleAmplitudeAmplification}
                    data-testid="diffusion-amplify-button"
                    className="w-full text-xs py-1.5 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-quantum-cyan" />2. Invert About Mean (D)</span>
                    <span className="text-[10px] opacity-75">2⟨a⟩ - α</span>
                  </Button>

                  <Button
                    variant={currentStep === "amplification" ? "primary" : "secondary"}
                    size="sm"
                    onClick={handleMeasure}
                    data-testid="measure-button"
                    className="w-full text-xs py-1.5 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-quantum-emerald" />3. Measure Search Result</span>
                    <span className="text-[10px] opacity-75">Collapse</span>
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    data-testid="reset-button"
                    className="w-full text-[10px] py-1 text-muted-foreground hover:text-foreground"
                  >
                    <RefreshCw className="w-2.5 h-2.5 mr-1" />
                    Reset to Equal Superposition
                  </Button>
                </div>

                {/* Active Spatial Telemetry Card */}
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
                    <p className="text-[10px] text-muted-foreground leading-tight">{activeMapping.description}</p>
                  </div>
                ) : (
                  <div className="p-2 rounded-lg border border-white/5 bg-surface-2/60 text-[10px] text-muted-foreground">
                    Hover amplitude bars or the mean plane to inspect geometry telemetry.
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Top Right: Telemetry Readouts & Scoreboard */}
          <div className="w-full md:w-88 lg:w-96 pointer-events-auto shrink-0 space-y-2.5">
            {/* 1. Target Amplification Scoreboard */}
            <GlassCard title="Amplitude Amplification" badge="Grover Boost">
              <div className="space-y-2.5 font-mono text-xs">
                {/* Mathematical Operator Formula */}
                <div
                  data-testid="grover-formula-card"
                  className="p-1.5 rounded border border-white/10 bg-surface-2/80 text-quantum-cyan font-bold tabular-nums text-xs"
                >
                  {currentStep === "superposition" && "|ψ₀⟩ = 1/2 (|00⟩ + |01⟩ + |10⟩ + |11⟩)"}
                  {currentStep === "inversion" && `O_f |ψ₀⟩ : α(${BASIS_LABELS_4[targetIndex]}) flipped to negative`}
                  {currentStep === "amplification" && "D O_f |ψ₀⟩ : Inversion about ⟨a_mean⟩ amplifies target to 100%"}
                  {currentStep === "measured" && `Collapsed state: ${BASIS_LABELS_4[outcome ?? targetIndex]} (Fidelity: 100%)`}
                </div>

                {/* Probabilities & Mean Telemetry Readouts */}
                <div className="grid grid-cols-2 gap-1.5 text-center text-[11px]">
                  <div className="p-1.5 rounded border border-quantum-cyan/40 bg-quantum-cyan/10">
                    <div className="text-[10px] text-muted-foreground uppercase">Target Prob P(x*)</div>
                    <div
                      data-testid="target-probability-readout"
                      className="text-quantum-cyan font-bold tabular-nums text-sm"
                    >
                      {(targetProb * 100).toFixed(1)}%
                    </div>
                    <div
                      data-testid="multiplier-badge"
                      className="text-[9px] text-quantum-emerald font-semibold uppercase"
                    >
                      {multiplier.toFixed(1)}× Baseline
                    </div>
                  </div>

                  <div className="p-1.5 rounded border border-quantum-purple/40 bg-quantum-purple/10">
                    <div className="text-[10px] text-muted-foreground uppercase">Mean Line ⟨a_mean⟩</div>
                    <div
                      data-testid="mean-amplitude-readout"
                      className="text-quantum-purple font-bold tabular-nums text-sm"
                    >
                      {meanAmplitude.toFixed(3)}
                    </div>
                    <div className="text-[9px] text-muted-foreground">Reflect: 2⟨a⟩ - α</div>
                  </div>
                </div>

                {/* 3D Spatial Target Prediction Zone */}
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
                      <span>{isTargetAligned ? "AMPLITUDE LOCKED" : "ALIGNING"}</span>
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    {isTargetAligned
                      ? "Spatial threshold reached: Target amplitude has grown into the 3D target zone."
                      : "Apply Grover diffusion to amplify the target bar into the floating target volume."}
                  </p>
                </div>

                {/* 4-State Probability Distribution Grid */}
                <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                  {BASIS_LABELS_4.map((label, idx) => {
                    const prob = probabilities[idx] ?? 0;
                    const isTarget = idx === targetIndex;
                    const amp = amplitudes[idx] ?? 0;
                    return (
                      <div
                        key={label}
                        data-testid={`basis-card-${idx}`}
                        onMouseEnter={() => {
                          useSpatialTelemetryBridge.getState().setActiveFocusId("grover-amplitude-bar");
                        }}
                        className={`p-1 rounded border transition-all ${
                          isTarget ? "border-quantum-cyan bg-quantum-cyan/20 scale-102" : "border-white/10 bg-surface-2/60"
                        }`}
                      >
                        <div className="text-muted-foreground font-bold">{label}</div>
                        <div className="font-bold tabular-nums text-foreground">{(prob * 100).toFixed(0)}%</div>
                        <div className={`text-[9px] tabular-nums font-mono ${amp < 0 ? "text-warning font-bold" : "text-muted-foreground"}`}>
                          {amp >= 0 ? "+" : ""}{amp.toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Outcome Banner when measured */}
                {outcome !== null && (
                  <div
                    data-testid="grover-outcome-banner"
                    className="p-1.5 rounded border border-emerald-500/40 bg-emerald-500/10 text-[11px] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Found Target: {BASIS_LABELS_4[outcome]}</span>
                    </div>
                    <span className="text-[9px] text-quantum-emerald font-mono uppercase">O(√N) SPEEDUP</span>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        </div>
      }
    />
  );
};

export default Mission07GroverSearch;