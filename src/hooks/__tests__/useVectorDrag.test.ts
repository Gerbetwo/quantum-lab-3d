import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import * as THREE from "three";
import {
  useVectorDrag,
  pointerCoordsToNdc,
  anglesToSphericalVector,
  vectorToSphericalCoordinates,
  raycastToSphereAngles,
} from "../useVectorDrag";

describe("useVectorDrag - Mathematical Utilities", () => {
  it("translates 2D client coordinates to Normalized Device Coordinates (NDC)", () => {
    const rect = { left: 100, top: 100, width: 400, height: 200 };

    // Center of element -> NDC (0, 0)
    const centerNdc = pointerCoordsToNdc(300, 200, rect);
    expect(centerNdc.x).toBeCloseTo(0, 5);
    expect(centerNdc.y).toBeCloseTo(0, 5);

    // Top-left -> NDC (-1, 1)
    const topLeftNdc = pointerCoordsToNdc(100, 100, rect);
    expect(topLeftNdc.x).toBeCloseTo(-1, 5);
    expect(topLeftNdc.y).toBeCloseTo(1, 5);

    // Bottom-right -> NDC (1, -1)
    const bottomRightNdc = pointerCoordsToNdc(500, 300, rect);
    expect(bottomRightNdc.x).toBeCloseTo(1, 5);
    expect(bottomRightNdc.y).toBeCloseTo(-1, 5);

    // Handles zero dimension defensively
    const zeroRect = { left: 0, top: 0, width: 0, height: 0 };
    expect(pointerCoordsToNdc(50, 50, zeroRect)).toEqual({ x: 0, y: 0 });
  });

  it("converts angles to spherical 3D vectors and back (round-trip)", () => {
    // North pole (|0⟩): θ = 0 -> (0, 1, 0)
    const v0 = anglesToSphericalVector(0, 0, 1.0);
    expect(v0.x).toBeCloseTo(0, 5);
    expect(v0.y).toBeCloseTo(1, 5);
    expect(v0.z).toBeCloseTo(0, 5);
    const coords0 = vectorToSphericalCoordinates(v0);
    expect(coords0.theta).toBeCloseTo(0, 5);

    // South pole (|1⟩): θ = π -> (0, -1, 0)
    const v1 = anglesToSphericalVector(Math.PI, 0, 1.0);
    expect(v1.x).toBeCloseTo(0, 5);
    expect(v1.y).toBeCloseTo(-1, 5);
    expect(v1.z).toBeCloseTo(0, 5);
    const coords1 = vectorToSphericalCoordinates(v1);
    expect(coords1.theta).toBeCloseTo(Math.PI, 5);

    // Superposition state |+⟩: θ = π/2, φ = 0 -> (1, 0, 0)
    const vPlus = anglesToSphericalVector(Math.PI / 2, 0, 1.0);
    expect(vPlus.x).toBeCloseTo(1, 5);
    expect(vPlus.y).toBeCloseTo(0, 5);
    expect(vPlus.z).toBeCloseTo(0, 5);
    const coordsPlus = vectorToSphericalCoordinates(vPlus);
    expect(coordsPlus.theta).toBeCloseTo(Math.PI / 2, 5);
    expect(coordsPlus.phi).toBeCloseTo(0, 5);

    // Superposition state |+i⟩: θ = π/2, φ = π/2 -> (0, 0, 1)
    const vPlusI = anglesToSphericalVector(Math.PI / 2, Math.PI / 2, 1.0);
    expect(vPlusI.x).toBeCloseTo(0, 5);
    expect(vPlusI.y).toBeCloseTo(0, 5);
    expect(vPlusI.z).toBeCloseTo(1, 5);
    const coordsPlusI = vectorToSphericalCoordinates(vPlusI);
    expect(coordsPlusI.theta).toBeCloseTo(Math.PI / 2, 5);
    expect(coordsPlusI.phi).toBeCloseTo(Math.PI / 2, 5);
  });

  it("raycasts from camera to unit sphere with smooth fallback when ray misses", () => {
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();

    const raycaster = new THREE.Raycaster();

    // Direct hit at center of screen -> hits sphere front facing camera (0, 0, 1)
    const hitCenter = raycastToSphereAngles(raycaster, camera, 0, 0, new THREE.Vector3(0, 0, 0), 1.0);
    expect(hitCenter.theta).toBeCloseTo(Math.PI / 2, 3);
    expect(hitCenter.phi).toBeCloseTo(Math.PI / 2, 3);
    expect(hitCenter.unitVector.z).toBeCloseTo(1, 2);

    // Off-sphere ray (far to the right, NDC x = 0.9, y = 0.0) -> ray misses silhouette
    // fallback calculates closest point and projects to surface
    const hitMiss = raycastToSphereAngles(raycaster, camera, 0.9, 0.0, new THREE.Vector3(0, 0, 0), 1.0);
    expect(hitMiss.theta).toBeGreaterThanOrEqual(0);
    expect(hitMiss.theta).toBeLessThanOrEqual(Math.PI);
    expect(hitMiss.phi).toBeGreaterThanOrEqual(0);
    expect(hitMiss.phi).toBeLessThanOrEqual(2 * Math.PI);
    expect(hitMiss.unitVector.length()).toBeCloseTo(1.0, 5);
  });
});

