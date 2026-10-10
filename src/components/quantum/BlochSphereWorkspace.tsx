'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { createScene } from '@/features/quantum-3d/lib/sceneManager';
import { useQuantumStore } from '@/store/useQuantumStore';
import { calculateDecoherencePerturbation } from '@/core/math/decoherence';

export const BlochSphereWorkspace: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const theta = useQuantumStore((s) => s.theta);
  const phi = useQuantumStore((s) => s.phi);
  const lastOutcome = useQuantumStore((s) => s.lastOutcome);

  const vectorCoords = useMemo(() => {
    const x = Math.sin(theta) * Math.cos(phi);
    const y = Math.sin(theta) * Math.sin(phi);
    const z = Math.cos(theta);
    return {
      x: x.toFixed(3),
      y: y.toFixed(3),
      z: z.toFixed(3),
    };
  }, [theta, phi]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handle = createScene(container);

    // Wireframe Sphere
    const sphereGeo = new THREE.SphereGeometry(1.3, 32, 16);
    const sphereMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true, transparent: true, opacity: 0.15 });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    handle.scene.add(sphere);

    // Equatorial Ring
    const ringGeo = new THREE.RingGeometry(1.29, 1.31, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    handle.scene.add(ring);

    // Vector Shaft, Cone & Tip Marker Group
    const vectorGroup = new THREE.Group();

    const shaftGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.2, 16);
    const shaftMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.6 });
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    shaft.position.y = 0.6;
    vectorGroup.add(shaft);

    const coneGeo = new THREE.ConeGeometry(0.07, 0.2, 16);
    const coneMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.9 });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.y = 1.2;
    vectorGroup.add(cone);

    const tipGeo = new THREE.SphereGeometry(0.05, 16, 16);
    const tipMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 1.0 });
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.position.y = 1.3;
    vectorGroup.add(tip);

    handle.scene.add(vectorGroup);

    const unregisterFrame = handle.onFrame((_time: number, delta: number) => {
      const state = useQuantumStore.getState();
      const currentTheta = state.theta;
      const currentPhi = state.phi;
      const tempK = state.temperatureK;
      const t2Ms = state.coherenceTimeUs / 1000;

      let targetTheta = currentTheta;
      let targetPhi = currentPhi;
      let targetLength = 1.0;

      if (tempK > 0.05) {
        const { deltaTheta, deltaPhi, vectorLength } = calculateDecoherencePerturbation(
          currentTheta,
          currentPhi,
          tempK,
          t2Ms
        );
        targetTheta += deltaTheta;
        targetPhi += deltaPhi;
        targetLength = vectorLength;
      }

      const targetEuler = new THREE.Euler(targetTheta, targetPhi, 0, 'YXZ');
      const targetQuat = new THREE.Quaternion().setFromEuler(targetEuler);
      const targetScale = new THREE.Vector3(targetLength, targetLength, targetLength);

      vectorGroup.quaternion.slerp(targetQuat, delta * 12.0);
      vectorGroup.scale.lerp(targetScale, delta * 8.0);
    });

    const resizeObserver = new ResizeObserver(() => handle.resize());
    resizeObserver.observe(container);

    return () => {
      unregisterFrame();
      resizeObserver.disconnect();
      handle.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-95 rounded-xl border border-cyan-500/20 bg-background/80 flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.08)_0%,transparent_70%)] pointer-events-none" />

      {/* 3D Viewport Canvas Container */}
      <div className="relative z-10 w-full h-64">
        <div ref={containerRef} className="w-full h-full" />

        {/* State Pole HUD Overlay */}
        <span className="absolute top-1 left-1/2 -translate-x-1/2 text-xs hud-font-mono text-accent pointer-events-none">
          |0⟩ (Z+)
        </span>
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs hud-font-mono text-purple-300 pointer-events-none">
          |1⟩ (Z-)
        </span>
      </div>

      {/* Coordinate & State Telemetry Dock */}
      <div className="mt-4 z-10 flex gap-4 text-xs hud-font-mono text-muted-foreground bg-background/80 px-4 py-2 rounded-md border border-border">
        <div><span className="text-accent font-bold">X:</span> {vectorCoords.x}</div>
        <div><span className="text-purple-400 font-bold">Y:</span> {vectorCoords.y}</div>
        <div><span className="text-amber-400 font-bold">Z:</span> {vectorCoords.z}</div>
        {lastOutcome !== null && (
          <div className="border-l border-border pl-3">
            <span className="text-emerald-400 font-bold">COLLAPSED:</span> |{lastOutcome}⟩
          </div>
        )}
      </div>
    </div>
  );
};
