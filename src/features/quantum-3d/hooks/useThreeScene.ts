import { useEffect, useRef } from 'react';
import { createScene, SceneHandle } from '../lib/sceneManager';
import { ResourceTracker } from '@/features/quantum-3d/lib/resourceTracker';
import type * as THREE from 'three';

export interface ThreeSceneOptions {
  width?: number;
  height?: number;
  viewportRelative?: boolean;
  aspect?: number;
  cameraPos?: [number, number, number] | number[];
  cameraLookAt?: [number, number, number] | number[];
  recreateOn?: string;
  onSetup?: (handle: SceneHandle) => (() => void) | void;
}

export function useThreeScene(
  containerRef: React.RefObject<HTMLDivElement | null>,
  options?: ThreeSceneOptions
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
  optionsOrFirstArg?: ThreeSceneOptions | unknown,
  ...restArgs: unknown[]
): React.RefObject<HTMLDivElement | null> {
  const internalRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = internalRef.current;
    if (!container) return;

    if (typeof containerOrFactory === 'function') {
      const controller = createScene(container);
      const tracker = new ResourceTracker();

      const res = containerOrFactory(controller.scene, tracker, optionsOrFirstArg, ...restArgs);
      return () => {
        if (res && typeof (res as { dispose?: () => void }).dispose === 'function') {
          (res as { dispose: () => void }).dispose();
        }
        tracker.dispose();
        controller.dispose();
      };
    } else {
      const options = (optionsOrFirstArg || {}) as ThreeSceneOptions;
      const handle = createScene(container);
      let cleanupFn: (() => void) | void;
      if (options.onSetup) {
        cleanupFn = options.onSetup(handle);
      }
      return () => {
        if (typeof cleanupFn === 'function') {
          cleanupFn();
        }
        handle.dispose();
      };
    }
  }, [containerOrFactory, optionsOrFirstArg, restArgs]);

  return internalRef;
}
