import { StateVector, bellState, measureEntangledQubit } from '@/lib/quantumCore';
import clsx from 'clsx';
import React, { forwardRef, useRef, useCallback, useEffect, useImperativeHandle, Suspense, MutableRefObject, RefObject, useMemo, useState } from 'react';
import { GlassCard } from './MathHUD';
import { useQuantumStore } from '@/store/useQuantumStore';
import * as THREE from 'three';
import { acquireRenderer, releaseRenderer } from '@/lib/three/rendererSingleton';

// Pre-allocated scratch objects for GC-free frame updates
const _scratchEuler = new THREE.Euler();
const _scratchQuat = new THREE.Quaternion();
const _scratchVec3 = new THREE.Vector3();
const _scratchTargetVec = new THREE.Vector3();
const _scratchDir = new THREE.Vector3();
const _scratchRight = new THREE.Vector3();
const _scratchUp = new THREE.Vector3();
const _unitY = new THREE.Vector3(0, 1, 0);

export function calculateDecoherencePerturbation(
  theta: number,
  phi: number,
  temperatureK: number,
  coherenceTimeMs: number
): { deltaTheta: number; deltaPhi: number; vectorLength: number } {
  const noiseScale = Math.min(1.0, temperatureK / 300);
  const deltaTheta = (Math.random() - 0.5) * 0.08 * noiseScale;
  const deltaPhi = (Math.random() - 0.5) * 0.15 * noiseScale;
  const purityDecay = Math.max(0.1, 1.0 - (noiseScale * 0.6));
  return { deltaTheta, deltaPhi, vectorLength: purityDecay };
}

export interface DisposableResource {
  dispose(): void;
}

export class ResourceTracker {
  private resources = new Set<DisposableResource | THREE.Object3D>();

  track<T extends DisposableResource | THREE.Object3D>(resource: T): T {
    if (!resource) return resource;
    if (resource instanceof THREE.Object3D) {
      resource.traverse((child: THREE.Object3D) => {
        const meshChild = child as THREE.Mesh;
        if (meshChild.geometry && typeof meshChild.geometry.dispose === 'function') {
          this.resources.add(meshChild.geometry as DisposableResource);
        }
        const mat = meshChild.material;
        if (mat) {
          if (Array.isArray(mat)) {
            mat.forEach((m) => {
              if (m && typeof m.dispose === 'function') {
                this.resources.add(m as DisposableResource);
              }
            });
          } else if (typeof mat.dispose === 'function') {
            this.resources.add(mat as DisposableResource);
          }
        }
      });
    } else if ('dispose' in resource && typeof (resource as DisposableResource).dispose === 'function') {
      this.resources.add(resource as DisposableResource);
    }
    return resource;
  }

  dispose() {
    for (const resource of this.resources) {
      const resWithData = resource as { userData?: { __shared?: boolean }; dispose?: () => void };
      if (resWithData.userData && resWithData.userData.__shared === true) continue;
      if (resWithData.dispose && typeof resWithData.dispose === 'function') {
        resWithData.dispose();
      }
    }
    this.resources.clear();
  }
}

export interface TriggerOptions {
  origin?: [number, number, number] | null;
  color?: number | null;
  count?: number | null;
  radial?: boolean | null;
}

export interface MeasurementParticlesHandle {
  trigger(opts?: TriggerOptions | null): void;
  dispose(): void;
}

export interface MeasurementParticlesProps {
  sceneRef: React.MutableRefObject<SceneHandle | null | {
    add?: ((obj: unknown) => void) | null;
    remove?: ((obj: unknown) => void) | null;
    onFrame?: ((cb: (t: number, dt: number) => void) => unknown) | null;
  }>;
  maxInstances?: number;
}

export const MeasurementParticles = forwardRef<MeasurementParticlesHandle, MeasurementParticlesProps>(
  function MeasurementParticles({ sceneRef, maxInstances = 1000 }, ref) {
    const poolRef = useRef<ParticlePool | null>(null);
    const trackerRef = useRef<ResourceTracker | null>(null);

    const triggerBurst = useCallback(
      (opts?: TriggerOptions | null) => {
        if (!poolRef.current || prefersReducedMotion()) return;

        const state = useQuantumStore.getState();
        const theta = state.theta;
        const phi = state.phi;

        const origin: [number, number, number] = opts?.origin ?? [
          Math.sin(theta) * Math.cos(phi),
          Math.cos(theta),
          Math.sin(theta) * Math.sin(phi),
        ];

        burst(poolRef.current, {
          origin,
          count: Math.min(opts?.count ?? maxInstances, maxInstances),
          color: opts?.color ?? 0x00f0ff,
        });
      },
      [maxInstances]
    );

    useEffect(() => {
      if (!sceneRef?.current) return;
      const handle = sceneRef.current;
      const tracker = new ResourceTracker();
      trackerRef.current = tracker;
      const pool = createParticlePool(maxInstances, tracker);
      poolRef.current = pool;

      if (typeof (handle as { add?: ((obj: unknown) => void) | null }).add === 'function') {
        (handle as { add: (obj: unknown) => void }).add(pool.mesh);
      }

      let unregisterFrame: (() => void) | undefined;
      if (typeof (handle as { onFrame?: ((cb: (t: number, dt: number) => void) => unknown) | null }).onFrame === 'function') {
        const res = (handle as { onFrame: (cb: (t: number, dt: number) => void) => unknown }).onFrame(
          (_t: number, _dt: number) => {
            if (poolRef.current) {
              tick(poolRef.current, _dt);
            }
          }
        );
        if (typeof res === 'function') {
          unregisterFrame = res as () => void;
        }
      }

      return () => {
        if (unregisterFrame) unregisterFrame();
        if (poolRef.current && handle) {
          if (typeof (handle as { remove?: ((obj: unknown) => void) | null }).remove === 'function') {
            (handle as { remove: (obj: unknown) => void }).remove(poolRef.current.mesh);
          }
          disposeParticlePool(poolRef.current, trackerRef.current ?? undefined);
          poolRef.current = null;
          trackerRef.current = null;
        }
      };
    }, [sceneRef, maxInstances]);

    // Store subscription for automatic collapse particle trigger
    useEffect(() => {
      const unsubscribe = useQuantumStore.subscribe((state, prevState) => {
        if (state.lastOutcome !== null && state.lastOutcome !== prevState.lastOutcome) {
          triggerBurst();
        }
      });
      return () => unsubscribe();
    }, [triggerBurst]);

    useImperativeHandle(ref, () => ({
      trigger(_opts?: TriggerOptions | null) {
        triggerBurst(_opts);
      },
      dispose() {
        if (poolRef.current) {
          const handle = sceneRef?.current;
          if (handle && typeof (handle as { remove?: ((obj: unknown) => void) | null }).remove === 'function') {
            (handle as { remove: (obj: unknown) => void }).remove(poolRef.current.mesh);
          }
          disposeParticlePool(poolRef.current, trackerRef.current ?? undefined);
          poolRef.current = null;
          trackerRef.current = null;
        }
      },
    }));

    return null;
  }
);

