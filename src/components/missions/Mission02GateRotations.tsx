"use client";

import React, { useState, useRef, useCallback } from "react";
import * as THREE from "three";
import { useQuantumStore } from "@/store/useQuantumStore";
import { MissionCanvasShell } from "@/components/framework/MissionCanvasShell";
import { CoreBlochSphere } from "@/components/canvas/CoreBlochSphere";
import {
  createGateRingsGroup,
  createGeodesicParticleSystem,
  GATE_RING_SPECS,
  GateRotationRings,
} from "@/components/canvas/GateRotationRings";
import { isVectorInBlochTarget } from "@/components/canvas/TargetZone3D";
import { useSpatialTelemetryBridge } from "@/hooks/useSpatialTelemetryBridge";
import { GlassCard } from "@/components/ui/GlassCard";
import { computeSphericalVector } from "@/features/quantum-core/blochSceneObjects";
import { Sparkles, Orbit, Crosshair, CheckCircle2 } from "lucide-react";

export interface Mission02GateRotationsProps {
  className?: string;
}

interface GateMatrixDef {
  symbol: string;
  latex: string;
  axis: string;
  matrix: [[string, string], [string, string]];
  description: string;
}

const GATE_MATRIX_DEFINITIONS: Record<string, GateMatrixDef> = {
  X: {
    symbol: "X",
    latex: "\\hat{\\sigma}_x",
    axis: "(1, 0, 0)",
    matrix: [["0", "1"], ["1", "0"]],
    description: "Bit flip: rotates π around X axis, mapping |0⟩ ↔ |1⟩.",
  },
  Y: {
    symbol: "Y",
    latex: "\\hat{\\sigma}_y",
    axis: "(0, 1, 0)",
    matrix: [["0", "-i"], ["i", "0"]],
    description: "Bit and phase flip: rotates π around Y axis, mapping |0⟩ ↔ i|1⟩.",
  },
  Z: {
    symbol: "Z",
    latex: "\\hat{\\sigma}_z",
    axis: "(0, 0, 1)",
    matrix: [["1", "0"], ["0", "-1"]],
    description: "Phase flip: rotates π around Z axis, mapping |1⟩ ↔ -|1⟩.",
  },
  H: {
    symbol: "H",
    latex: "\\frac{\\hat{\\sigma}_x + \\hat{\\sigma}_z}{\\sqrt{2}}",
    axis: "(1/√2, 0, 1/√2)",
    matrix: [["1/√2", "1/√2"], ["1/√2", "-1/√2"]],
    description: "Hadamard: creates equal superposition by rotating π around diagonal (X+Z)/√2.",
  },
  S: {
    symbol: "S",
    latex: "\\hat{S}",
    axis: "(0, 0, 1)",
    matrix: [["1", "0"], ["0", "i"]],
    description: "Phase gate: π/2 rotation around Z axis.",
  },
  T: {
    symbol: "T",
    latex: "\\hat{T}",
    axis: "(0, 0, 1)",
    matrix: [["1", "0"], ["0", "e^{iπ/4}"]],
    description: "π/8 gate: π/4 rotation around Z axis.",
  },
};

/**
 * Mission 02: Single-Qubit Unitary Gate Rotations
 * Upgraded with dynamic 3D rotation rings (X, Y, Z, H axis (X+Z)/√2),
 * geodesic trajectory particle arcs, MissionCanvasShell 3-tier architecture,
 * and real-time useSpatialTelemetryBridge bindings.
 */
