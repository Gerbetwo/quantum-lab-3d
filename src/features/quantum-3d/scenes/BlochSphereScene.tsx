'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createScene, type SceneHandle } from '../lib/sceneManager';
import { useQuantumStore } from '@/store/useQuantumStore';
import {
  MeasurementParticles,
  type MeasurementParticlesHandle,
} from '../canvas/MeasurementParticles';

export interface BlochSphereSceneProps {
  theta?: number;
  phi?: number;
}

export function BlochSphereScene({ theta: propTheta, phi: propPhi }: BlochSphereSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SceneHandle | null>(null);
  const particlesRef = useRef<MeasurementParticlesHandle>(null);
  const flashMeshRef = useRef<THREE.Mesh | null>(null);
  const flashAnimRef = useRef({ active: false, time: 0, duration: 0.35 });

  useEffect(() => {
    if (propTheta !== undefined && propPhi !== undefined) {
      useQuantumStore.setState({ theta: propTheta, phi: propPhi });
    }
  }, [propTheta, propPhi]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handle = createScene(container);
    sceneRef.current = handle;

    // Bloch Sphere Wireframe
    const sphereGeo = new THREE.SphereGeometry(1, 32, 16);
    const sphereMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true, transparent: true, opacity: 0.15 });
    const wireframeSphere = new THREE.Mesh(sphereGeo, sphereMat);
    handle.scene.add(wireframeSphere);

    // Equator Ring
    const ringGeo = new THREE.RingGeometry(0.99, 1.01, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    handle.scene.add(ring);

    // Vector Shaft & Cone Group
    const vectorGroup = new THREE.Group();
    const shaftGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.0, 16);
    const shaftMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.8 });
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    shaft.position.y = 0.5;
    vectorGroup.add(shaft);

    const coneGeo = new THREE.ConeGeometry(0.05, 0.15, 16);
    const coneMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 1.2 });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.y = 1.0;
    vectorGroup.add(cone);

    handle.scene.add(vectorGroup);

    // Collapse Flash Mesh
    const flashGeo = new THREE.SphereGeometry(1, 32, 32);
    const flashMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 2.5,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const flashMesh = new THREE.Mesh(flashGeo, flashMat);
    flashMesh.visible = false;
    handle.scene.add(flashMesh);
    flashMeshRef.current = flashMesh;

    // Animation Loop Callback
    const unregisterFrame = handle.onFrame((_time: number, delta: number) => {
      const state = useQuantumStore.getState();
      const targetEuler = new THREE.Euler(state.theta, state.phi, 0, 'YXZ');
      const targetQuat = new THREE.Quaternion().setFromEuler(targetEuler);
      vectorGroup.quaternion.slerp(targetQuat, delta * 12.0);

      // Collapse Flash Scaling Animation
      const anim = flashAnimRef.current;
      if (anim.active && flashMeshRef.current) {
        anim.time += delta;
        const progress = Math.min(anim.time / anim.duration, 1.0);
        const currentScale = 1.5 * (1.0 - progress);
        flashMeshRef.current.scale.setScalar(Math.max(0, currentScale));
        (flashMeshRef.current.material as THREE.MeshStandardMaterial).opacity = 0.95 * (1.0 - progress);

        if (progress >= 1.0) {
          anim.active = false;
          flashMeshRef.current.visible = false;
        }
      }
    });

    const resizeObserver = new ResizeObserver(() => handle.resize());
    resizeObserver.observe(container);

    return () => {
      unregisterFrame();
      resizeObserver.disconnect();
      handle.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Subscribe to measurement collapse outcome updates
  useEffect(() => {
    const unsubscribe = useQuantumStore.subscribe((state, prevState) => {
      if (state.lastOutcome !== null && state.lastOutcome !== prevState.lastOutcome && flashMeshRef.current) {
        const outcome = state.lastOutcome;
        flashMeshRef.current.position.set(0, outcome === 0 ? 1 : -1, 0);
        flashMeshRef.current.scale.setScalar(1.5);
        (flashMeshRef.current.material as THREE.MeshStandardMaterial).opacity = 0.95;
        flashMeshRef.current.visible = true;
        flashAnimRef.current = { active: true, time: 0, duration: 0.35 };
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-70 rounded-xl overflow-hidden relative bg-background/80"
      role="img"
      aria-label="Representación 3D interactiva de la Esfera de Bloch"
    >
      <MeasurementParticles ref={particlesRef} sceneRef={sceneRef} maxInstances={250} />
    </div>
  );
}