export interface ParticlePool {
  mesh: THREE.InstancedMesh;
  maxInstances: number;
  positions: Float32Array;
  velocities: Float32Array;
  ages: Float32Array;
  lifetimes: Float32Array;
  aliveCount: number;
}

export function createParticlePool(maxInstances: number = 1000, tracker?: ResourceTracker): ParticlePool {
  const geo = new THREE.IcosahedronGeometry(0.05, 0);
  const mat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.9 });
  const mesh = new THREE.InstancedMesh(geo, mat, maxInstances);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.count = 0;
  mesh.frustumCulled = false;

  if (tracker) {
    tracker.track(geo);
    tracker.track(mat);
    tracker.track(mesh);
  }

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
  count?: number | null;
  color?: number | null;
  speed?: number | null;
  lifetime?: number | null;
}

const _m = new THREE.Matrix4();
const _pos = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _scale = new THREE.Vector3(1, 1, 1);

export function burst(pool: ParticlePool, _opts: BurstOptions): number {
  const { origin, count = 120, color = 0x00f0ff, speed = 3, lifetime = 0.9 } = _opts;
  const available = pool.maxInstances - pool.aliveCount;
  const toSpawn = Math.min(count ?? 120, available);
  if (toSpawn <= 0) return 0;

  const start = pool.aliveCount;
  for (let i = 0; i < toSpawn; i++) {
    const idx = start + i;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const dx = Math.sin(phi) * Math.cos(theta);
    const dy = Math.cos(phi);
    const dz = Math.sin(phi) * Math.sin(theta);
    const s = (speed ?? 3) * (0.4 + Math.random() * 0.6);
    pool.velocities[idx * 3] = dx * s;
    pool.velocities[idx * 3 + 1] = dy * s;
    pool.velocities[idx * 3 + 2] = dz * s;
    pool.positions[idx * 3] = origin[0];
    pool.positions[idx * 3 + 1] = origin[1];
    pool.positions[idx * 3 + 2] = origin[2];
    pool.ages[idx] = 0;
    pool.lifetimes[idx] = (lifetime ?? 0.9) * (0.7 + Math.random() * 0.6);
    _pos.set(origin[0], origin[1], origin[2]);
    _m.compose(_pos, _q, _scale);
    pool.mesh.setMatrixAt(idx, _m);
  }
  pool.aliveCount += toSpawn;
  pool.mesh.count = pool.aliveCount;

  const clr = new THREE.Color(color ?? 0x00f0ff);
  for (let i = 0; i < pool.aliveCount; i++) {
    pool.mesh.setColorAt(i, clr);
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

export function disposeParticlePool(pool: ParticlePool, tracker?: ResourceTracker): void {
  if (tracker) {
    tracker.dispose();
  } else {
    try {
      pool.mesh.geometry.dispose();
      if (Array.isArray(pool.mesh.material)) {
        pool.mesh.material.forEach((_m) => _m.dispose());
      } else {
        pool.mesh.material.dispose();
      }
      pool.mesh.dispose();
    } catch { /* ignore */ }
  }
  pool.aliveCount = 0;
  pool.mesh.count = 0;
}


interface Props { state: StateVector; nQubits: number }

export function QuantumViewport({ state: _state, nQubits }: Props) {
  return (
    <div className="w-full rounded-2xl overflow-hidden bg-surface-1 border border-edge">
      <div
        data-testid="viewport-loading"
        className="w-full aspect-16/10 bg-surface-1 flex items-center justify-center p-4"
      >
        <span className="text-xs text-muted-foreground font-mono">
          Quantum Viewport ({nQubits} Qubit{nQubits > 1 ? 's' : ''})
        </span>
      </div>
    </div>
  );
}

interface SceneStageProps {
  children: React.ReactNode;
  label: string;
  description?: string | null;
  hasWebGL?: boolean;
}

export function SceneStage({ children, label, description, hasWebGL = true }: SceneStageProps) {
  return (
    <div className="flex flex-col bg-background-80 border border-border rounded-2xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-accent tracking-wide uppercase">{label}</h3>
        <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded border border-border">WebGL 3D Active</span>
      </div>
      {description && <p className="text-xs text-muted-foreground mb-3">{description}</p>}
      <div className="relative w-full aspect-square max-h-90 bg-background-50 rounded-xl overflow-hidden border border-border-80">
        {hasWebGL ? children : <SceneFallback />}
      </div>
    </div>
  );
}


export interface UseMeasurementBurstResult {
  controllerRef: MutableRefObject<MeasurementParticlesHandle | null>;
  burst: (origin?: [number, number, number] | null, color?: number | null) => void;
}

const DEFAULT_ORIGIN: [number, number, number] = [0, 0, 0];

export function useMeasurementBurst(
  _sceneRef: MutableRefObject<SceneHandle | null>
): UseMeasurementBurstResult {
  const controllerRef = useRef<MeasurementParticlesHandle | null>(null);

  const burst = useCallback((_origin: [number, number, number] | null = DEFAULT_ORIGIN, color?: number | null) => {
    const ctrl = controllerRef.current;
    if (!ctrl) return;
    const opts: TriggerOptions = { origin: _origin };
    if (color !== undefined && color !== null) opts.color = color;
    opts.count = 200;
    ctrl.trigger(opts);
  }, []);

  return { controllerRef, burst };
}

export interface OrbitControlsOptions {
  enableRotate?: boolean | null;
  enableZoom?: boolean | null;
  enablePan?: boolean | null;
  minDistance?: number | null;
  maxDistance?: number | null;
  minPolarAngle?: number | null;
  maxPolarAngle?: number | null;
  rotateSpeed?: number | null;
  zoomSpeed?: number | null;
  panSpeed?: number | null;
  enableDamping?: boolean | null;
  dampingFactor?: number | null;
  autoRotate?: boolean | null;
  autoRotateSpeed?: number | null;
  target?: THREE.Vector3 | [number, number, number] | null;
}

export interface OrbitControlsHandle {
  update(deltaSeconds?: number): void;
  resetView(): void;
  getCamera(): THREE.PerspectiveCamera;
  isDragging(): boolean;
  dispose(): void;
}

interface SphericalState {
  targetRadius: number;
  targetTheta: number;
  targetPhi: number;
  currentRadius: number;
  currentTheta: number;
  currentPhi: number;
  panTarget: THREE.Vector3;
  targetPanTarget: THREE.Vector3;
}

const clamp = (_v: number, _lo: number, _hi: number) => Math.max(_lo, Math.min(_hi, _v));

type ResolvedOrbitControlsOptions = {
  [K in keyof Omit<OrbitControlsOptions, 'target'>]-?: NonNullable<OrbitControlsOptions[K]>;
};

const DEFAULTS: ResolvedOrbitControlsOptions = {
  enableRotate: true,
  enableZoom: true,
  enablePan: false,
  minDistance: 1,
  maxDistance: 20,
  minPolarAngle: 0.05,
  maxPolarAngle: Math.PI - 0.05,
  rotateSpeed: 1.0,
  zoomSpeed: 1.0,
  panSpeed: 1.0,
  enableDamping: true,
  dampingFactor: 0.15,
  autoRotate: false,
  autoRotateSpeed: 1.0,
};

export function createOrbitControls(
  camera: THREE.PerspectiveCamera,
  domElement: HTMLElement,
  options: OrbitControlsOptions = {}
): OrbitControlsHandle {
  const opts: ResolvedOrbitControlsOptions = {
    enableRotate: options.enableRotate ?? DEFAULTS.enableRotate,
    enableZoom: options.enableZoom ?? DEFAULTS.enableZoom,
    enablePan: options.enablePan ?? DEFAULTS.enablePan,
    minDistance: options.minDistance ?? DEFAULTS.minDistance,
    maxDistance: options.maxDistance ?? DEFAULTS.maxDistance,
    minPolarAngle: options.minPolarAngle ?? DEFAULTS.minPolarAngle,
    maxPolarAngle: options.maxPolarAngle ?? DEFAULTS.maxPolarAngle,
    rotateSpeed: options.rotateSpeed ?? DEFAULTS.rotateSpeed,
    zoomSpeed: options.zoomSpeed ?? DEFAULTS.zoomSpeed,
    panSpeed: options.panSpeed ?? DEFAULTS.panSpeed,
    enableDamping: options.enableDamping ?? DEFAULTS.enableDamping,
    dampingFactor: options.dampingFactor ?? DEFAULTS.dampingFactor,
    autoRotate: options.autoRotate ?? DEFAULTS.autoRotate,
    autoRotateSpeed: options.autoRotateSpeed ?? DEFAULTS.autoRotateSpeed,
  };
  const initialTarget = options?.target
    ? (Array.isArray(options.target) ? new THREE.Vector3(...options.target) : options.target.clone())
    : new THREE.Vector3(0, 0, 0);

  const offset = camera.position.clone().sub(initialTarget);
  const initR = Math.max(offset.length(), opts.minDistance);
  const initTheta = Math.atan2(offset.x, offset.z);
  const initPhi = Math.acos(clamp(offset.y / initR, -1, 1));

  const st: SphericalState = {
    targetRadius: initR, targetTheta: initTheta, targetPhi: initPhi,
    currentRadius: initR, currentTheta: initTheta, currentPhi: initPhi,
    panTarget: initialTarget.clone(), targetPanTarget: initialTarget.clone(),
  };

  let dragging = false;
  let panning = false;
  let lastPointer = { x: 0, y: 0 };
  const activePointers = new Map<number, { x: number; y: number }>();
  let pinchStartDistance = 0;
  let pinchStartRadius = 0;
  let disposed = false;

  const applyToCamera = () => {
    const r = st.currentRadius;
    const sp = Math.sin(st.currentPhi);
    camera.position.set(
      st.panTarget.x + r * sp * Math.sin(st.currentTheta),
      st.panTarget.y + r * Math.cos(st.currentPhi),
      st.panTarget.z + r * sp * Math.cos(st.currentTheta)
    );
    camera.lookAt(st.panTarget);
  };

  const onPointerDown = (e: PointerEvent) => {
    if (disposed) return;
    (domElement as Element).setPointerCapture?.(e.pointerId);
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.size === 2) {
      const pts = Array.from(activePointers.values());
      pinchStartDistance = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      pinchStartRadius = st.targetRadius;
      dragging = false; panning = false;
    }
    if (e.button === 2 && opts.enablePan) panning = true;
    else if (opts.enableRotate) dragging = true;
    lastPointer = { x: e.clientX, y: e.clientY };
  };

  const onPointerMove = (e: PointerEvent) => {
    if (disposed) return;
    if (activePointers.has(e.pointerId)) activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointers.size === 2) {
      const pts = Array.from(activePointers.values());
      const d = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
      if (pinchStartDistance > 0) {
        st.targetRadius = clamp(pinchStartRadius * (pinchStartDistance / d), opts.minDistance, opts.maxDistance);
      }
    }
    if (!dragging && !panning) return;
    const dx = e.clientX - lastPointer.x;
    const dy = e.clientY - lastPointer.y;
    lastPointer = { x: e.clientX, y: e.clientY };

    if (panning) {
      _scratchRight.setFromMatrixColumn(camera.matrix, 0);
      _scratchUp.setFromMatrixColumn(camera.matrix, 1);
      const f = st.currentRadius * 0.0015 * (opts.panSpeed ?? 1.0);
      st.targetPanTarget.addScaledVector(_scratchRight, -dx * f).addScaledVector(_scratchUp, dy * f);
    } else {
      const f = 0.005 * (opts.rotateSpeed ?? 1.0);
      st.targetTheta -= dx * f;
      st.targetPhi = clamp(st.targetPhi - dy * f, opts.minPolarAngle, opts.maxPolarAngle);
    }
  };

  const onPointerUp = (e: PointerEvent) => {
    activePointers.delete(e.pointerId);
    if (activePointers.size === 0) { dragging = false; panning = false; }
    (domElement as Element).releasePointerCapture?.(e.pointerId);
  };

  const onWheel = (e: WheelEvent) => {
    if (!opts.enableZoom || disposed) return;
    e.preventDefault();
    st.targetRadius = clamp(st.targetRadius * Math.exp(e.deltaY * 0.001 * (opts.zoomSpeed ?? 1.0)), opts.minDistance, opts.maxDistance);
  };

  const onContextMenu = (e: MouseEvent) => { if (opts.enablePan) e.preventDefault(); };

  domElement.addEventListener('pointerdown', onPointerDown);
  domElement.addEventListener('pointermove', onPointerMove);
  domElement.addEventListener('pointerup', onPointerUp);
  domElement.addEventListener('pointercancel', onPointerUp);
  domElement.addEventListener('wheel', onWheel, { passive: false });
  domElement.addEventListener('contextmenu', onContextMenu);

  applyToCamera();

  return {
    update(deltaSeconds = 1 / 60) {
      if (disposed) return;
      if (opts.autoRotate && !prefersReducedMotion() && !dragging && !panning) {
        st.targetTheta += (opts.autoRotateSpeed ?? 1.0) * deltaSeconds * 0.15;
      }
      const d = opts.enableDamping ? 1 - Math.pow(1 - (opts.dampingFactor ?? 0.05), deltaSeconds * 60) : 1;
      st.currentRadius += (st.targetRadius - st.currentRadius) * d;
      st.currentTheta += (st.targetTheta - st.currentTheta) * d;
      st.currentPhi += (st.targetPhi - st.currentPhi) * d;
      st.panTarget.lerp(st.targetPanTarget, d);
      applyToCamera();
    },
    resetView() {
      st.targetRadius = initR; st.targetTheta = initTheta; st.targetPhi = initPhi;
      st.currentRadius = initR; st.currentTheta = initTheta; st.currentPhi = initPhi;
      st.targetPanTarget.copy(initialTarget); st.panTarget.copy(initialTarget);
      applyToCamera();
    },
    getCamera() { return camera; },
    isDragging() { return dragging || panning; },
    dispose() {
      if (disposed) return;
      disposed = true;
      domElement.removeEventListener('pointerdown', onPointerDown);
      domElement.removeEventListener('pointermove', onPointerMove);
      domElement.removeEventListener('pointerup', onPointerUp);
      domElement.removeEventListener('pointercancel', onPointerUp);
      domElement.removeEventListener('wheel', onWheel);
      domElement.removeEventListener('contextmenu', onContextMenu);
      activePointers.clear();
    },
  };
}

