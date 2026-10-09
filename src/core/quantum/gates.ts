import { Matrix, Complex, GateMatrix, StateVector } from './types';

export type { GateMatrix, StateVector, Complex, Matrix };

export const c = (re: number, im: number = 0): Complex => ({
  re: Math.abs(re) < 1e-12 ? 0 : re,
  im: Math.abs(im) < 1e-12 ? 0 : im,
});

export const add = (a: Complex, b: Complex): Complex => c(a.re + b.re, a.im + b.im);
export const sub = (a: Complex, b: Complex): Complex => c(a.re - b.re, a.im - b.im);
export const mul = (a: Complex, b: Complex): Complex => c(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);

export const H: GateMatrix = [
  [c(1 / Math.SQRT2), c(1 / Math.SQRT2)],
  [c(1 / Math.SQRT2), c(-1 / Math.SQRT2)],
];

export const X: GateMatrix = [
  [c(0), c(1)],
  [c(1), c(0)],
];

export const Y: GateMatrix = [
  [c(0), c(0, -1)],
  [c(0, 1), c(0)],
];

export const Z: GateMatrix = [
  [c(1), c(0)],
  [c(0), c(-1)],
];

export const S: GateMatrix = [
  [c(1), c(0)],
  [c(0), c(0, 1)],
];

export const T: GateMatrix = [
  [c(1), c(0)],
  [c(0), c(Math.SQRT1_2, Math.SQRT1_2)],
];

export const I: GateMatrix = [
  [c(1), c(0)],
  [c(0), c(1)],
];

export const H_GATE = H;
export const X_GATE = X;
export const Y_GATE = Y;
export const Z_GATE = Z;
export const I_GATE = I;

export const StandardGates = { H, X, Y, Z, S, T, I };

export function kroneckerProduct(m1: GateMatrix, m2: GateMatrix): GateMatrix {
  const r1 = m1.length;
  const c1 = m1[0].length;
  const r2 = m2.length;
  const c2 = m2[0].length;

  const result: GateMatrix = Array.from({ length: r1 * r2 }, () =>
    Array(c1 * c2).fill(c(0, 0))
  );

  for (let i = 0; i < r1; i++) {
    for (let j = 0; j < c1; j++) {
      for (let k = 0; k < r2; k++) {
        for (let l = 0; l < c2; l++) {
          result[i * r2 + k][j * c2 + l] = mul(m1[i][j], m2[k][l]);
        }
      }
    }
  }
  return result;
}

export function createMultiQubitGate(gateMatrix: GateMatrix, targetQubit: number, totalQubits: number): GateMatrix {
  let fullMatrix: GateMatrix = [[c(1)]];
  for (let q = 0; q < totalQubits; q++) {
    const currentGate = q === targetQubit ? gateMatrix : I;
    fullMatrix = fullMatrix.length === 1 && fullMatrix[0].length === 1 
      ? currentGate 
      : kroneckerProduct(fullMatrix, currentGate);
  }
  return fullMatrix;
}

export function applyGate(state: StateVector, gate: GateMatrix): StateVector {
  if (state.length !== gate.length) return state;
  const res: StateVector = [];
  for (let i = 0; i < gate.length; i++) {
    let sum = c(0, 0);
    for (let j = 0; j < gate[i].length; j++) {
      sum = add(sum, mul(gate[i][j], state[j]));
    }
    res.push(sum);
  }
  return res;
}

export function matrixMultiply(m1: GateMatrix, m2: GateMatrix): GateMatrix {
  const rows = m1.length;
  const cols = m2[0].length;
  const shared = m2.length;
  const res: GateMatrix = Array.from({ length: rows }, () => Array(cols).fill(c(0)));

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      let sum = c(0);
      for (let k = 0; k < shared; k++) {
        sum = add(sum, mul(m1[i][k], m2[k][j]));
      }
      res[i][j] = sum;
    }
  }
  return res;
}

export function applyCNOT(state: StateVector, controlQubit: number = 0): StateVector {
  const nQubits = Math.round(Math.log2(state.length));
  const targetQubit = controlQubit === 0 ? 1 : 0;
  return applyCNOT_N(state, controlQubit, targetQubit, nQubits);
}

export function evaluateCircuit(gates: GateMatrix[], initialState: StateVector): StateVector {
  let curr = initialState;
  for (const g of gates) {
    curr = applyGate(curr, g);
  }
  return curr;
}

export function stateToBlochAngles(state: StateVector): { theta: number; phi: number } {
  const a = state[0] || c(1, 0);
  const b = state[1] || c(0, 0);
  const rA = Math.sqrt(a.re * a.re + a.im * a.im);
  const theta = 2 * Math.acos(Math.min(1, Math.max(0, rA)));
  const phi = Math.atan2(b.im, b.re) - Math.atan2(a.im, a.re);
  return { theta, phi };
}

