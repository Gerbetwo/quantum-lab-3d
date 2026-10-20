"use client";

import * as THREE from "three";

/**
 * Calculates Born probabilities for a single-qubit state given polar angle θ.
 * Invariant: P₀ = cos²(θ/2), P₁ = sin²(θ/2), P₀ + P₁ = 1
 */
export function computeBornProbabilities(theta: number): { p0: number; p1: number } {
  const safeTheta = Number.isFinite(theta) ? theta : 0;
  const alpha = Math.cos(safeTheta / 2);
  const beta = Math.sin(safeTheta / 2);
  const p0 = alpha * alpha;
  const p1 = beta * beta;
  return { p0, p1 };
}

export interface ChamberGroupResult {
  group: THREE.Group;
  chamberMesh: THREE.Mesh;
  emitterNorth: THREE.Mesh;
  emitterSouth: THREE.Mesh;
  struts: THREE.LineSegments;
  dispose: () => void;
}

/**
 * Creates the 3D measurement chamber enclosure surrounding the Bloch sphere.
 */
export function createMeasurementChamberGroup(radius = 1.45): ChamberGroupResult {
  const group = new THREE.Group();
  group.name = "measurement-chamber-group";

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  // 1. Transparent octagonal containment cylinder
  const cylinderGeo = new THREE.CylinderGeometry(radius, radius, radius * 2.1, 8, 1, true);
  geometries.push(cylinderGeo);
  const cylinderMat = new THREE.MeshBasicMaterial({
    color: 0x00f3ff,
    wireframe: true,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
  });
  materials.push(cylinderMat);

  const chamberMesh = new THREE.Mesh(cylinderGeo, cylinderMat);
  chamberMesh.name = "measurement-chamber-cage";
  chamberMesh.userData = { spatialId: "measurement-chamber" };
  group.add(chamberMesh);

  // 2. Chamber structural struts (8 vertical cage rails)
  const strutPoints: THREE.Vector3[] = [];
  const halfH = (radius * 2.1) / 2;
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    strutPoints.push(new THREE.Vector3(x, -halfH, z), new THREE.Vector3(x, halfH, z));
  }
  const strutsGeo = new THREE.BufferGeometry().setFromPoints(strutPoints);
  geometries.push(strutsGeo);
  const strutsMat = new THREE.LineBasicMaterial({
    color: 0x00f3ff,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  materials.push(strutsMat);

  const struts = new THREE.LineSegments(strutsGeo, strutsMat);
  group.add(struts);

  // 3. Emitter Coils at North (|0⟩) and South (|1⟩) poles
  const emitterGeo = new THREE.TorusGeometry(0.35, 0.03, 16, 32);
  geometries.push(emitterGeo);

  const emitterMatNorth = new THREE.MeshBasicMaterial({
    color: 0x00f3ff,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
  });
  materials.push(emitterMatNorth);
  const emitterNorth = new THREE.Mesh(emitterGeo, emitterMatNorth);
  emitterNorth.rotation.x = Math.PI / 2;
  emitterNorth.position.set(0, halfH, 0);
  emitterNorth.name = "emitter-north";
  emitterNorth.userData = { spatialId: "measurement-chamber", pole: "north" };
  group.add(emitterNorth);

  const emitterMatSouth = new THREE.MeshBasicMaterial({
    color: 0xa855f7,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
  });
  materials.push(emitterMatSouth);
  const emitterSouth = new THREE.Mesh(emitterGeo, emitterMatSouth);
  emitterSouth.rotation.x = Math.PI / 2;
  emitterSouth.position.set(0, -halfH, 0);
  emitterSouth.name = "emitter-south";
  emitterSouth.userData = { spatialId: "measurement-chamber", pole: "south" };
  group.add(emitterSouth);

  const dispose = () => {
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
  };

  return { group, chamberMesh, emitterNorth, emitterSouth, struts, dispose };
}

export interface PoleDensityRingsResult {
  group: THREE.Group;
  ringNorth: THREE.Mesh;
  ringSouth: THREE.Mesh;
  update: (theta: number) => void;
  dispose: () => void;
}

/**
 * Creates dynamic probability density rings at North (|0⟩) and South (|1⟩) poles.
 * Scales dynamically according to P₀ = cos²(θ/2) and P₁ = sin²(θ/2).
 */
export function createPoleDensityRingsGroup(poleY = 1.34): PoleDensityRingsResult {
  const group = new THREE.Group();
  group.name = "pole-probability-rings-group";

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  // Base geometry for density discs
  const ringGeo = new THREE.RingGeometry(0.04, 0.42, 48);
  geometries.push(ringGeo);

  // North pole ring (|0⟩, cyan)
  const matNorth = new THREE.MeshBasicMaterial({
    color: 0x00f3ff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });
  materials.push(matNorth);
  const ringNorth = new THREE.Mesh(ringGeo, matNorth);
  ringNorth.rotation.x = Math.PI / 2;
  ringNorth.position.set(0, poleY, 0);
  ringNorth.name = "pole-density-ring-north";
  ringNorth.userData = { spatialId: "probability-p0", basis: "|0⟩" };
  group.add(ringNorth);

  // South pole ring (|1⟩, purple)
  const matSouth = new THREE.MeshBasicMaterial({
    color: 0xa855f7,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });
  materials.push(matSouth);
  const ringSouth = new THREE.Mesh(ringGeo, matSouth);
  ringSouth.rotation.x = Math.PI / 2;
  ringSouth.position.set(0, -poleY, 0);
  ringSouth.name = "pole-density-ring-south";
  ringSouth.userData = { spatialId: "probability-p1", basis: "|1⟩" };
  group.add(ringSouth);

  const update = (theta: number) => {
    const { p0, p1 } = computeBornProbabilities(theta);

    // North ring scale & opacity
    const scale0 = Math.max(0.05, Math.sqrt(p0));
    ringNorth.scale.set(scale0, scale0, scale0);
    matNorth.opacity = Math.max(0.12, p0 * 0.85);

    // South ring scale & opacity
    const scale1 = Math.max(0.05, Math.sqrt(p1));
    ringSouth.scale.set(scale1, scale1, scale1);
    matSouth.opacity = Math.max(0.12, p1 * 0.85);
  };

  const dispose = () => {
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
  };

  return { group, ringNorth, ringSouth, update, dispose };
}

export interface CollapseRaySystemResult {
  group: THREE.Group;
  triggerRay: (outcome: 0 | 1, onComplete?: () => void) => void;
  update: (dt: number) => void;
  dispose: () => void;
}

/**
 * Creates an animated projectile collapse ray system snapping the vector to |0⟩ or |1⟩.
 */
export function createCollapseRaySystem(poleY = 1.34, emitterY = 1.52): CollapseRaySystemResult {
  const group = new THREE.Group();
  group.name = "collapse-ray-system";

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  // Projectile laser beam line
  const beamGeo = new THREE.BufferGeometry();
  const beamPositions = new Float32Array(6);
  beamGeo.setAttribute("position", new THREE.BufferAttribute(beamPositions, 3));
  geometries.push(beamGeo);

  const beamMat = new THREE.LineBasicMaterial({
    color: 0x00f3ff,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
  });
  materials.push(beamMat);

  const beamLine = new THREE.Line(beamGeo, beamMat);
  beamLine.name = "collapse-beam-line";
  beamLine.userData = { spatialId: "collapse-ray" };
  group.add(beamLine);

  // Impact flash shockwave ring
  const impactGeo = new THREE.RingGeometry(0.05, 0.45, 32);
  geometries.push(impactGeo);

  const impactMat = new THREE.MeshBasicMaterial({
    color: 0x00f3ff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
  });
  materials.push(impactMat);

  const impactRing = new THREE.Mesh(impactGeo, impactMat);
  impactRing.rotation.x = Math.PI / 2;
  impactRing.name = "collapse-impact-ring";
  group.add(impactRing);

  let isAnimating = false;
  let elapsed = 0;
  const duration = 0.45; // seconds
  let activeOutcome: 0 | 1 = 0;
  let onFinishCallback: (() => void) | undefined;

  const triggerRay = (outcome: 0 | 1, onComplete?: () => void) => {
    isAnimating = true;
    elapsed = 0;
    activeOutcome = outcome;
    onFinishCallback = onComplete;

    const colorHex = outcome === 0 ? 0x00f3ff : 0xa855f7;
    beamMat.color.setHex(colorHex);
    impactMat.color.setHex(colorHex);
    beamMat.opacity = 0.95;
    impactMat.opacity = 0.0;

    const targetY = outcome === 0 ? poleY : -poleY;
    impactRing.position.set(0, targetY, 0);
    impactRing.scale.set(0.1, 0.1, 0.1);
  };

  const update = (dt: number) => {
    if (!isAnimating) return;
    elapsed += dt;
    const progress = Math.min(elapsed / duration, 1.0);

    const startY = activeOutcome === 0 ? emitterY : -emitterY;
    const targetY = activeOutcome === 0 ? poleY : -poleY;

    // Linear progress for beam head
    const currentTipY = THREE.MathUtils.lerp(startY, targetY, Math.min(progress * 1.5, 1.0));

    const pos = beamGeo.attributes.position.array as Float32Array;
    pos[0] = 0;
    pos[1] = startY;
    pos[2] = 0;
    pos[3] = 0;
    pos[4] = currentTipY;
    pos[5] = 0;
    beamGeo.attributes.position.needsUpdate = true;

    // Beam opacity fade out in second half
    if (progress > 0.6) {
      beamMat.opacity = 1.0 - (progress - 0.6) / 0.4;
    }

    // Impact shockwave ring pulse
    if (progress > 0.4) {
      const impactT = (progress - 0.4) / 0.6;
      const ringScale = THREE.MathUtils.lerp(0.2, 1.35, impactT);
      impactRing.scale.set(ringScale, ringScale, ringScale);
      impactMat.opacity = (1.0 - impactT) * 0.9;
    }

    if (progress >= 1.0) {
      isAnimating = false;
      beamMat.opacity = 0.0;
      impactMat.opacity = 0.0;
      onFinishCallback?.();
      onFinishCallback = undefined;
    }
  };

  const dispose = () => {
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
  };

  return { group, triggerRay, update, dispose };
}

export interface SamplingHistogramResult {
  group: THREE.Group;
  bar0: THREE.Mesh;
  bar1: THREE.Mesh;
  targetLine0: THREE.Line;
  targetLine1: THREE.Line;
  updateCounts: (n0: number, n1: number, p0: number, p1: number) => void;
  dispose: () => void;
}

/**
 * Creates the 3D sampling histogram columns visualizing empirical shot statistics vs Born predictions.
 */
export function createSamplingHistogram3D(
  position = new THREE.Vector3(2.2, -0.6, 0)
): SamplingHistogramResult {
  const group = new THREE.Group();
  group.name = "sampling-histogram-3d";
  group.position.copy(position);

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  const maxHeight = 1.2;
  const barWidth = 0.28;

  // 1. Base pedestal plate
  const baseGeo = new THREE.BoxGeometry(0.9, 0.04, 0.4);
  geometries.push(baseGeo);
  const baseMat = new THREE.MeshBasicMaterial({
    color: 0x1f2937,
    transparent: true,
    opacity: 0.75,
  });
  materials.push(baseMat);
  const baseMesh = new THREE.Mesh(baseGeo, baseMat);
  baseMesh.name = "histogram-base";
  baseMesh.userData = { spatialId: "histogram-3d" };
  group.add(baseMesh);

  // 2. Bar 0 (|0⟩, Cyan)
  const bar0Geo = new THREE.BoxGeometry(barWidth, 1, barWidth);
  geometries.push(bar0Geo);
  const bar0Mat = new THREE.MeshBasicMaterial({
    color: 0x00f3ff,
    transparent: true,
    opacity: 0.75,
  });
  materials.push(bar0Mat);
  const bar0 = new THREE.Mesh(bar0Geo, bar0Mat);
  bar0.position.set(-0.22, 0.02, 0);
  bar0.scale.set(1, 0.001, 1);
  bar0.name = "histogram-bar-0";
  bar0.userData = { spatialId: "histogram-3d", outcome: 0 };
  group.add(bar0);

  // 3. Bar 1 (|1⟩, Purple)
  const bar1Geo = new THREE.BoxGeometry(barWidth, 1, barWidth);
  geometries.push(bar1Geo);
  const bar1Mat = new THREE.MeshBasicMaterial({
    color: 0xa855f7,
    transparent: true,
    opacity: 0.75,
  });
  materials.push(bar1Mat);
  const bar1 = new THREE.Mesh(bar1Geo, bar1Mat);
  bar1.position.set(0.22, 0.02, 0);
  bar1.scale.set(1, 0.001, 1);
  bar1.name = "histogram-bar-1";
  bar1.userData = { spatialId: "histogram-3d", outcome: 1 };
  group.add(bar1);

  // 4. Target lines for theoretical Born probabilities
  const makeTargetLine = (xPos: number, colorHex: number) => {
    const pts = [
      new THREE.Vector3(xPos - barWidth * 0.7, 0, barWidth * 0.6),
      new THREE.Vector3(xPos + barWidth * 0.7, 0, barWidth * 0.6),
    ];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    geometries.push(geo);
    const mat = new THREE.LineBasicMaterial({ color: colorHex, depthWrite: false });
    materials.push(mat);
    const line = new THREE.Line(geo, mat);
    line.position.y = 0.02;
    group.add(line);
    return line;
  };

  const targetLine0 = makeTargetLine(-0.22, 0xffffff);
  const targetLine1 = makeTargetLine(0.22, 0xffffff);

  const updateCounts = (n0: number, n1: number, p0: number, p1: number) => {
    const total = n0 + n1;
    const f0 = total > 0 ? n0 / total : 0;
    const f1 = total > 0 ? n1 / total : 0;

    const h0 = Math.max(0.001, f0 * maxHeight);
    const h1 = Math.max(0.001, f1 * maxHeight);

    bar0.scale.y = h0;
    bar0.position.y = 0.02 + h0 / 2;

    bar1.scale.y = h1;
    bar1.position.y = 0.02 + h1 / 2;

    targetLine0.position.y = 0.02 + p0 * maxHeight;
    targetLine1.position.y = 0.02 + p1 * maxHeight;
  };

  const dispose = () => {
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
  };

  return { group, bar0, bar1, targetLine0, targetLine1, updateCounts, dispose };
}