describe("useVectorDrag - Hook Interaction & Lifecycle", () => {
  it("initializes with provided angles and updates via updateFromNdc", () => {
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();

    const { result } = renderHook(() =>
      useVectorDrag({
        camera,
        initialTheta: Math.PI / 4,
        initialPhi: Math.PI / 3,
      })
    );

    expect(result.current.isDragging).toBe(false);
    expect(result.current.theta).toBeCloseTo(Math.PI / 4, 5);
    expect(result.current.phi).toBeCloseTo(Math.PI / 3, 5);
    expect(result.current.spherical.theta).toBeCloseTo(Math.PI / 4, 5);

    // Call updateFromNdc
    act(() => {
      result.current.updateFromNdc(0, 0);
    });

    expect(result.current.theta).toBeCloseTo(Math.PI / 2, 2);
    expect(result.current.phi).toBeCloseTo(Math.PI / 2, 2);
  });

  it("supports programmatic setAngles and setTargetVector", () => {
    const { result } = renderHook(() => useVectorDrag());

    act(() => {
      result.current.setAngles(Math.PI / 3, Math.PI / 6);
    });

    expect(result.current.theta).toBeCloseTo(Math.PI / 3, 5);
    expect(result.current.phi).toBeCloseTo(Math.PI / 6, 5);

    act(() => {
      result.current.setTargetVector(new THREE.Vector3(0, 1, 0));
    });

    expect(result.current.theta).toBeCloseTo(0, 5);
  });

  it("triggers onDragStart, onDrag, and onDragEnd callbacks during pointer lifecycle", () => {
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();

    const onDragStart = vi.fn();
    const onDrag = vi.fn();
    const onDragEnd = vi.fn();

    const { result } = renderHook(() =>
      useVectorDrag({
        camera,
        onDragStart,
        onDrag,
        onDragEnd,
      })
    );

    const mockElement = {
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 200, height: 200 }),
      setPointerCapture: vi.fn(),
      releasePointerCapture: vi.fn(),
    } as unknown as HTMLElement;

    // Pointer down at center
    act(() => {
      result.current.onPointerDown({
        clientX: 100,
        clientY: 100,
        pointerId: 1,
        target: mockElement,
      } as unknown as React.PointerEvent<HTMLElement>);
    });

    expect(result.current.isDragging).toBe(true);
    expect(onDragStart).toHaveBeenCalledTimes(1);

    // Pointer move
    act(() => {
      result.current.onPointerMove({
        clientX: 120,
        clientY: 90,
        pointerId: 1,
        target: mockElement,
      } as unknown as React.PointerEvent<HTMLElement>);
    });

    expect(onDrag).toHaveBeenCalledTimes(1);

    // Pointer up
    act(() => {
      result.current.onPointerUp({
        pointerId: 1,
        target: mockElement,
      } as unknown as React.PointerEvent<HTMLElement>);
    });

    expect(result.current.isDragging).toBe(false);
    expect(onDragEnd).toHaveBeenCalledTimes(1);
  });
});
