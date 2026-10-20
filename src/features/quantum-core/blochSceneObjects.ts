/**
 * Pure Three.js Scene Builders & Visual Object Pools
 * Framework-agnostic: Zero React hooks, zero DOM bindings.
 */

import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';

export interface BaseSceneContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
}

export function createBaseScene(container: HTMLElement): BaseSceneContext {
  const scene = new THREE.Scene();
  const width = container.clientWidth || 800;
  const height = container.clientHeight || 600;
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 0, 5);
  scene.add(new THREE.AmbientLight(0xffffff, 0.85));
  return { scene, camera };
}

export interface BlochSphereElements {
  sphere: THREE.Mesh;
  ring: THREE.Mesh;
  axes: THREE.LineSegments;
  arrowHelper: THREE.ArrowHelper;
  tipHandle: THREE.Mesh;
  polarArc: Line2;
  azimuthalLine: Line2;
  geometries: (THREE.BufferGeometry | LineGeometry)[];
  materials: (THREE.Material | LineMaterial)[];
}

export function computePolarArcPositions(
  theta: number,
  phi: number,
  radius = 1.3,
  segments = 32
): number[] {
  const clampedTheta = Math.max(0, Math.min(Math.PI, theta));
  const count = Math.max(2, Math.ceil(segments * (clampedTheta / Math.PI)));
  const positions: number[] = [];
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);

  for (let i = 0; i <= count; i++) {
    const t = (i / count) * clampedTheta;
    const x = radius * Math.sin(t) * cosPhi;
    const y = radius * Math.cos(t);
    const z = radius * Math.sin(t) * sinPhi;
    positions.push(x, y, z);
  }
  return positions;
}

export function updatePolarArc(
  arc: Line2,
  theta: number,
  phi: number,
  radius = 1.3
): void {
  const positions = computePolarArcPositions(theta, phi, radius);
  arc.geometry.setPositions(positions);
}

export function computeAzimuthalLinePositions(
  theta: number,
  phi: number,
  radius = 1.3
): number[] {
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const sinTheta = Math.sin(theta);
  const cosTheta = Math.cos(theta);

  // Origin -> Equator rim (direction phi) -> Equator projection -> Vector tip
  const p0 = [0, 0, 0];
  const p1 = [radius * cosPhi, 0, radius * sinPhi];
  const p2 = [radius * sinTheta * cosPhi, 0, radius * sinTheta * sinPhi];
  const p3 = [radius * sinTheta * cosPhi, radius * cosTheta, radius * sinTheta * sinPhi];

  return [...p0, ...p1, ...p2, ...p3];
}

export function updateAzimuthalLine(
  line: Line2,
  theta: number,
  phi: number,
  radius = 1.3
): void {
  const positions = computeAzimuthalLinePositions(theta, phi, radius);
  line.geometry.setPositions(positions);
}

