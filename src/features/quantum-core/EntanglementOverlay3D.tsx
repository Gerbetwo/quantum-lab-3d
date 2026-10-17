'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useQuantumStore } from '@/store/useQuantumStore';
import { computeSphericalVector } from './blochSceneObjects';

export interface DualBlochElements {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  sphereA: THREE.Mesh;
  arrowA: THREE.ArrowHelper;
  tipHandleA: THREE.Mesh;
  sphereB: THREE.Mesh;
  arrowB: THREE.ArrowHelper;
  tipHandleB: THREE.Mesh;
  laserCore: THREE.Line;
  laserParticles: THREE.Points;
  laserPositions: Float32Array;
  laserColors: Float32Array;
  laserSizes: Float32Array;
  particleCount: number;
  geometries: THREE.BufferGeometry[];
  materials: THREE.Material[];
}

export interface SpinFlipWaveState {
  active: boolean;
  startTime: number;
  duration: number;
  outcome: 0 | 1;
}

const PARTICLE_COUNT = 120;
const STRAND_MIN_X = -1.2;
const STRAND_MAX_X = 1.2;

export function createDualBlochScene(): DualBlochElements {
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1.6, 0.1, 1000);
  camera.position.set(0, 0, 7.2);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.9));

  // --- Qubit A (Alice, X = -2.2) ---
  const sphereGeoA = new THREE.SphereGeometry(1.0, 24, 16);
  const sphereMatA = new THREE.MeshBasicMaterial({ color: 0x00f3ff, wireframe: true, transparent: true, opacity: 0.18 });
  geometries.push(sphereGeoA); materials.push(sphereMatA);
  const sphereA = new THREE.Mesh(sphereGeoA, sphereMatA);
  sphereA.position.set(-2.2, 0, 0);

  const ringGeoA = new THREE.RingGeometry(0.99, 1.01, 48);
  const ringMatA = new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
  geometries.push(ringGeoA); materials.push(ringMatA);
  const ringA = new THREE.Mesh(ringGeoA, ringMatA);
  ringA.rotation.x = Math.PI / 2;
  sphereA.add(ringA);

  const arrowA = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(-2.2, 0, 0), 1.0, 0x00f3ff, 0.18, 0.07);

  const tipGeoA = new THREE.SphereGeometry(0.08, 16, 16);
  const tipMatA = new THREE.MeshBasicMaterial({ color: 0x00f3ff, transparent: true, opacity: 0.95 });
  geometries.push(tipGeoA); materials.push(tipMatA);
  const tipHandleA = new THREE.Mesh(tipGeoA, tipMatA);
  tipHandleA.position.set(-1.2, 0, 0);

  scene.add(sphereA, arrowA, tipHandleA);

  // --- Qubit B (Bob, X = +2.2) ---
  const sphereGeoB = new THREE.SphereGeometry(1.0, 24, 16);
  const sphereMatB = new THREE.MeshBasicMaterial({ color: 0xa855f7, wireframe: true, transparent: true, opacity: 0.18 });
  geometries.push(sphereGeoB); materials.push(sphereMatB);
  const sphereB = new THREE.Mesh(sphereGeoB, sphereMatB);
  sphereB.position.set(2.2, 0, 0);

  const ringGeoB = new THREE.RingGeometry(0.99, 1.01, 48);
  const ringMatB = new THREE.MeshBasicMaterial({ color: 0x00f3ff, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
  geometries.push(ringGeoB); materials.push(ringMatB);
  const ringB = new THREE.Mesh(ringGeoB, ringMatB);
  ringB.rotation.x = Math.PI / 2;
  sphereB.add(ringB);

  const arrowB = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(2.2, 0, 0), 1.0, 0xa855f7, 0.18, 0.07);

  const tipGeoB = new THREE.SphereGeometry(0.08, 16, 16);
  const tipMatB = new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.95 });
  geometries.push(tipGeoB); materials.push(tipMatB);
  const tipHandleB = new THREE.Mesh(tipGeoB, tipMatB);
  tipHandleB.position.set(3.2, 0, 0);

  scene.add(sphereB, arrowB, tipHandleB);

  // --- Quantum Correlation Laser Strand (Line + Points) ---
  const coreGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(STRAND_MIN_X, 0, 0),
    new THREE.Vector3(STRAND_MAX_X, 0, 0),
  ]);
  const coreMat = new THREE.LineBasicMaterial({ color: 0x00f3ff, transparent: true, opacity: 0.5 });
  geometries.push(coreGeo); materials.push(coreMat);
  const laserCore = new THREE.Line(coreGeo, coreMat);
  scene.add(laserCore);

  const laserPositions = new Float32Array(PARTICLE_COUNT * 3);
  const laserColors = new Float32Array(PARTICLE_COUNT * 3);
  const laserSizes = new Float32Array(PARTICLE_COUNT);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const fraction = i / (PARTICLE_COUNT - 1);
    const x = STRAND_MIN_X + fraction * (STRAND_MAX_X - STRAND_MIN_X);
    laserPositions[i * 3] = x;
    laserPositions[i * 3 + 1] = 0;
    laserPositions[i * 3 + 2] = 0;

    // Gradient cyan (Alice) -> purple (Bob)
    laserColors[i * 3] = THREE.MathUtils.lerp(0.0, 0.66, fraction);
    laserColors[i * 3 + 1] = THREE.MathUtils.lerp(0.95, 0.33, fraction);
    laserColors[i * 3 + 2] = THREE.MathUtils.lerp(1.0, 0.97, fraction);

    laserSizes[i] = 0.04;
  }

  const laserGeo = new THREE.BufferGeometry();
  laserGeo.setAttribute('position', new THREE.BufferAttribute(laserPositions, 3));
  laserGeo.setAttribute('color', new THREE.BufferAttribute(laserColors, 3));
  laserGeo.setAttribute('size', new THREE.BufferAttribute(laserSizes, 1));
  geometries.push(laserGeo);

  const laserMat = new THREE.PointsMaterial({
    size: 0.08,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
  });
  materials.push(laserMat);
  const laserParticles = new THREE.Points(laserGeo, laserMat);
  scene.add(laserParticles);

  return {
    scene,
    camera,
    sphereA,
    arrowA,
    tipHandleA,
    sphereB,
    arrowB,
    tipHandleB,
    laserCore,
    laserParticles,
    laserPositions,
    laserColors,
    laserSizes,
    particleCount: PARTICLE_COUNT,
    geometries,
    materials,
  };
}

