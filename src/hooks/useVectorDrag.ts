import { useState, useRef, useCallback, useEffect } from "react";
import * as THREE from "three";
import { normalizeAngleTheta, normalizeAnglePhi } from "@/core/qubitMath";

export interface SphericalCoordinates {
  /** Polar angle θ in radians, bounded to [0, π] */
  theta: number;
  /** Azimuthal angle φ in radians, normalized to [0, 2π) */
  phi: number;
}

export interface DragCalculationResult extends SphericalCoordinates {
  /** Raycasted 3D target point on the sphere */
  targetVector: THREE.Vector3;
  /** Unit vector pointing from center to target */
  unitVector: THREE.Vector3;
  /** Normalized device coordinates (-1 to 1) */
  ndc: { x: number; y: number };
}

export interface UseVectorDragOptions {
  /** Three.js camera used for unprojection / raycasting */
  camera?: THREE.Camera | null | React.RefObject<THREE.Camera | null>;
  /** Bloch sphere center point in 3D world space (default: (0, 0, 0)) */
  center?: THREE.Vector3;
  /** Bloch sphere radius in world units (default: 1.0) */
  radius?: number;
  /** Initial polar angle θ in radians (default: 0) */
  initialTheta?: number;
  /** Initial azimuthal angle φ in radians (default: 0) */
  initialPhi?: number;
  /** Whether drag interaction is enabled (default: true) */
  enabled?: boolean;
  /** Optional callback fired when drag starts */
  onDragStart?: (coords: SphericalCoordinates, vector: THREE.Vector3) => void;
  /** Optional callback fired on each pointer move during drag */
  onDrag?: (coords: SphericalCoordinates, vector: THREE.Vector3) => void;
  /** Optional callback fired when drag finishes */
  onDragEnd?: (coords: SphericalCoordinates, vector: THREE.Vector3) => void;
}

export interface VectorDragState {
  /** Whether the user is currently actively dragging */
  isDragging: boolean;
  /** Current 3D position vector on the sphere surface */
  targetVector: THREE.Vector3;
  /** Polar angle θ in [0, π] */
  theta: number;
  /** Azimuthal angle φ in [0, 2π) */
  phi: number;
  /** Grouped spherical coordinates */
  spherical: SphericalCoordinates;
}

export interface UseVectorDragReturn extends VectorDragState {
  /** Attach to onPointerDown of canvas or handle element */
  onPointerDown: (e: PointerEvent | React.PointerEvent<HTMLElement>) => void;
  /** Attach to onPointerMove of canvas or window */
  onPointerMove: (e: PointerEvent | React.PointerEvent<HTMLElement>) => void;
  /** Attach to onPointerUp of canvas or window */
  onPointerUp: (e?: PointerEvent | React.PointerEvent<HTMLElement>) => void;
  /** Attach to onPointerCancel of canvas or window */
  onPointerCancel: (e?: PointerEvent | React.PointerEvent<HTMLElement>) => void;

  /** Programmatically update state from client 2D pixel coordinates and container rect */
  updateFromPointer: (
    clientX: number,
    clientY: number,
    rect: { left: number; top: number; width: number; height: number }
  ) => DragCalculationResult | null;

  /** Programmatically update state from normalized device coordinates [-1, 1] */
  updateFromNdc: (ndcX: number, ndcY: number) => DragCalculationResult | null;

  /** Explicitly set angles and synchronize 3D target vector */
  setAngles: (theta: number, phi: number) => void;

  /** Explicitly set target vector and derive angles */
  setTargetVector: (vec: THREE.Vector3) => void;

  /** Reset drag state and angles to initial values */
  reset: () => void;
}

/**
 * Convert 2D client coordinates and container bounds to Normalized Device Coordinates (NDC) in [-1, 1].
 */
export function pointerCoordsToNdc(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number }
): { x: number; y: number } {
  if (rect.width <= 0 || rect.height <= 0) {
    return { x: 0, y: 0 };
  }
  const x = ((clientX - rect.left) / rect.width) * 2 - 1;
  const y = -((clientY - rect.top) / rect.height) * 2 + 1;
  return {
    x: Math.max(-1, Math.min(1, x)),
    y: Math.max(-1, Math.min(1, y)),
  };
}

/**
 * Pure function to compute 3D target vector from spherical angles.
 */
export function anglesToSphericalVector(
  theta: number,
  phi: number,
  radius = 1.0,
  center = new THREE.Vector3(0, 0, 0)
): THREE.Vector3 {
  const normTheta = normalizeAngleTheta(theta);
  const normPhi = normalizeAnglePhi(phi);
  const sinT = Math.sin(normTheta);

  return new THREE.Vector3(
    center.x + radius * sinT * Math.cos(normPhi),
    center.y + radius * Math.cos(normTheta),
    center.z + radius * sinT * Math.sin(normPhi)
  );
}

