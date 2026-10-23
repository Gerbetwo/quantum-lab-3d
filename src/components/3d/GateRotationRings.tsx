'use client';

import * as THREE from 'three';

export interface GateRingSpec {
  gate: string;
  axis: THREE.Vector3;
  colorHex: number;
  spatialId: string;
  label: string;
}

export const GATE_RING_SPECS: GateRingSpec[] = [
  {
    gate: 'X',
    axis: new THREE.Vector3(1, 0, 0),
    colorHex: 0x00f0ff, // Neon cyan
    spatialId: 'gate-axis-x',
    label: 'Pauli-X (π around X)',
  },
  {
    gate: 'Y',
    axis: new THREE.Vector3(0, 1, 0),
    colorHex: 0x10b981, // Emerald green
    spatialId: 'gate-axis-y',
    label: 'Pauli-Y (π around Y)',
  },
  {
    gate: 'Z',
    axis: new THREE.Vector3(0, 0, 1),
    colorHex: 0xa855f7, // Quantum purple
    spatialId: 'gate-axis-z',
    label: 'Pauli-Z (π around Z)',
  },
  {
    gate: 'H',
    axis: new THREE.Vector3(1 / Math.SQRT2, 0, 1 / Math.SQRT2).normalize(),
    colorHex: 0xf59e0b, // Amber / gold
    spatialId: 'gate-axis-h',
    label: 'Hadamard (π around (X+Z)/√2)',
  },
];

/**
 * Returns the 3D unit rotation axis for standard single-qubit gates.
 * H axis is explicitly (X + Z)/√2.
 */
export function getGateRotationAxis(gate: string): THREE.Vector3 {
  switch (gate.toUpperCase()) {
    case 'X':
      return new THREE.Vector3(1, 0, 0);
    case 'Y':
      return new THREE.Vector3(0, 1, 0);
    case 'Z':
    case 'S':
    case 'T':
      return new THREE.Vector3(0, 0, 1);
    case 'H':
      return new THREE.Vector3(1 / Math.SQRT2, 0, 1 / Math.SQRT2).normalize();
    default:
      return new THREE.Vector3(0, 1, 0);
  }
}

/**
 * Spherical linear interpolation between two unit vectors.
 */
export function slerpUnitVectors(v1: THREE.Vector3, v2: THREE.Vector3, t: number): THREE.Vector3 {
  const dot = Math.max(-1, Math.min(1, v1.dot(v2)));
  if (dot > 0.999999) return v1.clone().lerp(v2, t).normalize();
  if (dot < -0.999999) {
    const ortho = Math.abs(v1.x) < 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1);
    const axis = new THREE.Vector3().crossVectors(v1, ortho).normalize();
    return v1.clone().applyQuaternion(new THREE.Quaternion().setFromAxisAngle(axis, Math.PI * t));
  }
  const omega = Math.acos(dot);
  const sinO = Math.sin(omega);
  return new THREE.Vector3(
    v1.x * (Math.sin((1 - t) * omega) / sinO) + v2.x * (Math.sin(t * omega) / sinO),
    v1.y * (Math.sin((1 - t) * omega) / sinO) + v2.y * (Math.sin(t * omega) / sinO),
    v1.z * (Math.sin((1 - t) * omega) / sinO) + v2.z * (Math.sin(t * omega) / sinO)
  ).normalize();
}

/**
 * Computes sampled 3D points along a great-circle geodesic curve between two vectors on a sphere.
 */
export function computeGeodesicArcPoints(
  start: THREE.Vector3,
  target: THREE.Vector3,
  segments = 32,
  radius = 1.3
): THREE.Vector3[] {
  const uStart = start.clone().normalize();
  const uTarget = target.clone().normalize();
  const dot = Math.max(-1, Math.min(1, uStart.dot(uTarget)));

  if (dot > 0.9999) {
    return [uStart.multiplyScalar(radius)];
  }

  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const s = i / segments;
    const pt = slerpUnitVectors(uStart, uTarget, s).multiplyScalar(radius);
    points.push(pt);
  }
  return points;
}

/**
 * Creates 3D rotation rings group for X, Y, Z, and H.
 * Implements full disposal of geometries and materials on unmount.
 */
