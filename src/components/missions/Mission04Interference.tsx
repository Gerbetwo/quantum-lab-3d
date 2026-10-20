"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import * as THREE from "three";
import { useQuantumStore } from "@/store/useQuantumStore";
import { MissionCanvasShell } from "@/components/framework/MissionCanvasShell";
import { CoreBlochSphere } from "@/components/canvas/CoreBlochSphere";
import {
  computeInterferenceAmplitudes,
  createDualPathInterferometerGroup,
  createWaveInterferenceSystem,
} from "@/components/canvas/Interferometer3D";
import { useSpatialTelemetryBridge } from "@/hooks/useSpatialTelemetryBridge";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { soundEngine } from "@/lib/soundEngine";
import { Waves } from "lucide-react";

export interface Mission04InterferenceProps {
  className?: string;
  missionId?: string;
}

const PHASE_PRESETS = [
  { label: "0 (Max)", phi: 0, desc: "Constructive" },
  { label: "π/2 (50%)", phi: Math.PI / 2, desc: "Half" },
  { label: "π (Node)", phi: Math.PI, desc: "Destructive" },
  { label: "3π/2 (50%)", phi: (3 * Math.PI) / 2, desc: "Half" },
] as const;

/**
 * Mission 04: Phase & Superposition Interference
 * Features:
 * - 3D dual-path Mach-Zehnder interferometer with optical rails & phase shifter.
 * - Interactive complex plane phase rotation disk illustrating vector addition
 *   of amplitude paths (A_constructive vs A_destructive).
 * - Animated 3D wave packet interference ripples merging at detector targets as e^(iφ) changes.
 * - Real-time spatial telemetry synchronization via useSpatialTelemetryBridge.
 */