/**
- React wrapper. Prefer createOrbitControls inside useThreeScene's onSetup.
- This hook exists for scenarios where camera+domElement are refs at render time.
 */
export function useOrbitControls(
  camera: THREE.PerspectiveCamera | null,
  domElement: HTMLElement | null,
  options?: OrbitControlsOptions | null
): RefObject<OrbitControlsHandle | null> {
  const ref = useRef<OrbitControlsHandle | null>(null);
  const optsRef = useRef(options);
  useEffect(() => {
    optsRef.current = options;
  });

  useEffect(() => {
    if (!camera || !domElement) return;
    const controls = createOrbitControls(camera, domElement, optsRef.current ?? undefined);
    ref.current = controls;
    let raf = 0; let last = performance.now();
    const loop = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      controls.update(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); controls.dispose(); ref.current = null; };
  }, [camera, domElement]);

  return ref;
}

export interface ThreeSceneOptions {
  width?: number | null;
  height?: number | null;
  viewportRelative?: boolean | null;
  aspect?: number | null;
  cameraPos?: [number, number, number] | number[] | null;
  cameraLookAt?: [number, number, number] | number[] | null;
  recreateOn?: string | null;
  onSetup?: ((handle: SceneHandle) => (() => void) | void) | null;
}

export function useThreeScene(
  containerRef: React.RefObject<HTMLDivElement | null>,
  options?: ThreeSceneOptions | null
): React.RefObject<HTMLDivElement | null>;

