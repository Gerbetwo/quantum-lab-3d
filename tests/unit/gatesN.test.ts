import { describe, it, expect } from 'vitest';
import { createZeroState, probability, probabilities } from '@/core/quantum/statevector';
import {
  applyGateN, applyCNOT_N, applyCZ_N, applySWAP_N, H, X, Y, Z, I,
} from '@/core/quantum/gates';

describe('Phase1 - N-qubit Gates', () => {
  it('H|0> = (|0>+|1>)/sqrt(2)', () => {
    const s = applyGateN(createZeroState(1), H, 0, 1);
    expect(s[0].re).toBeCloseTo(Math.SQRT1_2);
    expect(s[1].re).toBeCloseTo(Math.SQRT1_2);
  });
  it('X|0> = |1>', () => {
    const s = applyGateN(createZeroState(1), X, 0, 1);
    expect(s[1].re).toBeCloseTo(1);
  });
  it('Y|0> = i|1>', () => {
    const s = applyGateN(createZeroState(1), Y, 0, 1);
    expect(s[1].re).toBeCloseTo(0);
    expect(s[1].im).toBeCloseTo(1);
  });
  it('Z|1> = -|1>', () => {
    const one = applyGateN(createZeroState(1), X, 0, 1);
    const s = applyGateN(one, Z, 0, 1);
    expect(s[1].re).toBeCloseTo(-1);
  });
  it('I|0> = |0>', () => {
    const s = applyGateN(createZeroState(2), I, 1, 2);
    expect(s[0].re).toBeCloseTo(1);
  });
  it('H on qubit 1 of |00> creates |0+>', () => {
    const s = applyGateN(createZeroState(2), H, 1, 2);
    expect(s[0].re).toBeCloseTo(Math.SQRT1_2);
    expect(s[1].re).toBeCloseTo(Math.SQRT1_2);
    expect(s[2].re).toBeCloseTo(0);
    expect(s[3].re).toBeCloseTo(0);
  });
  it('CNOT control=0 target=1 flips |10> -> |11>', () => {
    const base = applyGateN(createZeroState(2), X, 0, 2);
    const s = applyCNOT_N(base, 0, 1, 2);
    expect(probability(s, 3)).toBeCloseTo(1);
  });
  it('CNOT control=1 target=0 flips |01> -> |11>', () => {
    const base = applyGateN(createZeroState(2), X, 1, 2);
    const s = applyCNOT_N(base, 1, 0, 2);
    expect(probability(s, 3)).toBeCloseTo(1);
  });
  it('CZ control=0 target=1 phase-flips |11>', () => {
    let s = createZeroState(2);
    s = applyGateN(s, X, 0, 2);
    s = applyGateN(s, X, 1, 2);
    const r = applyCZ_N(s, 0, 1, 2);
    expect(r[3].re).toBeCloseTo(-1);
  });
  it('SWAP exchanges qubit states', () => {
    const base = applyGateN(createZeroState(2), X, 0, 2);
    const s = applySWAP_N(base, 0, 1, 2);
    expect(probability(s, 1)).toBeCloseTo(1);
  });
  it('preserves norm through arbitrary sequence', () => {
    let s = createZeroState(4);
    s = applyGateN(s, H, 0, 4);
    s = applyGateN(s, H, 1, 4);
    s = applyCNOT_N(s, 0, 3, 4);
    s = applyGateN(s, Z, 2, 4);
    const p = probabilities(s).reduce((a, b) => a + b, 0);
    expect(p).toBeCloseTo(1, 10);
  });
  it('rejects out-of-range qubit index', () => {
    expect(() => applyGateN(createZeroState(2), H, 2, 2)).toThrow();
  });
  it('rejects state length mismatch', () => {
    expect(() => applyGateN(createZeroState(2), H, 0, 3)).toThrow(/length/);
  });
});
