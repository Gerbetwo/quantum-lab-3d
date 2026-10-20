"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import * as THREE from "three";
import { useQuantumStore } from "@/store/useQuantumStore";
import { MissionCanvasShell } from "@/components/framework/MissionCanvasShell";
import { acquireRenderer } from "@/features/quantum-core/BlochViewport";
import {
  computeTwoQubitState,
  computeSteeredQubitB,
  createEntanglementLatticeGroup,
  createBlochSphereGroup,
  type BellStateType,
} from "@/components/canvas/EntanglementLattice3D";
import { useSpatialTelemetryBridge } from "@/hooks/useSpatialTelemetryBridge";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { soundEngine } from "@/lib/soundEngine";
import { Zap, Activity, CheckCircle2, RotateCcw } from "lucide-react";

export interface Mission05EntanglementProps {
  className?: string;
  missionId?: string;
}

const BELL_PRESETS: { type: BellStateType; label: string; formula: string; desc: string }[] = [
  { type: "phi_plus", label: "|Φ⁺⟩", formula: "(|00⟩ + |11⟩)/√2", desc: "Correlated" },
  { type: "phi_minus", label: "|Φ⁻⟩", formula: "(|00⟩ - |11⟩)/√2", desc: "Phase-flip" },
  { type: "psi_plus", label: "|Ψ⁺⟩", formula: "(|01⟩ + |10⟩)/√2", desc: "Bit-flip" },
  { type: "psi_minus", label: "|Ψ⁻⟩", formula: "(|01⟩ - |10⟩)/√2", desc: "Singlet" },
  { type: "separable", label: "Sep |00⟩", formula: "|00⟩", desc: "Decoupled" },
];

const FORMULAS: Record<BellStateType, string> = {
  phi_plus: "|ψ⟩ = 1/√2 (|00⟩ + |11⟩)",
  phi_minus: "|ψ⟩ = 1/√2 (|00⟩ - |11⟩)",
  psi_plus: "|ψ⟩ = 1/√2 (|01⟩ + |10⟩)",
  psi_minus: "|ψ⟩ = 1/√2 (|01⟩ - |10⟩)",
  separable: "|ψ⟩ = |00⟩",
};

interface DualBlochViewportProps {
  thetaA: number;
  phiA: number;
  thetaB: number;
  phiB: number;
  isEntangled: boolean;
  onVectorDragA: (theta: number, phi: number) => void;
  onReadyLattice: (lattice: ReturnType<typeof createEntanglementLatticeGroup>) => void;
}

