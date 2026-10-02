import { describe, it, expect } from 'vitest';
import { measureQubit } from '@/domain/quantum/measurement';

describe('HU-07 — Deterministic Measurement & Collapse', () => {
  it('collapses to 0 when injectable random is less than P(0)', () => {
    const outcome = measureQubit(Math.PI / 2, () => 0.2);
    expect(outcome).toBe(0);
  });

  it('collapses to 1 when injectable random is greater than or equal to P(0)', () => {
    const outcome = measureQubit(Math.PI / 2, () => 0.8);
    expect(outcome).toBe(1);
  });

  it('always collapses to 0 at North Pole (|0⟩) regardless of random sample < 1', () => {
    expect(measureQubit(0, () => 0.99)).toBe(0);
  });

  it('always collapses to 1 at South Pole (|1⟩) regardless of random sample > 0', () => {
    expect(measureQubit(Math.PI, () => 0.01)).toBe(1);
  });
});
