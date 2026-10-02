/**
 * Quantum Gates & Circuit Composition (pure domain, no React / no Three.js)
 *
 * Conventions:
 *   - StateVector for 1 qubit: [alpha, beta]   (length 2)
 *   - StateVector for 2 qubits: [a00, a01, a10, a11] (length 4)
 *   - GateMatrix: square NxN of Complex.
 */

export interface Complex {
  re: number;
  im: number;
}

export type StateVector = Complex[];
export type GateMatrix = Complex[][];

// ---- constants -------------------------------------------------------------

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

const S = Math.SQRT1_2;
export const H_GATE: GateMatrix = [
  [{ re: S, im: 0 }, { re: S, im: 0 }],
  [{ re: S, im: 0 }, { re: -S, im: 0 }],
];

// ---- complex arithmetic ----------------------------------------------------

export function complexMul(a: Complex, b: Complex): Complex {
  return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
}

export function complexAdd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

// ---- core operations -------------------------------------------------------

export function applyGate(state: StateVector, gate: GateMatrix): StateVector {
  const n = state.length;
  const out: Complex[] = [];
  for (let i = 0; i < n; i++) {
    let acc: Complex = { re: 0, im: 0 };
    for (let j = 0; j < n; j++) {
      acc = complexAdd(acc, complexMul(gate[i][j], state[j]));
    }
    out.push(acc);
  }
  return out;
}

export function matrixMultiply(a: GateMatrix, b: GateMatrix): GateMatrix {
  const n = a.length;
  const inner = b.length;
  const m = b[0].length;
  const out: GateMatrix = [];
  for (let i = 0; i < n; i++) {
    const row: Complex[] = [];
    for (let j = 0; j < m; j++) {
      let acc: Complex = { re: 0, im: 0 };
      for (let k = 0; k < inner; k++) {
        acc = complexAdd(acc, complexMul(a[i][k], b[k][j]));
      }
      row.push(acc);
    }
    out.push(row);
  }
  return out;
}

/**
 * CNOT on a 2-qubit state (length 4).
 * controlQubit = 0: |10> <-> |11>  (target = qubit 1)
 * controlQubit = 1: |01> <-> |11>  (target = qubit 0)
 */
export function applyCNOT(state: StateVector, controlQubit: 0 | 1): StateVector {
  if (state.length !== 4) throw new Error('applyCNOT requires a 2-qubit state (length 4)');
  const [a00, a01, a10, a11] = state;
  if (controlQubit === 0) return [a00, a01, a11, a10];
  return [a00, a11, a10, a01];
}

export function evaluateCircuit(circuit: GateMatrix[], initialState: StateVector): StateVector {
  let state = initialState;
  for (const gate of circuit) state = applyGate(state, gate);
  return state;
}

// ---- helpers ---------------------------------------------------------------

export function stateToBlochAngles(state: StateVector): { theta: number; phi: number } {
  if (state.length !== 2) throw new Error('stateToBlochAngles expects a 1-qubit state');
  const [alpha, beta] = state;
  const pA = Math.min(1, alpha.re * alpha.re + alpha.im * alpha.im);
  const theta = 2 * Math.acos(Math.sqrt(pA));
  const phi = Math.atan2(beta.im, beta.re) - Math.atan2(alpha.im, alpha.re);
  return { theta, phi };
}

export function gatesApproxEqual(a: GateMatrix, b: GateMatrix, eps = 1e-9): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].length !== b[i].length) return false;
    for (let j = 0; j < a[i].length; j++) {
      if (Math.abs(a[i][j].re - b[i][j].re) > eps) return false;
      if (Math.abs(a[i][j].im - b[i][j].im) > eps) return false;
    }
  }
  return true;
}

export function stateLabel(state: StateVector): string {
  if (state.length === 2) {
    const [a, b] = state;
    const pa = a.re * a.re + a.im * a.im;
    const pb = b.re * b.re + b.im * b.im;
    if (pa > 0.999) return '|0>';
    if (pb > 0.999) return '|1>';
    if (Math.abs(pa - 0.5) < 1e-3 && Math.abs(pb - 0.5) < 1e-3) {
      return b.re > 0 ? '|+>' : '|->';
    }
    return 'superposicion';
  }
  return '|2q>';
}
