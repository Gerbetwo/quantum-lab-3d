import { useEffect, useRef } from 'react';
import { createScene, SceneHandle } from '../lib/three/createScene';
import { ResourceTracker } from '../lib/three/resourceTracker';
import * as THREE from 'three';

export interface SceneConfig {
  width?: number;
  height?: number;
  viewportRelative?: boolean;
  aspect?: number;
  cameraPos?: [number, number, number];
  cameraLookAt?: [number, number, number];
  recreateOn?: string;
  onSetup?: (handle: SceneHandle) => void;
  onResize?: (width: number, height: number) => void;
}

export function useThreeScene(
  initFnOrRef: React.RefObject<HTMLDivElement | null> | ((scene: THREE.Scene, tracker: ResourceTracker) => { update: (theta: number, phi?: number) => void }),
  configOrTheta?: SceneConfig | number,
  phiArg: number = 0
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<SceneHandle | null>(null);
  const configRef = useRef(configOrTheta);
  configRef.current = configOrTheta;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let initFn: (scene: THREE.Scene, tracker: ResourceTracker) => { update: (theta: number, phi?: number) => void };

    if (typeof initFnOrRef === 'function') {
      initFn = initFnOrRef;
    } else {
      const cfg = configRef.current as SceneConfig;
      initFn = (_scene, _tracker) => {
        const handle = createScene(container);
        if (cfg && cfg.onSetup) {
          cfg.onSetup(handle);
        }
        return {
          update: () => {}
        };
      };
    }

    const controller = createScene(container, initFn);
    controllerRef.current = controller;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        controller.resize(width, height);
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      controller.dispose();
      controllerRef.current = null;
    };
  }, [initFnOrRef]);

  useEffect(() => {
    if (controllerRef.current && typeof configOrTheta === 'number') {
      controllerRef.current.update(configOrTheta, phiArg);
    }
  }, [configOrTheta, phiArg]);

  return containerRef;
}