export function useThreeScene<TReturn>(
  factory: (scene: THREE.Scene, tracker: ResourceTracker) => TReturn
): React.RefObject<HTMLDivElement | null>;

export function useThreeScene<A1, TReturn>(
  factory: (scene: THREE.Scene, tracker: ResourceTracker, arg1: A1) => TReturn,
  arg1: A1
): React.RefObject<HTMLDivElement | null>;

export function useThreeScene<A1, A2, TReturn>(
  factory: (scene: THREE.Scene, tracker: ResourceTracker, arg1: A1, arg2: A2) => TReturn,
  arg1: A1,
  arg2: A2
): React.RefObject<HTMLDivElement | null>;

export function useThreeScene(
  containerOrFactory: React.RefObject<HTMLDivElement | null> | ((scene: THREE.Scene, tracker: ResourceTracker, ...args: unknown[]) => unknown),
  optionsOrFirstArg?: ThreeSceneOptions | unknown | null,
  ...restArgs: unknown[]
): React.RefObject<HTMLDivElement | null> {
  const internalRef = useRef<HTMLDivElement | null>(null);

  // Stabilize arguments and factory references via refs using useEffect
  const argsRef = useRef(restArgs);
  const optionsRef = useRef(optionsOrFirstArg);
  const factoryRef = useRef(containerOrFactory);

  useEffect(() => {
    argsRef.current = restArgs;
    optionsRef.current = optionsOrFirstArg;
    factoryRef.current = containerOrFactory;
  });

  useEffect(() => {
    const container = internalRef.current;
    if (!container) return;

    let isDisposed = false;
    let controller: SceneHandle | null = null;
    let tracker: ResourceTracker | null = null;
    let cleanupFn: (() => void) | void = undefined;

    try {
      const currentFactory = factoryRef.current;
      const currentOptionsOrArg = optionsRef.current;
      const currentRest = argsRef.current;

      if (typeof currentFactory === 'function') {
        controller = createScene(container);
        if (isDisposed) {
          controller.dispose();
        }
        tracker = new ResourceTracker();
        const res = (currentFactory as (scene: THREE.Scene, tracker: ResourceTracker, ...args: unknown[]) => unknown)(
          controller.scene,
          tracker,
          currentOptionsOrArg,
          ...currentRest
        );
        cleanupFn = () => {
          if (res && typeof (res as { dispose?: (() => void) | null }).dispose === 'function') {
            try {
              (res as { dispose: () => void }).dispose();
            } catch (e) {
              console.error('Error disposing scene resource return:', e);
            }
          }
        };
      } else {
        const options = (currentOptionsOrArg || {}) as ThreeSceneOptions;
        controller = createScene(container);
        if (isDisposed) {
          controller.dispose();
        }
        if (options.onSetup) {
          cleanupFn = options.onSetup(controller);
        }
      }
    } catch (error) {
      console.error('Error during ThreeScene initialization:', error);
      if (controller && !isDisposed) {
        try {
          controller.dispose();
        } catch (_e) {
          // Suppress secondary teardown exceptions
        }
      }
      if (tracker && !isDisposed) {
        try {
          tracker.dispose();
        } catch (_e) {
          // Suppress secondary teardown exceptions
        }
      }
    }

    return () => {
      if (isDisposed) return;
      isDisposed = true;

      if (typeof cleanupFn === 'function') {
        try {
          cleanupFn();
        } catch (e) {
          console.error('Error in scene cleanup function:', e);
        }
      }

      if (tracker) {
        try {
          tracker.dispose();
        } catch (e) {
          console.error('Error disposing resource tracker:', e);
        }
      }

      if (controller) {
        try {
          controller.dispose();
        } catch (e) {
          console.error('Error disposing scene controller:', e);
        }
      }
    };
  }, [containerOrFactory]);

  return internalRef;
}


export interface SceneContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
}

export interface SceneHandle extends SceneContext {
  dispose: () => void;
  add: (object: THREE.Object3D, id?: string | null) => (() => void);
  remove?: (object: THREE.Object3D) => void;
  detach: (id: string) => void;
  setVisible: (id: string, visible: boolean) => void;
  onFrame: (cb: (time: number, delta: number) => void) => (() => void);
  resize: (width?: number | null, height?: number | null) => void;
  update: () => void;
  cleanup: () => void;
  requestRender: () => void;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function createBaseScene(container: HTMLElement): SceneContext {
  const scene = new THREE.Scene();
  const width = container.clientWidth || 800;
  const height = container.clientHeight || 600;
  
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 0, 5);
  
  const renderer = acquireRenderer(container);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  return { scene, camera, renderer };
}

