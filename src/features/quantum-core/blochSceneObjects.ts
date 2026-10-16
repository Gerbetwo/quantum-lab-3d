/**
 * Pure Three.js Scene Builders & Visual Object Pools
 * Framework-agnostic: Zero React hooks, zero DOM bindings.
 */

import * as THREE from 'three';

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
  geometries: THREE.BufferGeometry[];
  materials: THREE.Material[];
}

export function createBlochSphereScene(): BlochSphereElements {
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  const sphereGeo = new THREE.SphereGeometry(1.3, 32, 16);
  const sphereMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, wireframe: true, transparent: true, opacity: 0.15 });
  geometries.push(sphereGeo); materials.push(sphereMat);
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);

  const ringGeo = new THREE.RingGeometry(1.29, 1.31, 64);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
  geometries.push(ringGeo); materials.push(ringMat);
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;

  const axesGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-1.5, 0, 0), new THREE.Vector3(1.5, 0, 0),
    new THREE.Vector3(0, -1.5, 0), new THREE.Vector3(0, 1.5, 0),
    new THREE.Vector3(0, 0, -1.5), new THREE.Vector3(0, 0, 1.5),
  ]);
  const axesMat = new THREE.LineBasicMaterial({ color: 0x475569, transparent: true, opacity: 0.4 });
  geometries.push(axesGeo); materials.push(axesMat);
  const axes = new THREE.LineSegments(axesGeo, axesMat);

  const arrowHelper = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 1.3, 0x00f3ff, 0.2, 0.08);

  return { sphere, ring, axes, arrowHelper, geometries, materials };
}

export function computeSphericalVector(theta: number, phi: number): THREE.Vector3 {
  const sT = Math.sin(theta);
  return new THREE.Vector3(sT * Math.cos(phi), Math.cos(theta), sT * Math.sin(phi)).normalize();
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
  options: { sphereColor?: number; arrowColor?: number; opacity?: number } = {}
): void {
  if (options.sphereColor !== undefined && elements.sphere.material instanceof THREE.MeshBasicMaterial) {
    elements.sphere.material.color.setHex(options.sphereColor);
  }
  if (options.opacity !== undefined && elements.sphere.material instanceof THREE.MeshBasicMaterial) {
    elements.sphere.material.opacity = options.opacity;
  }
  if (options.arrowColor !== undefined) {
    elements.arrowHelper.setColor(options.arrowColor);
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
