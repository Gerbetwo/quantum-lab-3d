import { Complex, StateVector, GateMatrix } from './types';

export type { Complex, StateVector, GateMatrix };

export function complexAdd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

export function complexMul(a: Complex, b: Complex): Complex {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

export const I_GATE: GateMatrix = [
  [{ re: 1, im: 0 }, { re: 0, im: 0 }],
  [{ re: 0, im: 0 }, { re: 1, im: 0 }],
];

export const X_GATE: GateMatrix = [
  [{ re: 0, im: 0 }, { re: 1, im: 0 }],
  [{ re: 1, im: 0 }, { re: 0, im: 0 }],
];

export const Z_GATE: GateMatrix = [
  [{ re: 1, im: 0 }, { re: 0, im: 0 }],
  [{ re: 0, im: 0 }, { re: -1, im: 0 }],
];

export const H_GATE: GateMatrix = [
  [{ re: 1 / Math.SQRT2, im: 0 }, { re: 1 / Math.SQRT2, im: 0 }],
  [{ re: 1 / Math.SQRT2, im: 0 }, { re: -1 / Math.SQRT2, im: 0 }],
];

export function applyGate(state: StateVector, gate: GateMatrix): StateVector {
  if (state.length === 2 && gate.length === 2) {
    const [c0, c1] = state;
    return [
      complexAdd(complexMul(gate[0][0], c0), complexMul(gate[0][1], c1)),
      complexAdd(complexMul(gate[1][0], c0), complexMul(gate[1][1], c1)),
    ];
  }
  return state;
}

export function matrixMultiply(a: GateMatrix, b: GateMatrix): GateMatrix {
  const rows = a.length;
  const cols = b[0].length;
  const result: GateMatrix = [];

  for (let i = 0; i < rows; i++) {
    result[i] = [];
    for (let j = 0; j < cols; j++) {
      let sum: Complex = { re: 0, im: 0 };
      for (let k = 0; k < a[0].length; k++) {
        sum = complexAdd(sum, complexMul(a[i][k], b[k][j]));
      }
      result[i][j] = sum;
    }
  }
  return result;
}

export function applyCNOT(state: StateVector, controlQubit: 0 | 1): StateVector {
  if (state.length !== 4) return state;
  const res = [...state];
  if (controlQubit === 0) {
    const tmp = res[2];
    res[2] = res[3];
    res[3] = tmp;
  } else {
    const tmp = res[1];
    res[1] = res[3];
    res[3] = tmp;
  }
  return res;
}

export function evaluateCircuit(circuit: GateMatrix[], initialState: StateVector): StateVector {
  return circuit.reduce((accState, gate) => applyGate(accState, gate), initialState);
}

export function stateToBlochAngles(state: StateVector): { theta: number; phi: number } {
  if (state.length < 2) return { theta: 0, phi: 0 };
  const alpha = state[0];
  const beta = state[1];

  const rAlpha = Math.sqrt(alpha.re * alpha.re + alpha.im * alpha.im);
  const theta = 2 * Math.acos(Math.min(1, Math.max(0, rAlpha)));
  const phaseAlpha = Math.atan2(alpha.im, alpha.re);
  const phaseBeta = Math.atan2(beta.im, beta.re);
  const phi = phaseBeta - phaseAlpha;

  return { theta, phi };
}

export function gatesApproxEqual(a: GateMatrix, b: GateMatrix, eps = 1e-9): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < a[i].length; j++) {
      if (Math.abs(a[i][j].re - b[i][j].re) > eps || Math.abs(a[i][j].im - b[i][j].im) > eps) {
        return false;
      }
    }
  }
  return true;
}

export function stateLabel(state: StateVector): string {
  if (state.length < 2) return '|0>';
  const a0 = Math.round(state[0].re * 100) / 100;
  const a1 = Math.round(state[1].re * 100) / 100;

  if (a0 === 1 && a1 === 0) return '|0>';
  if (a0 === 0 && a1 === 1) return '|1>';
  if (Math.abs(a0 - 0.71) < 0.05 && Math.abs(a1 - 0.71) < 0.05) return '|+>';
  if (Math.abs(a0 - 0.71) < 0.05 && Math.abs(a1 + 0.71) < 0.05) return '|->';

  return `${a0}|0> + ${a1}|1>`;
}