export const Mission02GateRotations: React.FC<Mission02GateRotationsProps> = ({
  className = "",
}) => {
  const theta = useQuantumStore((s) => s.theta);
  const phi = useQuantumStore((s) => s.phi);
  const applyGateStore = useQuantumStore((s) => s.applyGate);

  const activeMapping = useSpatialTelemetryBridge((s) => s.getActiveMapping());

  const [lastGateApplied, setLastGateApplied] = useState<string>("H");
  const [geodesicArcActive, setGeodesicArcActive] = useState<boolean>(false);

  // 3D Target Prediction Zone: Destination state for active gate
  const targetZone = React.useMemo(() => {
    if (lastGateApplied === "X") return { theta: Math.PI, phi: 0 };
    if (lastGateApplied === "Y") return { theta: Math.PI, phi: Math.PI / 2 };
    if (lastGateApplied === "Z") return { theta: 0, phi: 0 };
    return { theta: Math.PI / 2, phi: 0 };
  }, [lastGateApplied]);

  const isTargetAligned = isVectorInBlochTarget(
    theta,
    phi,
    targetZone.theta,
    targetZone.phi,
    0.35
  );

  // Reference to particle trigger function wired inside the 3D scene
  const triggerParticleArcRef = useRef<
    ((start: THREE.Vector3, target: THREE.Vector3, colorHex?: number) => void) | null
  >(null);

  const prevAnglesRef = useRef({ theta, phi });

  // Trigger geodesic particle animation for a gate
  const triggerGateAnimation = useCallback((gate: string) => {
    const prevDir = computeSphericalVector(prevAnglesRef.current.theta, prevAnglesRef.current.phi);
    setLastGateApplied(gate);
    setGeodesicArcActive(true);

    setTimeout(() => {
      const nextState = useQuantumStore.getState();
      const nextDir = computeSphericalVector(nextState.theta, nextState.phi);
      const spec = GATE_RING_SPECS.find((s) => s.gate === gate);
      triggerParticleArcRef.current?.(prevDir, nextDir, spec?.colorHex ?? 0x00f3ff);
      prevAnglesRef.current = { theta: nextState.theta, phi: nextState.phi };
    }, 10);
  }, []);

  // Handle gate execution with geodesic particle animation
  const handleApplyGate = useCallback(
    (gate: string) => {
      triggerGateAnimation(gate);
      applyGateStore(gate);
    },
    [applyGateStore, triggerGateAnimation]
  );

  // Hook into CoreBlochSphere scene to attach dynamic rotation rings and particle arc system
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
      const rings = createGateRingsGroup(1.33);
      scene.add(rings.group);

      const particles = createGeodesicParticleSystem(90, 1.3);
      scene.add(particles.mesh);
      scene.add(particles.guideLine);

      triggerParticleArcRef.current = (start, target, color) => {
        particles.triggerArc(start, target, color);
      };

      // Raycasting for interactive rotation rings
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const onPointerMove = (e: PointerEvent) => {
        const canvas = renderer.domElement;
        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const ringMeshes = Object.values(rings.rings);
        const hits = raycaster.intersectObjects(ringMeshes, false);

        if (hits.length > 0) {
          const hitObj = hits[0].object as THREE.Mesh;
          const spatialId = hitObj.userData?.spatialId;
          if (spatialId) {
            useSpatialTelemetryBridge.getState().setActiveFocusId(spatialId);
          }
          canvas.style.cursor = "pointer";
          (hitObj.material as THREE.MeshBasicMaterial).opacity = 0.95;
        } else {
          ringMeshes.forEach((r) => {
            (r.material as THREE.MeshBasicMaterial).opacity = 0.55;
          });
        }
      };

      const onPointerDown = (e: PointerEvent) => {
        const canvas = renderer.domElement;
        const rect = canvas.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const ringMeshes = Object.values(rings.rings);
        const hits = raycaster.intersectObjects(ringMeshes, false);

        if (hits.length > 0) {
          const hitGate = hits[0].object.userData?.gate;
          if (hitGate) {
            handleApplyGate(hitGate);
          }
        }
      };

      const dom = renderer.domElement;
      dom.addEventListener("pointermove", onPointerMove);
      dom.addEventListener("pointerdown", onPointerDown);

      // Render loop hook for particles
      let animId = 0;
      let lastTime = performance.now();
      const loop = (now: number) => {
        const dt = Math.min((now - lastTime) / 1000, 0.1);
        lastTime = now;
        particles.update(dt);
        animId = requestAnimationFrame(loop);
      };
      animId = requestAnimationFrame(loop);

      return () => {
        cancelAnimationFrame(animId);
        dom.removeEventListener("pointermove", onPointerMove);
        dom.removeEventListener("pointerdown", onPointerDown);
        triggerParticleArcRef.current = null;
        scene.remove(rings.group);
        scene.remove(particles.mesh);
        scene.remove(particles.guideLine);
        rings.dispose();
        particles.dispose();
      };
    },
    [handleApplyGate]
  );

  const activeGateDef = GATE_MATRIX_DEFINITIONS[lastGateApplied] || GATE_MATRIX_DEFINITIONS.H;

  return (
    <MissionCanvasShell
      missionId="gates"
      className={className}
      tier2Canvas={
        <CoreBlochSphere
          radius={1.3}
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
        onTransformGate: (gate) => handleApplyGate(gate),
      }}
      tier2Overlays={
        <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between select-none">
          {/* Top Left: Dynamic Rotation Rings Legend & Active Ring Controls */}
          <div className="flex flex-col gap-2 max-w-sm pointer-events-auto">
            <GlassCard
              title={"Dynamic Gate Rotation Rings"}
              badge="Geodesic Arcs"
            >
              <div className="space-y-2.5 text-xs font-mono">
                <p className="text-muted-foreground text-[11px] leading-relaxed flex items-center gap-1.5">
                  <Orbit className="w-3.5 h-3.5 text-quantum-cyan shrink-0" />
                  <span>{"Click 3D rings or ribbon buttons to trace geodesic rotation arcs."}</span>
                </p>

                {/* Gate Rotation Rings Badges */}
                <GateRotationRings
                  activeGate={lastGateApplied}
                  onGateSelect={triggerGateAnimation}
                />

                {/* Spatial Telemetry Bridge Active Element Readout */}
                {activeMapping ? (
                  <div
                    data-testid="spatial-telemetry-card"
                    className="p-2 rounded-lg border border-quantum-purple/50 bg-quantum-purple/10 text-quantum-purple space-y-1 transition-all"
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                      <span>Focused: {activeMapping.label}</span>
                      <span className="font-mono">{activeMapping.symbol}</span>
                    </div>
                    <div className="text-[11px] font-mono text-foreground font-semibold">
                      LaTeX: <code className="text-quantum-purple">{activeMapping.latex}</code>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      {activeMapping.description}
                    </p>
                  </div>
                ) : (
                  <div className="p-2 rounded-lg border border-white/5 bg-surface-2/60 text-[10px] text-muted-foreground">
                    Hover 3D rings (X, Y, Z, H) to inspect rotation axes and unitary generators.
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Top Right: Unitary Transformation Matrix & Geodesic Arc HUD */}
          <div className="fixed top-16 right-4 w-80 pointer-events-auto space-y-2.5">
            <GlassCard
              title={"Unitary Matrix Telemetry"}
              badge={`U_${activeGateDef.symbol}`}
            >
              <div className="space-y-2.5 font-mono text-xs">
                {/* Active Gate Operator */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground uppercase">{"Operator"}</span>
                  <span className="px-2 py-0.5 rounded text-xs font-bold hud-badge-cyan">
                    Gate [{activeGateDef.symbol}]
                  </span>
                </div>

                {/* 2x2 Unitary Matrix Display */}
                <div
                  data-testid="gate-matrix-display"
                  className="p-2.5 rounded-lg border border-white/10 bg-surface-2/80 font-mono text-center space-y-1.5"
                >
                  <div className="text-[10px] text-muted-foreground">
                    Rotation Axis: <b className="text-foreground">{activeGateDef.axis}</b>
                  </div>
                  <div className="flex justify-center items-center gap-3 text-sm font-bold text-quantum-cyan tabular-nums py-1">
                    <div className="flex flex-col border-l border-r border-quantum-cyan/60 px-2 py-0.5">
                      <div className="flex gap-4 justify-between">
                        <span>{activeGateDef.matrix[0][0]}</span>
                        <span>{activeGateDef.matrix[0][1]}</span>
                      </div>
                      <div className="flex gap-4 justify-between">
                        <span>{activeGateDef.matrix[1][0]}</span>
                        <span>{activeGateDef.matrix[1][1]}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  {activeGateDef.description}
                </p>

                {/* 3D Target Prediction Zone Status */}
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
                      <span>{isTargetAligned ? "TARGET LOCKED" : "ROTATING"}</span>
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    {isTargetAligned
                      ? `Target state spatially reached via Gate [${lastGateApplied}].`
                      : `Apply gate rotation to land |ψ⟩ in the translucent target zone.`}
                  </p>
                </div>

                {/* Geodesic Particle Arc Indicator */}
                <div
                  data-testid="geodesic-arc-indicator"
                  className="pt-2 border-t border-border flex items-center justify-between text-[11px]"
                >
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-quantum-cyan" />
                    <span>{"Geodesic Trajectory:"}</span>
                  </span>
                  <span className="text-success font-bold font-mono">
                    {geodesicArcActive ? "ACTIVE (π rad)" : "IDLE"}
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

export default Mission02GateRotations;