export function createBlochSphereScene(): BlochSphereElements {
  const geometries: (THREE.BufferGeometry | LineGeometry)[] = [];
  const materials: (THREE.Material | LineMaterial)[] = [];

  const sphereGeo = new THREE.SphereGeometry(1.3, 32, 16);
  const sphereMat = new THREE.MeshBasicMaterial({
    color: 0x1e293b,
    wireframe: true,
    transparent: true,
    opacity: 0.15,
    depthWrite: false,
  });
  geometries.push(sphereGeo); materials.push(sphereMat);
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);

  const ringGeo = new THREE.RingGeometry(1.29, 1.31, 64);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x334155,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  geometries.push(ringGeo); materials.push(ringMat);
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;

  const axesGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-1.5, 0, 0), new THREE.Vector3(1.5, 0, 0),
    new THREE.Vector3(0, -1.5, 0), new THREE.Vector3(0, 1.5, 0),
    new THREE.Vector3(0, 0, -1.5), new THREE.Vector3(0, 0, 1.5),
  ]);
  const axesMat = new THREE.LineBasicMaterial({
    color: 0x334155,
    transparent: true,
    opacity: 0.30,
    depthWrite: false,
  });
  geometries.push(axesGeo); materials.push(axesMat);
  const axes = new THREE.LineSegments(axesGeo, axesMat);

  const arrowHelper = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 1.3, 0x00f3ff, 0.2, 0.08);

  const tipHandleGeo = new THREE.SphereGeometry(0.09, 16, 16);
  const tipHandleMat = new THREE.MeshBasicMaterial({
    color: 0x00f3ff,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
  });
  geometries.push(tipHandleGeo); materials.push(tipHandleMat);
  const tipHandle = new THREE.Mesh(tipHandleGeo, tipHandleMat);
  tipHandle.name = 'bloch-vector-tip-handle';
  tipHandle.position.set(0, 1.3, 0);

  const polarArcGeo = new LineGeometry();
  polarArcGeo.setPositions(computePolarArcPositions(0, 0, 1.3));
  const polarArcMat = new LineMaterial({
    color: 0x00f3ff,
    linewidth: 3,
    transparent: true,
    opacity: 0.90,
    depthWrite: false,
  });
  geometries.push(polarArcGeo); materials.push(polarArcMat);
  const polarArc = new Line2(polarArcGeo, polarArcMat);
  polarArc.name = 'bloch-polar-arc';

  const azimuthalGeo = new LineGeometry();
  azimuthalGeo.setPositions(computeAzimuthalLinePositions(0, 0, 1.3));
  const azimuthalMat = new LineMaterial({
    color: 0xffee00,
    linewidth: 4,
    transparent: true,
    opacity: 1.0,
    depthWrite: false,
  });
  geometries.push(azimuthalGeo); materials.push(azimuthalMat);
  const azimuthalLine = new Line2(azimuthalGeo, azimuthalMat);
  azimuthalLine.name = 'bloch-azimuthal-line';

  return { sphere, ring, axes, arrowHelper, tipHandle, polarArc, azimuthalLine, geometries, materials };
}

export function computeSphericalVector(theta: number, phi: number): THREE.Vector3 {
  const sT = Math.sin(theta);
  return new THREE.Vector3(sT * Math.cos(phi), Math.cos(theta), sT * Math.sin(phi)).normalize();
}

export function vectorToSphericalAngles(v: THREE.Vector3): { theta: number; phi: number } {
  const len = v.length();
  if (len < 1e-6) return { theta: 0, phi: 0 };
  const clampedY = Math.max(-1, Math.min(1, v.y / len));
  const theta = Math.acos(clampedY);
  let phi = Math.atan2(v.z, v.x);
  if (phi < 0) phi += 2 * Math.PI;
  return { theta, phi };
}

export function lerpSphericalAngles(
  current: { theta: number; phi: number },
  target: { theta: number; phi: number },
  factor: number
): { theta: number; phi: number } {
  const t = Math.max(0, Math.min(1, factor));
  const nextTheta = current.theta + (target.theta - current.theta) * t;

  let dPhi = target.phi - current.phi;
  while (dPhi > Math.PI) dPhi -= 2 * Math.PI;
  while (dPhi < -Math.PI) dPhi += 2 * Math.PI;
  const nextPhi = (current.phi + dPhi * t + 2 * Math.PI) % (2 * Math.PI);

  return { theta: nextTheta, phi: nextPhi };
}

export function updateBlochSphereUniforms(
  elements: BlochSphereElements,
  options: { sphereColor?: number; arrowColor?: number; opacity?: number; gridAlpha?: number } = {}
): void {
  const alpha = options.gridAlpha ?? options.opacity;
  if (options.sphereColor !== undefined && elements.sphere.material instanceof THREE.MeshBasicMaterial) {
    elements.sphere.material.color.setHex(options.sphereColor);
  }
  if (alpha !== undefined && elements.sphere.material instanceof THREE.MeshBasicMaterial) {
    elements.sphere.material.opacity = alpha;
  }
  if (options.arrowColor !== undefined) {
    elements.arrowHelper.setColor(options.arrowColor);
    if (elements.tipHandle.material instanceof THREE.MeshBasicMaterial) {
      elements.tipHandle.material.color.setHex(options.arrowColor);
    }
  }
}


export interface ParticlePool {
  mesh: THREE.InstancedMesh;
  maxInstances: number;
  positions: Float32Array;
  velocities: Float32Array;
  ages: Float32Array;
  lifetimes: Float32Array;
  aliveCount: number;
}

