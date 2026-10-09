import { Complex, GateMatrix, StateVector } from './types';

export type { StateVector, GateMatrix };

const c = (re: number, im = 0): Complex => ({ re, im });

export const H: GateMatrix = [[c(Math.SQRT1_2), c(Math.SQRT1_2)], [c(Math.SQRT1_2), c(-Math.SQRT1_2)]];
export const X: GateMatrix = [[c(0), c(1)], [c(1), c(0)]];
export const Y: GateMatrix = [[c(0), c(0, -1)], [c(0, 1), c(0)]];
export const Z: GateMatrix = [[c(1), c(0)], [c(0), c(-1)]];
export const S: GateMatrix = [[c(1), c(0)], [c(0), c(0, 1)]];
export const T: GateMatrix = [[c(1), c(0)], [c(0), c(Math.SQRT1_2, Math.SQRT1_2)]];
export const I: GateMatrix = [[c(1), c(0)], [c(0), c(1)]];

export const H_GATE = H;
export const X_GATE = X;
export const Z_GATE = Z;
export const I_GATE = I;

function add(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

function mul(a: Complex, b: Complex): Complex {
  return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
}

export function applyGate(state: StateVector, gate: GateMatrix): StateVector {
  if (state.length === 2) {
    return [
      add(mul(gate[0][0], state[0]), mul(gate[0][1], state[1])),
      add(mul(gate[1][0], state[0]), mul(gate[1][1], state[1])),
    ];
  }
  return applyGateN(state, gate, 0, Math.round(Math.log2(state.length)));
}

export function applyCNOT(state: StateVector, controlQubit: 0 | 1 = 0): StateVector {
  if (state.length === 4) {
    const target = controlQubit === 0 ? 1 : 0;
    return applyCNOT_N(state, controlQubit, target, 2);
  }
  return state;
}

export function applyGateN(state: StateVector, gate: GateMatrix, target: number, nQubits: number): StateVector {
  if (target < 0 || target >= nQubits) {
    throw new Error('Qubit out of range');
  }
  const expectedLength = 1 << nQubits;
  if (state.length !== expectedLength) {
    throw new Error('State length mismatch');
  }
  const bitIndex = nQubits - 1 - target;
  const result: StateVector = state.map(() => c(0));
  const step = 1 << bitIndex;
  for (let i = 0; i < state.length; i++) {
    const bit = (i & step) >> bitIndex;
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

export function applyCNOT_N(state: StateVector, control: number, target: number, nQubits: number): StateVector {
  if (control < 0 || control >= nQubits || target < 0 || target >= nQubits || control === target) {
    throw new Error('Invalid control or target qubit');
  }
  const expectedLength = 1 << nQubits;
  if (state.length !== expectedLength) {
    throw new Error('State length mismatch');
  }
  const result: StateVector = [...state];
  const cBit = nQubits - 1 - control;
  const tBit = nQubits - 1 - target;
  const controlBit = 1 << cBit;
  const targetBit = 1 << tBit;
  for (let i = 0; i < state.length; i++) {
    if ((i & controlBit) !== 0) {
      const flipped = i ^ targetBit;
      result[i] = state[flipped];
    }
  }
  return result;
}

export function applyCZ_N(state: StateVector, control: number, target: number, nQubits: number): StateVector {
  if (control < 0 || control >= nQubits || target < 0 || target >= nQubits) {
    throw new Error('Qubit out of range');
  }
  const cBit = nQubits - 1 - control;
  const tBit = nQubits - 1 - target;
  const controlBit = 1 << cBit;
  const targetBit = 1 << tBit;
  return state.map((amp, i) => {
    if ((i & controlBit) !== 0 && (i & targetBit) !== 0) {
      return { re: -amp.re, im: -amp.im };
    }
    return amp;
  });
}

export function applySWAP_N(state: StateVector, q1: number, q2: number, nQubits: number): StateVector {
  if (q1 < 0 || q1 >= nQubits || q2 < 0 || q2 >= nQubits) {
    throw new Error('Qubit out of range');
  }
  const b1Bit = nQubits - 1 - q1;
  const b2Bit = nQubits - 1 - q2;
  const b1 = 1 << b1Bit;
  const b2 = 1 << b2Bit;
  return state.map((_, i) => {
    const bit1 = (i & b1) >> b1Bit;
    const bit2 = (i & b2) >> b2Bit;
    if (bit1 !== bit2) {
      return state[i ^ b1 ^ b2];
    }
    return state[i];
  });
}

export function applyControlledPhaseN(state: StateVector, control: number, target: number, phi: number, nQubits: number): StateVector {
  if (control < 0 || control >= nQubits || target < 0 || target >= nQubits) {
    throw new Error('Qubit out of range');
  }
  const cBit = nQubits - 1 - control;
  const tBit = nQubits - 1 - target;
  const controlBit = 1 << cBit;
  const targetBit = 1 << tBit;
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  return state.map((amp, i) => {
    if ((i & controlBit) !== 0 && (i & targetBit) !== 0) {
      return mul(amp, { re: cos, im: sin });
    }
    return amp;
  });
}

export function matrixMultiply(a: GateMatrix, b: GateMatrix): GateMatrix {
  return [
    [add(mul(a[0][0], b[0][0]), mul(a[0][1], b[1][0])), add(mul(a[0][0], b[0][1]), mul(a[0][1], b[1][1]))],
    [add(mul(a[1][0], b[0][0]), mul(a[1][1], b[1][0])), add(mul(a[1][0], b[0][1]), mul(a[1][1], b[1][1]))],
  ];
}

export function evaluateCircuit(circuitOrSteps: unknown, initialState?: StateVector): StateVector {
  let state = initialState ? [...initialState] : [c(1), c(0)];
  if (Array.isArray(circuitOrSteps)) {
    for (const gate of circuitOrSteps as GateMatrix[]) {
      state = applyGate(state, gate);
    }
  }
  return state;
}

export function stateToBlochAngles(state: StateVector): { theta: number; phi: number } {
  const a = state[0] || c(1);
  const b = state[1] || c(0);
  const rA = Math.sqrt(a.re ** 2 + a.im ** 2);
  const rB = Math.sqrt(b.re ** 2 + b.im ** 2);
  const theta = 2 * Math.atan2(rB, rA);
  const phi = Math.atan2(b.im, b.re) - Math.atan2(a.im, a.re);
  return { theta, phi };
}

export function gatesApproxEqual(a: GateMatrix, b: GateMatrix): boolean {
  for (let r = 0; r < 2; r++) {
    for (let col = 0; col < 2; col++) {
      if (Math.abs(a[r][col].re - b[r][col].re) > 1e-4) return false;
      if (Math.abs(a[r][col].im - b[r][col].im) > 1e-4) return false;
    }
  }
  return true;
}

export function stateLabel(state: StateVector): string {
  if (Math.abs((state[0]?.re ?? 0) - 1) < 1e-4) return '|0>';
  if (Math.abs((state[1]?.re ?? 0) - 1) < 1e-4) return '|1>';
  if (Math.abs((state[0]?.re ?? 0) - Math.SQRT1_2) < 1e-4) {
    if (Math.abs((state[1]?.re ?? 0) - Math.SQRT1_2) < 1e-4) return '|+>';
    if (Math.abs((state[1]?.re ?? 0) + Math.SQRT1_2) < 1e-4) return '|->';
  }
  return 'custom';
}
