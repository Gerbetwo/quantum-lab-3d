"use client";

import React, { useEffect, useRef, useMemo } from "react";
import * as THREE from "three";
import { useQuantumStore } from "@/store/useQuantumStore";
import { useTranslation } from '@/lib/i18n';
import {
  simulateGroverStep,
  runShorDemo,
  simulate3QubitBitFlipEC,
} from "@/core/algorithms";

export type AlgorithmType = "grover" | "shor" | "qec";

export function resolveAlgorithmType(missionId?: string): AlgorithmType {
  if (missionId === "grover" || missionId === "mission-4") return "grover";
  if (
    missionId === "applications" ||
    missionId === "shor" ||
    missionId === "mission-5"
  )
    return "shor";
  if (
    missionId === "error-correction" ||
    missionId === "qec" ||
    missionId === "mission-6"
  )
    return "qec";
  return "grover";
}

export interface GroverBarElements {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  bars: THREE.Mesh[];
  materials: THREE.MeshBasicMaterial[];
  geometries: THREE.BufferGeometry[];
}

export function createGroverBarScene(targetIndex = 2): GroverBarElements {
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.MeshBasicMaterial[] = [];
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1.6, 0.1, 1000);
  camera.position.set(0, 1.8, 4.6);
  camera.lookAt(0, 0.6, 0);

  const grid = new THREE.GridHelper(4.8, 8, 0x00f3ff, 0x1e293b);
  grid.position.y = 0;
  scene.add(grid);

  const xPositions = [-1.65, -0.55, 0.55, 1.65];
  const bars: THREE.Mesh[] = [];

  for (let i = 0; i < 4; i++) {
    const geo = new THREE.BoxGeometry(0.65, 1.0, 0.65);
    geo.translate(0, 0.5, 0);
    geometries.push(geo);

    const isTarget = i === targetIndex;
    const mat = new THREE.MeshBasicMaterial({
      color: isTarget ? 0x00f3ff : 0x334155,
      transparent: true,
      opacity: isTarget ? 0.95 : 0.6,
      wireframe: false,
    });
    materials.push(mat);

    const bar = new THREE.Mesh(geo, mat);
    bar.position.set(xPositions[i], 0, 0);
    bar.scale.set(1, 0.7, 1);
    scene.add(bar);
    bars.push(bar);
  }

  return { scene, camera, bars, materials, geometries };
}

export function updateGroverBars(
  elements: GroverBarElements,
  probabilities: number[],
  targetIndex: number,
): void {
  for (let i = 0; i < 4; i++) {
    const prob = probabilities[i] !== undefined ? probabilities[i] : 0.25;
    const height = Math.max(0.08, prob * 2.8);
    elements.bars[i].scale.set(1, height, 1);

    const isTarget = i === targetIndex;
    elements.materials[i].color.setHex(
      isTarget ? (prob > 0.7 ? 0x10b981 : 0x00f3ff) : 0x334155,
    );
    elements.materials[i].opacity = isTarget ? 0.95 : 0.45;
  }
}

export interface ShorWheelElements {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  rotor: THREE.Mesh;
  nodes: THREE.Mesh[];
  pulseBead: THREE.Mesh;
  period: number;
  geometries: THREE.BufferGeometry[];
  materials: THREE.Material[];
}

export function createShorWheelScene(
  period = 4,
  _sequence = [1, 7, 4, 13],
): ShorWheelElements {
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1.6, 0.1, 1000);
  camera.position.set(0, 0, 5.0);
  camera.lookAt(0, 0, 0);

  const rotorGeo = new THREE.TorusGeometry(1.6, 0.04, 16, 64);
  const rotorMat = new THREE.MeshBasicMaterial({
    color: 0xa855f7,
    transparent: true,
    opacity: 0.5,
  });
  geometries.push(rotorGeo);
  materials.push(rotorMat);
  const rotor = new THREE.Mesh(rotorGeo, rotorMat);
  scene.add(rotor);

  const nodes: THREE.Mesh[] = [];
  const validPeriod = Math.max(1, period);
  for (let i = 0; i < validPeriod; i++) {
    const angle = (i / validPeriod) * Math.PI * 2;
    const nodeGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const nodeMat = new THREE.MeshBasicMaterial({
      color: i === 0 ? 0x00f3ff : 0xa855f7,
    });
    geometries.push(nodeGeo);
    materials.push(nodeMat);
    const node = new THREE.Mesh(nodeGeo, nodeMat);
    node.position.set(1.6 * Math.cos(angle), 1.6 * Math.sin(angle), 0);
    scene.add(node);
    nodes.push(node);

    const spokeGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1.6 * Math.cos(angle), 1.6 * Math.sin(angle), 0),
    ]);
    const spokeMat = new THREE.LineBasicMaterial({
      color: 0x475569,
      transparent: true,
      opacity: 0.3,
    });
    geometries.push(spokeGeo);
    materials.push(spokeMat);
    scene.add(new THREE.Line(spokeGeo, spokeMat));
  }

  const beadGeo = new THREE.SphereGeometry(0.16, 16, 16);
  const beadMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  geometries.push(beadGeo);
  materials.push(beadMat);
  const pulseBead = new THREE.Mesh(beadGeo, beadMat);
  pulseBead.position.set(1.6, 0, 0);
  scene.add(pulseBead);

  return {
    scene,
    camera,
    rotor,
    nodes,
    pulseBead,
    period: validPeriod,
    geometries,
    materials,
  };
}