export function createScene(container: HTMLElement): SceneHandle {
  const base = createBaseScene(container);
  const frameCallbacks: Set<(time: number, delta: number) => void> = new Set();
  const namedObjects = new Map<string, THREE.Object3D>();

  let animId = 0;
  let lastTime = performance.now();
  let needsRender = true;
  let renderGraceFrames = 5;

  const requestRender = () => {
    needsRender = true;
    renderGraceFrames = 5;
  };

  const loop = (now: number) => {
    const delta = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    frameCallbacks.forEach((_cb) => _cb(now, delta));

    if (needsRender || renderGraceFrames > 0) {
      base.renderer.render(base.scene, base.camera);
      if (renderGraceFrames > 0) {
        renderGraceFrames--;
      } else {
        needsRender = false;
      }
    }

    animId = requestAnimationFrame(loop);
  };

  animId = requestAnimationFrame(loop);

  const handle: SceneHandle = {
    ...base,
    requestRender,
    add: (object: THREE.Object3D, id?: string | null) => {
      base.scene.add(object);
      if (id) namedObjects.set(id, object);
      requestRender();
      return () => {
        base.scene.remove(object);
        if (id) namedObjects.delete(id);
        requestRender();
      };
    },
    remove: (_object: THREE.Object3D) => {
      base.scene.remove(_object);
      requestRender();
    },
    detach: (id: string) => {
      const obj = namedObjects.get(id);
      if (obj) {
        base.scene.remove(obj);
        namedObjects.delete(id);
        requestRender();
      }
    },
    setVisible: (_id: string, _visible: boolean) => {
      const obj = namedObjects.get(_id);
      if (obj) {
        obj.visible = _visible;
        requestRender();
      }
    },
    onFrame: (cb: (time: number, delta: number) => void) => {
      frameCallbacks.add(cb);
      return () => {
        frameCallbacks.delete(cb);
      };
    },
    resize: (w?: number | null, h?: number | null) => {
      const width = w || container.clientWidth || 800;
      const height = h || container.clientHeight || 600;
      base.camera.aspect = width / height;
      base.camera.updateProjectionMatrix();
      base.renderer.setSize(width, height, false);
      requestRender();
    },
    update: () => {
      base.renderer.render(base.scene, base.camera);
    },
    cleanup: () => {
      cancelAnimationFrame(animId);
      frameCallbacks.clear();
      disposeResource(base.scene);
      releaseRenderer(container);
    },
    dispose: () => {
      handle.cleanup();
    },
  };

  return handle;
}

export function setupBaseScene(_container: HTMLElement) {
  return createScene(_container);
}

const resourceCache = new Map<string, unknown>();
const spriteMaterialCache = new Map<string, THREE.SpriteMaterial>();

export function cached<T>(key: string, _factory: () => T): T {
  if (!resourceCache.has(key)) {
    const val = _factory();
    if (val && typeof val === 'object') {
      (val as Record<string, unknown>).userData = { ...((val as Record<string, unknown>).userData || {}), __shared: true };
    }
    resourceCache.set(key, val);
  }
  return resourceCache.get(key) as T;
}

export function clearResourceCache(): void { resourceCache.clear(); }
export function clearSpriteMaterialCache(): void { spriteMaterialCache.clear(); }

export function disposeResource(obj: unknown): void {
  if (!obj || typeof obj !== 'object') return;
  const target = obj as Record<string, unknown>;

  if (target.userData && (target.userData as Record<string, unknown>).__shared) return;
  if (typeof target.dispose === 'function') (target.dispose as () => void)();

  if (target.children && Array.isArray(target.children)) {
    target.children.forEach(child => disposeResource(child));
  }
  if (target.geometry) disposeResource(target.geometry);
  if (target.material) {
    if (Array.isArray(target.material)) target.material.forEach(m => disposeResource(m));
    else disposeResource(target.material);
  }
  if (target.map) disposeResource(target.map);
}

export function createTextSprite(text: string, options: { fontSize?: number; color?: string } = {}): THREE.Sprite {
  const color = options.color || '#ffffff';
  const key = `sprite_${text}_${color}`;
  
  if (!spriteMaterialCache.has(key)) {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = color;
      ctx.font = `${options.fontSize || 24}px sans-serif`;
      ctx.fillText(text, 10, 50);
    }
    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture });
    spriteMaterialCache.set(key, mat);
  }

  return new THREE.Sprite(spriteMaterialCache.get(key)!);
}

export function createBlochSphereScene(
  scene: THREE.Scene,
  tracker: ResourceTracker,
  theta: number = 0,
  phi: number = 0
) {
  const sphereGeo = tracker.track(new THREE.SphereGeometry(1, 32, 32));
  const sphereMat = tracker.track(
    new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true, transparent: true, opacity: 0.3 })
  );
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  scene.add(sphere);

  const x = Math.sin(theta) * Math.cos(phi);
  const y = Math.cos(theta);
  const z = Math.sin(theta) * Math.sin(phi);

  const dir = new THREE.Vector3(x, y, z).normalize();
  const arrow = tracker.track(new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0, 0), 1, 0xff007f));
  scene.add(arrow);

  return { sphere, arrow };
}

export interface BlochSphereSceneProps {
  theta?: number;
  phi?: number;
}

