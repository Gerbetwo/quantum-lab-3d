"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import * as THREE from "three";
import { useSpatialTelemetryBridge } from "@/hooks/useSpatialTelemetryBridge";

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
  /** Optional spatial ID to synchronize hover/focus with useSpatialTelemetryBridge */
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
  // NDC: p.x in [-1, 1], p.y in [-1, 1], p.z in [-1, 1].
  const inNear = p.z >= -1;
  const inFar = p.z <= 1;
  const isVisible = inNear && inFar;
  const x = ((p.x + 1) * 0.5) * containerWidth;
  const y = ((-p.y + 1) * 0.5) * containerHeight;

  return { x, y, isVisible, z: p.z };
}

/**
 * Normalizes input vector into a THREE.Vector3 instance.
 */
function toVector3(pos: THREE.Vector3 | [number, number, number]): THREE.Vector3 {
  if (pos instanceof THREE.Vector3) return pos;
  return new THREE.Vector3(pos[0], pos[1], pos[2]);
}

/**
 * Resolves camera from either direct instance or React ref.
 */
function resolveCamera(
  camera?: THREE.Camera | null | React.RefObject<THREE.Camera | null>
): THREE.Camera | null {
  if (!camera) return null;
  if ("current" in camera) return camera.current;
  return camera;
}

/**
 * Frame subscriber hook that executes on every animation frame.
 * Compatible with standard requestAnimationFrame or R3F useFrame patterns.
 */
export function useFrameLoop(callback: () => void, active = true): void {
  const cbRef = useRef(callback);

  useEffect(() => {
    cbRef.current = callback;
  });

  useEffect(() => {
    if (!active || typeof window === "undefined") return;

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
 * rendering its children inside an absolutely positioned HTML container at z-index: 20.
 */
export const SpatialTooltipOverlay: React.FC<SpatialTooltipOverlayProps> = ({
  position,
  camera: cameraProp,
  containerRef,
  offset = [0, -12],
  spatialId,
  visible = true,
  children,
  className = "",
  style = {},
  onProject,
}) => {
  const activeFocusId = useSpatialTelemetryBridge((s) => s.activeFocusId);
  const isHighlighted = spatialId ? activeFocusId === spatialId : false;

  const posVec = useMemo(() => toVector3(position), [position]);

  const calculateProjection = useCallback((): ScreenCoordinates => {
    const activeCamera = resolveCamera(cameraProp);
    if (!activeCamera) {
      return { x: 0, y: 0, isVisible: false, z: 0 };
    }

    let width = typeof window !== "undefined" ? window.innerWidth || 800 : 800;
    let height = typeof window !== "undefined" ? window.innerHeight || 600 : 600;

    if (containerRef?.current) {
      const rect = containerRef.current.getBoundingClientRect();
      width = rect.width || width;
      height = rect.height || height;
    }

    return project3DTo2D(posVec, activeCamera, width, height);
  }, [cameraProp, containerRef, posVec]);

  // If a direct THREE.Camera instance is provided (not a ref), compute initial coordinates synchronously
  const [screenCoords, setScreenCoords] = useState<ScreenCoordinates>(() => {
    if (cameraProp && "isCamera" in cameraProp && (cameraProp as unknown as { isCamera: boolean }).isCamera) {
      const width = typeof window !== "undefined" ? window.innerWidth || 800 : 800;
      const height = typeof window !== "undefined" ? window.innerHeight || 600 : 600;
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

  // Run update on every animation frame for fluid 60fps tracking during rotations
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
      className={`absolute z-20 pointer-events-auto select-none transition-transform duration-75 ${
        isHighlighted ? "scale-105" : "scale-100"
      } ${className}`.trim()}
      style={{
        left: `${left}px`,
        top: `${top}px`,
        transform: "translate(-50%, -100%)",
        zIndex: 20,
        ...style,
      }}
    >
      <div
        className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono backdrop-blur-md transition-colors shadow-lg ${
          isHighlighted
            ? "bg-surface-2/95 border-quantum-cyan text-quantum-cyan shadow-[0_0_15px_rgba(0,243,255,0.25)]"
            : "bg-surface-1/90 border-white/10 text-foreground"
        }`}
      >
        {children}
      </div>
    </div>
  );
};