export function updateShorWheelAnimation(
  elements: ShorWheelElements,
  timeSec: number,
): void {
  const speed = 1.8;
  const angle = timeSec * speed;
  elements.pulseBead.position.set(
    1.6 * Math.cos(angle),
    1.6 * Math.sin(angle),
    0,
  );
  elements.rotor.rotation.z = timeSec * 0.2;
}

export interface QECLatticeElements {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  nodes: THREE.Mesh[];
  pulseShells: THREE.Mesh[];
  links: THREE.Line[];
  clearingBeam: THREE.Line;
  materials: THREE.Material[];
  geometries: THREE.BufferGeometry[];
}

export function createQECLatticeScene(
  errorIndex: number | null = null,
): QECLatticeElements {
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1.6, 0.1, 1000);
  camera.position.set(0, 0, 5.0);
  camera.lookAt(0, 0, 0);

  const xPositions = [-1.8, 0, 1.8];
  const nodes: THREE.Mesh[] = [];
  const pulseShells: THREE.Mesh[] = [];

  for (let i = 0; i < 3; i++) {
    const isError = i === errorIndex;
    const geo = new THREE.SphereGeometry(0.32, 24, 24);
    const mat = new THREE.MeshBasicMaterial({
      color: isError ? 0xef4444 : 0x10b981,
      transparent: true,
      opacity: 0.9,
    });
    geometries.push(geo);
    materials.push(mat);
    const node = new THREE.Mesh(geo, mat);
    node.position.set(xPositions[i], 0, 0);
    scene.add(node);
    nodes.push(node);

    const shellGeo = new THREE.SphereGeometry(0.48, 16, 16);
    const shellMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      wireframe: true,
      transparent: true,
      opacity: isError ? 0.7 : 0.0,
    });
    geometries.push(shellGeo);
    materials.push(shellMat);
    const shell = new THREE.Mesh(shellGeo, shellMat);
    node.add(shell);
    pulseShells.push(shell);
  }

  const links: THREE.Line[] = [];
  const linkDefs = [
    [-1.8, 0],
    [0, 1.8],
  ];

  for (const [x1, x2] of linkDefs) {
    const linkGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x1, 0, 0),
      new THREE.Vector3(x2, 0, 0),
    ]);
    const linkMat = new THREE.LineBasicMaterial({
      color: 0x00f3ff,
      transparent: true,
      opacity: 0.6,
    });
    geometries.push(linkGeo);
    materials.push(linkMat);
    const link = new THREE.Line(linkGeo, linkMat);
    scene.add(link);
    links.push(link);
  }

  const beamGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-2.2, -0.7, 0),
    new THREE.Vector3(2.2, -0.7, 0),
  ]);
  const beamMat = new THREE.LineBasicMaterial({
    color: 0x10b981,
    transparent: true,
    opacity: errorIndex === null ? 0.85 : 0.2,
  });
  geometries.push(beamGeo);
  materials.push(beamMat);
  const clearingBeam = new THREE.Line(beamGeo, beamMat);
  scene.add(clearingBeam);

  return {
    scene,
    camera,
    nodes,
    pulseShells,
    links,
    clearingBeam,
    materials,
    geometries,
  };
}

