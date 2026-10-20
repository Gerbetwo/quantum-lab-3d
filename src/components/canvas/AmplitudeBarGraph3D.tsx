"use client";

import * as THREE from "three";

export const BASIS_LABELS_4 = ["|00⟩", "|01⟩", "|10⟩", "|11⟩"] as const;
export const BASIS_LABELS_8 = [
  "|000⟩",
  "|001⟩",
  "|010⟩",
  "|011⟩",
  "|100⟩",
  "|101⟩",
  "|110⟩",
  "|111⟩",
] as const;

/**
 * Calculates the mean amplitude: ⟨a_mean⟩ = (1/N) * ∑ a_i
 */
export function computeMeanAmplitude(amplitudes: readonly number[]): number {
  if (!amplitudes || amplitudes.length === 0) return 0;
  const sum = amplitudes.reduce((acc, val) => acc + val, 0);
  return sum / amplitudes.length;
}

/**
 * Applies the Oracle phase inversion step: a_target -> -a_target
 */
export function applyOraclePhaseInversion(
  amplitudes: readonly number[],
  targetIndex: number
): number[] {
  return amplitudes.map((amp, idx) => (idx === targetIndex ? -amp : amp));
}

/**
 * Applies the Grover diffusion operator (inversion about the mean):
 * a_i' = 2⟨a_mean⟩ - a_i
 */
export function applyDiffusionReflection(amplitudes: readonly number[]): {
  amplitudes: number[];
  mean: number;
} {
  const mean = computeMeanAmplitude(amplitudes);
  const reflected = amplitudes.map((amp) => 2 * mean - amp);
  return { amplitudes: reflected, mean };
}

/**
 * Calculates state probabilities: P(i) = |a_i|²
 */
export function computeGroverProbabilities(amplitudes: readonly number[]): number[] {
  return amplitudes.map((amp) => amp * amp);
}

export interface AmplitudeBarGraphResult {
  group: THREE.Group;
  bars: THREE.Mesh[];
  barEdges: THREE.LineSegments[];
  meanPlane: THREE.Mesh;
  meanPerimeter: THREE.Line;
  groundGrid: THREE.GridHelper;
  update: (
    dt: number,
    displayedAmplitudes: readonly number[],
    targetIndex: number,
    isTargetMarked: boolean
  ) => void;
  triggerBouncePulse: () => void;
  dispose: () => void;
}

/**
 * Creates the 3D Amplitude Bar Graph and Mean Reflection Plane
 */
