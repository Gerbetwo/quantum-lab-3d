import * as THREE from "three";
import { computeSphericalVector } from "@/features/quantum-core/blochSceneObjects";

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
 * Creates a translucent 3D spherical target patch directly on the surface of a Bloch sphere.
 */
export function createBlochTargetZoneMesh(
  targetTheta: number,
  targetPhi: number,
  radius = 1.3,
  angularRadius = 0.32,
  defaultColor = 0x00f3ff,
  alignedColor = 0x10b981
): TargetZoneMesh {
  const dir = computeSphericalVector(targetTheta, targetPhi);
  const targetPos = dir.clone().multiplyScalar(radius);

  // Geometry: circular ring/disc tangent to sphere surface at target position
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
  mesh.name = "bloch-target-zone";

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
  defaultColor = 0x00f3ff,
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
  group.name = "bar-target-zone";

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
 * Uses dot product between unit vectors: cos(angle) >= cos(thresholdRad).
 */
export function isVectorInBlochTarget(
  currentTheta: number,
  currentPhi: number,
  targetTheta: number,
  targetPhi: number,
  thresholdRad = 0.35
): boolean {
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
