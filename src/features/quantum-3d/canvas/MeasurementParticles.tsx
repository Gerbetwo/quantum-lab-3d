'use client';

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import type { SceneHandle } from '../lib/sceneManager';
import { prefersReducedMotion } from '../lib/sceneManager';
import {
  createParticlePool,
  burst,
  disposeParticlePool,
  tick,
  type ParticlePool,
} from './particlePool';
import { useQuantumStore } from '@/store/useQuantumStore';

export interface TriggerOptions {
  origin?: [number, number, number];
  color?: number;
  count?: number;
  radial?: boolean;
}

export interface MeasurementParticlesHandle {
  trigger(opts?: TriggerOptions): void;
  dispose(): void;
}

export interface MeasurementParticlesProps {
  sceneRef: React.MutableRefObject<SceneHandle | null | {
    add?: (obj: unknown) => void;
    remove?: (obj: unknown) => void;
    onFrame?: (cb: (t: number, dt: number) => void) => unknown;
  }>;
  maxInstances?: number;
}

export const MeasurementParticles = forwardRef<MeasurementParticlesHandle, MeasurementParticlesProps>(
  function MeasurementParticles({ sceneRef, maxInstances = 1000 }, ref) {
    const poolRef = useRef<ParticlePool | null>(null);

    const triggerBurst = useCallback(
      (opts?: TriggerOptions) => {
        if (!poolRef.current || prefersReducedMotion()) return;

        const state = useQuantumStore.getState();
        const theta = state.theta;
        const phi = state.phi;

        const origin: [number, number, number] = opts?.origin ?? [
          Math.sin(theta) * Math.cos(phi),
          Math.cos(theta),
          Math.sin(theta) * Math.sin(phi),
        ];

        burst(poolRef.current, {
          origin,
          count: Math.min(opts?.count ?? maxInstances, maxInstances),
          color: opts?.color ?? 0x00f0ff,
        });
      },
      [maxInstances]
    );

    useEffect(() => {
      if (!sceneRef?.current) return;
      const handle = sceneRef.current;
      const pool = createParticlePool(maxInstances);
      poolRef.current = pool;

      if (typeof (handle as { add?: (obj: unknown) => void }).add === 'function') {
        (handle as { add: (obj: unknown) => void }).add(pool.mesh);
      }

      let unregisterFrame: (() => void) | undefined;
      if (typeof (handle as { onFrame?: (cb: (t: number, dt: number) => void) => unknown }).onFrame === 'function') {
        const res = (handle as { onFrame: (cb: (t: number, dt: number) => void) => unknown }).onFrame(
          (_t: number, dt: number) => {
            if (poolRef.current) {
              tick(poolRef.current, dt);
            }
          }
        );
        if (typeof res === 'function') {
          unregisterFrame = res as () => void;
        }
      }

      return () => {
        if (unregisterFrame) unregisterFrame();
        if (poolRef.current && handle) {
          if (typeof (handle as { remove?: (obj: unknown) => void }).remove === 'function') {
            (handle as { remove: (obj: unknown) => void }).remove(poolRef.current.mesh);
          }
          disposeParticlePool(poolRef.current);
          poolRef.current = null;
        }
      };
    }, [sceneRef, maxInstances]);

    // Store subscription for automatic collapse particle trigger
    useEffect(() => {
      const unsubscribe = useQuantumStore.subscribe((state, prevState) => {
        if (state.lastOutcome !== null && state.lastOutcome !== prevState.lastOutcome) {
          triggerBurst();
        }
      });
      return () => unsubscribe();
    }, [triggerBurst]);

    useImperativeHandle(ref, () => ({
      trigger(opts?: TriggerOptions) {
        triggerBurst(opts);
      },
      dispose() {
        if (poolRef.current) {
          const handle = sceneRef?.current;
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
