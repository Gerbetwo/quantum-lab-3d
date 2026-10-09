'use client';

import * as THREE from 'three';
import { useEffect, useRef, type RefObject } from 'react';
import { prefersReducedMotion } from '../lib/sceneManager';

export interface OrbitControlsOptions {
  enableRotate?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;
  minDistance?: number;
  maxDistance?: number;
  minPolarAngle?: number;
  maxPolarAngle?: number;
  rotateSpeed?: number;
  zoomSpeed?: number;
  panSpeed?: number;
  enableDamping?: boolean;
  dampingFactor?: number;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  target?: THREE.Vector3 | [number, number, number];
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

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const DEFAULTS: Required<Omit<OrbitControlsOptions, 'target'>> = {
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
  const opts = { ...DEFAULTS, ...options };
  const initialTarget = options.target
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
      return;
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
      return;
    }
    if (!dragging && !panning) return;
    const dx = e.clientX - lastPointer.x;
    const dy = e.clientY - lastPointer.y;
    lastPointer = { x: e.clientX, y: e.clientY };

    if (panning) {
      const right = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0);
      const up = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 1);
      const f = st.currentRadius * 0.0015 * opts.panSpeed;
      st.targetPanTarget.addScaledVector(right, -dx * f).addScaledVector(up, dy * f);
    } else {
      const f = 0.005 * opts.rotateSpeed;
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
    st.targetRadius = clamp(st.targetRadius * Math.exp(e.deltaY * 0.001 * opts.zoomSpeed), opts.minDistance, opts.maxDistance);
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
        st.targetTheta += opts.autoRotateSpeed * deltaSeconds * 0.15;
      }
      const d = opts.enableDamping ? 1 - Math.pow(1 - opts.dampingFactor, deltaSeconds * 60) : 1;
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
 * React wrapper. Prefer createOrbitControls inside useThreeScene's onSetup.
 * This hook exists for scenarios where camera+domElement are refs at render time.
 */
export function useOrbitControls(
  camera: THREE.PerspectiveCamera | null,
  domElement: HTMLElement | null,
  options?: OrbitControlsOptions
): RefObject<OrbitControlsHandle | null> {
  const ref = useRef<OrbitControlsHandle | null>(null);
  const optsRef = useRef(options); optsRef.current = options;

  useEffect(() => {
    if (!camera || !domElement) return;
    const controls = createOrbitControls(camera, domElement, optsRef.current);
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
