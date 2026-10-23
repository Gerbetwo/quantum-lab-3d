'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { QubitState } from '@/lib/quantumCore';

export interface BlochSphereViewportProps {
  state: QubitState;
  className?: string;
}

export function BlochSphereViewport({ state, className }: BlochSphereViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const targetStateRef = useRef<QubitState>(state);

  useEffect(() => {
    targetStateRef.current = state;
  }, [state]);

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

    const sphereGeo = new THREE.SphereGeometry(1.2, 24, 16);
    const sphereMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, wireframe: true, transparent: true, opacity: 0.15 });
    scene.add(new THREE.Mesh(sphereGeo, sphereMat));

    const ringGeo = new THREE.RingGeometry(1.18, 1.22, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, side: THREE.DoubleSide, transparent: true, opacity: 0.3 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    const axesGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1.4, 0, 0), new THREE.Vector3(1.4, 0, 0),
      new THREE.Vector3(0, -1.4, 0), new THREE.Vector3(0, 1.4, 0),
      new THREE.Vector3(0, 0, -1.4), new THREE.Vector3(0, 0, 1.4),
    ]);
    const axesMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25 });
    scene.add(new THREE.LineSegments(axesGeo, axesMat));

    let currentTheta = targetStateRef.current.theta;
    let currentPhi = targetStateRef.current.phi;
    const toVector = (th: number, ph: number) =>
      new THREE.Vector3(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)).normalize();

    const arrow = new THREE.ArrowHelper(toVector(currentTheta, currentPhi), new THREE.Vector3(0, 0, 0), 1.2, 0x00f3ff, 0.2, 0.08);
    scene.add(arrow);

    let animId = 0;
    const animate = () => {
      const { theta: targetTheta, phi: targetPhi } = targetStateRef.current;
      if (currentTheta < 0.05 || Math.PI - currentTheta < 0.05) currentPhi = targetPhi;
      let dPhi = targetPhi - currentPhi;
      while (dPhi > Math.PI) dPhi -= 2 * Math.PI;
      while (dPhi < -Math.PI) dPhi += 2 * Math.PI;

      currentPhi += dPhi * 0.1;
      currentTheta += (targetTheta - currentTheta) * 0.1;
      arrow.setDirection(toVector(currentTheta, currentPhi));
      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };
    animate();

    const resizeObserver = typeof ResizeObserver !== 'undefined'
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
      [sphereGeo, ringGeo, axesGeo, arrow.line.geometry, arrow.cone.geometry].forEach((g) => g.dispose());
      [sphereMat, ringMat, axesMat].forEach((m) => m.dispose());
      if (arrow.line.material instanceof THREE.Material) arrow.line.material.dispose();
      if (arrow.cone.material instanceof THREE.Material) arrow.cone.material.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className={className ?? 'w-full h-full min-h-75'} />;
}

export default BlochSphereViewport;
