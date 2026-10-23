'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { BitTriple, SyndromeResult } from '@/core/types';

export interface QECArray3DProps {
  qecTriple?: BitTriple;
  syndromeInfo?: SyndromeResult | null;
  onFlipQubit?: (idx: 0 | 1 | 2) => void;
  className?: string;
}

export function QECArray3D({
  qecTriple = [0, 0, 0],
  syndromeInfo = null,
  onFlipQubit,
  className = '',
}: QECArray3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tripleRef = useRef<BitTriple>(qecTriple);
  const syndromeRef = useRef<SyndromeResult | null>(syndromeInfo);
  const onFlipRef = useRef(onFlipQubit);

  useEffect(() => {
    tripleRef.current = qecTriple;
  }, [qecTriple]);

  useEffect(() => {
    syndromeRef.current = syndromeInfo;
  }, [syndromeInfo]);

  useEffect(() => {
    onFlipRef.current = onFlipQubit;
  }, [onFlipQubit]);

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

    // 1. Entanglement Bus Bar (Line connecting the 3 qubits)
    const busGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-2.2, 0, 0),
      new THREE.Vector3(2.2, 0, 0),
    ]);
    const busMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.35,
    });
    geometries.push(busGeo);
    materials.push(busMat);
    scene.add(new THREE.Line(busGeo, busMat));

    // 2. Build 3 Qubit Nodes (q0 at -2.2, q1 at 0, q2 at +2.2)
    const xOffsets = [-2.2, 0, 2.2];
    const nodes: {
      group: THREE.Group;
      arrow: THREE.ArrowHelper;
      sphereMat: THREE.MeshBasicMaterial;
      errorRing: THREE.Mesh;
      errorMat: THREE.MeshBasicMaterial;
    }[] = [];

    for (let idx = 0; idx < 3; idx++) {
      const group = new THREE.Group();
      group.position.set(xOffsets[idx], 0, 0);
      group.name = `qec-node-${idx}`;

      // Wireframe sphere
      const sphereGeo = new THREE.SphereGeometry(0.85, 18, 12);
      const sphereMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        wireframe: true,
        transparent: true,
        opacity: 0.18,
      });
      geometries.push(sphereGeo);
      materials.push(sphereMat);
      group.add(new THREE.Mesh(sphereGeo, sphereMat));

      // Equator ring
      const ringGeo = new THREE.RingGeometry(0.83, 0.87, 40);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3,
      });
      ringGeo.rotateX(Math.PI / 2);
      geometries.push(ringGeo);
      materials.push(ringMat);
      group.add(new THREE.Mesh(ringGeo, ringMat));

      // Directional arrow helper (up for |0⟩, down for |1⟩)
      const arrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 0, 0),
        0.85,
        0x10b981,
        0.16,
        0.06
      );
      group.add(arrow);

      // Pulsing error highlight ring
      const errorRingGeo = new THREE.RingGeometry(0.92, 1.05, 36);
      const errorMat = new THREE.MeshBasicMaterial({
        color: 0xf43f5e,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.0,
      });
      errorRingGeo.rotateX(Math.PI / 2);
      geometries.push(errorRingGeo);
      materials.push(errorMat);
      const errorRing = new THREE.Mesh(errorRingGeo, errorMat);
      group.add(errorRing);

      scene.add(group);
      nodes.push({ group, arrow, sphereMat, errorRing, errorMat });
    }

    let animId = 0;
    let t = 0;

    const animate = () => {
      t += 0.05;
      const triple = tripleRef.current;
      const syndrome = syndromeRef.current;

      // Find majority bit to detect bit-flip discrepancies
      const sum = triple[0] + triple[1] + triple[2];
      const majority = sum >= 2 ? 1 : 0;

      for (let i = 0; i < 3; i++) {
        const bit = triple[i];
        const isFlipped = bit !== majority;
        const isSyndromeDetected = syndrome && syndrome.errorIndex === i;
        const hasError = isFlipped || isSyndromeDetected;

        // Vector direction: 0 points up (0, 1, 0), 1 points down (0, -1, 0)
        const targetDir = bit === 0 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, -1, 0);
        nodes[i].arrow.setDirection(targetDir);

        if (hasError) {
          // Pulse error ring in warning rose/red
          const pulse = (Math.sin(t * 3) + 1) * 0.5;
          nodes[i].errorMat.opacity = 0.35 + pulse * 0.55;
          nodes[i].errorRing.scale.setScalar(1 + pulse * 0.12);
          nodes[i].sphereMat.color.setHex(0xf43f5e);
          nodes[i].arrow.setColor(new THREE.Color(0xf43f5e));
        } else {
          nodes[i].errorMat.opacity = 0.0;
          nodes[i].sphereMat.color.setHex(0x00f0ff);
          nodes[i].arrow.setColor(new THREE.Color(bit === 0 ? 0x10b981 : 0x00f0ff));
        }
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
      nodes.forEach((n) => n.arrow.dispose());
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      data-testid="qec-array-3d"
      ref={containerRef}
      className={`relative w-full h-full min-h-60 select-none ${className}`.trim()}
    />
  );
}

export default QECArray3D;
