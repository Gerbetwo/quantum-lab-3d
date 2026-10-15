'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { createScene } from '@/features/quantum-3d/lib/sceneManager';
import { createOrbitControls, OrbitControlsHandle } from '@/features/quantum-3d/hooks/useOrbitControls';
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
    let controls: OrbitControlsHandle | null = null;
    if (handle.camera && handle.renderer?.domElement) {
      controls = createOrbitControls(handle.camera, handle.renderer.domElement, {
        enableDamping: true,
        dampingFactor: 0.1,
      });
    }

    // Geometries and materials to explicitly dispose on unmount
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];

    // Wireframe Sphere
    const sphereGeo = new THREE.SphereGeometry(1.3, 32, 16);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    geometries.push(sphereGeo);
    materials.push(sphereMat);
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    handle.scene.add(sphere);

    // Equatorial Ring
    const ringGeo = new THREE.RingGeometry(1.29, 1.31, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });
    geometries.push(ringGeo);
    materials.push(ringMat);
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    handle.scene.add(ring);

    // Axes lines
    const axesGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1.5, 0, 0),
      new THREE.Vector3(1.5, 0, 0),
      new THREE.Vector3(0, -1.5, 0),
      new THREE.Vector3(0, 1.5, 0),
      new THREE.Vector3(0, 0, -1.5),
      new THREE.Vector3(0, 0, 1.5),
    ]);
    const axesMat = new THREE.LineBasicMaterial({
      color: 0x475569,
      transparent: true,
      opacity: 0.4,
    });
    geometries.push(axesGeo);
    materials.push(axesMat);
    const axes = new THREE.LineSegments(axesGeo, axesMat);
    handle.scene.add(axes);

    // 3D Vector Arrow ArrowHelper
    const arrowDir = new THREE.Vector3(
      Math.sin(theta) * Math.cos(phi),
      Math.sin(theta) * Math.sin(phi),
      Math.cos(theta)
    );
    if (arrowDir.lengthSq() < 1e-6) {
      arrowDir.set(0, 0, 1);
    } else {
      arrowDir.normalize();
    }
    const arrowOrigin = new THREE.Vector3(0, 0, 0);
    const arrowLength = 1.3;
    const arrowColor = 0x00f0ff;
    const arrowHelper = new THREE.ArrowHelper(
      arrowDir,
      arrowOrigin,
      arrowLength,
      arrowColor,
      0.2,
      0.08
    );
    handle.scene.add(arrowHelper);

    const currentInterpolatedDir = arrowDir.clone();

    const unregisterFrame = handle.onFrame((_time: number, delta: number) => {
      if (controls) {
        controls.update(delta);
      }

      const state = useQuantumStore.getState();
      let currentTheta = state.theta;
      let currentPhi = state.phi;
      let targetLength = 1.3;

      if (state.temperatureK > 0.05) {
        const { deltaTheta, deltaPhi, vectorLength } = calculateDecoherencePerturbation(
          currentTheta,
          currentPhi,
          state.temperatureK,
          state.coherenceTimeUs / 1000
        );
        currentTheta += deltaTheta;
        currentPhi += deltaPhi;
        targetLength = 1.3 * vectorLength;
      }

      const targetX = Math.sin(currentTheta) * Math.cos(currentPhi);
      const targetY = Math.sin(currentTheta) * Math.sin(currentPhi);
      const targetZ = Math.cos(currentTheta);

      const targetVec = new THREE.Vector3(targetX, targetY, targetZ);
      if (targetVec.lengthSq() < 1e-6) {
        targetVec.set(0, 0, 1);
      } else {
        targetVec.normalize();
      }

      const interpFactor = Math.min(1.0, delta * 12.0);
      currentInterpolatedDir.lerp(targetVec, interpFactor);
      if (currentInterpolatedDir.lengthSq() > 1e-6) {
        currentInterpolatedDir.normalize();
      }

      arrowHelper.setDirection(currentInterpolatedDir);
      arrowHelper.setLength(targetLength, 0.2, 0.08);
    });

    const resizeObserver = new ResizeObserver(() => handle.resize());
    resizeObserver.observe(container);

    return () => {
      unregisterFrame();
      resizeObserver.disconnect();
      if (controls) {
        controls.dispose();
      }
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      if (arrowHelper.line) {
        arrowHelper.line.geometry.dispose();
        if (Array.isArray(arrowHelper.line.material)) {
          arrowHelper.line.material.forEach((m) => m.dispose());
        } else {
          arrowHelper.line.material.dispose();
        }
      }
      if (arrowHelper.cone) {
        arrowHelper.cone.geometry.dispose();
        if (Array.isArray(arrowHelper.cone.material)) {
          arrowHelper.cone.material.forEach((m) => m.dispose());
        } else {
          arrowHelper.cone.material.dispose();
        }
      }
      handle.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-xl border border-accent-border bg-background-80 flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.08)_0%,transparent_70%)] pointer-events-none" />

      {/* 3D Viewport Canvas Container */}
      <div className="relative z-10 w-full flex-1 min-h-[300px]">
        <div ref={containerRef} className="w-full h-full absolute inset-0" />

        {/* State Pole HUD Overlay */}
        <span className="absolute top-2 left-1/2 -translate-x-1/2 text-xs hud-font-mono text-accent pointer-events-none select-none bg-background-80 px-2 py-0.5 rounded border border-accent-border/40">
          |0⟩ (Z+)
        </span>
        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs hud-font-mono text-axis-y pointer-events-none select-none bg-background-80 px-2 py-0.5 rounded border border-axis-y/40">
          |1⟩ (Z-)
        </span>
      </div>

      {/* Coordinate & State Telemetry Dock */}
      <div className="mt-2 z-10 flex flex-wrap gap-4 text-xs hud-font-mono text-muted-foreground bg-background-80 px-4 py-2 rounded-md border border-border">
        <div><span className="text-accent font-bold">X:</span> {vectorCoords.x}</div>
        <div><span className="text-axis-y font-bold">Y:</span> {vectorCoords.y}</div>
        <div><span className="text-warning font-bold">Z:</span> {vectorCoords.z}</div>
        {lastOutcome !== null && (
          <div className="border-l border-border pl-3">
            <span className="text-success font-bold">COLLAPSED:</span> |{lastOutcome}⟩
          </div>
        )}
      </div>
    </div>
  );
};