export function updateLaserStrand(
  elements: DualBlochElements,
  timeSeconds: number,
  waveState: SpinFlipWaveState
): void {
  const { laserPositions, laserColors, laserParticles, particleCount } = elements;
  const posAttr = laserParticles.geometry.getAttribute('position') as THREE.BufferAttribute;
  const colAttr = laserParticles.geometry.getAttribute('color') as THREE.BufferAttribute;

  const isWaveActive = waveState.active;
  const waveProgress = isWaveActive ? Math.min(1.0, (timeSeconds - waveState.startTime) / waveState.duration) : 0;
  const waveEnv = isWaveActive ? Math.sin(waveProgress * Math.PI) * (1.0 - 0.25 * waveProgress) : 0;

  for (let i = 0; i < particleCount; i++) {
    const fraction = i / (particleCount - 1);
    const baseX = STRAND_MIN_X + fraction * (STRAND_MAX_X - STRAND_MIN_X);

    // Baseline coherence pulse traveling between Alice and Bob
    const pulsePhase = fraction * 14.0 - timeSeconds * 7.0;
    let y = 0.035 * Math.sin(pulsePhase);
    let z = 0.035 * Math.cos(pulsePhase);

    // Spin-flip helical shockwave during collapse
    if (isWaveActive) {
      const shockwaveCenter = STRAND_MIN_X + waveProgress * (STRAND_MAX_X - STRAND_MIN_X);
      const dist = Math.abs(baseX - shockwaveCenter);
      const shockIntensity = Math.exp(-(dist * dist) / 0.18);

      const wavePhase = fraction * 20.0 - waveProgress * 28.0;
      y += 0.35 * waveEnv * Math.sin(wavePhase) * (0.35 + 0.65 * shockIntensity);
      z += 0.35 * waveEnv * Math.cos(wavePhase) * (0.35 + 0.65 * shockIntensity);

      // Color flash during collapse
      if (waveState.outcome === 0) {
        laserColors[i * 3] = THREE.MathUtils.lerp(0.06, 0.0, shockIntensity);
        laserColors[i * 3 + 1] = THREE.MathUtils.lerp(0.95, 1.0, shockIntensity);
        laserColors[i * 3 + 2] = THREE.MathUtils.lerp(0.55, 0.9, shockIntensity);
      } else {
        laserColors[i * 3] = THREE.MathUtils.lerp(0.95, 1.0, shockIntensity);
        laserColors[i * 3 + 1] = THREE.MathUtils.lerp(0.2, 0.4, shockIntensity);
        laserColors[i * 3 + 2] = THREE.MathUtils.lerp(0.6, 0.9, shockIntensity);
      }
    } else {
      // Normal quantum correlation gradient
      laserColors[i * 3] = THREE.MathUtils.lerp(0.0, 0.66, fraction);
      laserColors[i * 3 + 1] = THREE.MathUtils.lerp(0.95, 0.33, fraction);
      laserColors[i * 3 + 2] = THREE.MathUtils.lerp(1.0, 0.97, fraction);
    }

    laserPositions[i * 3] = baseX;
    laserPositions[i * 3 + 1] = y;
    laserPositions[i * 3 + 2] = z;
  }

  posAttr.needsUpdate = true;
  colAttr.needsUpdate = true;
}

