"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import * as THREE from "three";
import { useQuantumStore } from "@/store/useQuantumStore";
import { useTranslation } from "@/lib/i18n";
import { MissionCanvasShell } from "@/components/framework/MissionCanvasShell";
import { CoreBlochSphere } from "@/components/canvas/CoreBlochSphere";
import {
  computeBornProbabilities,
  createMeasurementChamberGroup,
  createPoleDensityRingsGroup,
  createCollapseRaySystem,
  createSamplingHistogram3D,
} from "@/components/canvas/MeasurementChamber3D";
import { useSpatialTelemetryBridge } from "@/hooks/useSpatialTelemetryBridge";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { soundEngine } from "@/lib/soundEngine";
import { Zap, BarChart3, RefreshCw, Layers } from "lucide-react";

export interface Mission03MeasurementProps {
  className?: string;
  missionId?: string;
}

/**
 * Mission 03: Measurement & Wavefunction Collapse
 * Features:
 * - 3D measurement chamber enclosure encasing the Bloch sphere.
 * - Dynamic pole probability density rings: P₀ = cos²(θ/2), P₁ = sin²(θ/2).
 * - Projectile collapse ray animation snapping the state vector to |0⟩ or |1⟩.
 * - Real-time 3D sampling histogram demonstrating the Law of Large Numbers.
 */
