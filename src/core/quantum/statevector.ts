/**
 * N-qubit State Vector Simulation (N <= 6, dim <= 64).
 * Pure domain, no React, no Three.js.
 *
 * Basis convention: index i has the binary representation of qubits 0..N-1,
 * where qubit 0 is the most significant bit.
 * Examples for N=2: |00>=0, |01>=1, |10>=2, |11>=3.
 */

export const MAX_QUBITS = 6;
export const MAX_DIM = 1 << MAX_QUBITS;

export interface Complex { re: number; im: number }

export type StateVector = Complex[];

export function dimOf(nQubits: number): number {
  if (!Number.isInteger(nQubits) || nQubits < 0 || nQubits > MAX_QUBITS) {
    throw new RangeError('nQubits must be an integer in [0, ' + MAX_QUBITS + '], received: ' + nQubits);
  }
  return 1 << nQubits;
}

export function createZeroState(nQubits: number): StateVector {
  const dim = dimOf(nQubits);
  const s: StateVector = new Array(dim);
  s[0] = { re: 1, im: 0 };
  for (let i = 1; i < dim; i++) s[i] = { re: 0, im: 0 };
  return s;
}

export function probability(state: StateVector, basisIndex: number): number {
  const a = state[basisIndex];
  if (!a) return 0;
  return a.re * a.re + a.im * a.im;
}

export function probabilities(state: StateVector): number[] {
  return state.map((_, i) => probability(state, i));
}

export function norm(state: StateVector): number {
  let acc = 0;
  for (let i = 0; i < state.length; i++) {
    const a = state[i];
    acc += a.re * a.re + a.im * a.im;
  }
  return Math.sqrt(acc);
}

export function normalize(state: StateVector): StateVector {
  const n = norm(state);
  if (n === 0) {
    const out: StateVector = state.map(() => ({ re: 0, im: 0 }));
    if (out.length > 0) out[0] = { re: 1, im: 0 };
    return out;
  }
  return state.map((a) => ({ re: a.re / n, im: a.im / n }));
}

export function innerProduct(a: StateVector, b: StateVector): Complex {
  let re = 0;
  let im = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    re += a[i].re * b[i].re + a[i].im * b[i].im;
    im += a[i].re * b[i].im - a[i].im * b[i].re;
  }
  return { re, im };
}


export function normalizeStateVector(amplitudes: { re: number; im: number }[]): { re: number; im: number }[] {
  let normSq = 0;
  for (const amp of amplitudes) {
    normSq += amp.re * amp.re + amp.im * amp.im;
  }
  if (normSq === 0) return amplitudes;
  const norm = Math.sqrt(normSq);
  return amplitudes.map(amp => ({
    re: Math.abs(amp.re / norm) < 1e-12 ? 0 : amp.re / norm,
    im: Math.abs(amp.im / norm) < 1e-12 ? 0 : amp.im / norm,
  }));
}

export function createInitialState(nQubits: number): StateVector {
  return createZeroState(nQubits);
}