export function gatesApproxEqual(g1: GateMatrix, g2: GateMatrix, eps = 1e-5): boolean {
  if (g1.length !== g2.length || g1[0].length !== g2[0].length) return false;
  for (let i = 0; i < g1.length; i++) {
    for (let j = 0; j < g1[0].length; j++) {
      if (Math.abs(g1[i][j].re - g2[i][j].re) > eps || Math.abs(g1[i][j].im - g2[i][j].im) > eps) {
        return false;
      }
    }
  }
  return true;
}

export function stateLabel(state: StateVector): string {
  if (!state || state.length < 2) return '|0>';
  const a0 = state[0];
  const a1 = state[1];
  if (Math.abs(a0.re - 1) < 1e-3) return '|0>';
  if (Math.abs(a1.re - 1) < 1e-3) return '|1>';
  if (Math.abs(a0.re - Math.SQRT1_2) < 1e-3 && Math.abs(a1.re - Math.SQRT1_2) < 1e-3) return '|+>';
  if (Math.abs(a0.re - Math.SQRT1_2) < 1e-3 && Math.abs(a1.re + Math.SQRT1_2) < 1e-3) return '|->';
  return '|0>';
}

export function applyGateN(state: StateVector, gate: GateMatrix, targetQubit: number, nQubits: number): StateVector {
  const expectedDim = 1 << nQubits;
  if (state.length !== expectedDim) {
    throw new Error(`State length mismatch: expected ${expectedDim}, got ${state.length}`);
  }
  if (targetQubit < 0 || targetQubit >= nQubits) {
    throw new Error(`Target qubit out of range: ${targetQubit}`);
  }

  const result: StateVector = new Array(expectedDim);
  const bit = 1 << (nQubits - 1 - targetQubit);

  for (let i = 0; i < expectedDim; i++) {
    if ((i & bit) === 0) {
      const i0 = i;
      const i1 = i | bit;
      const v0 = state[i0];
      const v1 = state[i1];

      result[i0] = add(mul(gate[0][0], v0), mul(gate[0][1], v1));
      result[i1] = add(mul(gate[1][0], v0), mul(gate[1][1], v1));
    }
  }
  return result;
}

export function applyCNOT_N(state: StateVector, controlQubit: number, targetQubit: number, nQubits: number): StateVector {
  const dim = 1 << nQubits;
  const result: StateVector = [...state];
  const cBit = 1 << (nQubits - 1 - controlQubit);
  const tBit = 1 << (nQubits - 1 - targetQubit);

  for (let i = 0; i < dim; i++) {
    if ((i & cBit) !== 0 && (i & tBit) === 0) {
      const i0 = i;
      const i1 = i | tBit;
      const tmp = result[i0];
      result[i0] = result[i1];
      result[i1] = tmp;
    }
  }
  return result;
}

export function applyCZ_N(state: StateVector, controlQubit: number, targetQubit: number, nQubits: number): StateVector {
  const dim = 1 << nQubits;
  const result: StateVector = [...state];
  const cBit = 1 << (nQubits - 1 - controlQubit);
  const tBit = 1 << (nQubits - 1 - targetQubit);

  for (let i = 0; i < dim; i++) {
    if ((i & cBit) !== 0 && (i & tBit) !== 0) {
      result[i] = c(-result[i].re, -result[i].im);
    }
  }
  return result;
}

export function applySWAP_N(state: StateVector, q1: number, q2: number, nQubits: number): StateVector {
  const dim = 1 << nQubits;
  const result: StateVector = [...state];
  const bit1 = 1 << (nQubits - 1 - q1);
  const bit2 = 1 << (nQubits - 1 - q2);

  for (let i = 0; i < dim; i++) {
    const b1 = (i & bit1) !== 0 ? 1 : 0;
    const b2 = (i & bit2) !== 0 ? 1 : 0;
    if (b1 === 1 && b2 === 0) {
      const j = (i ^ bit1) | bit2;
      const tmp = result[i];
      result[i] = result[j];
      result[j] = tmp;
    }
  }
  return result;
}

export function applyControlledPhaseN(state: StateVector, controlQubit: number, targetQubit: number, phi: number, nQubits: number): StateVector {
  const dim = 1 << nQubits;
  const result: StateVector = [...state];
  const cBit = 1 << (nQubits - 1 - controlQubit);
  const tBit = 1 << (nQubits - 1 - targetQubit);
  const phaseVal = c(Math.cos(phi), Math.sin(phi));

  for (let i = 0; i < dim; i++) {
    if ((i & cBit) !== 0 && (i & tBit) !== 0) {
      result[i] = mul(result[i], phaseVal);
    }
  }
  return result;
}
