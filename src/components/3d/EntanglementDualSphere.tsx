'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export interface EntanglementDualSphereProps {
  entangledPair?: { alice: 0 | 1; bob: 0 | 1; state: string } | null;
  className?: string;
}

export function EntanglementDualSphere({
  entangledPair = null,
  className = '',
}: EntanglementDualSphereProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pairRef = useRef(entangledPair);

  useEffect(() => {
    pairRef.current = entangledPair;
  }, [entangledPair]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 300;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.8, 6.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];

    // Helper to build a Bloch sphere at offset X
    const buildSphere = (offsetX: number, label: string, colorHex: number) => {
      const group = new THREE.Group();
      group.position.set(offsetX, 0, 0);
      group.name = `sphere-${label.toLowerCase()}`;

      // Wireframe
      const sphereGeo = new THREE.SphereGeometry(1.0, 20, 14);
      const sphereMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        wireframe: true,
        transparent: true,
        opacity: 0.15,
      });
      geometries.push(sphereGeo);
      materials.push(sphereMat);
      group.add(new THREE.Mesh(sphereGeo, sphereMat));

      // Equator Ring
      const ringGeo = new THREE.RingGeometry(0.98, 1.02, 48);
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35,
      });
      ringGeo.rotateX(Math.PI / 2);
      geometries.push(ringGeo);
      materials.push(ringMat);
      group.add(new THREE.Mesh(ringGeo, ringMat));

      // Axes
      const axesGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-1.2, 0, 0),
        new THREE.Vector3(1.2, 0, 0),
        new THREE.Vector3(0, -1.2, 0),
        new THREE.Vector3(0, 1.2, 0),
        new THREE.Vector3(0, 0, -1.2),
        new THREE.Vector3(0, 0, 1.2),
      ]);
      const axesMat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.2,
      });
      geometries.push(axesGeo);
      materials.push(axesMat);
      group.add(new THREE.LineSegments(axesGeo, axesMat));

      // Arrow Helper
      const arrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 0, 0),
        1.0,
        colorHex,
        0.18,
        0.07
      );
      group.add(arrow);

      scene.add(group);
      return { group, arrow };
    };

    // 1. Alice Sphere at x = -2.2 (Neon Cyan 0x00f0ff)
    const alice = buildSphere(-2.2, 'Alice', 0x00f0ff);

    // 2. Bob Sphere at x = +2.2 (Precision Purple 0xa855f7)
    const bob = buildSphere(2.2, 'Bob', 0xa855f7);

    // 3. Interlaced Correlation Geometry connecting Alice and Bob
    const helixSegments = 64;
    const helixPositions = new Float32Array((helixSegments + 1) * 3);
    const helixGeo = new THREE.BufferGeometry();
    helixGeo.setAttribute('position', new THREE.BufferAttribute(helixPositions, 3));
    const helixMat = new THREE.LineBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.65,
    });
    geometries.push(helixGeo);
    materials.push(helixMat);
    const helixLine = new THREE.Line(helixGeo, helixMat);
    scene.add(helixLine);

    let animId = 0;
    let t = 0;

    const animate = () => {
      t += 0.03;

      const currentPair = pairRef.current;

      // Update Alice and Bob vectors
      if (currentPair) {
        // Collapsed state: pointing deterministically up (|0⟩) or down (|1⟩)
        const aliceDir = currentPair.alice === 0 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, -1, 0);
        const bobDir = currentPair.bob === 0 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, -1, 0);
        alice.arrow.setDirection(aliceDir);
        bob.arrow.setDirection(bobDir);
        helixMat.color.setHex(0x10b981); // Emerald on correlation
        helixMat.opacity = 0.85;
      } else {
        // Superposition precession
        const angle = t * 0.75;
        const precDir = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)).normalize();
        alice.arrow.setDirection(precDir);
        bob.arrow.setDirection(precDir);
        helixMat.color.setHex(0x00f0ff);
        helixMat.opacity = 0.45;
      }

      // Update interlaced correlation sine wave geometry between x = -1.2 and x = 1.2
      const posAttr = helixGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i <= helixSegments; i++) {
        const u = i / helixSegments;
        const x = -1.2 + u * 2.4;
        const envelope = Math.sin(u * Math.PI);
        const y = Math.sin(u * Math.PI * 4 + t * 2) * 0.22 * envelope;
        const z = Math.cos(u * Math.PI * 4 + t * 2) * 0.22 * envelope;
        posAttr.setXYZ(i, x, y, z);
      }
      posAttr.needsUpdate = true;

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
      alice.arrow.dispose();
      bob.arrow.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      data-testid="entanglement-dual-sphere"
      ref={containerRef}
      className={`relative w-full h-full min-h-60 select-none ${className}`.trim()}
    />
  );
}

export default EntanglementDualSphere;
