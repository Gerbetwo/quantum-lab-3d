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
import { isPhaseInTargetSector } from "@/components/canvas/TargetZone3D";
import { useSpatialTelemetryBridge } from "@/hooks/useSpatialTelemetryBridge";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { soundEngine } from "@/lib/soundEngine";
import { Waves, Crosshair, CheckCircle2 } from "lucide-react";

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
 * Dual-path interferometer, 3D target zone on complex phase disk, and spatial threshold alignment.
 */
export const Mission04Interference: React.FC<Mission04InterferenceProps> = ({
  className = "",
  missionId = "interference",
}) => {
  const phi = useQuantumStore((s) => s.phi);
  const setPhi = useQuantumStore((s) => s.setPhi);
  const theta = useQuantumStore((s) => s.theta);
  const setAngles = useQuantumStore((s) => s.setAngles);

  const activeMapping = useSpatialTelemetryBridge((s) => s.getActiveMapping());

  const safePhi = Number.isFinite(phi) ? phi : 0;
  const amplitudes = computeInterferenceAmplitudes(safePhi);

  // 3D & Disk Spatial Target Region: Constructive Interference Zone (φ ≈ 0 ± 0.35 rad)
  const TARGET_PHI = 0;
  const isTargetAligned = isPhaseInTargetSector(safePhi, TARGET_PHI, 0.35);
  const targetZone = React.useMemo(() => ({ theta: Math.PI / 2, phi: TARGET_PHI }), []);

  const svgSize = 180, center = svgSize / 2, radius = 62;
  const a0X = center + radius * 0.5, a0Y = center;
  const a1X = center + radius * 0.5 * Math.cos(safePhi), a1Y = center - radius * 0.5 * Math.sin(safePhi);
  const sumX = center + radius * amplitudes.constructiveReal, sumY = center - radius * amplitudes.constructiveImag;
  const diffX = center + radius * amplitudes.destructiveReal, diffY = center + radius * amplitudes.destructiveImag;

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
          targetZone={targetZone}
          onSceneReady={handleSceneReady}
        />
      }
      pipelineRibbonProps={{
        activePhase: "transform",
        onTransformGate: (gate) => {
          const delta = gate === "S" ? Math.PI / 2 : gate === "T" ? Math.PI / 4 : gate === "Z" ? Math.PI : 0;
          if (delta > 0) setPhi((safePhi + delta) % (2 * Math.PI));
          soundEngine.playVectorSnap();
        },
      }}
      tier2Overlays={
        <div className="absolute inset-0 pointer-events-none max-h-full overflow-y-auto pt-16 px-4 pb-4 sm:pt-20 sm:px-6 sm:pb-6 flex flex-col md:flex-row justify-between items-start gap-4 select-none">
          {/* Top Left: Interferometer Guide & Active Telemetry */}
          <div className="w-full md:w-80 lg:w-96 pointer-events-auto shrink-0 space-y-2">
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
          <div className="w-full md:w-84 lg:w-96 pointer-events-auto shrink-0 space-y-2.5">
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

                    {/* Translucent 3D / Disk Target Prediction Zone */}
                    <path
                      data-testid="phase-target-zone"
                      d={`M ${center} ${center} L ${center + radius * Math.cos(-0.35)} ${center - radius * Math.sin(-0.35)} A ${radius} ${radius} 0 0 1 ${center + radius * Math.cos(0.35)} ${center - radius * Math.sin(0.35)} Z`}
                      fill={isTargetAligned ? "rgba(16, 185, 129, 0.35)" : "rgba(0, 243, 255, 0.18)"}
                      stroke={isTargetAligned ? "#10b981" : "#00f3ff"}
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
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

                {/* 3D Target Prediction Zone */}
                <div
                  data-testid="target-zone-status"
                  className="p-1.5 rounded border border-white/10 bg-surface-2/80 space-y-1"
                >
                  <div className="flex justify-between items-center text-[10px] uppercase text-muted-foreground">
                    <span className="flex items-center gap-1 font-bold">
                      <Crosshair className="w-3 h-3 text-quantum-cyan" />
                      <span>Phase Target Zone</span>
                    </span>
                    <span
                      data-testid="target-alignment-badge"
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 ${
                        isTargetAligned ? "hud-badge-emerald" : "hud-badge-cyan"
                      }`}
                    >
                      {isTargetAligned ? <CheckCircle2 className="w-2.5 h-2.5 text-success" /> : null}
                      <span>{isTargetAligned ? "SECTOR LOCKED" : "ALIGNING"}</span>
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    {isTargetAligned
                      ? "Phase φ is aligned within the constructive interference spatial sector."
                      : "Rotate the phase disk dial into the illuminated green target sector."}
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      }
    />
  );
};

export default Mission04Interference;