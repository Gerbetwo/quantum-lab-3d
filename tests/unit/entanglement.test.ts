import { describe, it, expect } from 'vitest';
import { correlateEntangledMeasurement } from '@/domain/quantum/entanglement';

describe('HU-12 — Entangled Pair Correlated Measurement', () => {
  it('correlates Bob outcome to 0 when Alice measures 0', () => {
    const result = correlateEntangledMeasurement(0);
    expect(result).toEqual({ alice: 0, bob: 0 });
  });

  it('correlates Bob outcome to 1 when Alice measures 1', () => {
    const result = correlateEntangledMeasurement(1);
    expect(result).toEqual({ alice: 1, bob: 1 });
  });
});