/**
 * Pure function to compute spherical angles from a 3D vector relative to a center.
 */
export function vectorToSphericalCoordinates(
  vector: THREE.Vector3,
  center = new THREE.Vector3(0, 0, 0)
): SphericalCoordinates {
  const dx = vector.x - center.x;
  const dy = vector.y - center.y;
  const dz = vector.z - center.z;
  const len = Math.hypot(dx, dy, dz);

  if (len < 1e-6) {
    return { theta: 0, phi: 0 };
  }

  const clampedY = Math.max(-1, Math.min(1, dy / len));
  const theta = normalizeAngleTheta(Math.acos(clampedY));
  let phi = Math.atan2(dz, dx);
  if (phi < 0) phi += 2 * Math.PI;

  return { theta, phi: normalizeAnglePhi(phi) };
}

/**
 * Raycast from camera using NDC coordinates onto a sphere.
 * If the ray misses the sphere silhouette, falls back to the closest point on the ray
 * projected outward to preserve smooth rotational dragging.
 */
export function raycastToSphereAngles(
  raycaster: THREE.Raycaster,
  camera: THREE.Camera,
  ndcX: number,
  ndcY: number,
  center = new THREE.Vector3(0, 0, 0),
  radius = 1.0
): DragCalculationResult {
  raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

  const sphere = new THREE.Sphere(center, radius);
  const hitPoint = new THREE.Vector3();
  const hasHit = raycaster.ray.intersectSphere(sphere, hitPoint);

  if (!hasHit) {
    raycaster.ray.closestPointToPoint(center, hitPoint);
    const offset = hitPoint.clone().sub(center);
    if (offset.lengthSq() > 1e-8) {
      offset.normalize().multiplyScalar(radius);
      hitPoint.copy(center).add(offset);
    } else {
      hitPoint.copy(center).add(new THREE.Vector3(0, radius, 0));
    }
  }

  const { theta, phi } = vectorToSphericalCoordinates(hitPoint, center);
  const unitVector = hitPoint.clone().sub(center).normalize();

  return {
    theta,
    phi,
    targetVector: hitPoint,
    unitVector,
    ndc: { x: ndcX, y: ndcY },
  };
}

/**
 * Safely resolves camera from direct instance or React ref.
 */
function resolveCamera(
  camera?: THREE.Camera | null | React.RefObject<THREE.Camera | null>
): THREE.Camera | null {
  if (!camera) return null;
  if ("current" in camera) return camera.current;
  return camera;
}

/**
 * Custom React hook for translating 2D pointer coordinates on a Three.js canvas
 * into 3D spherical angles (θ ∈ [0, π], φ ∈ [0, 2π]) with raycasting and drag tracking.
 */