export function computeSynchronizedAngles(
  theta: number,
  phi: number,
  lastOutcome: 0 | 1 | null,
  waveState: SpinFlipWaveState,
  nowSec: number
): { thetaA: number; phiA: number; thetaB: number; phiB: number } {
  if (lastOutcome !== null) {
    const targetTheta = lastOutcome === 0 ? 0 : Math.PI;
    if (waveState.active) {
      const tau = Math.min(1.0, (nowSec - waveState.startTime) / waveState.duration);
      // Alice snaps first, Bob snaps as the spin wave arrives
      const tA = Math.min(1.0, tau * 1.8);
      const tB = Math.max(0.0, Math.min(1.0, (tau - 0.25) / 0.75));
      return {
        thetaA: THREE.MathUtils.lerp(theta, targetTheta, tA),
        phiA: 0,
        thetaB: THREE.MathUtils.lerp(theta, targetTheta, tB),
        phiB: 0,
      };
    }
    return { thetaA: targetTheta, phiA: 0, thetaB: targetTheta, phiB: 0 };
  }
  return { thetaA: theta, phiA: phi, thetaB: theta, phiB: phi };
}

export interface EntanglementOverlay3DProps {
  missionId?: string;
  className?: string;
}

export const EntanglementOverlay3D: React.FC<EntanglementOverlay3DProps> = ({
  missionId,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const storeMissionId = useQuantumStore((s) => s.currentMissionId ?? s.activeMissionId ?? 'superposition');
  const isEntangled = useQuantumStore((s) => s.isEntangled);
  const lastOutcome = useQuantumStore((s) => s.lastOutcome);

  const effectiveMissionId = missionId ?? storeMissionId;
  const isMission2 = effectiveMissionId === 'mission-2' || effectiveMissionId === 'entanglement';

  const [waveState, setWaveState] = useState<SpinFlipWaveState>({
    active: false,
    startTime: 0,
    duration: 1.2,
    outcome: 0,
  });

  const waveStateRef = useRef(waveState);
  useEffect(() => {
    waveStateRef.current = waveState;
  }, [waveState]);

  // Measurement collapse trigger
  const prevOutcomeRef = useRef<0 | 1 | null>(null);
  useEffect(() => {
    if (lastOutcome !== null && prevOutcomeRef.current === null) {
      const newWave: SpinFlipWaveState = {
        active: true,
        startTime: performance.now() / 1000,
        duration: 1.2,
        outcome: lastOutcome,
      };
      setWaveState(newWave);
      waveStateRef.current = newWave;
    }
    prevOutcomeRef.current = lastOutcome;
  }, [lastOutcome]);

  useEffect(() => {
    if (!isMission2) return;
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2));
      renderer.setSize(container.clientWidth || 800, container.clientHeight || 500, false);
      container.appendChild(renderer.domElement);
    } catch (_e) {
      // Safe fallback in test/non-WebGL environments
      renderer = null;
    }

    const elements = createDualBlochScene();
    const { scene, camera, arrowA, tipHandleA, arrowB, tipHandleB, geometries, materials } = elements;

    let animId = 0;
    const loop = (nowMs: number) => {
      const nowSec = nowMs / 1000;
      const curWave = waveStateRef.current;

      if (curWave.active && nowSec - curWave.startTime >= curWave.duration) {
        waveStateRef.current = { ...curWave, active: false };
      }

      updateLaserStrand(elements, nowSec, waveStateRef.current);

      const state = useQuantumStore.getState();
      const angles = computeSynchronizedAngles(
        state.theta,
        state.phi,
        state.lastOutcome,
        waveStateRef.current,
        nowSec
      );

      // Synchronize Qubit A
      const dirA = computeSphericalVector(angles.thetaA, angles.phiA);
      arrowA.setDirection(dirA);
      arrowA.position.set(-2.2, 0, 0);
      tipHandleA.position.copy(new THREE.Vector3(-2.2, 0, 0).add(dirA.clone().multiplyScalar(1.0)));

      // Synchronize Qubit B
      const dirB = computeSphericalVector(angles.thetaB, angles.phiB);
      arrowB.setDirection(dirB);
      arrowB.position.set(2.2, 0, 0);
      tipHandleB.position.copy(new THREE.Vector3(2.2, 0, 0).add(dirB.clone().multiplyScalar(1.0)));

      if (renderer) {
        renderer.render(scene, camera);
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    const onResize = () => {
      if (!renderer || !container) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      if (renderer && renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
        renderer.dispose();
      }
    };
  }, [isMission2]);

  const telemetry = useMemo(() => {
    return {
      aliceState: lastOutcome !== null ? `|${lastOutcome}⟩` : isEntangled ? '1/√2(|0⟩+|1⟩)' : '|0⟩',
      bobState: lastOutcome !== null ? `|${lastOutcome}⟩` : isEntangled ? '1/√2(|0⟩+|1⟩)' : '|0⟩',
      channelStatus: waveState.active ? 'SPIN-FLIP COLLAPSE WAVE' : isEntangled ? '100% BELL COHERENT' : 'DECOUPLED',
    };
  }, [lastOutcome, isEntangled, waveState.active]);

  if (!isMission2) {
    return null;
  }

  return (
    <div
      data-testid="entanglement-overlay-3d"
      className={`relative w-full h-full min-h-[360px] rounded-2xl border border-cyan/30 bg-slate-950/70 backdrop-blur-md overflow-hidden flex flex-col select-none ${className}`}
    >
      {/* 3D WebGL Canvas Viewport */}
      <div ref={containerRef} className="absolute inset-0 z-0 touch-none" />

      {/* Perimeter Tactical HUD */}
      <div className="relative z-10 flex items-center justify-between p-3.5 border-b border-border/60 bg-background/50 backdrop-blur-sm pointer-events-none">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${waveState.active ? 'bg-amber-400 animate-ping' : 'bg-cyan animate-pulse'}`} />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan">
            Dual Bloch Viewport: EPR Laser Strand
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan/15 text-cyan border border-cyan/30">
            {telemetry.channelStatus}
          </span>
        </div>
      </div>

      {/* Floating Qubit Telemetry Nodes */}
      <div className="relative z-10 flex-1 flex items-end justify-between p-4 pointer-events-none">
        {/* Qubit A Info */}
        <div className="flex flex-col items-center p-2 rounded-lg bg-surface-2/80 border border-edge/80 backdrop-blur-sm min-w-28 text-center">
          <span className="text-[10px] font-mono text-muted-foreground uppercase">Qubit A (Alice)</span>
          <span className="text-base font-mono font-bold text-cyan">{telemetry.aliceState}</span>
        </div>

        {/* Center EPR Laser Strand Status */}
        <div className="flex flex-col items-center text-center p-1.5 rounded bg-background/70 border border-border/80">
          <span className="text-[9px] font-mono text-muted-foreground uppercase">Laser Strand Pulse</span>
          <span className={`text-[11px] font-mono font-semibold ${waveState.active ? 'text-amber-300' : 'text-purple-400'}`}>
            {waveState.active ? '⚡ Spin-Flip Wave' : '∿ 120-pt Laser Line'}
          </span>
        </div>

        {/* Qubit B Info */}
        <div className="flex flex-col items-center p-2 rounded-lg bg-surface-2/80 border border-edge/80 backdrop-blur-sm min-w-28 text-center">
          <span className="text-[10px] font-mono text-muted-foreground uppercase">Qubit B (Bob)</span>
          <span className="text-base font-mono font-bold text-purple-400">{telemetry.bobState}</span>
        </div>
      </div>
    </div>
  );
};

export default EntanglementOverlay3D;