export function updateQECLattice(
  elements: QECLatticeElements,
  errorIndex: number | null,
  timeSec: number,
): void {
  for (let i = 0; i < 3; i++) {
    const isError = i === errorIndex;
    const nodeMat = elements.nodes[i].material as THREE.MeshBasicMaterial;
    nodeMat.color.setHex(isError ? 0xef4444 : 0x10b981);

    const shellMat = elements.pulseShells[i]
      .material as THREE.MeshBasicMaterial;
    if (isError) {
      const pulse = 1.0 + 0.3 * Math.sin(timeSec * 8.0);
      elements.pulseShells[i].scale.set(pulse, pulse, pulse);
      shellMat.opacity = 0.6 + 0.4 * Math.sin(timeSec * 8.0);
    } else {
      shellMat.opacity = 0;
    }
  }

  const beamMat = elements.clearingBeam.material as THREE.LineBasicMaterial;
  beamMat.opacity = errorIndex === null ? 0.85 : 0.25;
}

export interface AlgorithmVisualizer3DProps {
  missionId?: string;
  className?: string;
}

export const AlgorithmVisualizer3D: React.FC<AlgorithmVisualizer3DProps> = ({
  missionId,
  className = "",
}) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const currentMissionId = useQuantumStore((s) => s.currentMissionId);
  const activeMission = missionId ?? currentMissionId ?? "grover";
  const algoType = resolveAlgorithmType(activeMission);

  const groverStep = useQuantumStore((s) => s.groverStep);
  const targetIndex = useQuantumStore((s) => s.groverTargetIndex);
  const setGroverStep = useQuantumStore((s) => s.setGroverStep);
  const setTargetIndex = useQuantumStore((s) => s.setGroverTargetIndex);

  const shorBase = useQuantumStore((s) => s.shorBase);
  const setShorBase = useQuantumStore((s) => s.setShorBase);

  const injectedError = useQuantumStore((s) => s.qecInjectedError);
  const setInjectedError = useQuantumStore((s) => s.setQecInjectedError);

  const groverResult = useMemo(
    () => simulateGroverStep(2, targetIndex, groverStep),
    [targetIndex, groverStep],
  );
  const shorResult = useMemo(() => runShorDemo(shorBase), [shorBase]);
  const qecResult = useMemo(
    () => simulate3QubitBitFlipEC(injectedError),
    [injectedError],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(
        Math.min(
          typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
          2,
        ),
      );
      renderer.setSize(
        container.clientWidth || 800,
        container.clientHeight || 450,
        false,
      );
      container.appendChild(renderer.domElement);
    } catch (_e) {
      renderer = null;
    }

    let groverElements: GroverBarElements | null = null;
    let shorElements: ShorWheelElements | null = null;
    let qecElements: QECLatticeElements | null = null;

    let activeScene: THREE.Scene;
    let activeCamera: THREE.PerspectiveCamera;

    if (algoType === "grover") {
      groverElements = createGroverBarScene(targetIndex);
      activeScene = groverElements.scene;
      activeCamera = groverElements.camera;
    } else if (algoType === "shor") {
      shorElements = createShorWheelScene(
        shorResult.period,
        shorResult.sequence,
      );
      activeScene = shorElements.scene;
      activeCamera = shorElements.camera;
    } else {
      qecElements = createQECLatticeScene(injectedError);
      activeScene = qecElements.scene;
      activeCamera = qecElements.camera;
    }

    let animId = 0;
    const loop = (nowMs: number) => {
      const timeSec = nowMs / 1000;

      if (algoType === "grover" && groverElements) {
        updateGroverBars(
          groverElements,
          groverResult.probabilities,
          targetIndex,
        );
      } else if (algoType === "shor" && shorElements) {
        updateShorWheelAnimation(shorElements, timeSec);
      } else if (algoType === "qec" && qecElements) {
        updateQECLattice(qecElements, injectedError, timeSec);
      }

      if (renderer) renderer.render(activeScene, activeCamera);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    const onResize = () => {
      if (!renderer || !container) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 450;
      activeCamera.aspect = w / h;
      activeCamera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      [groverElements, shorElements, qecElements].forEach((el) => {
        el?.geometries.forEach((g) => g.dispose());
        el?.materials.forEach((m) => m.dispose());
      });
      if (renderer && renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
        renderer.dispose();
      }
    };
  }, [algoType, targetIndex, groverResult, shorResult, injectedError]);

  return (
    <div
      data-testid="algorithm-visualizer-3d"
      className={`relative w-full h-full min-h-95 rounded-2xl hud-panel overflow-hidden flex flex-col select-none ${className}`}
    >
      <div ref={containerRef} className="absolute inset-0 z-0 touch-none" />

      {/* Perimeter HUD Header */}
      <div className="relative z-10 flex items-center justify-between p-3.5 border-b border-border bg-background/80 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-quantum-cyan animate-pulse" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-quantum-cyan">
            {algoType === "grover" && t('algorithm_viz.grover_title')}
            {algoType === "shor" && t('algorithm_viz.shor_title', { a: shorBase })}
            {algoType === "qec" && t('algorithm_viz.qec_title')}
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full hud-badge-cyan uppercase">
          {algoType} Active
        </span>
      </div>

      {/* Floating Tactical Bottom Controls */}
      <div className="relative z-10 flex-1 flex flex-col justify-end p-4 pointer-events-none">
        <div className="p-3 rounded-xl bg-surface-2 border border-border pointer-events-auto flex flex-col gap-2.5">
          {algoType === "grover" && (
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground uppercase text-[10px]">
                  {t('algorithm_viz.target_state')}
                </span>
                {[0, 1, 2, 3].map((idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setTargetIndex(idx);
                      setGroverStep(0);
                    }}
                    className={`px-2.5 py-1 rounded text-xs font-mono cursor-pointer transition-all ${
                      targetIndex === idx
                        ? "hud-badge-cyan font-bold"
                        : "bg-surface-3 border border-border text-muted-foreground hover:bg-surface-2"
                    }`}
                  >
                    |{idx}⟩
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-quantum-cyan font-bold">
                  P(|{targetIndex}⟩):{" "}
                  {Math.round(
                    (groverResult.probabilities[targetIndex] || 0) * 100,
                  )}
                  %
                </span>
                <button
                  type="button"
                  onClick={() => setGroverStep((s) => Math.min(2, s + 1))}
                  className="px-3 py-1 rounded text-xs font-mono font-semibold hud-badge-cyan cursor-pointer transition-all hover:opacity-90"
                >
                  {t('algorithm_viz.apply_oracle', { step: groverStep })}
                </button>
                <button
                  type="button"
                  onClick={() => setGroverStep(0)}
                  className="px-2.5 py-1 rounded text-xs font-mono bg-surface-3 border border-border text-muted-foreground cursor-pointer transition-all hover:bg-surface-2"
                >
                  {t('common.reset')}
                </button>
              </div>
            </div>
          )}

          {algoType === "shor" && (
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground uppercase text-[10px]">
                  {t('algorithm_viz.coprime_base')}
                </span>
                {[2, 7, 8, 11, 13].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setShorBase(b)}
                    className={`px-2.5 py-1 rounded text-xs font-mono cursor-pointer transition-all ${
                      shorBase === b
                        ? "hud-badge-purple font-bold"
                        : "bg-surface-3 border border-border text-muted-foreground hover:bg-surface-2"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-quantum-purple">
                  {t('algorithm_viz.sequence', { seq: shorResult.sequence.join(', '), r: shorResult.period })}
                </span>
                <span className="text-success font-bold">
                  {t('algorithm_viz.factors', { f1: shorResult.factors[0], f2: shorResult.factors[1] })}
                </span>
              </div>
            </div>
          )}

          {algoType === "qec" && (
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground uppercase text-[10px]">
                  {t('algorithm_viz.inject_error')}
                </span>
                {[0, 1, 2].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setInjectedError(q)}
                    className={`px-2.5 py-1 rounded text-xs font-mono cursor-pointer transition-all ${
                      injectedError === q
                        ? "hud-badge-rose font-bold"
                        : "bg-surface-3 border border-border text-muted-foreground hover:bg-surface-2"
                    }`}
                  >
                    {t('algorithm_controls.flip_qubit', { index: q })}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setInjectedError(null)}
                  className={`px-2.5 py-1 rounded text-xs font-mono cursor-pointer transition-all ${
                    injectedError === null
                      ? "hud-badge-emerald font-bold"
                      : "bg-surface-3 border border-border text-muted-foreground hover:bg-surface-2"
                  }`}
                >
                  {t('algorithm_viz.clean')}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span>Syndrome: [{qecResult.syndrome.join(", ")}]</span>
                <span
                  className={
                    injectedError !== null
                      ? "text-destructive"
                      : "text-success font-bold"
                  }
                >
                  {qecResult.recoveredState}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlgorithmVisualizer3D;
