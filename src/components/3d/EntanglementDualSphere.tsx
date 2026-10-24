'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { readBlochPalette } from '@/lib/3d/blochTheme';
import { useOrbitCamera } from '@/hooks/useOrbitCamera';
import { useVectorKeyboardControl } from '@/hooks/useVectorKeyboardControl';
import {
  computeBellReducedDensityMatrices,
  collapseEntangledDensityMatrices,
  type QubitState,
} from '@/core/qubitMath';
import { acquireRenderer, releaseRenderer, disposeObject3D } from '@/lib/three/rendererSingleton';

export interface EntanglementDualSphereProps {
  entangledPair?: { alice: 0 | 1; bob: 0 | 1; state: string } | null;
  state?: QubitState;
  interactive?: boolean;
  onStateChange?: (state: QubitState) => void;
  className?: string;
  autoRotate?: boolean;
  animationSpeed?: number;
}

/**
 * Creates an individual Bloch sphere group with scalable polarization vector arrow.
 */
export function createBlochSphereGroup(
  offsetX: number,
  label: string,
  colorHex: number,
  axesForegroundHex: number,
  axesOpacity: number,
  radius = 1.0
): {
  group: THREE.Group;
  arrow: THREE.ArrowHelper;
  setPolarization: (r: number, dir?: THREE.Vector3) => void;
  dispose: () => void;
} {
  const group = new THREE.Group();
  group.position.set(offsetX, 0, 0);
  group.name = `sphere-${label.toLowerCase()}`;

  // 1. Wireframe sphere
  const sphereGeo = new THREE.SphereGeometry(radius, 20, 14);
  const sphereMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    wireframe: true,
    transparent: true,
    opacity: 0.18,
  });
  group.add(new THREE.Mesh(sphereGeo, sphereMat));

  // 2. Equator ring
  const ringGeo = new THREE.RingGeometry(radius * 0.98, radius * 1.02, 48);
  const ringMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.35,
  });
  ringGeo.rotateX(Math.PI / 2);
  group.add(new THREE.Mesh(ringGeo, ringMat));

  // 3. Axes
  const axesGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-radius * 1.2, 0, 0),
    new THREE.Vector3(radius * 1.2, 0, 0),
    new THREE.Vector3(0, -radius * 1.2, 0),
    new THREE.Vector3(0, radius * 1.2, 0),
    new THREE.Vector3(0, 0, -radius * 1.2),
    new THREE.Vector3(0, 0, radius * 1.2),
  ]);
  const axesMat = new THREE.LineBasicMaterial({
    color: axesForegroundHex,
    transparent: true,
    opacity: axesOpacity * 0.8,
  });
  group.add(new THREE.LineSegments(axesGeo, axesMat));

  // 4. Arrow Helper (scaled dynamically by r: arrow.setLength(radius * r))
  const arrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 0, 0),
    0.001,
    colorHex,
    0.18,
    0.07
  );
  group.add(arrow);

  const setPolarization = (r: number, dir?: THREE.Vector3) => {
    const clampedR = Math.max(0, Math.min(1, r));
    if (dir) arrow.setDirection(dir.clone().normalize());
    const length = Math.max(0.001, radius * clampedR);
    arrow.setLength(length, Math.min(length * 0.25, 0.18), Math.min(length * 0.1, 0.07));
    arrow.visible = clampedR > 0.05;
  };

  const dispose = () => {
    sphereGeo.dispose();
    sphereMat.dispose();
    ringGeo.dispose();
    ringMat.dispose();
    axesGeo.dispose();
    axesMat.dispose();
    arrow.dispose();
  };

  return { group, arrow, setPolarization, dispose };
}

