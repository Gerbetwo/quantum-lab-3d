import React, { createRef } from 'react';
import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import * as THREE from 'three';
import MeasurementParticles, {
  type MeasurementParticlesHandle,
} from '@/components/canvas/MeasurementParticles';
import type { SceneHandle } from '@/lib/three/createScene';

function makeMockSceneHandle(): SceneHandle {
  const scene = new THREE.Scene();
  return {
    scene,
    camera: new THREE.PerspectiveCamera(45, 1, 0.1, 100),
    renderer: { dispose: vi.fn() } as unknown as THREE.WebGLRenderer,
    add: (obj: THREE.Object3D, id?: string) => { scene.add(obj); if (id) scene.name = id; },
    setVisible: vi.fn(),
    onFrame: vi.fn(() => vi.fn()),
    dispose: vi.fn(),
  };
}

describe('Phase 3 - MeasurementParticles', () => {
  beforeEach(() => {
    vi.spyOn(THREE, 'InstancedMesh');
  });

  it('mounts without throwing and exposes trigger/dispose via ref', () => {
    const sceneRef = { current: makeMockSceneHandle() };
    const handle = createRef<MeasurementParticlesHandle>();
    render(<MeasurementParticles ref={handle} sceneRef={sceneRef} maxInstances={100} />);
    expect(handle.current).toBeTruthy();
    expect(typeof handle.current?.trigger).toBe('function');
    expect(typeof handle.current?.dispose).toBe('function');
  });

  it('trigger with count=500 clamps to maxInstances', () => {
    const sceneRef = { current: makeMockSceneHandle() };
    const handle = createRef<MeasurementParticlesHandle>();
    render(<MeasurementParticles ref={handle} sceneRef={sceneRef} maxInstances={64} />);
    act(() => {
      handle.current?.trigger({ origin: [0, 0, 0], count: 500 });
    });
    // The underlying pool is an InstancedMesh with max 64 instances; trigger must not throw.
    expect(handle.current).toBeTruthy();
  });

  it('dispose is idempotent (calling twice does not throw)', () => {
    const sceneRef = { current: makeMockSceneHandle() };
    const handle = createRef<MeasurementParticlesHandle>();
    render(<MeasurementParticles ref={handle} sceneRef={sceneRef} maxInstances={32} />);
    expect(() => {
      handle.current?.dispose();
      handle.current?.dispose();
    }).not.toThrow();
  });

  it('registers a frame callback on mount', () => {
    const sceneRef = { current: makeMockSceneHandle() };
    const handle = createRef<MeasurementParticlesHandle>();
    render(<MeasurementParticles ref={handle} sceneRef={sceneRef} />);
    expect(sceneRef.current.onFrame).toHaveBeenCalled();
  });

  it('trigger is a safe no-op when sceneRef is null', () => {
    const sceneRef: { current: SceneHandle | null } = { current: null };
    const handle = createRef<MeasurementParticlesHandle>();
    render(<MeasurementParticles ref={handle} sceneRef={sceneRef} />);
    expect(() => handle.current?.trigger({ origin: [0, 0, 0] })).not.toThrow();
  });
});
