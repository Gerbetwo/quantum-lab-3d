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

export interface Complex {
  re: number;
  im: number;
}

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
  const n = Math.sqrt(normSq);
  return amplitudes.map(amp => ({
    re: Math.abs(amp.re / n) < 1e-12 ? 0 : amp.re / n,
    im: Math.abs(amp.im / n) < 1e-12 ? 0 : amp.im / n,
  }));
}

export function createInitialState(nQubits: number): StateVector {
  return createZeroState(nQubits);
}

export function calculateAmplitudes(theta: number, phi: number) {
  const alphaVal = Math.cos(theta / 2);
  const betaMag = Math.sin(theta / 2);
  return {
    alpha: alphaVal,
    beta: {
      real: betaMag * Math.cos(phi),
      imag: betaMag * Math.sin(phi),
      magnitude: betaMag,
      phase: phi,
    },
  };
}

export function calculateProbabilities(theta: number, _phi?: number) {
  const prob0 = Math.cos(theta / 2) ** 2;
  const prob1 = Math.sin(theta / 2) ** 2;
  return { prob0, prob1 };
}

export function formatStateVectorLatex(theta: number, phi: number): string {
  const alphaStr = Math.cos(theta / 2).toFixed(3);
  const betaStr = Math.sin(theta / 2).toFixed(3);
  const phiStr = phi.toFixed(2);
  const betaTerm = Math.abs(phi) < 0.01 ? betaStr : `${betaStr}e^{i \cdot ${phiStr}}`;
  return `|\\psi\\rangle = ${alphaStr}|0\\rangle + ${betaTerm}|1\\rangle`;
}

export function applyGate(
  theta: number,
  phi: number,
  gateType: string
): { theta: number; phi: number } {
  const cosT = Math.cos(theta / 2);
  const sinT = Math.sin(theta / 2);

  const a: Complex = { re: cosT, im: 0 };
  const b: Complex = { re: sinT * Math.cos(phi), im: sinT * Math.sin(phi) };

  let u00: Complex = { re: 1, im: 0 };
  let u01: Complex = { re: 0, im: 0 };
  let u10: Complex = { re: 0, im: 0 };
  let u11: Complex = { re: 1, im: 0 };

  const gate = gateType.toUpperCase();

  switch (gate) {
    case 'X':
      u00 = { re: 0, im: 0 };
      u01 = { re: 1, im: 0 };
      u10 = { re: 1, im: 0 };
      u11 = { re: 0, im: 0 };
      break;

    case 'Y':
      u00 = { re: 0, im: 0 };
      u01 = { re: 0, im: -1 };
      u10 = { re: 0, im: 1 };
      u11 = { re: 0, im: 0 };
      break;

    case 'Z':
      u00 = { re: 1, im: 0 };
      u01 = { re: 0, im: 0 };
      u10 = { re: 0, im: 0 };
      u11 = { re: -1, im: 0 };
      break;

    case 'H': {
      const invSqrt2 = 1 / Math.SQRT2;
      u00 = { re: invSqrt2, im: 0 };
      u01 = { re: invSqrt2, im: 0 };
      u10 = { re: invSqrt2, im: 0 };
      u11 = { re: -invSqrt2, im: 0 };
      break;
    }

    case 'S':
      u00 = { re: 1, im: 0 };
      u01 = { re: 0, im: 0 };
      u10 = { re: 0, im: 0 };
      u11 = { re: 0, im: 1 };
      break;

    case 'T': {
      const invSqrt2 = 1 / Math.SQRT2;
      u00 = { re: 1, im: 0 };
      u01 = { re: 0, im: 0 };
      u10 = { re: 0, im: 0 };
      u11 = { re: invSqrt2, im: invSqrt2 };
      break;
    }

    default:
      return { theta, phi };
  }

  const add = (c1: Complex, c2: Complex): Complex => ({ re: c1.re + c2.re, im: c1.im + c2.im });
  const mul = (c1: Complex, c2: Complex): Complex => ({
    re: c1.re * c2.re - c1.im * c2.im,
    im: c1.re * c2.im + c1.im * c2.re,
  });

  const newA = add(mul(u00, a), mul(u01, b));
  const newB = add(mul(u10, a), mul(u11, b));

  const magA = Math.hypot(newA.re, newA.im);
  const magB = Math.hypot(newB.re, newB.im);

  const newTheta = 2 * Math.atan2(magB, magA);

  let newPhi = 0;
  if (magA > 1e-12) {
    const phaseA = Math.atan2(newA.im, newA.re);
    const phaseB = Math.atan2(newB.im, newB.re);
    newPhi = phaseB - phaseA;
  } else if (magB > 1e-12) {
    newPhi = Math.atan2(newB.im, newB.re);
  }

  const twoPi = 2 * Math.PI;
  newPhi = ((newPhi % twoPi) + twoPi) % twoPi;

  return { theta: newTheta, phi: newPhi };
}
