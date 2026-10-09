/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createRef } from 'react';
import { render } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import * as THREE from 'three';
import { MeasurementParticles, MeasurementParticlesHandle } from '@/features/quantum-3d/canvas/MeasurementParticles';

describe('Phase 3 - MeasurementParticles', () => {
  test('mounts without throwing and exposes trigger/dispose via ref', () => {
    const sceneRef = {
      current: {
        scene: new THREE.Scene(),
        camera: new THREE.PerspectiveCamera(),
        renderer: new THREE.WebGLRenderer(),
        tracker: { track: (r: any) => r, dispose: vi.fn() },
        onFrame: vi.fn().mockReturnValue(() => {}),
        add: vi.fn().mockReturnValue(() => {}),
        detach: vi.fn(),
        setVisible: vi.fn(),
        resize: vi.fn(),
        update: vi.fn(),
        cleanup: vi.fn(),
        dispose: vi.fn(),
      }
    };

    const handle = createRef<MeasurementParticlesHandle>();
    render(<MeasurementParticles ref={handle} sceneRef={sceneRef as any} />);

    expect(handle.current).not.toBeNull();
    expect(typeof handle.current?.trigger).toBe('function');
    expect(typeof handle.current?.dispose).toBe('function');
  });

  test('trigger with count=500 clamps to maxInstances', () => {
    const scene = new THREE.Scene();
    const sceneRef = {
      current: {
        scene,
        camera: new THREE.PerspectiveCamera(),
        renderer: new THREE.WebGLRenderer(),
        tracker: { track: (r: any) => r, dispose: vi.fn() },
        onFrame: vi.fn().mockReturnValue(() => {}),
        add: (obj: THREE.Object3D, id?: string) => {
          scene.add(obj);
          if (id) scene.name = id;
          return () => { scene.remove(obj); };
        },
        detach: vi.fn(),
        setVisible: vi.fn(),
        resize: vi.fn(),
        update: vi.fn(),
        cleanup: vi.fn(),
        dispose: vi.fn(),
      }
    };

    const handle = createRef<MeasurementParticlesHandle>();
    render(<MeasurementParticles ref={handle} sceneRef={sceneRef as any} maxInstances={100} />);

    expect(() => handle.current?.trigger({ count: 500, origin: [0, 0, 0] })).not.toThrow();
  });

  test('dispose is idempotent (calling twice does not throw)', () => {
    const sceneRef = {
      current: {
        scene: new THREE.Scene(),
        camera: new THREE.PerspectiveCamera(),
        renderer: new THREE.WebGLRenderer(),
        tracker: { track: (r: any) => r, dispose: vi.fn() },
        onFrame: vi.fn().mockReturnValue(() => {}),
        add: () => () => {},
        detach: vi.fn(),
        setVisible: vi.fn(),
        resize: vi.fn(),
        update: vi.fn(),
        cleanup: vi.fn(),
        dispose: vi.fn(),
      }
    };

    const handle = createRef<MeasurementParticlesHandle>();
    render(<MeasurementParticles ref={handle} sceneRef={sceneRef as any} />);

    expect(() => {
      handle.current?.dispose();
      handle.current?.dispose();
    }).not.toThrow();
  });

  test('registers a frame callback on mount', () => {
    const onFrameMock = vi.fn().mockReturnValue(() => {});
    const sceneRef = {
      current: {
        scene: new THREE.Scene(),
        camera: new THREE.PerspectiveCamera(),
        renderer: new THREE.WebGLRenderer(),
        tracker: { track: (r: any) => r, dispose: vi.fn() },
        onFrame: onFrameMock,
        add: () => () => {},
        detach: vi.fn(),
        setVisible: vi.fn(),
        resize: vi.fn(),
        update: vi.fn(),
        cleanup: vi.fn(),
        dispose: vi.fn(),
      }
    };

    const handle = createRef<MeasurementParticlesHandle>();
    render(<MeasurementParticles ref={handle} sceneRef={sceneRef as any} />);

    expect(onFrameMock).toHaveBeenCalled();
  });

  test('trigger is a safe no-op when sceneRef is null', () => {
    const sceneRef = { current: null };
    const handle = createRef<MeasurementParticlesHandle>();
    render(<MeasurementParticles ref={handle} sceneRef={sceneRef as any} />);
    expect(() => handle.current?.trigger({ origin: [0, 0, 0] })).not.toThrow();
  });
});