export const Mission04Interference: React.FC<Mission04InterferenceProps> = ({
  className = "",
  missionId = "gates",
}) => {
  const phi = useQuantumStore((s) => s.phi);
  const setPhi = useQuantumStore((s) => s.setPhi);
  const theta = useQuantumStore((s) => s.theta);
  const setAngles = useQuantumStore((s) => s.setAngles);

  const activeMapping = useSpatialTelemetryBridge((s) => s.getActiveMapping());

  const safePhi = Number.isFinite(phi) ? phi : 0;
  const amplitudes = computeInterferenceAmplitudes(safePhi);

  // SVG Complex Plane dimensions
  const svgSize = 180;
  const center = svgSize / 2;
  const radius = 62;

  // Vector coordinates on complex plane:
  // A0 = (0.5, 0)
  const a0X = center + (radius * 0.5);
  const a0Y = center;

  // A1 = 0.5 * e^(iφ)
  const a1Real = 0.5 * Math.cos(safePhi);
  const a1Imag = 0.5 * Math.sin(safePhi);
  const a1X = center + radius * a1Real;
  const a1Y = center - radius * a1Imag;

  // Vector addition: A_constructive = A0 + A1
  const sumX = center + radius * amplitudes.constructiveReal;
  const sumY = center - radius * amplitudes.constructiveImag;

  // Vector subtraction: A_destructive = A0 - A1
  const diffX = center + radius * amplitudes.destructiveReal;
  const diffY = center + radius * amplitudes.destructiveImag;

  const [isDraggingDisk, setIsDraggingDisk] = useState<boolean>(false);
  const svgDiskRef = useRef<SVGSVGElement | null>(null);

  // Ensure initial superposition (θ = π/2) for balanced dual-path interference
  useEffect(() => {
    if (theta === 0) {
      setAngles(Math.PI / 2, safePhi);
    }
  }, [theta, safePhi, setAngles]);

  // Handle pointer interactions with the Complex Plane Disk
  const updatePhiFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      if (!svgDiskRef.current) return;
      const rect = svgDiskRef.current.getBoundingClientRect();
      const x = clientX - (rect.left + rect.width / 2);
      const y = -(clientY - (rect.top + rect.height / 2));
      let angle = Math.atan2(y, x);
      if (angle < 0) angle += 2 * Math.PI;
      setPhi(angle);
    },
    [setPhi]
  );

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    setIsDraggingDisk(true);
    updatePhiFromPointer(e.clientX, e.clientY);
    useSpatialTelemetryBridge.getState().setActiveFocusId("phase-disk");
    soundEngine.playVectorSnap();
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isDraggingDisk) {
      updatePhiFromPointer(e.clientX, e.clientY);
    }
  };

  const handlePointerUp = () => {
    setIsDraggingDisk(false);
  };

  // Wire 3D interferometer scene and wave packets
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
      // 1. Dual-Path Interferometer Group
      const ifm = createDualPathInterferometerGroup();
      scene.add(ifm.group);

      // 2. Wave Packet Interference System
      const waveSys = createWaveInterferenceSystem();
      scene.add(waveSys.group);

      // Raycasting for spatial telemetry
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const interactiveObjects = [
        ifm.bs1Mesh,
        ifm.bs2Mesh,
        ifm.phaseShifterMesh,
        ifm.phaseDial,
        ifm.detectorConstructive,
        ifm.detectorDestructive,
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

      // Continuous animation loop
      let animId = 0;
      let lastTime = performance.now();
      const loop = (now: number) => {
        const dt = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;

        const currentPhi = useQuantumStore.getState().phi;
        ifm.update(currentPhi);
        waveSys.update(dt, currentPhi);

        animId = requestAnimationFrame(loop);
      };
      animId = requestAnimationFrame(loop);

      return () => {
        cancelAnimationFrame(animId);
        dom.removeEventListener("pointermove", onPointerMove);

        scene.remove(ifm.group);
        scene.remove(waveSys.group);

        ifm.dispose();
        waveSys.dispose();
      };
    },
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
          interactive
          onSceneReady={handleSceneReady}
        />
      }
      pipelineRibbonProps={{
        activePhase: "transform",
        onTransformGate: (gate) => {
          if (gate === "S") {
            setPhi((safePhi + Math.PI / 2) % (2 * Math.PI));
          } else if (gate === "T") {
            setPhi((safePhi + Math.PI / 4) % (2 * Math.PI));
          } else if (gate === "Z") {
            setPhi((safePhi + Math.PI) % (2 * Math.PI));
          }
          soundEngine.playVectorSnap();
        },
      }}
      tier2Overlays={
        <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between select-none">
          {/* Top Left: Interferometer Guide & Active Telemetry */}
          <div className="flex flex-col gap-2 max-w-sm pointer-events-auto">
            <GlassCard
              title={"Dual-Path Interferometer"}
              badge="Mach-Zehnder"
            >
              <div className="space-y-2 text-xs font-mono">
                <p className="text-muted-foreground text-[11px] leading-relaxed flex items-center gap-1.5">
                  <Waves className="w-3.5 h-3.5 text-quantum-cyan shrink-0" />
                  <span>{"Interference merges Path 0 & Path 1 amplitudes at the detector target."}</span>
                </p>

                {/* Spatial Telemetry Card */}
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
                    {"Hover beam splitters, phase shifter, or ripples to bind telemetry."}
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Top Right: Complex Plane Disk & Vector Addition HUD */}
          <div className="fixed top-16 right-4 w-84 pointer-events-auto space-y-2.5">
            {/* 1. Complex Plane Phase Rotation Disk */}
            <GlassCard title={"Complex Plane Vector Addition"} badge="e^{iφ} Dial">
              <div
                className="flex flex-col items-center gap-2"
                onMouseEnter={() => useSpatialTelemetryBridge.getState().setActiveFocusId("complex-amplitude-disk")}
              >
                {/* Interactive SVG Disk */}
                <div
                  data-testid="complex-phase-disk"
                  className="relative p-1 rounded-xl border border-white/10 bg-surface-2/70 shadow-inner cursor-crosshair select-none"
                >
                  <svg
                    ref={svgDiskRef}
                    width={svgSize}
                    height={svgSize}
                    className="overflow-visible"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                  >
                    {/* Background coordinate grid */}
                    <circle
                      cx={center}
                      cy={center}
                      r={radius}
                      fill="none"
                      stroke="rgba(255,255,255,0.12)"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                    <line
                      x1={center - radius - 8}
                      y1={center}
                      x2={center + radius + 8}
                      y2={center}
                      stroke="rgba(255,255,255,0.18)"
                      strokeWidth="1"
                    />
                    <line
                      x1={center}
                      y1={center - radius - 8}
                      x2={center}
                      y2={center + radius + 8}
                      stroke="rgba(255,255,255,0.18)"
                      strokeWidth="1"
                    />
                    <text x={center + radius + 2} y={center - 3} fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="monospace">
                      Re
                    </text>
                    <text x={center + 3} y={center - radius - 2} fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="monospace">
                      Im
                    </text>

                    {/* Vector A0 (Path 0: Constant along Re axis) */}
                    <line
                      x1={center}
                      y1={center}
                      x2={a0X}
                      y2={a0Y}
                      stroke="#00f3ff"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <circle cx={a0X} cy={a0Y} r="3" fill="#00f3ff" />

                    {/* Vector A1 (Path 1: Rotated by φ) */}
                    <line
                      x1={center}
                      y1={center}
                      x2={a1X}
                      y2={a1Y}
                      stroke="#a855f7"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <circle cx={a1X} cy={a1Y} r="3.5" fill="#a855f7" />

                    {/* Constructive Vector: A_c = A0 + A1 (Emerald) */}
                    <line
                      x1={center}
                      y1={center}
                      x2={sumX}
                      y2={sumY}
                      stroke="#10b981"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <circle cx={sumX} cy={sumY} r="4.5" fill="#10b981" />

                    {/* Destructive Vector: A_d = A0 - A1 (Amber) */}
                    <line
                      x1={center}
                      y1={center}
                      x2={diffX}
                      y2={diffY}
                      stroke="#f59e0b"
                      strokeWidth="2"
                      strokeDasharray="2 2"
                      strokeLinecap="round"
                    />
                    <circle cx={diffX} cy={diffY} r="3" fill="#f59e0b" />
                  </svg>
                </div>

                {/* Phase Presets */}
                <div className="grid grid-cols-4 gap-1 w-full pt-1">
                  {PHASE_PRESETS.map((p) => (
                    <Button
                      key={p.phi}
                      variant="secondary"
                      size="sm"
                      data-testid={`phase-preset-${p.phi.toFixed(2)}`}
                      onClick={() => {
                        setPhi(p.phi);
                        soundEngine.playVectorSnap();
                      }}
                      className="py-0.5 px-1 text-[10px] font-mono"
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>

                {/* Continuous Phase Slider */}
                <div className="w-full space-y-1 font-mono text-xs pt-1 border-t border-border">
                  <div className="flex justify-between text-[10px] text-muted-foreground uppercase">
                    <span>{"Relative Phase (φ)"}</span>
                    <span className="text-quantum-cyan tabular-nums font-bold">
                      {((safePhi * 180) / Math.PI).toFixed(1)}{"° / "}{(safePhi / Math.PI).toFixed(2)}{"π"}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={2 * Math.PI}
                    step="0.02"
                    value={safePhi}
                    onChange={(e) => setPhi(parseFloat(e.target.value))}
                    data-testid="phase-slider"
                    className="w-full accent-quantum-cyan cursor-pointer h-1.5 bg-surface-3"
                  />
                </div>
              </div>
            </GlassCard>

            {/* 2. Interference Telemetry Readout */}
            <GlassCard title={"Amplitude Addition & Born Intensity"} badge="P_c + P_d = 1">
              <div className="space-y-2 font-mono text-xs">
                {/* State Formula */}
                <div
                  data-testid="interference-state-formula"
                  className="p-1.5 rounded border border-white/10 bg-surface-2/80 text-quantum-cyan font-bold tabular-nums text-xs"
                >
                  {"|ψ⟩ = 1/√2 (|0⟩ + e^{iφ} |1⟩)"}
                </div>

                {/* Probabilities & Magnitudes */}
                <div className="grid grid-cols-2 gap-1.5 text-center text-[11px]">
                  <div className="p-1.5 rounded border border-emerald-500/30 bg-emerald-500/10">
                    <div className="text-[10px] text-muted-foreground">{"Constructive P_c"}</div>
                    <div data-testid="p-constructive" className="text-emerald-400 font-bold tabular-nums">
                      {(amplitudes.pConstructive * 100).toFixed(1)}{"%"}
                    </div>
                    <div className="text-[9px] text-muted-foreground tabular-nums">
                      {"|A_c| = "}{amplitudes.constructiveMagnitude.toFixed(3)}
                    </div>
                  </div>

                  <div className="p-1.5 rounded border border-amber-500/30 bg-amber-500/10">
                    <div className="text-[10px] text-muted-foreground">{"Destructive P_d"}</div>
                    <div data-testid="p-destructive" className="text-amber-400 font-bold tabular-nums">
                      {(amplitudes.pDestructive * 100).toFixed(1)}{"%"}
                    </div>
                    <div className="text-[9px] text-muted-foreground tabular-nums">
                      {"|A_d| = "}{amplitudes.destructiveMagnitude.toFixed(3)}
                    </div>
                  </div>
                </div>

                {/* Interference Regime Tag */}
                <div className="p-1.5 rounded border border-white/5 bg-surface-2/60 text-[10px] flex items-center justify-between">
                  <span className="text-muted-foreground">{"Regime:"}</span>
                  <span
                    data-testid="interference-regime-tag"
                    className={`font-bold flex items-center gap-1 ${
                      amplitudes.pConstructive > 0.95
                        ? "text-emerald-400"
                        : amplitudes.pDestructive > 0.95
                        ? "text-amber-400"
                        : "text-quantum-cyan"
                    }`}
                  >
                    {amplitudes.pConstructive > 0.95
                      ? "CONSTRUCTIVE MAXIMUM"
                      : amplitudes.pDestructive > 0.95
                      ? "DESTRUCTIVE MINIMUM / NODE"
                      : "PARTIAL INTERFERENCE"}
                  </span>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      }
    />
  );
};
