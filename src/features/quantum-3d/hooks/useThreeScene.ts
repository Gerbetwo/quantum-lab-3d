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

  // Stabilize arguments and factory references via refs to avoid infinite re-render loops
  const argsRef = useRef(restArgs);
  argsRef.current = restArgs;
  const optionsRef = useRef(optionsOrFirstArg);
  optionsRef.current = optionsOrFirstArg;
  const factoryRef = useRef(containerOrFactory);
  factoryRef.current = containerOrFactory;

  useEffect(() => {
    const container = internalRef.current;
    if (!container) return;

    let isDisposed = false;
    let controller: SceneHandle | null = null;
    let tracker: ResourceTracker | null = null;
    let cleanupFn: (() => void) | void = undefined;

    try {
      const currentFactory = factoryRef.current;
      const currentOptionsOrArg = optionsRef.current;
      const currentRest = argsRef.current;

      if (typeof currentFactory === 'function') {
        controller = createScene(container);
        if (isDisposed) {
          controller.dispose();
          return;
        }
        tracker = new ResourceTracker();
        const res = currentFactory(controller.scene, tracker, currentOptionsOrArg, ...currentRest);
        cleanupFn = () => {
          if (res && typeof (res as { dispose?: () => void }).dispose === 'function') {
            try {
              (res as { dispose: () => void }).dispose();
            } catch (e) {
              console.error('Error disposing scene resource return:', e);
            }
          }
        };
      } else {
        const options = (currentOptionsOrArg || {}) as ThreeSceneOptions;
        controller = createScene(container);
        if (isDisposed) {
          controller.dispose();
          return;
        }
        if (options.onSetup) {
          cleanupFn = options.onSetup(controller);
        }
      }
    } catch (error) {
      console.error('Error during ThreeScene initialization:', error);
      // Safe partial initialization recovery & cleanup
      if (controller && !isDisposed) {
        try {
          controller.dispose();
        } catch (_e) {
          // Suppress secondary teardown exceptions
        }
      }
      if (tracker && !isDisposed) {
        try {
          tracker.dispose();
        } catch (_e) {
          // Suppress secondary teardown exceptions
        }
      }
    }

    // Idempotent cleanup return guaranteed to stop loops, observers, and release resources safely
    return () => {
      if (isDisposed) return;
      isDisposed = true;

      if (typeof cleanupFn === 'function') {
        try {
          cleanupFn();
        } catch (e) {
          console.error('Error in scene cleanup function:', e);
        }
      }

      if (tracker) {
        try {
          tracker.dispose();
        } catch (e) {
          console.error('Error disposing resource tracker:', e);
        }
      }

      if (controller) {
        try {
          controller.dispose();
        } catch (e) {
          console.error('Error disposing scene controller:', e);
        }
      }
    };
  }, [containerOrFactory]);

  return internalRef;
}