export function createAmplitudeBarGraphGroup(
  numStates = 4,
  initialTargetIndex = 2
): AmplitudeBarGraphResult {
  const group = new THREE.Group();
  group.name = "amplitude-bar-graph-group";

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  const heightScale = 2.4;
  const barWidth = numStates === 4 ? 0.72 : 0.42;
  const barDepth = 0.72;

  // Compute X spacing centered at 0
  const totalSpan = numStates === 4 ? 3.6 : 4.4;
  const stepX = totalSpan / (numStates - 1);
  const startX = -totalSpan / 2;

  // 1. Cybernetic Ground Grid at y = 0
  const groundGrid = new THREE.GridHelper(5.2, 10, 0x00f3ff, 0x1e293b);
  groundGrid.position.set(0, 0, 0);
  group.add(groundGrid);

  // 2. Amplitude Bars & Wireframe Edges
  const bars: THREE.Mesh[] = [];
  const barEdges: THREE.LineSegments[] = [];

  // Shared geometry instances for high rendering performance
  const sharedBoxGeo = new THREE.BoxGeometry(barWidth, 1.0, barDepth);
  const sharedEdgesGeo = new THREE.EdgesGeometry(sharedBoxGeo);
  geometries.push(sharedBoxGeo, sharedEdgesGeo);

  for (let i = 0; i < numStates; i++) {
    const x = startX + i * stepX;
    const isInitialTarget = i === initialTargetIndex;
    const barMat = new THREE.MeshBasicMaterial({
      color: isInitialTarget ? 0x00f3ff : 0x38bdf8,
      transparent: true,
      opacity: 0.85,
      depthWrite: true,
    });
    materials.push(barMat);

    const barMesh = new THREE.Mesh(sharedBoxGeo, barMat);
    barMesh.position.set(x, 0.6, 0);
    barMesh.scale.set(1, 1.2, 1);
    barMesh.name = `amplitude-bar-${i}`;
    barMesh.userData = {
      spatialId: "grover-amplitude-bar",
      stateIndex: i,
      label: numStates === 4 ? BASIS_LABELS_4[i] : BASIS_LABELS_8[i],
    };
    group.add(barMesh);
    bars.push(barMesh);

    // Wireframe edges for high-tech holographic appearance
    const edgesMat = new THREE.LineBasicMaterial({
      color: isInitialTarget ? 0xffffff : 0x00f3ff,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });
    materials.push(edgesMat);

    const edges = new THREE.LineSegments(sharedEdgesGeo, edgesMat);
    edges.position.copy(barMesh.position);
    edges.scale.copy(barMesh.scale);
    group.add(edges);
    barEdges.push(edges);
  }

  // 3. Floating Mean Reflection Plane
  const planeWidth = totalSpan + 1.2;
  const planeDepth = 2.0;
  const planeGeo = new THREE.PlaneGeometry(planeWidth, planeDepth);
  planeGeo.rotateX(-Math.PI / 2);
  geometries.push(planeGeo);

  const planeMat = new THREE.MeshBasicMaterial({
    color: 0x00f3ff,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  materials.push(planeMat);

  const meanPlane = new THREE.Mesh(planeGeo, planeMat);
  meanPlane.position.set(0, 0.5 * heightScale, 0);
  meanPlane.name = "mean-reflection-plane-mesh";
  meanPlane.userData = { spatialId: "mean-reflection-plane" };
  group.add(meanPlane);

  // Perimeter wire for mean plane
  const perimeterPoints = [
    new THREE.Vector3(-planeWidth / 2, 0, -planeDepth / 2),
    new THREE.Vector3(planeWidth / 2, 0, -planeDepth / 2),
    new THREE.Vector3(planeWidth / 2, 0, planeDepth / 2),
    new THREE.Vector3(-planeWidth / 2, 0, planeDepth / 2),
    new THREE.Vector3(-planeWidth / 2, 0, -planeDepth / 2),
  ];
  const perimeterGeo = new THREE.BufferGeometry().setFromPoints(perimeterPoints);
  geometries.push(perimeterGeo);
  const perimeterMat = new THREE.LineBasicMaterial({
    color: 0x00f3ff,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
  });
  materials.push(perimeterMat);

  const meanPerimeter = new THREE.Line(perimeterGeo, perimeterMat);
  meanPerimeter.position.copy(meanPlane.position);
  group.add(meanPerimeter);

  // Pulse bounce effect variable
  let bounceEnergy = 0;

  const triggerBouncePulse = () => {
    bounceEnergy = 1.0;
  };

  /**
   * Updates bar heights, positions, mean plane altitude, and color dynamics
   */
  const update = (
    dt: number,
    displayedAmplitudes: readonly number[],
    targetIndex: number,
    isTargetMarked: boolean
  ) => {
    if (bounceEnergy > 0) {
      bounceEnergy = Math.max(0, bounceEnergy - dt * 2.5);
    }

    const mean = computeMeanAmplitude(displayedAmplitudes);
    const targetMeanY = mean * heightScale;

    // Smoothly glide mean plane
    meanPlane.position.y += (targetMeanY - meanPlane.position.y) * Math.min(1, dt * 10);
    meanPerimeter.position.y = meanPlane.position.y;

    // Adjust mean plane color/opacity during bounce
    if (bounceEnergy > 0) {
      planeMat.opacity = 0.22 + bounceEnergy * 0.35;
      perimeterMat.color.setHex(0xa855f7); // purple pulse on reflection
    } else {
      planeMat.opacity = isTargetMarked ? 0.28 : 0.2;
      perimeterMat.color.setHex(isTargetMarked ? 0x00f3ff : 0x38bdf8);
    }

    // Update each state bar
    for (let i = 0; i < numStates; i++) {
      const amp = displayedAmplitudes[i] ?? 0;
      const targetHeight = amp * heightScale;
      const absHeight = Math.max(0.04, Math.abs(targetHeight));
      const targetCenterY = targetHeight / 2;

      const bar = bars[i];
      const edges = barEdges[i];

      // Lerp position Y and scale Y
      bar.position.y += (targetCenterY - bar.position.y) * Math.min(1, dt * 12);
      bar.scale.y += (absHeight - bar.scale.y) * Math.min(1, dt * 12);

      edges.position.copy(bar.position);
      edges.scale.copy(bar.scale);

      const isTarget = i === targetIndex;
      const barMat = materials[i] as THREE.MeshBasicMaterial;

      if (isTarget) {
        if (amp < -0.05) {
          // Negative amplitude (inverted below zero by Oracle)
          barMat.color.setHex(0xf59e0b); // Neon Amber
          barMat.opacity = 0.95;
        } else if (amp > 0.8) {
          // Amplified state (high probability)
          barMat.color.setHex(0x10b981); // Emerald
          barMat.opacity = 0.95;
        } else {
          // Normal target
          barMat.color.setHex(0x00f3ff); // Neon Cyan
          barMat.opacity = 0.9;
        }
      } else {
        // Non-target state
        if (Math.abs(amp) < 0.1) {
          barMat.color.setHex(0x1e293b); // Muted dark slate
          barMat.opacity = 0.35;
        } else {
          barMat.color.setHex(0x38bdf8); // Sky blue
          barMat.opacity = 0.65;
        }
      }
    }
  };

  const dispose = () => {
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
  };

  return {
    group,
    bars,
    barEdges,
    meanPlane,
    meanPerimeter,
    groundGrid,
    update,
    triggerBouncePulse,
    dispose,
  };
}