export function EntanglementDualSphere({
  entangledPair = null,
  state: _state = { theta: Math.PI / 2, phi: 0 },
  interactive = true,
  onStateChange,
  className = '',
  autoRotate = false,
  animationSpeed = 1,
}: EntanglementDualSphereProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pairRef = useRef(entangledPair);
  const stateRef = useRef<QubitState>(_state);
  const onStateChangeRef = useRef(onStateChange);

  useVectorKeyboardControl(stateRef, {
    enabled: interactive,
    onStateChange: (newState) => {
      stateRef.current = newState;
      onStateChangeRef.current?.(newState);
    },
  });

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
    pairRef.current = entangledPair;
    stateRef.current = _state;
    onStateChangeRef.current = onStateChange;
  }, [entangledPair, _state, onStateChange]);

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
    const palette = readBlochPalette();

    // 1. Alice Sphere at x = -2.2 (Neon Cyan)
    const alice = createBlochSphereGroup(-2.2, 'Alice', 0x00f0ff, palette.foreground, palette.axesOpacity, 1.0);
    scene.add(alice.group);

    // 2. Bob Sphere at x = +2.2 (Quantum Purple)
    const bob = createBlochSphereGroup(2.2, 'Bob', 0xa855f7, palette.foreground, palette.axesOpacity, 1.0);
    scene.add(bob.group);

    // 3. Central 4x4 Density Matrix Visualizer in C⁴ Tensor Lattice
    const dmGroup = new THREE.Group();
    dmGroup.position.set(0, -0.6, 0);
    const dmCells: THREE.Mesh[] = [];
    const dmMaterials: THREE.MeshBasicMaterial[] = [];
    const cellGeo = new THREE.BoxGeometry(0.24, 0.05, 0.24);

    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const mat = new THREE.MeshBasicMaterial({
          color: 0x00f0ff,
          transparent: true,
          opacity: 0.3,
        });
        dmMaterials.push(mat);
        const cell = new THREE.Mesh(cellGeo, mat);
        cell.position.set((c - 1.5) * 0.3, 0, (r - 1.5) * 0.3);
        dmGroup.add(cell);
        dmCells.push(cell);
      }
    }
    scene.add(dmGroup);

    // 4. Interlaced Correlation Geometry connecting Alice and Bob
    const helixSegments = 64;
    const helixPositions = new Float32Array((helixSegments + 1) * 3);
    const helixGeo = new THREE.BufferGeometry();
    helixGeo.setAttribute('position', new THREE.BufferAttribute(helixPositions, 3));
    const helixMat = new THREE.LineBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.65,
    });
    const helixLine = new THREE.Line(helixGeo, helixMat);
    scene.add(helixLine);

    let animId = 0;
    let t = 0;

    const animate = () => {
      t += 0.03;
      orbit.updateCamera(camera);

      const currentPair = pairRef.current;
      const dmData = currentPair
        ? collapseEntangledDensityMatrices(currentPair.alice)
        : computeBellReducedDensityMatrices();

      if (currentPair) {
        // Collapsed pure state (r = 1.0)
        const dir = currentPair.alice === 0 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, -1, 0);
        alice.setPolarization(1.0, dir);
        bob.setPolarization(1.0, dir);
        helixMat.color.setHex(0x10b981);
        helixMat.opacity = 0.85;
      } else {
        // Maximally entangled Bell state: r_A = 0, r_B = 0 (shrinks to origin)
        alice.setPolarization(dmData.vectorA.r, new THREE.Vector3(0, 1, 0));
        bob.setPolarization(dmData.vectorB.r, new THREE.Vector3(0, 1, 0));
        helixMat.color.setHex(0x00f0ff);
        helixMat.opacity = 0.55 + Math.sin(t * 3) * 0.2;
      }

      // Update 4x4 Density Matrix visualizer cell heights and opacities
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const idx = r * 4 + c;
          const cell = dmCells[idx];
          const mat = dmMaterials[idx];
          const val = Math.sqrt(dmData.rhoAB[r][c].real ** 2 + dmData.rhoAB[r][c].imag ** 2);
          const targetScaleY = Math.max(0.2, val * 6.0);
          cell.scale.y += (targetScaleY - cell.scale.y) * 0.15;
          cell.position.y = (cell.scale.y * 0.05) / 2;
          mat.opacity = Math.max(0.15, val * 0.9);
          mat.color.setHex(val > 0.1 ? (r === c ? 0x10b981 : 0xa855f7) : 0x334155);
        }
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
      alice.dispose();
      bob.dispose();
      cellGeo.dispose();
      dmMaterials.forEach((m) => m.dispose());
      helixGeo.dispose();
      helixMat.dispose();
      disposeObject3D(scene);
      releaseRenderer(container);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- singleton WebGL canvas lifecycle
  }, []);

  return (
    <div
      data-testid="entanglement-dual-sphere"
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

export default EntanglementDualSphere;
