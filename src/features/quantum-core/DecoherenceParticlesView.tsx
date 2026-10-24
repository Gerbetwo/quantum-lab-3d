'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useQuantumStore } from '@/store/useQuantumStore';
import { computeSphericalVector } from './blochSceneObjects';
import {
  calculateThermalMetrics,
  createThermalDistortionShaderMaterial,
  updateThermalDistortionUniforms,
  createDecoherenceParticleSystem,
  updateThermalParticles,
} from './DecoherenceParticles';
import { applyPhaseDecay, calculateT2CoherenceTime, kelvinToMilliKelvin } from '@/core/decoherenceMath';
import { acquireRenderer, releaseRenderer, disposeObject3D } from '@/lib/three/rendererSingleton';

export interface DecoherenceParticlesProps {
  className?: string;
  initialTemperatureK?: number;
}

export const DecoherenceParticles: React.FC<DecoherenceParticlesProps> = ({
  className = '',
  initialTemperatureK,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const storeTemp = useQuantumStore((s) => s.temperatureK);
  const setTemperature = useQuantumStore((s) => s.setTemperature);

  const activeTemp = initialTemperatureK !== undefined ? initialTemperatureK : storeTemp;
  const metrics = useMemo(() => calculateThermalMetrics(activeTemp), [activeTemp]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = acquireRenderer(container);
    } catch (_e) {
      renderer = null;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1.6, 0.1, 1000);
    camera.position.set(0, 0, 5.2);
    camera.lookAt(0, 0, 0);

    const sphereGeo = new THREE.SphereGeometry(1.3, 36, 24);
    const sphereMat = createThermalDistortionShaderMaterial();
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphere);

    const ringGeo = new THREE.RingGeometry(1.29, 1.31, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    const arrowHelper = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 1.3, 0x00f3ff, 0.2, 0.08);
    scene.add(arrowHelper);

    const particleSystem = createDecoherenceParticleSystem(350);
    scene.add(particleSystem.points);

    let animId = 0;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const state = useQuantumStore.getState();
      const currentTemp = initialTemperatureK !== undefined ? initialTemperatureK : state.temperatureK;

      updateThermalDistortionUniforms(sphereMat, now / 1000, currentTemp);
      updateThermalParticles(particleSystem, dt, currentTemp);

      const dir = computeSphericalVector(state.theta, state.phi);
      arrowHelper.setDirection(dir);

      // Mixed state interior vector shrinkage r(T) < 1 inside containment shell
      const tempMilliK = kelvinToMilliKelvin(currentTemp);
      const t2 = calculateT2CoherenceTime(tempMilliK);
      const phase = applyPhaseDecay(state.theta, state.phi, 0.15, t2);
      const radiusLength = Math.max(0.01, 1.3 * phase.r);
      arrowHelper.setLength(radiusLength, Math.min(radiusLength * 0.25, 0.2), Math.min(radiusLength * 0.1, 0.08));

      if (renderer) renderer.render(scene, camera);
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
      sphereGeo.dispose();
      sphereMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      arrowHelper.dispose();
      particleSystem.points.geometry.dispose();
      (particleSystem.points.material as THREE.Material).dispose();
      disposeObject3D(scene);
      releaseRenderer(container);
    };
  }, [initialTemperatureK]);

  return (
    <div
      data-testid="decoherence-particles"
      className={`relative w-full h-full min-h-90 rounded-2xl border border-cyan/30 bg-slate-950/70 backdrop-blur-md overflow-hidden flex flex-col select-none ${className}`}
    >
      <div ref={containerRef} className="absolute inset-0 z-0 touch-none" />

      {/* Perimeter Tactical HUD Header */}
      <div className="relative z-10 flex items-center justify-between p-3.5 border-b border-border/60 bg-background/50 backdrop-blur-sm pointer-events-none">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${metrics.normalizedDegradation > 0.6 ? 'bg-rose-500 animate-ping' : 'bg-cyan animate-pulse'}`} />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan">
            Thermal Decoherence: GPU Jitter & Mesh Distortion
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan/15 text-cyan border border-cyan/30">
          T₂ = {metrics.t2CoherenceTimeUs} μs
        </span>
      </div>

      {/* Floating Bottom Telemetry & Cryo Presets */}
      <div className="relative z-10 flex-1 flex flex-col justify-end p-4 pointer-events-none">
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-surface-2/85 border border-edge/80 backdrop-blur-sm pointer-events-auto">
          {/* Readout */}
          <div className="flex gap-4 font-mono text-xs">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase block">Temp (T)</span>
              <span className="font-bold text-foreground">
                {metrics.temperatureK < 1 ? `${metrics.temperatureMilliK} mK` : `${metrics.temperatureK} K`}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase block">Coherence T₂</span>
              <span className="font-bold text-cyan">{metrics.t2CoherenceTimeUs} μs</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase block">Distortion Δ</span>
              <span className="font-bold text-amber-400">{(metrics.distortionAmplitude * 100).toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase block">Jitter v</span>
              <span className="font-bold text-rose-400">{metrics.particleSpeed}x</span>
            </div>
          </div>

          {/* Cryo Presets */}
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <button
              type="button"
              onClick={() => setTemperature(0.015)}
              className="px-2 py-1 rounded border border-cyan/40 bg-cyan/10 hover:bg-cyan/20 text-cyan text-[11px]"
            >
              15 mK
            </button>
            <button
              type="button"
              onClick={() => setTemperature(4.0)}
              className="px-2 py-1 rounded border border-border bg-surface-3 hover:bg-surface-2 text-muted-foreground text-[11px]"
            >
              4 K
            </button>
            <button
              type="button"
              onClick={() => setTemperature(77.0)}
              className="px-2 py-1 rounded border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[11px]"
            >
              77 K
            </button>
            <button
              type="button"
              onClick={() => setTemperature(300.0)}
              className="px-2 py-1 rounded border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px]"
            >
              300 K
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DecoherenceParticles;
