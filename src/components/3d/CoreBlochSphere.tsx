'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { QubitState } from '@/core/qubitMath';
import {
  createGateRingsGroup,
  createGeodesicParticleSystem,
  slerpUnitVectors,
} from './GateRotationRings';
import { useSpatialTelemetryBridge } from '@/hooks/useSpatialTelemetryBridge';

export { slerpUnitVectors };

export interface CoreBlochSphereProps {
  state?: QubitState;
  className?: string;
  purity?: number;
  activeGate?: string | null;
  interactive?: boolean;
}

export function CoreBlochSphere({
  state = { theta: 0, phi: 0 },
  className = '',
  purity = 1,
  activeGate = null,
}: CoreBlochSphereProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetStateRef = useRef<QubitState>(state);
  const targetPurityRef = useRef<number>(purity);
  const prevGateRef = useRef<string | null>(null);

  const onPointerOver = useSpatialTelemetryBridge((s) => s.onPointerOver);
  const onPointerOut = useSpatialTelemetryBridge((s) => s.onPointerOut);

  useEffect(() => {
    targetStateRef.current = state;
  }, [state]);

  useEffect(() => {
    targetPurityRef.current = purity;
  }, [purity]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 300;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(2.4, 1.8, 2.4);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    // 1. Sphere wireframe
    const sphereGeo = new THREE.SphereGeometry(1.2, 24, 16);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphereMesh);

    // 2. Equator Ring
    const ringGeo = new THREE.RingGeometry(1.18, 1.22, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    // 3. Axes
    const axesGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1.4, 0, 0),
      new THREE.Vector3(1.4, 0, 0),
      new THREE.Vector3(0, -1.4, 0),
      new THREE.Vector3(0, 1.4, 0),
      new THREE.Vector3(0, 0, -1.4),
      new THREE.Vector3(0, 0, 1.4),
    ]);
    const axesMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.25,
    });
    const axes = new THREE.LineSegments(axesGeo, axesMat);
    scene.add(axes);

    // 4. Gate Rotation Rings Group
    const { group: ringsGroup, dispose: disposeRings } = createGateRingsGroup(1.28);
    scene.add(ringsGroup);

    // 5. Geodesic Particle Tracer System
    const {
      mesh: particleMesh,
      guideLine,
      triggerArc,
      update: updateParticles,
      dispose: disposeParticles,
    } = createGeodesicParticleSystem(80, 1.25);
    scene.add(particleMesh);
    scene.add(guideLine);

    // 6. State Vector Arrow
    let currentTheta = targetStateRef.current.theta;
    let currentPhi = targetStateRef.current.phi;
    let currentPurity = targetPurityRef.current ?? 1;

    const toVector = (th: number, ph: number) =>
      new THREE.Vector3(
        Math.sin(th) * Math.cos(ph),
        Math.cos(th),
        Math.sin(th) * Math.sin(ph)
      ).normalize();

    const arrow = new THREE.ArrowHelper(
      toVector(currentTheta, currentPhi),
      new THREE.Vector3(0, 0, 0),
      1.2 * currentPurity,
      0x00f0ff,
      0.2,
      0.08
    );
    scene.add(arrow);

    let animId = 0;
    let lastTime = performance.now();

    const animate = () => {
      const now = performance.now();
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      const { theta: targetTheta, phi: targetPhi } = targetStateRef.current;
      const targetPurity = Math.max(0.05, Math.min(1, targetPurityRef.current ?? 1));
      currentPurity += (targetPurity - currentPurity) * 0.1;

      if (currentTheta < 0.05 || Math.PI - currentTheta < 0.05) currentPhi = targetPhi;
      let dPhi = targetPhi - currentPhi;
      while (dPhi > Math.PI) dPhi -= 2 * Math.PI;
      while (dPhi < -Math.PI) dPhi += 2 * Math.PI;

      currentPhi += dPhi * 0.1;
      currentTheta += (targetTheta - currentTheta) * 0.1;

      const vec = toVector(currentTheta, currentPhi);
      arrow.setDirection(vec);
      const len = 1.2 * currentPurity;
      arrow.setLength(len, Math.min(len * 0.25, 0.2), Math.min(len * 0.1, 0.08));

      updateParticles(dt);

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };
    animate();

    // Trigger geodesic particle arc when activeGate changes
    if (activeGate && activeGate !== prevGateRef.current) {
      const startVec = toVector(currentTheta, currentPhi);
      const targetVec = toVector(targetStateRef.current.theta, targetStateRef.current.phi);
      triggerArc(startVec, targetVec);
      prevGateRef.current = activeGate;
    }

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(([entry]) => {
            if (!entry) return;
            const { width: w, height: h } = entry.contentRect;
            if (w > 0 && h > 0) {
              camera.aspect = w / h;
              camera.updateProjectionMatrix();
              renderer.setSize(w, h);
            }
          })
        : null;

    resizeObserver?.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver?.disconnect();
      disposeRings();
      disposeParticles();
      sphereGeo.dispose();
      sphereMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      axesGeo.dispose();
      axesMat.dispose();
      arrow.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [activeGate]);

  return (
    <div
      data-testid="core-bloch-sphere"
      ref={containerRef}
      onPointerEnter={() => onPointerOver('state-vector')}
      onPointerLeave={() => onPointerOut('state-vector')}
      className={`relative w-full h-full min-h-60 select-none ${className}`.trim()}
    />
  );
}

export default CoreBlochSphere;
