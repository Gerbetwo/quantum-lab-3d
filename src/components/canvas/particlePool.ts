/**
 * GPU-friendly particle pool using THREE.InstancedMesh.
 * Pool is pre-allocated; bursts reuse dead slots without re-allocating.
 */

import * as THREE from 'three';

export interface ParticlePool {
  mesh: THREE.InstancedMesh;
  maxInstances: number;
  positions: Float32Array;
  velocities: Float32Array;
  ages: Float32Array;
  lifetimes: Float32Array;
  aliveCount: number;
}

export function createParticlePool(maxInstances: number = 1000): ParticlePool {
  const geo = new THREE.IcosahedronGeometry(0.05, 0);
  const mat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.9 });
  const mesh = new THREE.InstancedMesh(geo, mat, maxInstances);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.count = 0;
  mesh.frustumCulled = false;

  const positions = new Float32Array(maxInstances * 3);
  const velocities = new Float32Array(maxInstances * 3);
  const ages = new Float32Array(maxInstances);
  const lifetimes = new Float32Array(maxInstances);

  const zeroM = new THREE.Matrix4();
  const zeroScale = new THREE.Vector3(0.0001, 0.0001, 0.0001);
  const zeroPos = new THREE.Vector3(0, 0, 0);
  const q = new THREE.Quaternion();
  for (let i = 0; i < maxInstances; i++) {
    zeroM.compose(zeroPos, q, zeroScale);
    mesh.setMatrixAt(i, zeroM);
  }
  mesh.instanceMatrix.needsUpdate = true;

  return { mesh, maxInstances, positions, velocities, ages, lifetimes, aliveCount: 0 };
}

export interface BurstOptions {
  origin: [number, number, number];
  count?: number;
  color?: number;
  speed?: number;
  lifetime?: number;
}

const _m = new THREE.Matrix4();
const _pos = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _scale = new THREE.Vector3(1, 1, 1);

export function burst(pool: ParticlePool, opts: BurstOptions): number {
  const { origin, count = 120, color = 0x00f0ff, speed = 3, lifetime = 0.9 } = opts;
  const available = pool.maxInstances - pool.aliveCount;
  const toSpawn = Math.min(count, available);
  if (toSpawn <= 0) return 0;

  const start = pool.aliveCount;
  for (let i = 0; i < toSpawn; i++) {
    const idx = start + i;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const dx = Math.sin(phi) * Math.cos(theta);
    const dy = Math.cos(phi);
    const dz = Math.sin(phi) * Math.sin(theta);
    const s = speed * (0.4 + Math.random() * 0.6);
    pool.velocities[idx * 3] = dx * s;
    pool.velocities[idx * 3 + 1] = dy * s;
    pool.velocities[idx * 3 + 2] = dz * s;
    pool.positions[idx * 3] = origin[0];
    pool.positions[idx * 3 + 1] = origin[1];
    pool.positions[idx * 3 + 2] = origin[2];
    pool.ages[idx] = 0;
    pool.lifetimes[idx] = lifetime * (0.7 + Math.random() * 0.6);
    _pos.set(origin[0], origin[1], origin[2]);
    _m.compose(_pos, _q, _scale);
    pool.mesh.setMatrixAt(idx, _m);
  }
  pool.aliveCount += toSpawn;
  pool.mesh.count = pool.aliveCount;

  const c = new THREE.Color(color);
  for (let i = 0; i < pool.aliveCount; i++) {
    pool.mesh.setColorAt(i, c);
  }
  if (pool.mesh.instanceColor) pool.mesh.instanceColor.needsUpdate = true;
  pool.mesh.instanceMatrix.needsUpdate = true;
  return toSpawn;
}

export function tick(pool: ParticlePool, dt: number): void {
  if (pool.aliveCount === 0) return;
  const { positions, velocities, ages, lifetimes, mesh } = pool;
  let w = 0;
  for (let i = 0; i < pool.aliveCount; i++) {
    ages[i] += dt;
    if (ages[i] >= lifetimes[i]) continue;

    positions[i * 3] += velocities[i * 3] * dt;
    positions[i * 3 + 1] += velocities[i * 3 + 1] * dt;
    positions[i * 3 + 2] += velocities[i * 3 + 2] * dt;

    if (w !== i) {
      positions[w * 3] = positions[i * 3];
      positions[w * 3 + 1] = positions[i * 3 + 1];
      positions[w * 3 + 2] = positions[i * 3 + 2];
      velocities[w * 3] = velocities[i * 3];
      velocities[w * 3 + 1] = velocities[i * 3 + 1];
      velocities[w * 3 + 2] = velocities[i * 3 + 2];
      ages[w] = ages[i];
      lifetimes[w] = lifetimes[i];
    }

    const t = ages[w] / lifetimes[w];
    const s = Math.max(0.001, 1 - t);
    _pos.set(positions[w * 3], positions[w * 3 + 1], positions[w * 3 + 2]);
    _scale.set(s, s, s);
    _m.compose(_pos, _q, _scale);
    mesh.setMatrixAt(w, _m);
    w++;
  }
  pool.aliveCount = w;
  mesh.count = w;
  mesh.instanceMatrix.needsUpdate = true;
}

export function disposeParticlePool(pool: ParticlePool): void {
  try {
    pool.mesh.geometry.dispose();
    if (Array.isArray(pool.mesh.material)) {
      pool.mesh.material.forEach((m) => m.dispose());
    } else {
      pool.mesh.material.dispose();
    }
    pool.mesh.dispose();
  } catch { /* ignore */ }
  pool.aliveCount = 0;
  pool.mesh.count = 0;
}
