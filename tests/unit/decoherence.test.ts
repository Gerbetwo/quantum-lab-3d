import { describe, it, expect } from 'vitest';
import { calculateCoherenceTime, isCriticalDecoherence } from '@/domain/quantum/decoherence';

describe('HU-15 — Temperature & Coherence Calculation', () => {
  it('calculates positive coherence time T2 at 15 mK cryogenic baseline', () => {
    const t2 = calculateCoherenceTime(15);
    expect(t2).toBeGreaterThan(0);
    expect(t2).toBe(245.36);
  });

  it('decreases coherence time as temperature increases', () => {
    const t2Cold = calculateCoherenceTime(15);
    const t2Hot = calculateCoherenceTime(1500);
    expect(t2Hot).toBeLessThan(t2Cold);
  });

  it('evaluates critical decoherence threshold (< 10.0 µs coherence time)', () => {
    expect(isCriticalDecoherence(12.0)).toBe(false);
    expect(isCriticalDecoherence(8.0)).toBe(true);
  });
});
