'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { BitTriple, SyndromeResult } from '@/core/types';
import { useOrbitCamera } from '@/hooks/useOrbitCamera';
import { acquireRenderer, releaseRenderer, disposeObject3D } from '@/lib/three/rendererSingleton';

export interface QECArray3DProps {
  qecTriple?: BitTriple;
  syndromeInfo?: SyndromeResult | null;
  onFlipQubit?: (idx: 0 | 1 | 2) => void;
  isCorrecting?: boolean;
  correctionTrigger?: number;
  className?: string;
  autoRotate?: boolean;
  animationSpeed?: number;
}

export function QECArray3D({
  qecTriple = [0, 0, 0],
  syndromeInfo = null,
  onFlipQubit,
  isCorrecting = false,
  correctionTrigger = 0,
  className = '',
  autoRotate = false,
  animationSpeed = 1,
}: QECArray3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tripleRef = useRef<BitTriple>(qecTriple);
  const syndromeRef = useRef<SyndromeResult | null>(syndromeInfo);
  const onFlipRef = useRef(onFlipQubit);
  const pulseProgressRef = useRef<number>(-1);
  const prevCorrectionRef = useRef<number>(correctionTrigger);

  const orbit = useOrbitCamera(containerRef, {
    initialRadius: 6.5,
    minRadius: 2.5,
    maxRadius: 14.0,
    initialTheta: Math.PI / 2.5,
    initialPhi: Math.PI / 2,
    autoRotate,
    autoRotateSpeed: 0.005 * animationSpeed,
  });

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
    if (isCorrecting || correctionTrigger !== prevCorrectionRef.current) {
      pulseProgressRef.current = 0.0;
      prevCorrectionRef.current = correctionTrigger;
    }
  }, [isCorrecting, correctionTrigger]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 300;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.8, 6.2);
    camera.lookAt(0, 0, 0);

    const renderer = acquireRenderer(container);

    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];

    // 1. Entanglement Bus Bar (Line connecting the 3 qubits)
    const busGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-2.6, 0, 0),
      new THREE.Vector3(2.6, 0, 0),
    ]);
    const busMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.35,
    });
    geometries.push(busGeo);
    materials.push(busMat);
    scene.add(new THREE.Line(busGeo, busMat));

    // Corrective green traveling pulse sphere
    const pulseGeo = new THREE.SphereGeometry(0.24, 16, 12);
    const pulseMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.9,
    });
    geometries.push(pulseGeo);
    materials.push(pulseMat);
    const pulseMesh = new THREE.Mesh(pulseGeo, pulseMat);
    pulseMesh.visible = false;
    scene.add(pulseMesh);

    // 2. Build 3 Qubit Nodes (q0 at -2.2, q1 at 0, q2 at +2.2)
    const xOffsets = [-2.2, 0, 2.2];
    const nodes: {
      group: THREE.Group;
      arrow: THREE.ArrowHelper;
      sphereMat: THREE.MeshBasicMaterial;
      errorRing: THREE.Mesh;
      errorMat: THREE.MeshBasicMaterial;
      auraMesh: THREE.Mesh;
      auraMat: THREE.MeshBasicMaterial;
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

      // Corrupted qubit pulsing red aura sphere
      const auraGeo = new THREE.SphereGeometry(1.08, 20, 14);
      const auraMat = new THREE.MeshBasicMaterial({
        color: 0xf43f5e,
        transparent: true,
        opacity: 0.0,
      });
      geometries.push(auraGeo);
      materials.push(auraMat);
      const auraMesh = new THREE.Mesh(auraGeo, auraMat);
      group.add(auraMesh);

      scene.add(group);
      nodes.push({ group, arrow, sphereMat, errorRing, errorMat, auraMesh, auraMat });
    }

    // 3. Floating Syndrome Parity Check Nodes
    // S1 = q0 ⊕ q1 at x = -1.1, y = 1.1; S2 = q1 ⊕ q2 at x = 1.1, y = 1.1
    const parityNodePositions = [
      { x: -1.1, y: 1.1, qA: -2.2, qB: 0.0, label: 'S1' },
      { x: 1.1, y: 1.1, qA: 0.0, qB: 2.2, label: 'S2' },
    ];

    const parityNodes: {
      group: THREE.Group;
      meshMat: THREE.MeshBasicMaterial;
      wireMat: THREE.MeshBasicMaterial;
      linesMat: THREE.LineBasicMaterial;
    }[] = [];

    parityNodePositions.forEach((pos) => {
      const pGroup = new THREE.Group();
      pGroup.position.set(pos.x, pos.y, 0);

      const octGeo = new THREE.OctahedronGeometry(0.3, 0);
      const meshMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.45,
      });
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        wireframe: true,
        transparent: true,
        opacity: 0.8,
      });
      geometries.push(octGeo);
      materials.push(meshMat, wireMat);
      pGroup.add(new THREE.Mesh(octGeo, meshMat));
      pGroup.add(new THREE.Mesh(octGeo, wireMat));

      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(pos.qA - pos.x, -pos.y, 0),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(pos.qB - pos.x, -pos.y, 0),
      ]);
      const linesMat = new THREE.LineBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.35,
      });
      geometries.push(lineGeo);
      materials.push(linesMat);
      pGroup.add(new THREE.Line(lineGeo, linesMat));

      scene.add(pGroup);
      parityNodes.push({ group: pGroup, meshMat, wireMat, linesMat });
    });

    let animId = 0;
    let t = 0;
    let lastTime = performance.now();

    const animate = () => {
      const now = performance.now();
      const dt = Math.min(0.1, (now - lastTime) * 0.001);
      lastTime = now;
      t += 0.05;

      orbit.updateCamera(camera);

      const triple = tripleRef.current;
      const syndrome = syndromeRef.current;

      // Parity values: S1 = q0 ⊕ q1, S2 = q1 ⊕ q2
      const s1 = triple[0] ^ triple[1];
      const s2 = triple[1] ^ triple[2];
      const parityValues = [s1, s2];

      for (let p = 0; p < 2; p++) {
        const isViolated = parityValues[p] === 1;
        const pNode = parityNodes[p];

        pNode.group.rotation.y = t * 0.8;
        pNode.group.rotation.x = Math.sin(t * 0.5) * 0.3;

        if (isViolated) {
          const pulse = (Math.sin(t * 5) + 1) * 0.5;
          const activeColor = 0xf43f5e;
          pNode.meshMat.color.setHex(activeColor);
          pNode.meshMat.opacity = 0.55 + pulse * 0.4;
          pNode.wireMat.color.setHex(activeColor);
          pNode.wireMat.opacity = 0.9;
          pNode.linesMat.color.setHex(activeColor);
          pNode.linesMat.opacity = 0.6 + pulse * 0.35;
          pNode.group.scale.setScalar(1.0 + pulse * 0.2);
        } else {
          const calmColor = 0x10b981;
          pNode.meshMat.color.setHex(calmColor);
          pNode.meshMat.opacity = 0.35;
          pNode.wireMat.color.setHex(calmColor);
          pNode.wireMat.opacity = 0.65;
          pNode.linesMat.color.setHex(0x00f0ff);
          pNode.linesMat.opacity = 0.25;
          pNode.group.scale.setScalar(1.0);
        }
      }

      // Find majority bit to detect bit-flip discrepancies
      const sum = triple[0] + triple[1] + triple[2];
      const majority = sum >= 2 ? 1 : 0;

      for (let i = 0; i < 3; i++) {
        const bit = triple[i];
        const isFlipped = bit !== majority;
        const isSyndromeDetected = syndrome && syndrome.errorIndex === i;
        const hasError = isFlipped || isSyndromeDetected;

        const targetDir = bit === 0 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, -1, 0);
        nodes[i].arrow.setDirection(targetDir);

        if (hasError) {
          const pulse = (Math.sin(t * 4) + 1) * 0.5;
          nodes[i].errorMat.opacity = 0.35 + pulse * 0.55;
          nodes[i].errorRing.scale.setScalar(1 + pulse * 0.15);
          nodes[i].auraMat.opacity = 0.15 + pulse * 0.25;
          nodes[i].auraMesh.scale.setScalar(1.0 + pulse * 0.12);
          nodes[i].sphereMat.color.setHex(0xf43f5e);
          nodes[i].arrow.setColor(new THREE.Color(0xf43f5e));
        } else {
          nodes[i].errorMat.opacity = 0.0;
          nodes[i].auraMat.opacity = 0.0;
          nodes[i].sphereMat.color.setHex(0x00f0ff);
          nodes[i].arrow.setColor(new THREE.Color(bit === 0 ? 0x10b981 : 0x00f0ff));
        }
      }

      // Corrective pulse animation along the bus bar
      const isPulseActive = pulseProgressRef.current >= 0;
      if (isPulseActive && pulseProgressRef.current <= 1.0) {
        pulseProgressRef.current += dt * 1.6;
        const prog = pulseProgressRef.current;
        pulseMesh.visible = true;
        pulseMesh.position.set(-2.5 + prog * 5.0, 0, 0);
        const pulseScale = Math.sin(prog * Math.PI) * 1.3 + 0.8;
        pulseMesh.scale.setScalar(pulseScale);
        busMat.color.setHex(0x10b981);
        busMat.opacity = 0.85;
      } else {
        pulseMesh.visible = false;
        busMat.color.setHex(0x00f0ff);
        busMat.opacity = 0.35;
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
      disposeObject3D(scene);
      releaseRenderer(container);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- singleton WebGL canvas lifecycle
  }, []);

  return (
    <div
      data-testid="qec-array-3d"
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

export default QECArray3D;
