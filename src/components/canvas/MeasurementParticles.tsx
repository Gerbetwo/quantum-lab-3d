'use client';

import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import type { SceneHandle } from '@/lib/three/createScene';
import { prefersReducedMotion } from '@/lib/three/createScene';
import {
  createParticlePool, burst, tick, disposeParticlePool,
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
  sceneRef: React.MutableRefObject<SceneHandle | null>;
  maxInstances?: number;
}

const MeasurementParticles = forwardRef<MeasurementParticlesHandle, MeasurementParticlesProps>(
  function MeasurementParticles({ sceneRef, maxInstances = 1000 }, ref) {
    const poolRef = useRef<ParticlePool | null>(null);

    useEffect(() => {
      const handle = sceneRef.current;
      if (!handle) return;
      const pool = createParticlePool(maxInstances);
      poolRef.current = pool;
      handle.add(pool.mesh, 'measurement-particles');
      const detach = handle.onFrame((_elapsed, dt) => {
        tick(pool, Math.min(0.05, dt));
      });
      return () => {
        detach();
        try { handle.scene.remove(pool.mesh); } catch { /* ignore */ }
        disposeParticlePool(pool);
        poolRef.current = null;
      };
    }, [sceneRef, maxInstances]);

    useImperativeHandle(ref, () => ({
      trigger(opts: TriggerOptions) {
        if (prefersReducedMotion()) return;
        const pool = poolRef.current;
        if (!pool) return;
        burst(pool, {
          origin: opts.origin,
          color: opts.color,
          count: opts.count,
        });
      },
      dispose() {
        const pool = poolRef.current;
        if (pool) disposeParticlePool(pool);
      },
    }), []);

    return null;
  }
);

export default MeasurementParticles;