export const Mission03Measurement: React.FC<Mission03MeasurementProps> = ({
  className = "",
  missionId = "superposition",
}) => {
  const { t } = useTranslation();
  const theta = useQuantumStore((s) => s.theta);
  const phi = useQuantumStore((s) => s.phi);
  const setAngles = useQuantumStore((s) => s.setAngles);
  const setLastOutcome = useQuantumStore((s) => s.setLastOutcome);
  const storeLastOutcome = useQuantumStore((s) => s.lastOutcome);

  const activeMapping = useSpatialTelemetryBridge((s) => s.getActiveMapping());

  // Invariant Born probabilities
  const safeTheta = Number.isFinite(theta) ? theta : 0;
  const safePhi = Number.isFinite(phi) ? phi : 0;
  const { p0, p1 } = computeBornProbabilities(safeTheta);
  const alpha = Math.cos(safeTheta / 2);
  const beta = Math.sin(safeTheta / 2);

  // Stochastic sampling counts for 3D histogram
  const [shots0, setShots0] = useState<number>(0);
  const [shots1, setShots1] = useState<number>(0);
  const totalShots = shots0 + shots1;
  const f0 = totalShots > 0 ? shots0 / totalShots : 0;
  const f1 = totalShots > 0 ? shots1 / totalShots : 0;

  // Animation lock during collapse ray traversal
  const [isCollapsing, setIsCollapsing] = useState<boolean>(false);

  // Ref triggers for 3D systems inside Three.js scene
  const triggerCollapseRayRef = useRef<
    ((outcome: 0 | 1, onComplete?: () => void) => void) | null
  >(null);
  const updateHistogramRef = useRef<
    ((n0: number, n1: number, p0Theo: number, p1Theo: number) => void) | null
  >(null);

  // Sync histogram when counts or angles change
  useEffect(() => {
    updateHistogramRef.current?.(shots0, shots1, p0, p1);
  }, [shots0, shots1, p0, p1]);

  // Execute single-shot measurement with projectile collapse ray animation
  const handleMeasure = useCallback(() => {
    if (isCollapsing) return;

    // Roll stochastic outcome based on Born rule
    const outcome: 0 | 1 = Math.random() < p0 ? 0 : 1;
    setIsCollapsing(true);
    soundEngine.playStateCollapse();

    // Snap state vector to measured eigenstate and update counts
    setAngles(outcome === 0 ? 0 : Math.PI, 0);
    setLastOutcome(outcome);
    if (outcome === 0) setShots0((prev) => prev + 1);
    else setShots1((prev) => prev + 1);

    if (triggerCollapseRayRef.current) {
      triggerCollapseRayRef.current(outcome, () => {
        setIsCollapsing(false);
      });
    } else {
      setIsCollapsing(false);
    }
  }, [isCollapsing, p0, setAngles, setLastOutcome]);

  // Execute batch stochastic sampling (Law of Large Numbers)
  const handleBatchSample = useCallback(
    (count: number) => {
      if (isCollapsing) return;
      let added0 = 0;
      let added1 = 0;
      for (let i = 0; i < count; i++) {
        if (Math.random() < p0) added0++;
        else added1++;
      }
      setShots0((prev) => prev + added0);
      setShots1((prev) => prev + added1);
      soundEngine.playVectorSnap();
    },
    [isCollapsing, p0]
  );

  const handleResetHistogram = useCallback(() => {
    setShots0(0);
    setShots1(0);
    soundEngine.playVectorSnap();
  }, []);

  // Hook into CoreBlochSphere scene to attach chamber, rings, ray system, and histogram
  const handleSceneReady = useCallback(
    ({
      scene,
      camera,
      renderer,
    }: {
      scene: THREE.Scene;
      camera: THREE.PerspectiveCamera;
      renderer: THREE.WebGLRenderer;
    }) => {
      // 1. Measurement chamber enclosure
      const chamber = createMeasurementChamberGroup(1.45);
      scene.add(chamber.group);

      // 2. Dynamic pole probability density rings
      const poleRings = createPoleDensityRingsGroup(1.34);
      scene.add(poleRings.group);

      // 3. Projectile collapse ray system
      const collapseSys = createCollapseRaySystem(1.34, 1.52);
      scene.add(collapseSys.group);
      triggerCollapseRayRef.current = (outcome, onComplete) => {
        collapseSys.triggerRay(outcome, onComplete);
      };

      // 4. Real-time 3D sampling histogram
      const histogram = createSamplingHistogram3D(new THREE.Vector3(2.1, -0.5, 0));
      scene.add(histogram.group);
      updateHistogramRef.current = (n0, n1, p0Val, p1Val) => {
        histogram.updateCounts(n0, n1, p0Val, p1Val);
      };
      // Initial render sync
      histogram.updateCounts(shots0, shots1, p0, p1);

      // Raycasting for interactive spatial telemetry
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const interactiveObjects = [
        chamber.chamberMesh,
        chamber.emitterNorth,
        chamber.emitterSouth,
        poleRings.ringNorth,
        poleRings.ringSouth,
        histogram.bar0,
        histogram.bar1,
      ];

      const onPointerMove = (e: PointerEvent) => {
        const canvas = renderer.domElement;
        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(interactiveObjects, false);

        if (hits.length > 0) {
          const hitObj = hits[0].object as THREE.Mesh;
          const spatialId = hitObj.userData?.spatialId;
          if (spatialId) {
            useSpatialTelemetryBridge.getState().setActiveFocusId(spatialId);
          }
          canvas.style.cursor = "pointer";
        }
      };

      const dom = renderer.domElement;
      dom.addEventListener("pointermove", onPointerMove);

      // Animation loop hook
      let animId = 0;
      let lastTime = performance.now();
      const loop = (now: number) => {
        const dt = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;

        const currentTheta = useQuantumStore.getState().theta;
        poleRings.update(currentTheta);
        collapseSys.update(dt);

        animId = requestAnimationFrame(loop);
      };
      animId = requestAnimationFrame(loop);

      return () => {
        cancelAnimationFrame(animId);
        dom.removeEventListener("pointermove", onPointerMove);
        triggerCollapseRayRef.current = null;
        updateHistogramRef.current = null;

        scene.remove(chamber.group);
        scene.remove(poleRings.group);
        scene.remove(collapseSys.group);
        scene.remove(histogram.group);

        chamber.dispose();
        poleRings.dispose();
        collapseSys.dispose();
        histogram.dispose();
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <MissionCanvasShell
      missionId={missionId}
      className={className}
      tier2Canvas={
        <CoreBlochSphere
          showArcs
          showAxes
          showPoleLabels
          interactive={!isCollapsing}
          onSceneReady={handleSceneReady}
        />
      }
      pipelineRibbonProps={{
        activePhase: "measure",
        onMeasure: handleMeasure,
        disabled: isCollapsing,
        lastOutcome: storeLastOutcome,
      }}
      tier2Overlays={
        <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between select-none">
          {/* Top Left: Chamber Guide & Active Spatial Telemetry Card */}
          <div className="flex flex-col gap-2 max-w-sm pointer-events-auto">
            <GlassCard
              title={"Measurement Chamber"}
              badge="Active Isolation"
            >
              <div className="space-y-2 text-xs font-mono">
                <p className="text-muted-foreground text-[11px] leading-relaxed flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-quantum-cyan shrink-0" />
                  <span>{"Enclosing chamber detects wavefunction collapse with projectile ray."}</span>
                </p>

                {/* Spatial Telemetry Bridge Binding */}
                {activeMapping ? (
                  <div
                    data-testid="spatial-telemetry-card"
                    className="p-2 rounded-lg border border-quantum-cyan/50 bg-quantum-cyan/10 text-quantum-cyan space-y-1 transition-all"
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                      <span>{"Focused: "}{activeMapping.label}</span>
                      <span className="font-mono">{activeMapping.symbol}</span>
                    </div>
                    <div className="text-[11px] font-mono text-foreground font-semibold">
                      {"LaTeX: "}<code className="text-quantum-cyan">{activeMapping.latex}</code>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      {activeMapping.description}
                    </p>
                  </div>
                ) : (
                  <div className="p-2 rounded-lg border border-white/5 bg-surface-2/60 text-[10px] text-muted-foreground">
                    {"Hover chamber, pole rings, or 3D histogram to bind telemetry."}
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Top Right: Born Probabilities & 3D Sampling Scoreboard */}
          <div className="fixed top-16 right-4 w-84 pointer-events-auto space-y-2.5">
            {/* 1. Born Rule Theoretical Probabilities */}
            <GlassCard title={t("math_dock.dirac_telemetry_title")} badge="Born Invariant">
              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between text-[10px] text-muted-foreground uppercase">
                  <span>{t("math_dock.state_vector_label")}</span>
                  <span className="tabular-nums text-quantum-cyan">
                    {"θ="}{((safeTheta * 180) / Math.PI).toFixed(1)}{"° φ="}{((safePhi * 180) / Math.PI).toFixed(1)}{"°"}
                  </span>
                </div>
                <div
                  data-testid="state-vector-formula"
                  className="p-1.5 rounded border border-white/10 bg-surface-2/80 text-quantum-cyan font-bold tabular-nums text-xs"
                >
                  {"|ψ⟩ = "}{alpha.toFixed(3)}{"|0⟩ + "}{beta.toFixed(3)}e<sup>{"iφ"}</sup>{"|1⟩"}
                </div>

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
                      {"P(|0⟩): "}{(p0 * 100).toFixed(1)}{"%"}
                    </span>
                    <span className="text-muted-foreground">{"|"}</span>
                    <span className="text-quantum-purple font-bold">
                      {"P(|1⟩): "}{(p1 * 100).toFixed(1)}{"%"}
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* 2. 3D Sampling Histogram Scoreboard */}
            <GlassCard title={"3D Sampling Statistics"} badge="Law of Large Numbers">
              <div className="space-y-2.5 font-mono text-xs">
                <div className="flex justify-between text-[10px] text-muted-foreground uppercase">
                  <span className="flex items-center gap-1">
                    <BarChart3 className="w-3 h-3 text-quantum-cyan" />
                    <span>{"Total Shots:"}</span>
                  </span>
                  <span data-testid="total-shots-counter" className="font-bold text-foreground tabular-nums">
                    {totalShots}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-center text-[11px]">
                  <div className="p-1.5 rounded border border-quantum-cyan/30 bg-quantum-cyan/10">
                    <div className="text-[10px] text-muted-foreground">{"Outcome |0⟩"}</div>
                    <div data-testid="outcome-0-count" className="text-quantum-cyan font-bold tabular-nums">
                      {shots0} <span className="text-[9px]">({(f0 * 100).toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="p-1.5 rounded border border-quantum-purple/30 bg-quantum-purple/10">
                    <div className="text-[10px] text-muted-foreground">{"Outcome |1⟩"}</div>
                    <div data-testid="outcome-1-count" className="text-quantum-purple font-bold tabular-nums">
                      {shots1} <span className="text-[9px]">({(f1 * 100).toFixed(1)}%)</span>
                    </div>
                  </div>
                </div>

                {/* Deviation delta */}
                {totalShots > 0 && (
                  <div className="text-[10px] text-muted-foreground flex justify-between">
                    <span>{"Empirical Error Δ:"}</span>
                    <span className="text-quantum-emerald font-bold tabular-nums">
                      {Math.abs(f0 - p0).toFixed(3)}
                    </span>
                  </div>
                )}

                {/* Batch sampling control buttons */}
                <div className="pt-2 border-t border-border flex flex-col gap-1.5">
                  <div className="flex gap-1.5">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleMeasure}
                      disabled={isCollapsing}
                      data-testid="single-shot-button"
                      className="flex-1 text-xs py-1"
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      <span>{"1 Shot"}</span>
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleBatchSample(10)}
                      disabled={isCollapsing}
                      data-testid="batch-10-button"
                      className="flex-1 text-xs py-1"
                    >
                      <span>{"+10 Shots"}</span>
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleBatchSample(50)}
                      disabled={isCollapsing}
                      data-testid="batch-50-button"
                      className="flex-1 text-xs py-1"
                    >
                      <span>{"+50 Shots"}</span>
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleResetHistogram}
                    disabled={isCollapsing || totalShots === 0}
                    data-testid="reset-histogram-button"
                    className="w-full text-[10px] py-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <RefreshCw className="w-2.5 h-2.5 mr-1" />
                    <span>{"Reset Histogram"}</span>
                  </Button>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      }
    />
  );
};
