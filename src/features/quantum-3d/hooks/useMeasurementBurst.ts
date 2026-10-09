'use client';

import { useCallback, useRef, type MutableRefObject } from 'react';
import type { SceneHandle } from '@/features/quantum-3d/lib/createScene';
import type { MeasurementParticlesHandle, TriggerOptions } from '@/features/quantum-3d/canvas/MeasurementParticles';

export interface UseMeasurementBurstResult {
  controllerRef: MutableRefObject<MeasurementParticlesHandle | null>;
  burst: (origin?: [number, number, number], color?: number) => void;
}

const DEFAULT_ORIGIN: [number, number, number] = [0, 0, 0];

export function useMeasurementBurst(
  _sceneRef: MutableRefObject<SceneHandle | null>
): UseMeasurementBurstResult {
  const controllerRef = useRef<MeasurementParticlesHandle | null>(null);

  const burst = useCallback((origin: [number, number, number] = DEFAULT_ORIGIN, color?: number) => {
    const ctrl = controllerRef.current;
    if (!ctrl) return;
    const opts: TriggerOptions = { origin };
    if (color !== undefined) opts.color = color;
    opts.count = 200;
    ctrl.trigger(opts);
  }, []);

  return { controllerRef, burst };
}
