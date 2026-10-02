'use client';

import { useEffect, useRef, type RefObject, type MutableRefObject } from 'react';
import {
  createScene,
  type SceneConfig,
  type SceneHandle,
} from '@/lib/three/createScene';

export interface UseThreeSceneOptions extends SceneConfig {
  recreateOn?: unknown;
  onSetup?: (handle: SceneHandle) => void | (() => void);
}

export function useThreeScene(
  containerRef: RefObject<HTMLElement | null>,
  options: UseThreeSceneOptions
): MutableRefObject<SceneHandle | null> {
  const handleRef = useRef<SceneHandle | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const recreateOn = options.recreateOn;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const opts = optionsRef.current;
    const handle = createScene(container, {
      width: container.clientWidth || opts.width,
      height: opts.height,
      cameraPos: opts.cameraPos,
      cameraLookAt: opts.cameraLookAt,
      fov: opts.fov,
      near: opts.near,
      far: opts.far,
      pixelRatioCap: opts.pixelRatioCap,
    });

    handleRef.current = handle;
    const setupCleanup = optionsRef.current.onSetup?.(handle);

    return () => {
      if (typeof setupCleanup === 'function') {
        try {
          setupCleanup();
        } catch {
          /* ignore */
        }
      }
      handle.dispose();
      handleRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recreateOn]);

  return handleRef;
}
