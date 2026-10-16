'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useQuantumStore } from '@/store/useQuantumStore';
import {
  createBaseScene,
  createBlochSphereScene,
  createParticlePool,
  burstParticles,
  updateParticles,
  calculateDecoherencePerturbation,
  computeSphericalVector,
  lerpSphericalAngles,
  updateBlochSphereUniforms,
} from './blochSceneObjects';

let singletonRenderer: THREE.WebGLRenderer | null = null;

function acquireRenderer(container: HTMLElement): THREE.WebGLRenderer {
  if (!singletonRenderer) {
    singletonRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    singletonRenderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2));
  }
  const dom = singletonRenderer.domElement;
  dom.style.display = 'block';
  dom.style.width = '100%';
  dom.style.height = '100%';
  if (dom.parentElement !== container) {
    dom.parentElement?.removeChild(dom);
    container.appendChild(dom);
  }
  singletonRenderer.setSize(container.clientWidth || 800, container.clientHeight || 600, false);
  return singletonRenderer;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export const BlochViewport: React.FC<{ className?: string }> = ({ className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const theta = useQuantumStore((s) => s.theta);
  const phi = useQuantumStore((s) => s.phi);
  const lastOutcome = useQuantumStore((s) => s.lastOutcome);

  const coords = useMemo(() => {
    const sT = Math.sin(theta);
    return { x: (sT * Math.cos(phi)).toFixed(3), y: Math.cos(theta).toFixed(3), z: (sT * Math.sin(phi)).toFixed(3) };
  }, [theta, phi]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Single WebGLRenderer context reuse safeguard (AGENTS.md Principle 2)
    const renderer = acquireRenderer(container);
    const { scene, camera } = createBaseScene(container);
    const elements = createBlochSphereScene();
    const { sphere, ring, axes, arrowHelper, geometries, materials } = elements;
    scene.add(sphere, ring, axes, arrowHelper);

    const particlePool = createParticlePool(250);
    scene.add(particlePool.mesh);

    let isDragging = false;
    let prevMouse = { x: 0, y: 0 };
    const spherical = { radius: 4.8, theta: Math.PI / 4, phi: Math.PI / 3 };

    const updateCamera = () => {
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
      camera.position.set(
        spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta),
        spherical.radius * Math.cos(spherical.phi),
        spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta)
      );
      camera.lookAt(0, 0, 0);
    };
    updateCamera();

    const onPointerDown = (e: PointerEvent) => { isDragging = true; prevMouse = { x: e.clientX, y: e.clientY }; };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = (e.clientX - prevMouse.x) * 0.008;
      const dy = (e.clientY - prevMouse.y) * 0.008;
      spherical.theta -= dx;
      spherical.phi -= dy;
      prevMouse = { x: e.clientX, y: e.clientY };
      updateCamera();
    };
    const onPointerUp = () => { isDragging = false; };
    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Spherical angle state vector lerp tracker
    const initSt = useQuantumStore.getState();
    let currentAngles = { theta: initSt.theta, phi: initSt.phi };
    let animId = 0;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const state = useQuantumStore.getState();
      let targetT = state.theta;
      let targetP = state.phi;
      let targetLen = 1.3;

      if (state.temperatureK > 0.05) {
        const { deltaTheta, deltaPhi, vectorLength } = calculateDecoherencePerturbation(targetT, targetP, state.temperatureK);
        targetT += deltaTheta;
        targetP += deltaPhi;
        targetLen = 1.3 * vectorLength;
      }

      // Smooth spherical angle easing across gate executions
      currentAngles = prefersReducedMotion()
        ? { theta: targetT, phi: targetP }
        : lerpSphericalAngles(currentAngles, { theta: targetT, phi: targetP }, dt * 12.0);

      const dir = computeSphericalVector(currentAngles.theta, currentAngles.phi);
      arrowHelper.setDirection(dir);
      arrowHelper.setLength(targetLen, 0.2, 0.08);

      updateParticles(particlePool, dt);
      renderer.render(scene, camera);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    const onResize = () => {
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 600;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);

    const unsub = useQuantumStore.subscribe((state, prev) => {
      // In-place uniform/material updates on mission changes without WebGL rebuild
      if (state.currentMissionId !== prev.currentMissionId) {
        const isEnt = state.currentMissionId === 'entanglement';
        updateBlochSphereUniforms(elements, {
          sphereColor: isEnt ? 0xa855f7 : 0x00f3ff,
          arrowColor: isEnt ? 0xa855f7 : 0x00f3ff,
        });
      }
      if (state.lastOutcome !== null && state.lastOutcome !== prev.lastOutcome) {
        burstParticles(particlePool, [0, state.lastOutcome === 0 ? 1.3 : -1.3, 0], 80);
      }
    });

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      unsub();
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      arrowHelper.line?.geometry.dispose();
      arrowHelper.cone?.geometry.dispose();
      particlePool.mesh.geometry.dispose();
      // Safeguard: singletonRenderer is preserved across unmounts/mounts
    };
  }, []);

  return (
    <div className={`relative w-full h-full min-h-72 rounded-xl border border-accent/20 bg-background/80 flex flex-col overflow-hidden ${className}`}>
      <div className="relative flex-1 min-h-0 touch-none">
        <div ref={containerRef} className="absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.08)_0%,transparent_70%)]" />
        <span className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-mono text-accent pointer-events-none bg-background/80 px-2 py-0.5 rounded border border-accent/30 select-none">|0⟩ (+Y)</span>
        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-mono text-cyan-400 pointer-events-none bg-background/80 px-2 py-0.5 rounded border border-cyan-400/30 select-none">|1⟩ (-Y)</span>
      </div>
      <div className="shrink-0 border-t border-border/80 bg-background/90 px-4 py-2.5 text-xs font-mono text-muted-foreground flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-4">
          <span><strong className="text-accent">X:</strong> {coords.x}</span>
          <span><strong className="text-cyan-400">Y:</strong> {coords.y}</span>
          <span><strong className="text-amber-400">Z:</strong> {coords.z}</span>
        </div>
        {lastOutcome !== null && <span className="text-emerald-400 font-bold">COLLAPSED: |{lastOutcome}⟩</span>}
      </div>
    </div>
  );
};

export const BlochSphereWorkspace = BlochViewport;
export default BlochViewport;