export function BlochSphereScene({ theta: propTheta, phi: propPhi }: BlochSphereSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SceneHandle | null>(null);
  const particlesRef = useRef<MeasurementParticlesHandle>(null);
  const flashMeshRef = useRef<THREE.Mesh | null>(null);
  const flashAnimRef = useRef({ active: false, time: 0, duration: 0.35 });

  useEffect(() => {
    if (propTheta !== undefined && propPhi !== undefined) {
      useQuantumStore.setState({ theta: propTheta, phi: propPhi });
    }
  }, [propTheta, propPhi]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handle = createScene(container);
    sceneRef.current = handle;

    // Bloch Sphere Wireframe
    const sphereGeo = new THREE.SphereGeometry(1, 32, 16);
    const sphereMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true, transparent: true, opacity: 0.15 });
    const wireframeSphere = new THREE.Mesh(sphereGeo, sphereMat);
    handle.scene.add(wireframeSphere);

    // Equator Ring
    const ringGeo = new THREE.RingGeometry(0.99, 1.01, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    handle.scene.add(ring);

    // Vector Shaft & Cone Group
    const vectorGroup = new THREE.Group();
    const shaftGeo = new THREE.CylinderGeometry(0.015, 0.015, 1.0, 16);
    const shaftMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.8 });
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    shaft.position.y = 0.5;
    vectorGroup.add(shaft);

    const coneGeo = new THREE.ConeGeometry(0.05, 0.15, 16);
    const coneMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 1.2 });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.position.y = 1.0;
    vectorGroup.add(cone);

    handle.scene.add(vectorGroup);

    // Collapse Flash Mesh
    const flashGeo = new THREE.SphereGeometry(1, 32, 32);
    const flashMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 2.5,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const flashMesh = new THREE.Mesh(flashGeo, flashMat);
    flashMesh.visible = false;
    handle.scene.add(flashMesh);
    flashMeshRef.current = flashMesh;

    // Animation Loop Callback with scratch vectors and demand-driven rendering
    const unregisterFrame = handle.onFrame((_time: number, delta: number) => {
      const state = useQuantumStore.getState();
      const sinTheta = Math.sin(state.theta);
      _scratchTargetVec.set(
        sinTheta * Math.cos(state.phi),
        Math.cos(state.theta),
        sinTheta * Math.sin(state.phi)
      );
      if (_scratchTargetVec.lengthSq() < 1e-6) {
        _scratchTargetVec.set(0, 1, 0);
      } else {
        _scratchTargetVec.normalize();
      }

      _scratchQuat.setFromUnitVectors(_unitY, _scratchTargetVec);
      vectorGroup.quaternion.slerp(_scratchQuat, delta * 12.0);

      // Collapse Flash Scaling Animation
      const anim = flashAnimRef.current;
      if (anim.active && flashMeshRef.current) {
        handle.requestRender();
        anim.time += delta;
        const progress = Math.min(anim.time / anim.duration, 1.0);
        const currentScale = 1.5 * (1.0 - progress);
        flashMeshRef.current.scale.setScalar(Math.max(0, currentScale));
        (flashMeshRef.current.material as THREE.MeshStandardMaterial).opacity = 0.95 * (1.0 - progress);

        if (progress >= 1.0) {
          anim.active = false;
          flashMeshRef.current.visible = false;
        }
      }
    });

    const resizeObserver = new ResizeObserver(() => handle.resize());
    resizeObserver.observe(container);

    return () => {
      unregisterFrame();
      resizeObserver.disconnect();
      handle.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Subscribe to state updates & measurement collapse outcome updates
  useEffect(() => {
    const unsubscribe = useQuantumStore.subscribe((state, prevState) => {
      if (state.theta !== prevState.theta || state.phi !== prevState.phi) {
        sceneRef.current?.requestRender();
      }
      if (state.lastOutcome !== null && state.lastOutcome !== prevState.lastOutcome && flashMeshRef.current) {
        const outcome = state.lastOutcome;
        flashMeshRef.current.position.set(0, outcome === 0 ? 1 : -1, 0);
        flashMeshRef.current.scale.setScalar(1.5);
        (flashMeshRef.current.material as THREE.MeshStandardMaterial).opacity = 0.95;
        flashMeshRef.current.visible = true;
        flashAnimRef.current = { active: true, time: 0, duration: 0.35 };
        sceneRef.current?.requestRender();
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-70 rounded-xl overflow-hidden relative bg-background-80"
      role="img"
      aria-label="Representación 3D interactiva de la Esfera de Bloch"
    >
      <MeasurementParticles ref={particlesRef} sceneRef={sceneRef} maxInstances={250} />
    </div>
  );
}

export interface SceneFallbackProps {
  title?: string;
  description?: string;
  stateSummary?: string;
  className?: string;
}

export const SceneFallback: React.FC<SceneFallbackProps> = ({
  title = 'WebGL Simulation Unavailable',
  description = 'WebGL is not available or supported on this device. Showing a simplified textual representation of the quantum simulation.',
  stateSummary,
  className,
}) => {
  return (
    <div 
      role="region" 
      aria-label={title}
      className={clsx(
        'flex flex-col items-center justify-center h-full p-6 bg-background text-muted-foreground rounded-xl border border-border',
        className
      )}
    >
      <svg className="w-12 h-12 mb-3 text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <h3 className="text-base font-semibold text-foreground mb-1 text-center">{title}</h3>
      <p className="text-sm text-muted-foreground text-center max-w-md">{description}</p>
      {stateSummary && (
        <div className="mt-4 p-3 bg-card-80 border border-border rounded-lg w-full max-w-md">
          <span className="text-xs font-mono uppercase tracking-wider text-accent block mb-1">Current Simulation State:</span>
          <p className="text-xs font-mono text-foreground">{stateSummary}</p>
        </div>
      )}
    </div>
  );
};

export const BlochSphereWorkspace: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const theta = useQuantumStore((s) => s.theta);
  const phi = useQuantumStore((s) => s.phi);
  const lastOutcome = useQuantumStore((s) => s.lastOutcome);

  const vectorCoords = useMemo(() => {
    const sinTheta = Math.sin(theta);
    const x = sinTheta * Math.cos(phi);
    const y = Math.cos(theta);
    const z = sinTheta * Math.sin(phi);
    return {
      x: x.toFixed(3),
      y: y.toFixed(3),
      z: z.toFixed(3),
    };
  }, [theta, phi]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handle = createScene(container);
    let controls: OrbitControlsHandle | null = null;
    if (handle.camera && handle.renderer?.domElement) {
      controls = createOrbitControls(
        handle.camera,
        handle.renderer.domElement,
        {
          enableDamping: true,
          dampingFactor: 0.1,
        },
      );
    }

    // Geometries and materials to explicitly dispose on unmount
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];

    // Wireframe Sphere
    const sphereGeo = new THREE.SphereGeometry(1.3, 32, 16);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    geometries.push(sphereGeo);
    materials.push(sphereMat);
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    handle.scene.add(sphere);

    // Equatorial Ring in XZ plane (Y = 0)
    const ringGeo = new THREE.RingGeometry(1.29, 1.31, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide,
    });
    geometries.push(ringGeo);
    materials.push(ringMat);
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    handle.scene.add(ring);

    // Axes lines
    const axesGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1.5, 0, 0),
      new THREE.Vector3(1.5, 0, 0),
      new THREE.Vector3(0, -1.5, 0),
      new THREE.Vector3(0, 1.5, 0),
      new THREE.Vector3(0, 0, -1.5),
      new THREE.Vector3(0, 0, 1.5),
    ]);
    const axesMat = new THREE.LineBasicMaterial({
      color: 0x475569,
      transparent: true,
      opacity: 0.4,
    });
    geometries.push(axesGeo);
    materials.push(axesMat);
    const axes = new THREE.LineSegments(axesGeo, axesMat);
    handle.scene.add(axes);

    // 3D Vector Arrow ArrowHelper: r = (sin(theta)*cos(phi), cos(theta), sin(theta)*sin(phi))
    const sinInit = Math.sin(theta);
    const arrowDir = new THREE.Vector3(
      sinInit * Math.cos(phi),
      Math.cos(theta),
      sinInit * Math.sin(phi),
    );
    if (arrowDir.lengthSq() < 1e-6) {
      arrowDir.set(0, 1, 0);
    } else {
      arrowDir.normalize();
    }
    const arrowOrigin = new THREE.Vector3(0, 0, 0);
    const arrowLength = 1.3;
    const arrowColor = 0x00f0ff;
    const arrowHelper = new THREE.ArrowHelper(
      arrowDir,
      arrowOrigin,
      arrowLength,
      arrowColor,
      0.2,
      0.08,
    );
    handle.scene.add(arrowHelper);

    const currentInterpolatedDir = arrowDir.clone();

    const unregisterFrame = handle.onFrame((_time: number, delta: number) => {
      if (controls) {
        controls.update(delta);
        if (controls.isDragging()) {
          handle.requestRender();
        }
      }

      const state = useQuantumStore.getState();
      let currentTheta = state.theta;
      let currentPhi = state.phi;
      let targetLength = 1.3;

      if (state.temperatureK > 0.05) {
        const { deltaTheta, deltaPhi, vectorLength } =
          calculateDecoherencePerturbation(
            currentTheta,
            currentPhi,
            state.temperatureK,
            state.coherenceTimeUs / 1000,
          );
        currentTheta += deltaTheta;
        currentPhi += deltaPhi;
        targetLength = 1.3 * vectorLength;
        handle.requestRender();
      }

      const sinT = Math.sin(currentTheta);
      _scratchTargetVec.set(
        sinT * Math.cos(currentPhi),
        Math.cos(currentTheta),
        sinT * Math.sin(currentPhi),
      );

      if (_scratchTargetVec.lengthSq() < 1e-6) {
        _scratchTargetVec.set(0, 1, 0);
      } else {
        _scratchTargetVec.normalize();
      }

      const interpFactor = Math.min(1.0, delta * 12.0);
      if (currentInterpolatedDir.distanceToSquared(_scratchTargetVec) > 1e-5) {
        currentInterpolatedDir.lerp(_scratchTargetVec, interpFactor);
        if (currentInterpolatedDir.lengthSq() > 1e-6) {
          currentInterpolatedDir.normalize();
        }
        handle.requestRender();
      }

      arrowHelper.setDirection(currentInterpolatedDir);
      arrowHelper.setLength(targetLength, 0.2, 0.08);
    });

    const unsubscribeStore = useQuantumStore.subscribe((state, prevState) => {
      if (
        state.theta !== prevState.theta ||
        state.phi !== prevState.phi ||
        state.temperatureK !== prevState.temperatureK ||
        state.lastOutcome !== prevState.lastOutcome
      ) {
        handle.requestRender();
      }
    });

    const resizeObserver = new ResizeObserver(() => handle.resize());
    resizeObserver.observe(container);

    return () => {
      unregisterFrame();
      unsubscribeStore();
      resizeObserver.disconnect();
      if (controls) {
        controls.dispose();
      }
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      if (arrowHelper.line) {
        arrowHelper.line.geometry.dispose();
        if (Array.isArray(arrowHelper.line.material)) {
          arrowHelper.line.material.forEach((m) => m.dispose());
        } else {
          arrowHelper.line.material.dispose();
        }
      }
      if (arrowHelper.cone) {
        arrowHelper.cone.geometry.dispose();
        if (Array.isArray(arrowHelper.cone.material)) {
          arrowHelper.cone.material.forEach((m) => m.dispose());
        } else {
          arrowHelper.cone.material.dispose();
        }
      }
      handle.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-dvh min-h-0 rounded-xl border border-accent-border bg-background-80 flex overflow-hidden">
      {/* 3D Viewport — fills ALL remaining space */}
      <div className="relative flex-1 min-h-0">
        <div ref={containerRef} className="absolute inset-0" />

        {/* Radial glow (behind the HUD labels, above the canvas) */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.08)_0%,transparent_70%)]" />

        {/* State Pole HUD Overlay */}
        <span className="absolute top-2 left-1/2 -translate-x-1/2 text-xs hud-font-mono text-accent pointer-events-none select-none bg-background-80 px-2 py-0.5 rounded border border-accent-border/40">
          |0⟩ (+Y)
        </span>
        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs hud-font-mono text-axis-y pointer-events-none select-none bg-background-80 px-2 py-0.5 rounded border border-axis-y/40">
          |1⟩ (-Y)
        </span>
      </div>

      {/* Telemetry dock — sits BELOW the viewport, stacked in rows */}
      <div className="shrink-0 border-t border-border bg-background-80 px-4 py-3 text-xs hud-font-mono text-muted-foreground flex flex-col gap-1.5">
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <div>
            <span className="text-accent font-bold">X:</span> {vectorCoords.x}
          </div>
          <div>
            <span className="text-axis-y font-bold">Y:</span> {vectorCoords.y}
          </div>
          <div>
            <span className="text-warning font-bold">Z:</span> {vectorCoords.z}
          </div>
        </div>

        {lastOutcome !== null && (
          <div className="pt-1.5 border-t border-border/60">
            <span className="text-success font-bold">COLLAPSED:</span> |
            {lastOutcome}⟩
          </div>
        )}
      </div>
    </div>
  );
};

