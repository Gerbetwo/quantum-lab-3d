/**
 * N-qubit gates (N <= 6). Pure domain.
 *
 * Single-qubit gates act on a target qubit index (0 = most significant).
 * Multi-qubit gates (CNOT, CZ, SWAP) take explicit control/target indices.
 * All functions return a NEW state vector (no in-place mutation).
 */

import type { Complex, StateVector } from './statevector';
import { dimOf } from './statevector';

export interface GateMatrix {
  /** Row-major 2x2 complex matrix: [m00, m01, m10, m11]. */
  m: [Complex, Complex, Complex, Complex];
}

const c = (re: number, im = 0): Complex => ({ re, im });

export const I: GateMatrix = { m: [c(1), c(0), c(0), c(1)] };
export const X: GateMatrix = { m: [c(0), c(1), c(1), c(0)] };
// Pauli-Y = [[0, -i], [i, 0]]
export const Y: GateMatrix = { m: [c(0), c(0, -1), c(0, 1), c(0)] };
export const Z: GateMatrix = { m: [c(1), c(0), c(0), c(-1)] };
const S = Math.SQRT1_2;
export const H: GateMatrix = { m: [c(S), c(S), c(S), c(-S)] };

function assertIndex(q: number, n: number): void {
  if (!Number.isInteger(q) || q < 0 || q >= n) {
    throw new RangeError('qubit index ' + q + ' out of range for n=' + n);
  }
}
function assertDistinct(a: number, b: number, n: number): void {
  assertIndex(a, n); assertIndex(b, n);
  if (a === b) throw new RangeError('control and target must be distinct');
}
function assertDim(state: StateVector, n: number): void {
  const expected = dimOf(n);
  if (state.length !== expected) {
    throw new Error('state length ' + state.length + ' !== 2^' + n + ' (' + expected + ')');
  }
}

export function applyGateN(
  state: StateVector,
  gate: GateMatrix,
  target: number,
  nQubits: number,
): StateVector {
  assertIndex(target, nQubits);
  assertDim(state, nQubits);
  const dim = 1 << nQubits;
  const bit = 1 << (nQubits - 1 - target);
  const out: StateVector = new Array(dim);
  const [g00, g01, g10, g11] = gate.m;
  for (let i = 0; i < dim; i++) {
    const isOne = (i & bit) !== 0;
    if (isOne) continue;
    const partner = i | bit;
    const a = state[i];
    const b = state[partner];
    const outLo: Complex = {
      re: g00.re * a.re - g00.im * a.im + g01.re * b.re - g01.im * b.im,
      im: g00.re * a.im + g00.im * a.re + g01.re * b.im + g01.im * b.re,
    };
    const outHi: Complex = {
      re: g10.re * a.re - g10.im * a.im + g11.re * b.re - g11.im * b.im,
      im: g10.re * a.im + g10.im * a.re + g11.re * b.im + g11.im * b.re,
    };
    out[i] = outLo;
    out[partner] = outHi;
  }
  return out;
}

export function applyCNOT_N(
  state: StateVector, control: number, target: number, nQubits: number,
): StateVector {
  assertDistinct(control, target, nQubits);
  assertDim(state, nQubits);
  const dim = 1 << nQubits;
  const cBit = 1 << (nQubits - 1 - control);
  const tBit = 1 << (nQubits - 1 - target);
  const out: StateVector = new Array(dim);
  for (let i = 0; i < dim; i++) {
    const cOn = (i & cBit) !== 0;
    out[i] = cOn ? state[i ^ tBit] : state[i];
  }
  return out;
}

export function applyCZ_N(
  state: StateVector, control: number, target: number, nQubits: number,
): StateVector {
  assertDistinct(control, target, nQubits);
  assertDim(state, nQubits);
  const dim = 1 << nQubits;
  const cBit = 1 << (nQubits - 1 - control);
  const tBit = 1 << (nQubits - 1 - target);
  const out: StateVector = new Array(dim);
  for (let i = 0; i < dim; i++) {
    const both = (i & cBit) !== 0 && (i & tBit) !== 0;
    out[i] = both ? { re: -state[i].re, im: -state[i].im } : state[i];
  }
  return out;
}

export function applySWAP_N(
  state: StateVector, a: number, b: number, nQubits: number,
): StateVector {
  assertDistinct(a, b, nQubits);
  assertDim(state, nQubits);
  const dim = 1 << nQubits;
  const aBit = 1 << (nQubits - 1 - a);
  const bBit = 1 << (nQubits - 1 - b);
  const out: StateVector = new Array(dim);
  for (let i = 0; i < dim; i++) {
    const aOn = (i & aBit) !== 0;
    const bOn = (i & bBit) !== 0;
    if (aOn === bOn) { out[i] = state[i]; continue; }
    out[i] = state[i ^ aBit ^ bBit];
  }
  return out;
}
