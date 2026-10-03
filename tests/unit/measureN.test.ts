import { describe, it, expect } from 'vitest';
import { createZeroState } from '@/domain/quantum/statevector';
import { applyGateN, applyCNOT_N, H, X } from '@/domain/quantum/gatesN';
import { measureAll, measureQubitN } from '@/domain/quantum/measureN';

describe('Phase1 - N-qubit Measurement (injectable RNG)', () => {
  it('measureAll on |0> returns 0', () => {
    expect(measureAll(createZeroState(3), () => 0.5)).toBe(0);
  });
  it('measureAll on |111> returns 7', () => {
    let s = createZeroState(3);
    s = applyGateN(s, X, 0, 3);
    s = applyGateN(s, X, 1, 3);
    s = applyGateN(s, X, 2, 3);
    expect(measureAll(s, () => 0.99)).toBe(7);
  });
  it('measureAll respects cumulative distribution', () => {
    let s = createZeroState(1);
    s = applyGateN(s, H, 0, 1);
    expect(measureAll(s, () => 0)).toBe(0);
    expect(measureAll(s, () => 0.6)).toBe(1);
  });
  it('measureQubitN on a Bell state collapses both qubits consistently', () => {
    // |Phi+> = (|00> + |11>) / sqrt(2)
    let s = createZeroState(2);
    s = applyGateN(s, H, 0, 2);
    s = applyCNOT_N(s, 0, 1, 2);
    // rng = 0.9 > P(0) = 0.5  =>  outcome 1, collapse to |11> (index 3)
    const r = measureQubitN(s, 0, 2, () => 0.9);
    expect(r.outcome).toBe(1);
    expect(r.collapsed[3].re).toBeCloseTo(1);
    expect(r.collapsed[0].re).toBeCloseTo(0);
  });
  it('measureQubitN measuring LSB preserves MSB superposition', () => {
    // H on qubit 0 (MSB) produces |+> (x) |0>
    let s = createZeroState(2);
    s = applyGateN(s, H, 0, 2);
    // Measure LSB (qubit 1); it is always 0.
    const r = measureQubitN(s, 1, 2, () => 0.1);
    expect(r.outcome).toBe(0);
    expect(r.collapsed[0].re).toBeCloseTo(Math.SQRT1_2);
    expect(r.collapsed[2].re).toBeCloseTo(Math.SQRT1_2);
    expect(r.collapsed[1].re).toBeCloseTo(0);
    expect(r.collapsed[3].re).toBeCloseTo(0);
  });
  it('rejects out-of-range qubit in measureQubitN', () => {
    expect(() => measureQubitN(createZeroState(2), 2, 2, () => 0.5)).toThrow();
  });
});