export const MathDock: React.FC = () => {
  const theta = useQuantumStore((_s: any) => _s.theta);
  const phi = useQuantumStore((_s: any) => _s.phi);
  const temperatureK = useQuantumStore((_s: any) => _s.temperatureK);
  const coherenceTimeUs = useQuantumStore((_s: any) => _s.coherenceTimeUs);
  const setAngles = useQuantumStore((_s: any) => _s.setAngles);
  const setTemperature = useQuantumStore((_s: any) => _s.setTemperature);
  const activeMission = useQuantumStore((_s: any) => _s.activeMission);

  // Zero-Spoiler Prediction & Outcome state
  const [selectedPrediction, setSelectedPrediction] = useState<'|0>' | '|1>' | '50/50' | null>(null);
  const [revealedOutcome, setRevealedOutcome] = useState<0 | 1 | null>(null);
  const [revealedProb, setRevealedProb] = useState<number | null>(null);
  const [lastPrediction, setLastPrediction] = useState<'|0>' | '|1>' | '50/50' | null>(null);

  // Mission 2 (Entanglement) state
  const [stationA, setStationA] = useState<0 | 1 | null>(null);
  const [stationB, setStationB] = useState<0 | 1 | null>(null);

  const alpha = Math.cos(theta / 2);
  const beta = Math.sin(theta / 2);
  const bornProb0 = Math.cos(theta / 2) ** 2;
  const bornProb1 = Math.sin(theta / 2) ** 2;
  const prob0Str = (bornProb0 * 100).toFixed(1);
  const prob1Str = (bornProb1 * 100).toFixed(1);

  const theta180 = (theta * 180) / Math.PI;
  const phi180 = (phi * 180) / Math.PI;

  const handleMeasureMission01 = () => {
    if (!selectedPrediction) return;

    // Sample Born probability cos^2(theta/2)
    const outcome: 0 | 1 = Math.random() < bornProb0 ? 0 : 1;
    const probabilityVal = outcome === 0 ? bornProb0 : bornProb1;

    // Snap theta in useQuantumStore to 0 (|0) or Math.PI (|1)
    setAngles(outcome === 0 ? 0 : Math.PI, phi);

    // Reveal prediction vs outcome
    setRevealedOutcome(outcome);
    setRevealedProb(probabilityVal);
    setLastPrediction(selectedPrediction);
  };

  const handleMeasureStationA = () => {
    bellState('phi+');
    const res = measureEntangledQubit();
    const outcome = res.aliceOutcome ?? (Math.random() < 0.5 ? 0 : 1);
    setStationA(outcome);
    setStationB(outcome);
  };

  const tempMilliKelvin = Math.round(temperatureK * 1000);

  return (
    <div className="flex flex-col gap-3 w-full">
      <GlassCard title="Dirac State Vector" badge="|ψ⟩">
        <div className="p-2 hud-font-mono text-sm text-accent-light bg-background-60 rounded border border-accent-border my-1">
          |ψ⟩ = {alpha.toFixed(3)}|0⟩ + {beta.toFixed(3)}|1⟩
        </div>
        <div className="mt-2 flex flex-col gap-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>α = cos(θ/2) = {alpha.toFixed(3)}</span>
            <span>β = sin(θ/2) = {beta.toFixed(3)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Polar (θ): {theta180.toFixed(0)}°</span>
            <span>Azimuthal (φ): {phi180.toFixed(0)}°</span>
          </div>

          {/* Angle Sliders */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono text-muted-foreground">
              <label htmlFor="dock-theta">θ (Polar)</label>
              <span>{theta.toFixed(3)} rad</span>
            </div>
            <input
              id="dock-theta"
              type="range"
              min="0"
              max={Math.PI}
              step="0.01"
              value={theta}
              onChange={(_e: React.ChangeEvent<HTMLInputElement>) => {
                setAngles(parseFloat(_e.target.value), phi);
                setRevealedOutcome(null);
              }}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono text-muted-foreground">
              <label htmlFor="dock-phi">φ (Azimuthal)</label>
              <span>{phi.toFixed(3)} rad</span>
            </div>
            <input
              id="dock-phi"
              type="range"
              min="0"
              max={2 * Math.PI}
              step="0.01"
              value={phi}
              onChange={(_e: React.ChangeEvent<HTMLInputElement>) => {
                setAngles(theta, parseFloat(_e.target.value));
              }}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Canonical Presets */}
          <div className="pt-1">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Presets</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setAngles(0, phi);
                  setRevealedOutcome(null);
                }}
                className="flex-1 py-1 px-2 rounded bg-background border border-border hover:bg-card text-xs font-mono font-medium"
              >
                |0⟩
              </button>
              <button
                type="button"
                onClick={() => {
                  setAngles(Math.PI / 2, phi);
                  setRevealedOutcome(null);
                }}
                className="flex-1 py-1 px-2 rounded bg-background border border-border hover:bg-card text-xs font-mono font-medium text-accent"
              >
                |+⟩ (θ=π/2)
              </button>
              <button
                type="button"
                onClick={() => {
                  setAngles(Math.PI, phi);
                  setRevealedOutcome(null);
                }}
                className="flex-1 py-1 px-2 rounded bg-background border border-border hover:bg-card text-xs font-mono font-medium"
              >
                |1⟩
              </button>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Measurement Panel: Zero-Spoiler UX for Superposition & Collapse */}
      {(activeMission === 0 || activeMission === 1 || activeMission === undefined) && (
        <GlassCard title="Measurement Probabilities" badge="Zero-Spoiler">
          <div className="space-y-3 my-1">
            <div>
              <div className="flex justify-between text-xs hud-font-mono mb-1">
                <span className="text-accent font-semibold">P(|0⟩) = α²</span>
                <span>{prob0Str}%</span>
              </div>
              <div className="w-full h-2 bg-card rounded-full overflow-hidden">
                <div className="h-full bg-accent transition-all duration-300" style={{ width: `${prob0Str}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs hud-font-mono mb-1">
                <span className="text-axis-y font-semibold">P(|1⟩) = β²</span>
                <span>{prob1Str}%</span>
              </div>
              <div className="w-full h-2 bg-card rounded-full overflow-hidden">
                <div className="h-full bg-quantum-purple transition-all duration-300" style={{ width: `${prob1Str}%` }} />
              </div>
            </div>
          </div>

          {/* Zero-Spoiler Prediction Selector */}
          <div className="mt-3 pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground block mb-1.5 font-semibold">
              Select Prediction before measuring:
            </span>
            <div className="flex gap-2">
              {(['|0>', '|1>', '50/50'] as const).map((pred) => (
                <button
                  key={pred}
                  type="button"
                  onClick={() => setSelectedPrediction(pred)}
                  className={`flex-1 py-1 px-2 rounded text-xs font-mono border transition-all ${
                    selectedPrediction === pred
                      ? 'bg-accent text-accent-foreground border-accent font-bold shadow-[0_0_8px_rgba(0,240,255,0.4)]'
                      : 'bg-background border-border hover:bg-card text-foreground'
                  }`}
                >
                  {pred}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={!selectedPrediction}
            onClick={handleMeasureMission01}
            className={`mt-3 w-full py-2 rounded font-bold text-xs uppercase tracking-wider hud-font-mono transition-all ${
              !selectedPrediction
                ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                : 'bg-accent hover:bg-accent text-accent-foreground shadow-[0_0_15px_rgba(0,240,255,0.3)] cursor-pointer'
            }`}
          >
            Measure (Collapse Wavefunction)
          </button>

          {/* Prediction vs Outcome Reveal */}
          {revealedOutcome !== null && (
            <div className="mt-3 p-2.5 rounded bg-background-80 border border-border text-xs hud-font-mono space-y-1 animate-fadeIn">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Your Prediction:</span>
                <span className="font-bold text-accent">{lastPrediction}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Observed Outcome:</span>
                <span className="font-bold text-success">|{revealedOutcome}⟩</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Born Probability:</span>
                <span className="font-mono">{((revealedProb ?? 0) * 100).toFixed(1)}%</span>
              </div>
            </div>
          )}
        </GlassCard>
      )}

      {/* Mission 2: Entanglement Controls */}
      {activeMission === 2 && (
        <GlassCard title="Bell State |Φ+⟩ Measurement" badge="Entanglement">
          <div className="p-2 hud-font-mono text-xs bg-background-60 rounded border border-accent-border my-1">
            |Φ⁺⟩ = (|00⟩ + |11⟩) / √2
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Measuring Station A collapses the pair instantaneously. Station B is guaranteed to match Station A perfectly.
          </p>
          <button
            type="button"
            onClick={handleMeasureStationA}
            className="mt-3 w-full py-2 rounded bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider hud-font-mono transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:opacity-90 cursor-pointer"
          >
            Measure Station A
          </button>
          {stationA !== null && (
            <div className="mt-3 p-2.5 rounded bg-background-80 border border-border text-xs hud-font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Station A Outcome:</span>
                <span className="font-bold text-accent">|{stationA}⟩</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Station B Outcome:</span>
                <span className="font-bold text-quantum-purple">|{stationB}⟩</span>
              </div>
              <div className="flex justify-between text-[11px] text-success pt-1 border-t border-border/50">
                <span>Joint State:</span>
                <span className="font-bold">|{stationA}{stationB}⟩ (Correlated)</span>
              </div>
            </div>
          )}
        </GlassCard>
      )}

      {/* Mission 3: Thermal Decoherence */}
      <GlassCard title="Cryogenic Environment" badge="Decoherence">
        <div className="space-y-2 text-xs hud-font-mono">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Temperature:</span>
            <span className="text-warning font-bold">
              {tempMilliKelvin} mK ({temperatureK.toFixed(3)} K)
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Coherence T₂(T):</span>
            <span className="text-success font-bold">{coherenceTimeUs.toFixed(1)} μs</span>
          </div>
          <div className="pt-1">
            <div className="flex justify-between text-muted-foreground mb-1">
              <label htmlFor="temp-range">Thermal Fluctuation Controller</label>
              <span>{tempMilliKelvin >= 1000 ? `${(tempMilliKelvin / 1000).toFixed(1)} K` : `${tempMilliKelvin} mK`}</span>
            </div>
            <input
              id="temp-range"
              type="range"
              min="15"
              max="300000"
              step="5"
              value={tempMilliKelvin}
              onChange={(_e: React.ChangeEvent<HTMLInputElement>) => setTemperature(parseFloat(_e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>15 mK (0.015 K)</span>
              <span>150 K</span>
              <span>300,000 mK (300 K)</span>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default BlochSphereWorkspace;