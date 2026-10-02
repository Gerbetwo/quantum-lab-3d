import { describe, it, expect } from 'vitest';
import { calculateBlochProbabilities } from '@/domain/quantum/bloch';

describe('HU-06 — Bloch Probabilities Calculation', () => {
  it('calculates exact state amplitudes and probabilities for North Pole (|0⟩)', () => {
    const res = calculateBlochProbabilities(0);
    expect(res.alpha).toBeCloseTo(1);
    expect(res.beta).toBeCloseTo(0);
    expect(res.prob0).toBe(100);
    expect(res.prob1).toBe(0);
  });

  it('calculates equal probabilities for Equator superposition (|+⟩)', () => {
    const res = calculateBlochProbabilities(Math.PI / 2);
    expect(res.alpha).toBeCloseTo(Math.SQRT1_2);
    expect(res.beta).toBeCloseTo(Math.SQRT1_2);
    expect(res.prob0).toBe(50);
    expect(res.prob1).toBe(50);
  });

  it('calculates exact state amplitudes and probabilities for South Pole (|1⟩)', () => {
    const res = calculateBlochProbabilities(Math.PI);
    expect(res.alpha).toBeCloseTo(0);
    expect(res.beta).toBeCloseTo(1);
    expect(res.prob0).toBe(0);
    expect(res.prob1).toBe(100);
  });
});
