'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useOrbitCamera } from '@/hooks/useOrbitCamera';

export interface GroverBarChart3DProps {
  groverProbs?: number[];
  targetIndex?: number;
  className?: string;
  autoRotate?: boolean;
  animationSpeed?: number;
}

export function GroverBarChart3D({
  groverProbs = [0.25, 0.25, 0.25, 0.25],
  targetIndex = 1,
  className = '',
  autoRotate = false,
  animationSpeed = 1,
}: GroverBarChart3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const probsRef = useRef<number[]>(groverProbs);
  const targetRef = useRef<number>(targetIndex);

  const orbit = useOrbitCamera(containerRef, {
    initialRadius: 7.0,
    minRadius: 3.0,
    maxRadius: 15.0,
    initialTheta: Math.PI / 3,
    initialPhi: Math.PI / 4,
    target: [0, 1.2, 0],
    autoRotate,
    autoRotateSpeed: 0.005 * animationSpeed,
  });

  useEffect(() => {
    probsRef.current = groverProbs;
  }, [groverProbs]);

  useEffect(() => {
    targetRef.current = targetIndex;
  }, [targetIndex]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 300;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 2.8, 6.4);
    camera.lookAt(0, 1.2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];

    // 1. Ground Grid
    const grid = new THREE.GridHelper(6, 12, 0x00f0ff, 0x1e293b);
    grid.position.y = 0;
    scene.add(grid);

    // 2. 4 Probability Bar Meshes
    const barSpacing = 1.35;
    const barWidth = 0.7;
    const barDepth = 0.7;
    const xOffsets = [-1.5 * barSpacing, -0.5 * barSpacing, 0.5 * barSpacing, 1.5 * barSpacing];

    const barMeshes: THREE.Mesh[] = [];
    const currentHeights = [0.75, 0.75, 0.75, 0.75];

    for (let i = 0; i < 4; i++) {
      const isTarget = i === targetRef.current;
      const boxGeo = new THREE.BoxGeometry(barWidth, 1.0, barDepth);
      const boxMat = new THREE.MeshBasicMaterial({
        color: isTarget ? 0x00f0ff : 0x334155,
        transparent: true,
        opacity: isTarget ? 0.75 : 0.45,
      });
      geometries.push(boxGeo);
      materials.push(boxMat);

      const barMesh = new THREE.Mesh(boxGeo, boxMat);
      barMesh.position.set(xOffsets[i], 0.5, 0);
      barMesh.name = `grover-bar-${i}`;

      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(boxGeo),
        new THREE.LineBasicMaterial({
          color: isTarget ? 0x00f0ff : 0x64748b,
          transparent: true,
          opacity: 0.8,
        })
      );
      geometries.push(edges.geometry);
      materials.push(edges.material as THREE.Material);
      barMesh.add(edges);

      scene.add(barMesh);
      barMeshes.push(barMesh);
    }

    // 3. Floating Mean Reflection Plane (Quantum Purple 0xa855f7)
    const planeGeo = new THREE.PlaneGeometry(5.8, 1.8);
    const planeMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    planeGeo.rotateX(Math.PI / 2);
    geometries.push(planeGeo);
    materials.push(planeMat);

    const meanPlane = new THREE.Mesh(planeGeo, planeMat);
    meanPlane.position.set(0, 0.75, 0);
    scene.add(meanPlane);

    // Outline for mean plane
    const planeEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(planeGeo),
      new THREE.LineBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.75 })
    );
    geometries.push(planeEdges.geometry);
    materials.push(planeEdges.material as THREE.Material);
    meanPlane.add(planeEdges);

    let animId = 0;

    const animate = () => {
      orbit.updateCamera(camera);

      const probs = probsRef.current;
      const target = targetRef.current;
      const meanProb = probs.reduce((acc, p) => acc + p, 0) / 4;
      const targetMeanY = Math.max(0.1, meanProb * 2.8);

      // Smoothly interpolate mean plane height
      meanPlane.position.y += (targetMeanY - meanPlane.position.y) * 0.1;

      // Smoothly update bar heights and colors
      for (let i = 0; i < 4; i++) {
        const p = probs[i] ?? 0.25;
        const targetH = Math.max(0.08, p * 2.8);
        currentHeights[i] += (targetH - currentHeights[i]) * 0.1;
        const h = currentHeights[i];

        const bar = barMeshes[i];
        bar.scale.set(1, h, 1);
        bar.position.y = h / 2;

        const isTarget = i === target;
        const mat = bar.material as THREE.MeshBasicMaterial;
        mat.color.setHex(isTarget ? 0x00f0ff : 0x334155);
        mat.opacity = isTarget ? 0.8 : 0.4;
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };
    animate();

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
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      grid.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- singleton WebGL canvas lifecycle
  }, []);

  return (
    <div
      data-testid="grover-bar-chart-3d"
      ref={containerRef}
      onPointerDown={orbit.onPointerDown}
      onPointerMove={orbit.onPointerMove}
      onPointerUp={orbit.onPointerUp}
      onPointerCancel={orbit.onPointerCancel}
      onPointerLeave={orbit.onPointerLeave}
      style={{ touchAction: 'none' }}
      className={`relative w-full h-full min-h-60 select-none pointer-events-auto touch-none cursor-grab active:cursor-grabbing ${className}`.trim()}
    />
  );
}

export default GroverBarChart3D;
