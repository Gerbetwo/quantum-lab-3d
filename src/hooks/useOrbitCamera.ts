'use client';

import { useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';

export interface UseOrbitCameraOptions {
  initialRadius?: number;
  minRadius?: number;
  maxRadius?: number;
  initialTheta?: number;
  initialPhi?: number;
  enabled?: boolean;
}

export function useOrbitCamera(
  containerRef: React.RefObject<HTMLElement | null>,
  options: UseOrbitCameraOptions = {}
) {
  const {
    initialRadius = 3.5,
    minRadius = 1.8,
    maxRadius = 7.0,
    initialTheta = Math.PI / 3,
    initialPhi = Math.PI / 4,
    enabled = true,
  } = options;

  const radiusRef = useRef(initialRadius);
  const thetaRef = useRef(initialTheta);
  const phiRef = useRef(initialPhi);
  const isOrbitingRef = useRef(false);
  const lastMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement> | PointerEvent) => {
      if (!enabled) return;
      isOrbitingRef.current = true;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      try {
        const target = e.target as HTMLElement | null;
        target?.setPointerCapture?.(e.pointerId);
      } catch {
        // Safe fallback in test environments
      }
    },
    [enabled]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement> | PointerEvent) => {
      if (!isOrbitingRef.current) return;
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };

      phiRef.current -= dx * 0.008;
      thetaRef.current = Math.max(
        0.1,
        Math.min(Math.PI - 0.1, thetaRef.current - dy * 0.008)
      );
    },
    []
  );

  const onPointerUp = useCallback(
    (e?: React.PointerEvent<HTMLElement> | PointerEvent) => {
      isOrbitingRef.current = false;
      if (e) {
        try {
          const target = e.target as HTMLElement | null;
          target?.releasePointerCapture?.(e.pointerId);
        } catch {
          // Safe fallback
        }
      }
    },
    []
  );

  const onPointerCancel = useCallback(
    (e?: React.PointerEvent<HTMLElement> | PointerEvent) => {
      onPointerUp(e);
    },
    [onPointerUp]
  );

  const onPointerLeave = useCallback(() => {
    isOrbitingRef.current = false;
  }, []);

  // Native non-passive wheel listener for smooth zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !enabled) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      radiusRef.current = Math.max(
        minRadius,
        Math.min(maxRadius, radiusRef.current + e.deltaY * 0.003)
      );
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [containerRef, enabled, minRadius, maxRadius]);

  const updateCamera = useCallback((camera: THREE.Camera) => {
    const r = radiusRef.current;
    const th = thetaRef.current;
    const ph = phiRef.current;
    camera.position.set(
      r * Math.sin(th) * Math.cos(ph),
      r * Math.cos(th),
      r * Math.sin(th) * Math.sin(ph)
    );
    camera.lookAt(0, 0, 0);
  }, []);

  return {
    radiusRef,
    thetaRef,
    phiRef,
    isOrbitingRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onPointerLeave,
    updateCamera,
  };
}

export default useOrbitCamera;
