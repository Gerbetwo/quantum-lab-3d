'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { useTranslation } from '@/hooks/useTranslation';

export interface ScreenCoordinates {
  x: number;
  y: number;
  isVisible: boolean;
  z: number;
}

export interface SpatialTooltipOverlayProps {
  /** 3D position vector in world space to project onto screen */
  position: THREE.Vector3 | [number, number, number];
  /** Three.js camera used for project(). Accepts camera instance or ref */
  camera?: THREE.Camera | null | React.RefObject<THREE.Camera | null>;
  /** Optional container element or ref for measuring pixel bounds. Defaults to window */
  containerRef?: React.RefObject<HTMLElement | null>;
  /** 2D pixel offset [offsetX, offsetY] relative to projected point (default: [0, -12]) */
  offset?: [number, number];
  /** Optional spatial identifier */
  spatialId?: string;
  /** Explicit visibility toggle (default: true) */
  visible?: boolean;
  /** Content to display inside the tooltip */
  children?: React.ReactNode;
  /** Custom CSS classes */
  className?: string;
  /** Inline style overrides */
  style?: React.CSSProperties;
  /** Callback fired whenever screen coordinates are recalculated */
  onProject?: (coords: ScreenCoordinates) => void;
}

/**
 * Projects a 3D vector to 2D pixel coordinates using camera.project().
 */
export function project3DTo2D(
  position: THREE.Vector3,
  camera: THREE.Camera,
  containerWidth: number,
  containerHeight: number
): ScreenCoordinates {
  const p = position.clone().project(camera);
  const inNear = p.z >= -1;
  const inFar = p.z <= 1;
  const isVisible = inNear && inFar;
  const x = (p.x + 1) * 0.5 * containerWidth;
  const y = (-p.y + 1) * 0.5 * containerHeight;

  return { x, y, isVisible, z: p.z };
}

function toVector3(pos: THREE.Vector3 | [number, number, number]): THREE.Vector3 {
  if (pos instanceof THREE.Vector3) return pos;
  return new THREE.Vector3(pos[0], pos[1], pos[2]);
}

function resolveCamera(
  camera?: THREE.Camera | null | React.RefObject<THREE.Camera | null>
): THREE.Camera | null {
  if (!camera) return null;
  if ('current' in camera) return camera.current;
  return camera;
}

export function useFrameLoop(callback: () => void, active = true): void {
  const cbRef = useRef(callback);

  useEffect(() => {
    cbRef.current = callback;
  });

  useEffect(() => {
    if (!active || typeof window === 'undefined') return;

    let animId: number;
    const loop = () => {
      cbRef.current();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [active]);
}

/**
 * SpatialTooltipOverlay:
 * Projects a 3D mesh vector into 2D absolute pixel coordinates via camera.project(),
 * rendering content inside an accessible, themed tactical HUD card.
 */
export const SpatialTooltipOverlay: React.FC<SpatialTooltipOverlayProps> = ({
  position,
  camera: cameraProp,
  containerRef,
  offset = [0, -12],
  spatialId,
  visible = true,
  children,
  className = '',
  style = {},
  onProject,
}) => {
  const { t } = useTranslation();
  const posVec = useMemo(() => toVector3(position), [position]);

  const calculateProjection = useCallback((): ScreenCoordinates => {
    const activeCamera = resolveCamera(cameraProp);
    if (!activeCamera) {
      return { x: 0, y: 0, isVisible: false, z: 0 };
    }

    let width = typeof window !== 'undefined' ? window.innerWidth || 800 : 800;
    let height = typeof window !== 'undefined' ? window.innerHeight || 600 : 600;

    if (containerRef?.current) {
      const rect = containerRef.current.getBoundingClientRect();
      width = rect.width || width;
      height = rect.height || height;
    }

    return project3DTo2D(posVec, activeCamera, width, height);
  }, [cameraProp, containerRef, posVec]);

  const [screenCoords, setScreenCoords] = useState<ScreenCoordinates>(() => {
    if (cameraProp && 'isCamera' in cameraProp && (cameraProp as unknown as { isCamera: boolean }).isCamera) {
      const width = typeof window !== 'undefined' ? window.innerWidth || 800 : 800;
      const height = typeof window !== 'undefined' ? window.innerHeight || 600 : 600;
      return project3DTo2D(posVec, cameraProp as THREE.Camera, width, height);
    }
    return { x: 0, y: 0, isVisible: false, z: 0 };
  });

  const updateCoordinates = useCallback(() => {
    const projected = calculateProjection();

    setScreenCoords((prev) => {
      if (
        Math.abs(prev.x - projected.x) < 0.1 &&
        Math.abs(prev.y - projected.y) < 0.1 &&
        prev.isVisible === projected.isVisible
      ) {
        return prev;
      }
      return projected;
    });

    onProject?.(projected);
  }, [calculateProjection, onProject]);

  useFrameLoop(updateCoordinates, visible);

  if (!visible || !screenCoords.isVisible) {
    return null;
  }

  const left = screenCoords.x + offset[0];
  const top = screenCoords.y + offset[1];

  return (
    <div
      data-testid="spatial-tooltip-overlay"
      data-spatial-id={spatialId}
      aria-label={t('tooltip.info')}
      className={`absolute z-20 pointer-events-auto select-none transition-transform duration-75 ${className}`.trim()}
      style={{
        left: `${left}px`,
        top: `${top}px`,
        transform: 'translate(-50%, -100%)',
        zIndex: 20,
        ...style,
      }}
    >
      <div className="px-2.5 py-1.5 rounded-lg border border-border bg-card/90 text-foreground text-xs font-mono backdrop-blur-md shadow-lg">
        {children}
      </div>
    </div>
  );
};

export default SpatialTooltipOverlay;
