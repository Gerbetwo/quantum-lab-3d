import { Complex, GateMatrix, StateVector } from './types';

const c = (re: number, im = 0): Complex => ({ re, im });
const add = (a: Complex, b: Complex): Complex => ({ re: a.re + b.re, im: a.im + b.im });
const mul = (a: Complex, b: Complex): Complex => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re });

export function applyGateN(
  state: StateVector,
  gate: GateMatrix,
  target: number,
  nQubits: number
): StateVector {
  if (target < 0 || target >= nQubits) {
    throw new Error('Qubit out of range');
  }
  const expectedLength = 1 << nQubits;
  if (state.length !== expectedLength) {
    throw new Error('State length mismatch');
  }
  const result: StateVector = state.map(() => c(0));
  const step = 1 << target;
  for (let i = 0; i < state.length; i++) {
    const bit = (i & step) >> target;
    const i0 = i & ~step;
    const i1 = i | step;
    if (bit === 0) {
      result[i] = add(mul(gate[0][0], state[i0]), mul(gate[0][1], state[i1]));
    } else {
      result[i] = add(mul(gate[1][0], state[i0]), mul(gate[1][1], state[i1]));
    }
  }
  return result;
}

export function applyCNOT_N(
  state: StateVector,
  control: number,
  target: number,
  nQubits: number
): StateVector {
  if (control < 0 || control >= nQubits || target < 0 || target >= nQubits || control === target) {
    throw new Error('Invalid control or target qubit');
  }
  const expectedLength = 1 << nQubits;
  if (state.length !== expectedLength) {
    throw new Error('State length mismatch');
  }
  const result: StateVector = [...state];
  const controlBit = 1 << control;
  const targetBit = 1 << target;
  for (let i = 0; i < state.length; i++) {
    if ((i & controlBit) !== 0) {
      const flipped = i ^ targetBit;
      result[i] = state[flipped];
    }
  }
  return result;
}

export function applyCZ_N(
  state: StateVector,
  control: number,
  target: number,
  nQubits: number
): StateVector {
  if (control < 0 || control >= nQubits || target < 0 || target >= nQubits) {
    throw new Error('Qubit out of range');
  }
  const expectedLength = 1 << nQubits;
  if (state.length !== expectedLength) {
    throw new Error('State length mismatch');
  }
  const controlBit = 1 << control;
  const targetBit = 1 << target;
  return state.map((amp, i) => {
    if ((i & controlBit) !== 0 && (i & targetBit) !== 0) {
      return { re: -amp.re, im: -amp.im };
    }
    return amp;
  });
}

export function applySWAP_N(
  state: StateVector,
  q1: number,
  q2: number,
  nQubits: number
): StateVector {
  if (q1 < 0 || q1 >= nQubits || q2 < 0 || q2 >= nQubits) {
    throw new Error('Qubit out of range');
  }
  const expectedLength = 1 << nQubits;
  if (state.length !== expectedLength) {
    throw new Error('State length mismatch');
  }
  const b1 = 1 << q1;
  const b2 = 1 << q2;
  return state.map((_, i) => {
    const bit1 = (i & b1) >> q1;
    const bit2 = (i & b2) >> q2;
    if (bit1 !== bit2) {
      return state[i ^ b1 ^ b2];
    }
    return state[i];
  });
}