export function useVectorDrag(options: UseVectorDragOptions = {}): UseVectorDragReturn {
  const {
    camera: cameraProp,
    center = new THREE.Vector3(0, 0, 0),
    radius = 1.0,
    initialTheta = 0,
    initialPhi = 0,
    enabled = true,
    onDragStart,
    onDrag,
    onDragEnd,
  } = options;

  const [isDragging, setIsDragging] = useState(false);
  const [theta, setThetaState] = useState(() => normalizeAngleTheta(initialTheta));
  const [phi, setPhiState] = useState(() => normalizeAnglePhi(initialPhi));
  const [targetVector, setTargetVectorState] = useState(() =>
    anglesToSphericalVector(initialTheta, initialPhi, radius, center)
  );

  const isDraggingRef = useRef(isDragging);
  isDraggingRef.current = isDragging;

  const thetaRef = useRef(theta);
  thetaRef.current = theta;

  const phiRef = useRef(phi);
  phiRef.current = phi;

  const raycasterRef = useRef<THREE.Raycaster | null>(null);
  if (!raycasterRef.current) {
    raycasterRef.current = new THREE.Raycaster();
  }

  const camera = resolveCamera(cameraProp);

  const calculateFromNdc = useCallback(
    (ndcX: number, ndcY: number): DragCalculationResult | null => {
      const activeCamera = resolveCamera(cameraProp);
      if (!activeCamera) return null;
      return raycastToSphereAngles(
        raycasterRef.current!,
        activeCamera,
        ndcX,
        ndcY,
        center,
        radius
      );
    },
    [cameraProp, center, radius]
  );

  const updateFromNdc = useCallback(
    (ndcX: number, ndcY: number): DragCalculationResult | null => {
      const result = calculateFromNdc(ndcX, ndcY);
      if (!result) return null;

      setThetaState(result.theta);
      setPhiState(result.phi);
      setTargetVectorState(result.targetVector);

      return result;
    },
    [calculateFromNdc]
  );

  const updateFromPointer = useCallback(
    (
      clientX: number,
      clientY: number,
      rect: { left: number; top: number; width: number; height: number }
    ): DragCalculationResult | null => {
      const ndc = pointerCoordsToNdc(clientX, clientY, rect);
      return updateFromNdc(ndc.x, ndc.y);
    },
    [updateFromNdc]
  );

  const setAngles = useCallback(
    (newTheta: number, newPhi: number) => {
      const t = normalizeAngleTheta(newTheta);
      const p = normalizeAnglePhi(newPhi);
      setThetaState(t);
      setPhiState(p);
      setTargetVectorState(anglesToSphericalVector(t, p, radius, center));
    },
    [center, radius]
  );

  const setTargetVector = useCallback(
    (vec: THREE.Vector3) => {
      const { theta: t, phi: p } = vectorToSphericalCoordinates(vec, center);
      setThetaState(t);
      setPhiState(p);
      setTargetVectorState(vec.clone());
    },
    [center]
  );

  const reset = useCallback(() => {
    setIsDragging(false);
    const t = normalizeAngleTheta(initialTheta);
    const p = normalizeAnglePhi(initialPhi);
    setThetaState(t);
    setPhiState(p);
    setTargetVectorState(anglesToSphericalVector(t, p, radius, center));
  }, [initialTheta, initialPhi, center, radius]);

  const onPointerDown = useCallback(
    (e: PointerEvent | React.PointerEvent<HTMLElement>) => {
      if (!enabled) return;

      const target = e.target as HTMLElement | null;
      try {
        target?.setPointerCapture?.(e.pointerId);
      } catch {
        // Safe fallback in test or non-supporting environments
      }

      const rect =
        target?.getBoundingClientRect() ?? {
          left: 0,
          top: 0,
          width: window.innerWidth || 800,
          height: window.innerHeight || 600,
        };

      setIsDragging(true);
      const result = updateFromPointer(e.clientX, e.clientY, rect);

      if (result) {
        onDragStart?.({ theta: result.theta, phi: result.phi }, result.targetVector);
      }
    },
    [enabled, updateFromPointer, onDragStart]
  );

  const onPointerMove = useCallback(
    (e: PointerEvent | React.PointerEvent<HTMLElement>) => {
      if (!enabled || !isDraggingRef.current) return;

      const target = e.target as HTMLElement | null;
      const rect =
        target?.getBoundingClientRect() ?? {
          left: 0,
          top: 0,
          width: window.innerWidth || 800,
          height: window.innerHeight || 600,
        };

      const result = updateFromPointer(e.clientX, e.clientY, rect);
      if (result) {
        onDrag?.({ theta: result.theta, phi: result.phi }, result.targetVector);
      }
    },
    [enabled, updateFromPointer, onDrag]
  );

  const onPointerUp = useCallback(
    (e?: PointerEvent | React.PointerEvent<HTMLElement>) => {
      if (!isDraggingRef.current) return;

      if (e) {
        const target = e.target as HTMLElement | null;
        try {
          target?.releasePointerCapture?.(e.pointerId);
        } catch {
          // Safe fallback
        }
      }

      setIsDragging(false);
      onDragEnd?.(
        { theta: thetaRef.current, phi: phiRef.current },
        anglesToSphericalVector(thetaRef.current, phiRef.current, radius, center)
      );
    },
    [center, radius, onDragEnd]
  );

  const onPointerCancel = useCallback(
    (e?: PointerEvent | React.PointerEvent<HTMLElement>) => {
      onPointerUp(e);
    },
    [onPointerUp]
  );

  // Sync internal angles if initial options change dynamically
  useEffect(() => {
    if (!isDraggingRef.current) {
      const t = normalizeAngleTheta(initialTheta);
      const p = normalizeAnglePhi(initialPhi);
      setThetaState(t);
      setPhiState(p);
      setTargetVectorState(anglesToSphericalVector(t, p, radius, center));
    }
  }, [initialTheta, initialPhi, radius, center]);

  return {
    isDragging,
    targetVector,
    theta,
    phi,
    spherical: { theta, phi },
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    updateFromPointer,
    updateFromNdc,
    setAngles,
    setTargetVector,
    reset,
  };
}