export function createGateRingsGroup(radius = 1.33): {
  group: THREE.Group;
  rings: Record<string, THREE.Mesh>;
  dispose: () => void;
} {
  const group = new THREE.Group();
  group.name = 'gate-rotation-rings-group';
  const rings: Record<string, THREE.Mesh> = {};
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  const baseNormal = new THREE.Vector3(0, 1, 0);

  GATE_RING_SPECS.forEach((spec) => {
    const torusGeo = new THREE.TorusGeometry(radius, 0.012, 16, 64);
    const torusMat = new THREE.MeshBasicMaterial({
      color: spec.colorHex,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    geometries.push(torusGeo);
    materials.push(torusMat);

    const ringMesh = new THREE.Mesh(torusGeo, torusMat);
    ringMesh.quaternion.setFromUnitVectors(baseNormal, spec.axis);
    ringMesh.name = `gate-ring-${spec.gate.toLowerCase()}`;
    ringMesh.userData = { gate: spec.gate, spatialId: spec.spatialId, spec };

    group.add(ringMesh);
    rings[spec.gate] = ringMesh;
  });

  const dispose = () => {
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
  };

  return { group, rings, dispose };
}

/**
 * Creates a particle arc system that flows along geodesic trajectories during gate application.
 */
export function createGeodesicParticleSystem(maxParticles = 80, radius = 1.3): {
  mesh: THREE.InstancedMesh;
  guideLine: THREE.Line;
  triggerArc: (startDir: THREE.Vector3, targetDir: THREE.Vector3, colorHex?: number) => void;
  update: (dt: number) => void;
  dispose: () => void;
} {
  const pGeo = new THREE.IcosahedronGeometry(0.024, 0);
  const pMat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
  });
  const mesh = new THREE.InstancedMesh(pGeo, pMat, maxParticles);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.count = 0;
  mesh.frustumCulled = false;

  const guideGeo = new THREE.BufferGeometry();
  const guidePositions = new Float32Array(33 * 3);
  guideGeo.setAttribute('position', new THREE.BufferAttribute(guidePositions, 3));
  const guideMat = new THREE.LineBasicMaterial({
    color: 0x00f0ff,
    transparent: true,
    opacity: 0.0,
    depthWrite: false,
  });
  const guideLine = new THREE.Line(guideGeo, guideMat);

  const zeroM = new THREE.Matrix4().makeScale(0.0001, 0.0001, 0.0001);
  for (let i = 0; i < maxParticles; i++) {
    mesh.setMatrixAt(i, zeroM);
  }
  mesh.instanceMatrix.needsUpdate = true;

  let isAnimating = false;
  let elapsed = 0;
  const duration = 0.65;
  let arcPoints: THREE.Vector3[] = [];

  const scratchPos = new THREE.Vector3();
  const scratchMat4 = new THREE.Matrix4();
  const scratchQuat = new THREE.Quaternion();
  const scratchScale = new THREE.Vector3();

  const triggerArc = (startDir: THREE.Vector3, targetDir: THREE.Vector3, colorHex = 0x00f0ff) => {
    pMat.color.setHex(colorHex);
    guideMat.color.setHex(colorHex);
    guideMat.opacity = 0.65;

    arcPoints = computeGeodesicArcPoints(startDir, targetDir, 32, radius);

    const posAttr = guideGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < arcPoints.length; i++) {
      posAttr.setXYZ(i, arcPoints[i].x, arcPoints[i].y, arcPoints[i].z);
    }
    posAttr.needsUpdate = true;

    elapsed = 0;
    isAnimating = true;
    mesh.count = maxParticles;
  };

  const update = (dt: number) => {
    if (!isAnimating || arcPoints.length < 2) return;

    elapsed += dt;
    const progress = Math.min(1, elapsed / duration);
    guideMat.opacity = Math.max(0, 0.65 * (1 - progress));

    const totalPoints = arcPoints.length;
    for (let i = 0; i < maxParticles; i++) {
      const offset = (i / maxParticles) * 0.45;
      const particleProgress = Math.max(0, Math.min(1, progress * 1.45 - offset));

      const sampleIdx = Math.min(totalPoints - 1, Math.floor(particleProgress * (totalPoints - 1)));
      const nextIdx = Math.min(totalPoints - 1, sampleIdx + 1);
      const frac = (particleProgress * (totalPoints - 1)) % 1;

      scratchPos.lerpVectors(arcPoints[sampleIdx], arcPoints[nextIdx], frac);
      const scaleFactor = Math.sin(particleProgress * Math.PI) * Math.max(0.1, 1 - progress * 0.5);
      scratchScale.set(scaleFactor, scaleFactor, scaleFactor);
      scratchMat4.compose(scratchPos, scratchQuat, scratchScale);

      mesh.setMatrixAt(i, scratchMat4);
    }
    mesh.instanceMatrix.needsUpdate = true;

    if (progress >= 1) {
      isAnimating = false;
      mesh.count = 0;
    }
  };

  const dispose = () => {
    pGeo.dispose();
    pMat.dispose();
    guideGeo.dispose();
    guideMat.dispose();
  };

  return { mesh, guideLine, triggerArc, update, dispose };
}

export default createGateRingsGroup;