export function createParticlePool(maxInstances = 300): ParticlePool {
  const geo = new THREE.IcosahedronGeometry(0.04, 0);
  const mat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, transparent: true, opacity: 0.85 });
  const mesh = new THREE.InstancedMesh(geo, mat, maxInstances);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.count = 0;
  mesh.frustumCulled = false;

  const positions = new Float32Array(maxInstances * 3);
  const velocities = new Float32Array(maxInstances * 3);
  const ages = new Float32Array(maxInstances);
  const lifetimes = new Float32Array(maxInstances);

  const zeroM = new THREE.Matrix4().compose(new THREE.Vector3(0, 0, 0), new THREE.Quaternion(), new THREE.Vector3(0.0001, 0.0001, 0.0001));
  for (let i = 0; i < maxInstances; i++) mesh.setMatrixAt(i, zeroM);
  mesh.instanceMatrix.needsUpdate = true;

  return { mesh, maxInstances, positions, velocities, ages, lifetimes, aliveCount: 0 };
}

const _scratchMat4 = new THREE.Matrix4();
const _scratchPos = new THREE.Vector3();
const _scratchQuat = new THREE.Quaternion();
const _scratchScale = new THREE.Vector3(1, 1, 1);

export function burstParticles(pool: ParticlePool, origin: [number, number, number], count = 80): void {
  const toSpawn = Math.min(count, pool.maxInstances - pool.aliveCount);
  if (toSpawn <= 0) return;

  const start = pool.aliveCount;
  for (let i = 0; i < toSpawn; i++) {
    const idx = start + i;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const speed = 2.5 * (0.5 + Math.random() * 0.5);

    pool.velocities[idx * 3] = Math.sin(phi) * Math.cos(theta) * speed;
    pool.velocities[idx * 3 + 1] = Math.cos(phi) * speed;
    pool.velocities[idx * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed;
    pool.positions[idx * 3] = origin[0]; pool.positions[idx * 3 + 1] = origin[1]; pool.positions[idx * 3 + 2] = origin[2];
    pool.ages[idx] = 0;
    pool.lifetimes[idx] = 0.8 * (0.6 + Math.random() * 0.4);

    _scratchPos.set(origin[0], origin[1], origin[2]);
    _scratchMat4.compose(_scratchPos, _scratchQuat, _scratchScale);
    pool.mesh.setMatrixAt(idx, _scratchMat4);
  }
  pool.aliveCount += toSpawn;
  pool.mesh.count = pool.aliveCount;
  pool.mesh.instanceMatrix.needsUpdate = true;
}

export function updateParticles(pool: ParticlePool, dt: number): void {
  if (pool.aliveCount === 0) return;
  const { positions, velocities, ages, lifetimes, mesh } = pool;
  let active = 0;

  for (let i = 0; i < pool.aliveCount; i++) {
    ages[i] += dt;
    if (ages[i] >= lifetimes[i]) continue;

    positions[active * 3] = positions[i * 3] + velocities[i * 3] * dt;
    positions[active * 3 + 1] = positions[i * 3 + 1] + velocities[i * 3 + 1] * dt;
    positions[active * 3 + 2] = positions[i * 3 + 2] + velocities[i * 3 + 2] * dt;
    velocities[active * 3] = velocities[i * 3]; velocities[active * 3 + 1] = velocities[i * 3 + 1]; velocities[active * 3 + 2] = velocities[i * 3 + 2];
    ages[active] = ages[i]; lifetimes[active] = lifetimes[i];

    _scratchPos.set(positions[active * 3], positions[active * 3 + 1], positions[active * 3 + 2]);
    const progress = ages[active] / lifetimes[active];
    const scale = Math.max(0.001, 1 - progress);
    _scratchScale.set(scale, scale, scale);
    _scratchMat4.compose(_scratchPos, _scratchQuat, _scratchScale);
    mesh.setMatrixAt(active, _scratchMat4);
    active++;
  }

  pool.aliveCount = active;
  mesh.count = active;
  mesh.instanceMatrix.needsUpdate = true;
}

export function calculateDecoherencePerturbation(
  _theta: number,
  _phi: number,
  temperatureK: number
): { deltaTheta: number; deltaPhi: number; vectorLength: number } {
  const noiseScale = Math.min(1.0, temperatureK / 300);
  const deltaTheta = (Math.random() - 0.5) * 0.08 * noiseScale;
  const deltaPhi = (Math.random() - 0.5) * 0.15 * noiseScale;
  const purityDecay = Math.max(0.1, 1.0 - noiseScale * 0.6);
  return { deltaTheta, deltaPhi, vectorLength: purityDecay };
}
