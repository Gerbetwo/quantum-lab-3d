import * as THREE from 'three';

export interface TargetZoneMesh {
  mesh: THREE.Mesh;
  targetVector: THREE.Vector3;
  updateAlignment: (isAligned: boolean) => void;
  dispose: () => void;
}

export interface BarTargetZoneMesh {
  group: THREE.Group;
  boxMesh: THREE.Mesh;
  updateAlignment: (isAligned: boolean) => void;
  dispose: () => void;
}

/**
 * Computes a unit vector from spherical angles (θ ∈ [0, π], φ ∈ [0, 2π]).
 */
export function computeSphericalVector(theta: number, phi: number): THREE.Vector3 {
  const sinT = Math.sin(theta);
  return new THREE.Vector3(
    sinT * Math.cos(phi),
    Math.cos(theta),
    sinT * Math.sin(phi)
  );
}

/**
 * Creates a translucent 3D spherical target patch on the surface of a Bloch sphere.
 */
export function createBlochTargetZoneMesh(
  targetTheta: number,
  targetPhi: number,
  radius = 1.3,
  angularRadius = 0.32,
  defaultColor = 0x00f0ff,
  alignedColor = 0x10b981
): TargetZoneMesh {
  const dir = computeSphericalVector(targetTheta, targetPhi);
  const targetPos = dir.clone().multiplyScalar(radius);

  const diskRadius = radius * Math.sin(angularRadius);
  const geometry = new THREE.RingGeometry(diskRadius * 0.15, diskRadius, 32);
  const material = new THREE.MeshBasicMaterial({
    color: defaultColor,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(targetPos);
  mesh.lookAt(targetPos.clone().add(dir));
  mesh.name = 'bloch-target-zone';

  const updateAlignment = (isAligned: boolean) => {
    material.color.setHex(isAligned ? alignedColor : defaultColor);
    material.opacity = isAligned ? 0.75 : 0.35;
    mesh.scale.setScalar(isAligned ? 1.15 : 1.0);
  };

  const dispose = () => {
    geometry.dispose();
    material.dispose();
  };

  return {
    mesh,
    targetVector: dir,
    updateAlignment,
    dispose,
  };
}

/**
 * Creates a translucent 3D target bounding volume floating above a bar in an amplitude bar graph.
 */
export function createBarTargetZoneMesh(
  x: number,
  targetHeight: number,
  width = 0.75,
  depth = 0.75,
  defaultColor = 0x00f0ff,
  alignedColor = 0x10b981
): BarTargetZoneMesh {
  const group = new THREE.Group();

  const boxGeo = new THREE.BoxGeometry(width, 0.35, depth);
  const boxMat = new THREE.MeshBasicMaterial({
    color: defaultColor,
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
  });
  const boxMesh = new THREE.Mesh(boxGeo, boxMat);
  boxMesh.position.set(x, targetHeight, 0);

  const edgeGeo = new THREE.EdgesGeometry(boxGeo);
  const edgeMat = new THREE.LineBasicMaterial({
    color: defaultColor,
    transparent: true,
    opacity: 0.7,
  });
  const edgeLine = new THREE.LineSegments(edgeGeo, edgeMat);
  edgeLine.position.copy(boxMesh.position);

  group.add(boxMesh);
  group.add(edgeLine);
  group.name = 'bar-target-zone';

  const updateAlignment = (isAligned: boolean) => {
    boxMat.color.setHex(isAligned ? alignedColor : defaultColor);
    edgeMat.color.setHex(isAligned ? alignedColor : defaultColor);
    boxMat.opacity = isAligned ? 0.75 : 0.35;
    edgeMat.opacity = isAligned ? 0.95 : 0.7;
    group.scale.setScalar(isAligned ? 1.08 : 1.0);
  };

  const dispose = () => {
    boxGeo.dispose();
    boxMat.dispose();
    edgeGeo.dispose();
    edgeMat.dispose();
  };

  return {
    group,
    boxMesh,
    updateAlignment,
    dispose,
  };
}

/**
 * Checks whether a 3D state vector lies within the spatial threshold of a target zone.
 * Supports:
 * - isVectorInBlochTarget(stateVector: THREE.Vector3, targetCenter: THREE.Vector3, thresholdRad?: number)
 * - isVectorInBlochTarget(currentTheta: number, currentPhi: number, targetTheta: number, targetPhi: number, thresholdRad?: number)
 */
export function isVectorInBlochTarget(
  arg1: number | THREE.Vector3,
  arg2: number | THREE.Vector3 = 0,
  arg3: number = 0.35,
  arg4?: number,
  arg5 = 0.35
): boolean {
  if (arg1 instanceof THREE.Vector3 && arg2 instanceof THREE.Vector3) {
    const vCurr = arg1.clone().normalize();
    const vTarg = arg2.clone().normalize();
    const thresholdRad = typeof arg3 === 'number' ? arg3 : 0.35;
    const dot = Math.max(-1, Math.min(1, vCurr.dot(vTarg)));
    return dot >= Math.cos(thresholdRad);
  }

  const currentTheta = typeof arg1 === 'number' ? arg1 : 0;
  const currentPhi = typeof arg2 === 'number' ? arg2 : 0;
  const targetTheta = typeof arg3 === 'number' ? arg3 : 0;
  const targetPhi = typeof arg4 === 'number' ? arg4 : 0;
  const thresholdRad = typeof arg5 === 'number' ? arg5 : 0.35;

  const vCurr = computeSphericalVector(currentTheta, currentPhi);
  const vTarg = computeSphericalVector(targetTheta, targetPhi);
  const dot = Math.max(-1, Math.min(1, vCurr.dot(vTarg)));
  return dot >= Math.cos(thresholdRad);
}

/**
 * Checks whether a phase angle lies within an angular target sector on the phase disk.
 */
export function isPhaseInTargetSector(
  currentPhi: number,
  targetPhi: number,
  thresholdRad = 0.35
): boolean {
  let diff = Math.abs(currentPhi - targetPhi) % (2 * Math.PI);
  if (diff > Math.PI) {
    diff = 2 * Math.PI - diff;
  }
  return diff <= thresholdRad;
}

/**
 * Checks whether an amplitude bar has grown into its spatial 3D target volume.
 */
export function isBarInTargetZone(
  barHeight: number,
  minHeightThreshold = 1.4
): boolean {
  return barHeight >= minHeightThreshold;
}
