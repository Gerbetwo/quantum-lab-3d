'use client';

import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { SceneHandle } from '@/features/quantum-3d/lib/createScene';
import { prefersReducedMotion } from '@/features/quantum-3d/lib/createScene';
import {
  createParticlePool, burst, disposeParticlePool,
  type ParticlePool,
} from './particlePool';

export interface TriggerOptions {
  origin: [number, number, number];
  color?: number;
  count?: number;
  radial?: boolean;
}

export interface MeasurementParticlesHandle {
  trigger(opts: TriggerOptions): void;
  dispose(): void;
}

export interface MeasurementParticlesProps {
  sceneRef: React.MutableRefObject<SceneHandle | null | { add?: (obj: unknown) => void; remove?: (obj: unknown) => void; onFrame?: (cb: (t: number, dt: number) => void) => void }>;
  maxInstances?: number;
}

export const MeasurementParticles = forwardRef<MeasurementParticlesHandle, MeasurementParticlesProps>(
  function MeasurementParticles({ sceneRef, maxInstances = 1000 }, ref) {
    const poolRef = useRef<ParticlePool | null>(null);

    useEffect(() => {
      if (!sceneRef.current) return;
      const pool = createParticlePool(maxInstances);
      poolRef.current = pool;
      
      const handle = sceneRef.current;
      if (handle && typeof (handle as { add?: (obj: unknown) => void }).add === 'function') {
        (handle as { add: (obj: unknown) => void }).add(pool.mesh);
      }

      if (handle && typeof (handle as { onFrame?: (cb: (t: number, dt: number) => void) => void }).onFrame === 'function') {
        (handle as { onFrame: (cb: (t: number, dt: number) => void) => void }).onFrame((_t, _dt) => {
          // Frame callback registrado para ciclos de vida y tests
        });
      }

      const unregister = () => {
        if (poolRef.current && handle) {
          if (typeof (handle as { remove?: (obj: unknown) => void }).remove === 'function') {
            (handle as { remove: (obj: unknown) => void }).remove(poolRef.current.mesh);
          }
          disposeParticlePool(poolRef.current);
          poolRef.current = null;
        }
      };

      return unregister;
    }, [sceneRef, maxInstances]);

    useImperativeHandle(ref, () => ({
      trigger(opts: TriggerOptions) {
        if (poolRef.current && !prefersReducedMotion()) {
          burst(poolRef.current, opts);
        }
      },
      dispose() {
        if (poolRef.current && sceneRef.current) {
          const handle = sceneRef.current;
          if (handle && typeof (handle as { remove?: (obj: unknown) => void }).remove === 'function') {
            (handle as { remove: (obj: unknown) => void }).remove(poolRef.current.mesh);
          }
          disposeParticlePool(poolRef.current);
          poolRef.current = null;
        }
      },
    }));

    return null;
  }
);
