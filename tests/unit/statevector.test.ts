import { describe, it, expect } from 'vitest';
import {
  MAX_QUBITS, MAX_DIM, createZeroState, normalize,
  probability, probabilities, innerProduct, dimOf,
} from '@/core/quantum/statevector';

describe('Phase1 - N-qubit State Vector (N<=6)', () => {
  it('exposes MAX_QUBITS=6 and MAX_DIM=64', () => {
    expect(MAX_QUBITS).toBe(6);
    expect(MAX_DIM).toBe(64);
  });
  it('dimOf(0)=1, dimOf(1)=2, dimOf(6)=64', () => {
    expect(dimOf(0)).toBe(1); expect(dimOf(1)).toBe(2); expect(dimOf(6)).toBe(64);
  });
  it('createZeroState(3) = [1,0,0,0,0,0,0,0]', () => {
    const s = createZeroState(3);
    expect(s).toHaveLength(8);
    expect(s[0]).toEqual({ re: 1, im: 0 });
    for (let i = 1; i < 8; i++) expect(s[i]).toEqual({ re: 0, im: 0 });
  });
  it('rejects nQubits > MAX_QUBITS or negative', () => {
    expect(() => createZeroState(7)).toThrow(/nQubits/);
    expect(() => createZeroState(-1)).toThrow(/nQubits/);
    expect(() => dimOf(2.5)).toThrow(/nQubits/);
  });
  it('probabilities sum to 1 for a normalized state', () => {
    const s = createZeroState(4);
    const sum = probabilities(s).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1, 12);
  });
  it('probability(s, 0) = 1 for |0...0>', () => {
    const s = createZeroState(5);
    expect(probability(s, 0)).toBeCloseTo(1);
    expect(probability(s, 1)).toBeCloseTo(0);
  });
  it('normalize scales amplitudes to unit norm', () => {
    const unnorm = [{ re: 3, im: 0 }, { re: 4, im: 0 }];
    const n = normalize(unnorm);
    expect(probability(n, 0) + probability(n, 1)).toBeCloseTo(1);
    expect(Math.hypot(n[0].re, n[1].re)).toBeCloseTo(1);
  });
  it('normalize returns zero state for zero-norm input', () => {
    const z = normalize([{ re: 0, im: 0 }, { re: 0, im: 0 }]);
    expect(z[0]).toEqual({ re: 1, im: 0 });
  });
  it('innerProduct(<0|0>) = 1', () => {
    const s = createZeroState(2);
    const ip = innerProduct(s, s);
    expect(ip.re).toBeCloseTo(1);
    expect(ip.im).toBeCloseTo(0);
  });
});