const DualBlochViewport: React.FC<DualBlochViewportProps> = ({
  thetaA,
  phiA,
  thetaB,
  phiB,
  isEntangled,
  onVectorDragA,
  onReadyLattice,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragPlaneRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const isDraggingRef = useRef<boolean>(false);
  const anglesRef = useRef({ thetaA, phiA, thetaB, phiB });

  useEffect(() => {
    anglesRef.current = { thetaA, phiA, thetaB, phiB };
  }, [thetaA, phiA, thetaB, phiB]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = acquireRenderer(container);
    const scene = new THREE.Scene();
    const w = container.clientWidth || 800;
    const h = container.clientHeight || 600;
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    camera.position.set(0, 0, 6.2);
    scene.add(new THREE.AmbientLight(0xffffff, 0.95));

    const alice = createBlochSphereGroup(-2.2, 0.92, 0x00f3ff, "qubit-alice");
    const bob = createBlochSphereGroup(2.2, 0.92, 0xa855f7, "qubit-bob");
    const lattice = createEntanglementLatticeGroup();
    scene.add(alice.group, bob.group, lattice.group);
    onReadyLattice(lattice);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const hitPoint = new THREE.Vector3();
    const interactive = [alice.tipHandle, alice.sphere, bob.sphere, lattice.latticeMesh];

    const getMouseNDC = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerDown = (e: PointerEvent) => {
      getMouseNDC(e);
      raycaster.setFromCamera(mouse, camera);
      if (raycaster.intersectObjects([alice.tipHandle, alice.sphere], false).length > 0) {
        isDraggingRef.current = true;
        renderer.domElement.setPointerCapture?.(e.pointerId);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      getMouseNDC(e);
      raycaster.setFromCamera(mouse, camera);

      if (isDraggingRef.current) {
        if (raycaster.ray.intersectPlane(dragPlaneRef.current, hitPoint)) {
          const localVec = hitPoint.clone().sub(new THREE.Vector3(-2.2, 0, 0)).normalize();
          const newTheta = Math.acos(Math.max(-1, Math.min(1, localVec.y)));
          let newPhi = Math.atan2(localVec.z, localVec.x);
          if (newPhi < 0) newPhi += 2 * Math.PI;
          onVectorDragA(newTheta, newPhi);
        }
        return;
      }

      const hits = raycaster.intersectObjects(interactive, false);
      if (hits.length > 0 && hits[0].object.userData?.spatialId) {
        useSpatialTelemetryBridge.getState().setActiveFocusId(hits[0].object.userData.spatialId);
        renderer.domElement.style.cursor = "pointer";
      } else {
        renderer.domElement.style.cursor = "default";
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        renderer.domElement.releasePointerCapture?.(e.pointerId);
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener("pointerdown", onPointerDown);
    dom.addEventListener("pointermove", onPointerMove);
    dom.addEventListener("pointerup", onPointerUp);

    let animId = 0;
    let lastTime = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      alice.updateVector(anglesRef.current.thetaA, anglesRef.current.phiA);
      bob.updateVector(anglesRef.current.thetaB, anglesRef.current.phiB);
      lattice.update(dt, isEntangled);
      renderer.render(scene, camera);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener("pointerdown", onPointerDown);
      dom.removeEventListener("pointermove", onPointerMove);
      dom.removeEventListener("pointerup", onPointerUp);
      scene.remove(alice.group, bob.group, lattice.group);
      alice.dispose();
      bob.dispose();
      lattice.dispose();
    };
  }, [onReadyLattice, onVectorDragA, isEntangled]);

  return (
    <div
      ref={containerRef}
      data-testid="dual-bloch-viewport"
      className="relative w-full h-full select-none overflow-hidden touch-none"
    />
  );
};

/**
 * Mission 05: Quantum Entanglement & Multi-Qubit Systems
 */
export const Mission05Entanglement: React.FC<Mission05EntanglementProps> = ({
  className = "",
  missionId = "entanglement",
}) => {
  const thetaA = useQuantumStore((s) => s.theta);
  const phiA = useQuantumStore((s) => s.phi);
  const setAngles = useQuantumStore((s) => s.setAngles);
  const isEntangled = useQuantumStore((s) => s.isEntangled);
  const setEntangled = useQuantumStore((s) => s.setEntangled);
  const setLastOutcome = useQuantumStore((s) => s.setLastOutcome);

  const activeMapping = useSpatialTelemetryBridge((s) => s.getActiveMapping());

  // Entanglement parameters
  const [bellType, setBellType] = useState<BellStateType>("phi_plus");
  const [entropyDegree, setEntropyDegree] = useState<number>(1.0);
  const [isCollapsing, setIsCollapsing] = useState<boolean>(false);
  const [outcomeA, setOutcomeA] = useState<0 | 1 | null>(null);
  const [outcomeB, setOutcomeB] = useState<0 | 1 | null>(null);
  const [hoveredBasis, setHoveredBasis] = useState<string | null>(null);

  const latticeRef = useRef<ReturnType<typeof createEntanglementLatticeGroup> | null>(null);

  // Steered coordinates for Bob based on entanglement entropy
  const safeThetaA = Number.isFinite(thetaA) ? thetaA : 0;
  const safePhiA = Number.isFinite(phiA) ? phiA : 0;
  const { thetaB, phiB } = computeSteeredQubitB(
    bellType,
    safeThetaA,
    safePhiA,
    isEntangled ? entropyDegree : 0
  );

  const twoQubitAmps = computeTwoQubitState(
    bellType,
    safeThetaA,
    safePhiA,
    isEntangled ? entropyDegree : 0
  );

  // Set initial Bell state |Φ⁺⟩ on mount
  useEffect(() => {
    if (!isEntangled) {
      setEntangled(true);
    }
  }, [isEntangled, setEntangled]);

  const handleSelectBellState = (type: BellStateType) => {
    setBellType(type);
    setOutcomeA(null);
    setOutcomeB(null);
    setLastOutcome(null);

    if (type === "separable") {
      setEntangled(false);
      setEntropyDegree(0);
    } else {
      setEntangled(true);
      setEntropyDegree(1.0);
    }

    latticeRef.current?.triggerIgnition(type);
    soundEngine.playVectorSnap();
  };

  // Instant correlated collapse
  const handleMeasure = useCallback(() => {
    if (isCollapsing) return;

    // Roll stochastic outcome for Alice based on P(A=0) = p00 + p01
    const pA0 = twoQubitAmps.c00.prob + twoQubitAmps.c01.prob;
    const rollA: 0 | 1 = Math.random() < pA0 ? 0 : 1;

    // Determine Bob's collapsed eigenstate based on Bell correlation
    let rollB: 0 | 1 = rollA;
    if (bellType === "psi_minus" || bellType === "psi_plus") {
      rollB = rollA === 0 ? 1 : 0; // Anti-correlated
    } else if (bellType === "separable") {
      rollB = 0;
    }

    setIsCollapsing(true);
    soundEngine.playStateCollapse();

    // Snap Alice's angle in store
    setAngles(rollA === 0 ? 0 : Math.PI, 0);
    setLastOutcome(rollA);

    setOutcomeA(rollA);
    setOutcomeB(rollB);

    if (latticeRef.current) {
      latticeRef.current.triggerCollapseWave(rollA, () => {
        setIsCollapsing(false);
      });
    } else {
      setIsCollapsing(false);
    }
  }, [isCollapsing, twoQubitAmps, bellType, setAngles, setLastOutcome]);

  const handleReset = () => {
    setAngles(0, 0);
    setOutcomeA(null);
    setOutcomeB(null);
    setLastOutcome(null);
    soundEngine.playVectorSnap();
  };

  return (
    <MissionCanvasShell
      missionId={missionId}
      className={className}
      tier2Canvas={
        <DualBlochViewport
          thetaA={safeThetaA}
          phiA={safePhiA}
          thetaB={thetaB}
          phiB={phiB}
          isEntangled={isEntangled}
          onVectorDragA={(tA, pA) => setAngles(tA, pA)}
          onReadyLattice={(l) => {
            latticeRef.current = l;
          }}
        />
      }
      pipelineRibbonProps={{
        activePhase: "measure",
        onMeasure: handleMeasure,
        disabled: isCollapsing,
      }}
      tier2Overlays={
        <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between select-none">
          {/* Top Left: Entanglement Channel Guide & Active Spatial Telemetry */}
          <div className="flex flex-col gap-2 max-w-sm pointer-events-auto">
            <GlassCard
              title={"Entanglement Channel (EPR)"}
              badge={isEntangled ? "Entangled (1.0 ebit)" : "Separable (0 ebits)"}
            >
              <div className="space-y-2 text-xs font-mono">
                <p className="text-muted-foreground text-[11px] leading-relaxed flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-quantum-cyan shrink-0" />
                  <span>{"Non-local tensor lattice links Alice (Qubit A) & Bob (Qubit B)."}</span>
                </p>

                {/* Active Focus Card */}
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
                    {"Hover spheres or the central lattice to inspect EPR telemetry."}
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Top Right: 2-Qubit State Vector Telemetry & Controls */}
          <div className="fixed top-16 right-4 w-88 pointer-events-auto space-y-2.5">
            {/* 1. Bell State Presets */}
            <GlassCard title={"Bell State Preparation"} badge="EPR Pair">
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-1">
                  {BELL_PRESETS.map((p) => (
                    <Button
                      key={p.type}
                      variant={bellType === p.type ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => handleSelectBellState(p.type)}
                      data-testid={`bell-preset-${p.type}`}
                      className="py-1 px-1.5 text-[10px] font-mono flex flex-col items-center"
                    >
                      <span className="font-bold">{p.label}</span>
                      <span className="text-[9px] opacity-70">{p.desc}</span>
                    </Button>
                  ))}
                </div>

                {/* Entropy slider */}
                <div className="space-y-1 font-mono text-xs pt-1 border-t border-border">
                  <div className="flex justify-between text-[10px] text-muted-foreground uppercase">
                    <span>{"Entanglement Entropy S(ρ_A)"}</span>
                    <span data-testid="entropy-readout" className="text-quantum-purple font-bold tabular-nums">
                      {twoQubitAmps.entropy.toFixed(2)}{" ebits"}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={entropyDegree}
                    disabled={bellType === "separable"}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setEntropyDegree(v);
                      setEntangled(v > 0.02);
                    }}
                    data-testid="entropy-slider"
                    className="w-full accent-quantum-purple cursor-pointer h-1.5 bg-surface-3 disabled:opacity-40"
                  />
                </div>
              </div>
            </GlassCard>

            {/* 2. 2-Qubit State Vector Scoreboard */}
            <GlassCard title={"2-Qubit State Vector Telemetry"} badge="H₄ Hilbert">
              <div className="space-y-2.5 font-mono text-xs">
                {/* State Formula */}
                <div
                  data-testid="two-qubit-formula"
                  className="p-1.5 rounded border border-white/10 bg-surface-2/80 text-quantum-cyan font-bold tabular-nums text-xs"
                >
                  {FORMULAS[bellType]}
                </div>

                {/* 4 Basis state cards */}
                <div className="grid grid-cols-2 gap-1.5 text-center text-[11px]">
                  {[
                    { key: "00", amp: twoQubitAmps.c00, col: "cyan" },
                    { key: "01", amp: twoQubitAmps.c01, col: "purple" },
                    { key: "10", amp: twoQubitAmps.c10, col: "purple" },
                    { key: "11", amp: twoQubitAmps.c11, col: "emerald" },
                  ].map(({ key, amp }) => {
                    const isHovered = hoveredBasis === key;
                    return (
                      <div
                        key={key}
                        data-testid={`basis-card-${key}`}
                        onMouseEnter={() => {
                          setHoveredBasis(key);
                          useSpatialTelemetryBridge.getState().setActiveFocusId("two-qubit-state");
                        }}
                        onMouseLeave={() => setHoveredBasis(null)}
                        className={`p-1.5 rounded border transition-all cursor-pointer ${
                          isHovered
                            ? "border-quantum-cyan bg-quantum-cyan/20 scale-[1.02]"
                            : "border-white/10 bg-surface-2/60"
                        }`}
                      >
                        <div className="text-[10px] text-muted-foreground uppercase font-bold">
                          {"|"}{key}{"⟩"}
                        </div>
                        <div className="font-bold tabular-nums text-foreground">
                          {(amp.prob * 100).toFixed(1)}{"%"}
                        </div>
                        <div className="text-[9px] text-muted-foreground tabular-nums">
                          {"c = "}{amp.real >= 0 ? "+" : ""}{amp.real.toFixed(3)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Instant Collapse Action */}
                <div className="pt-2 border-t border-border flex flex-col gap-1.5">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleMeasure}
                    disabled={isCollapsing}
                    data-testid="measure-alice-button"
                    className="w-full text-xs py-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 mr-1 text-quantum-cyan" />
                    <span>{"Measure Qubit A (Instant Collapse)"}</span>
                  </Button>

                  {/* Outcome display */}
                  {outcomeA !== null && outcomeB !== null && (
                    <div
                      data-testid="entanglement-outcome-banner"
                      className="p-1.5 rounded border border-emerald-500/40 bg-emerald-500/10 text-[11px] flex items-center justify-between"
                    >
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {"Alice: |"}{outcomeA}{"⟩ ⟶ Bob: |"}{outcomeB}{"⟩"}
                        </span>
                      </div>
                      <span className="text-[9px] text-muted-foreground font-semibold uppercase">
                        {outcomeA === outcomeB ? "CORRELATED" : "ANTI-CORRELATED"}
                      </span>
                    </div>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    data-testid="reset-button"
                    className="w-full text-[10px] py-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="w-2.5 h-2.5 mr-1" />
                    <span>{"Reset Qubits"}</span>
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
