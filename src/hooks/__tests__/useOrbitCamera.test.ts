import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import * as THREE from 'three';
import { useOrbitCamera } from '../useOrbitCamera';

describe('useOrbitCamera Hook', () => {
  it('initializes with default spherical camera parameters', () => {
    const el = document.createElement('div');
    const containerRef = { current: el };

    const { result } = renderHook(() =>
      useOrbitCamera(containerRef, {
        initialRadius: 3.5,
        minRadius: 1.8,
        maxRadius: 7.0,
        initialTheta: Math.PI / 3,
        initialPhi: Math.PI / 4,
      })
    );

    expect(result.current.radiusRef.current).toBe(3.5);
    expect(result.current.thetaRef.current).toBeCloseTo(Math.PI / 3);
    expect(result.current.phiRef.current).toBeCloseTo(Math.PI / 4);
    expect(result.current.isOrbitingRef.current).toBe(false);
  });

  it('updates theta and phi on pointer drag', () => {
    const el = document.createElement('div');
    const containerRef = { current: el };

    const { result } = renderHook(() => useOrbitCamera(containerRef));

    act(() => {
      result.current.onPointerDown({ clientX: 100, clientY: 100 } as React.PointerEvent<HTMLElement>);
    });
    expect(result.current.isOrbitingRef.current).toBe(true);

    act(() => {
      result.current.onPointerMove({ clientX: 150, clientY: 120 } as React.PointerEvent<HTMLElement>);
    });

    // dx = 50 -> phi decreases by 50 * 0.008 = 0.4
    // dy = 20 -> theta decreases by 20 * 0.008 = 0.16
    expect(result.current.phiRef.current).toBeLessThan(Math.PI / 4);
    expect(result.current.thetaRef.current).toBeLessThan(Math.PI / 3);

    act(() => {
      result.current.onPointerUp();
    });
    expect(result.current.isOrbitingRef.current).toBe(false);
  });

  it('clamps polar angle theta to [0.1, π - 0.1] to prevent gimbal inversion', () => {
    const el = document.createElement('div');
    const containerRef = { current: el };

    const { result } = renderHook(() => useOrbitCamera(containerRef));

    act(() => {
      result.current.onPointerDown({ clientX: 0, clientY: 0 } as React.PointerEvent<HTMLElement>);
      // Huge dy upwards
      result.current.onPointerMove({ clientX: 0, clientY: 10000 } as React.PointerEvent<HTMLElement>);
    });
    expect(result.current.thetaRef.current).toBe(0.1);

    act(() => {
      // Huge dy downwards
      result.current.onPointerMove({ clientX: 0, clientY: -20000 } as React.PointerEvent<HTMLElement>);
    });
    expect(result.current.thetaRef.current).toBeCloseTo(Math.PI - 0.1);
  });

  it('handles wheel zoom clamping within [1.8, 7.0]', () => {
    const el = document.createElement('div');
    document.body.appendChild(el);
    const containerRef = { current: el };

    const { result } = renderHook(() =>
      useOrbitCamera(containerRef, {
        initialRadius: 3.5,
        minRadius: 1.8,
        maxRadius: 7.0,
      })
    );

    // Zoom in (negative deltaY)
    el.dispatchEvent(new WheelEvent('wheel', { deltaY: -1000, cancelable: true }));
    expect(result.current.radiusRef.current).toBe(1.8);

    // Zoom out (positive deltaY)
    el.dispatchEvent(new WheelEvent('wheel', { deltaY: 5000, cancelable: true }));
    expect(result.current.radiusRef.current).toBe(7.0);

    document.body.removeChild(el);
  });

  it('applies camera position and looks at origin', () => {
    const el = document.createElement('div');
    const containerRef = { current: el };
    const { result } = renderHook(() => useOrbitCamera(containerRef));

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    result.current.updateCamera(camera);

    expect(camera.position.length()).toBeCloseTo(3.5, 2);
  });

  it('offsets camera position and looks at custom target', () => {
    const el = document.createElement('div');
    const containerRef = { current: el };
    const { result } = renderHook(() =>
      useOrbitCamera(containerRef, {
        initialRadius: 5.0,
        target: [0, 1.2, 0],
      })
    );

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    result.current.updateCamera(camera);

    // Camera position should be offset by target y = 1.2
    const diff = camera.position.clone().sub(new THREE.Vector3(0, 1.2, 0));
    expect(diff.length()).toBeCloseTo(5.0, 2);
  });
});
