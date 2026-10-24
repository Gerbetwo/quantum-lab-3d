/**
 * Core Qubit & Bloch Sphere Kinematics (Pure Math)
 * Invariants: θ ∈ [0, π], φ ∈ [0, 2π], P(|0⟩) + P(|1⟩) = 1.0
 */

import {
  QuantumState,
  QubitBlochState,
  MeasurementResult,
  QubitState,
  StateMetrics,
  TwoQubitTensorState,
  TwoQubitMeasurementResult,
} from './types';
import { purityAtTemperature } from './decoherenceMath';

export function normalizeAngleTheta(theta: number): number {
  return Math.max(0, Math.min(Math.PI, theta));
}

export function normalizeAnglePhi(phi: number): number {
  let p = phi % (2 * Math.PI);
  if (p < 0) p += 2 * Math.PI;
  return p;
}

export function computeStateVector(theta: number, phi: number): QuantumState {
  const normTheta = normalizeAngleTheta(theta);
  const normPhi = normalizeAnglePhi(phi);

  const alphaReal = Math.cos(normTheta / 2);
  const betaMagnitude = Math.sin(normTheta / 2);

  return {
    alpha: { real: alphaReal, imag: 0 },
    beta: {
      real: betaMagnitude * Math.cos(normPhi),
      imag: betaMagnitude * Math.sin(normPhi),
    },
    theta: normTheta,
    phi: normPhi,
  };
}

export function computeBlochCoordinates(theta: number, phi: number): QubitBlochState {
  const normTheta = normalizeAngleTheta(theta);
  const normPhi = normalizeAnglePhi(phi);

  const x = Math.sin(normTheta) * Math.cos(normPhi);
  const y = Math.sin(normTheta) * Math.sin(normPhi);
  const z = Math.cos(normTheta);

  const prob0 = Math.cos(normTheta / 2) ** 2;
  const prob1 = Math.sin(normTheta / 2) ** 2;

  return { x, y, z, theta: normTheta, phi: normPhi, prob0, prob1 };
}

export function measureQuantumState(
  theta: number,
  phi: number,
  randomSeed = Math.random()
): MeasurementResult {
  const { prob0 } = computeBlochCoordinates(theta, phi);
  const outcome: 0 | 1 = randomSeed < prob0 ? 0 : 1;
  const probability = outcome === 0 ? prob0 : 1 - prob0;

  const collapsedTheta = outcome === 0 ? 0 : Math.PI;
  const collapsedState = computeStateVector(collapsedTheta, 0);

  return { outcome, probability, collapsedState };
}

export function createBellState(): { pair: string; probability00: number; probability11: number } {
  return {
    pair: '|Φ+⟩ = 1/√2(|00⟩ + |11⟩)',
    probability00: 0.5,
    probability11: 0.5,
  };
}

export function bellState() {
  return createBellState();
}

export function measureEntangledQubit(randomSeed = Math.random()): {
  localOutcome: 0 | 1;
  remoteOutcome: 0 | 1;
  aliceOutcome: 0 | 1;
  bobOutcome: 0 | 1;
  state: string;
} {
  const bit: 0 | 1 = randomSeed < 0.5 ? 0 : 1;
  return {
    localOutcome: bit,
    remoteOutcome: bit,
    aliceOutcome: bit,
    bobOutcome: bit,
    state: bit === 0 ? '|00⟩' : '|11⟩',
  };
}

/**
 * Calculates alpha = cos(theta/2), betaReal = sin(theta/2)*cos(phi),
 * betaImag = sin(theta/2)*sin(phi), prob0 = cos^2(theta/2), prob1 = sin^2(theta/2).
 */
export function computeStateMetrics(state: QubitState): StateMetrics {
  const halfTheta = state.theta / 2;
  const alpha = Math.cos(halfTheta);
  const sinHalf = Math.sin(halfTheta);
  const betaReal = sinHalf * Math.cos(state.phi);
  const betaImag = sinHalf * Math.sin(state.phi);
  const prob0 = Math.cos(halfTheta) ** 2;
  const prob1 = Math.sin(halfTheta) ** 2;

  return {
    alpha,
    betaReal,
    betaImag,
    prob0,
    prob1,
  };
}

/**
 * Calculates updated spherical angles (theta, phi) after applying unitary matrix rotation.
 * Supports: H (Hadamard), X (Pauli-X), Y (Pauli-Y), Z (Pauli-Z), S (Phase), T (π/8).
 */
export function applyGate(
  state: QubitState,
  gate: 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T'
): QubitState {
  const x = Math.sin(state.theta) * Math.cos(state.phi);
  const y = Math.sin(state.theta) * Math.sin(state.phi);
  const z = Math.cos(state.theta);

  let nx = x;
  let ny = y;
  let nz = z;

  switch (gate) {
    case 'H':
      nx = z;
      ny = -y;
      nz = x;
      break;
    case 'X':
      nx = x;
      ny = -y;
      nz = -z;
      break;
    case 'Y':
      nx = -x;
      ny = y;
      nz = -z;
      break;
    case 'Z':
      nx = -x;
      ny = -y;
      nz = z;
      break;
    case 'S':
      nx = -y;
      ny = x;
      nz = z;
      break;
    case 'T': {
      const cos45 = Math.SQRT1_2;
      const sin45 = Math.SQRT1_2;
      nx = x * cos45 - y * sin45;
      ny = x * sin45 + y * cos45;
      nz = z;
      break;
    }
  }

  const clampedZ = Math.max(-1, Math.min(1, nz));
  if (Math.abs(clampedZ - 1) < 1e-12) {
    return { theta: 0, phi: 0 };
  }
  if (Math.abs(clampedZ + 1) < 1e-12) {
    return { theta: Math.PI, phi: 0 };
  }

  const theta = Math.acos(clampedZ);
  let phi = Math.atan2(ny, nx);
  if (phi < 0) {
    phi += 2 * Math.PI;
  }
  if (Math.abs(phi) < 1e-12 || Math.abs(phi - 2 * Math.PI) < 1e-12) {
    phi = 0;
  }

  return { theta, phi };
}

/**
 * Performs Born-rule stochastic wavefunction collapse based on prob0.
 * Returns outcome 0 (theta=0, phi=0) or 1 (theta=PI, phi=0).
 */
export function measureState(
  state: QubitState,
  seed = Math.random()
): { outcome: 0 | 1; newState: QubitState } {
  const { prob0 } = computeStateMetrics(state);
  const outcome: 0 | 1 = seed < prob0 ? 0 : 1;
  const newState: QubitState = outcome === 0
    ? { theta: 0, phi: 0 }
    : { theta: Math.PI, phi: 0 };

  return { outcome, newState };
}

/**
 * Computes multi-qubit tensor product state |ψ⟩ = |q1⟩ ⊗ |q2⟩:
 * |ψ⟩ = α|00⟩ + β|01⟩ + γ|10⟩ + δ|11⟩
 * Computes Born probabilities, von Neumann / Shannon thermal entropy, and fidelity.
 */
export function computeTwoQubitTensorState(
  qubit1: QubitState,
  qubit2?: QubitState,
  options?: { temperature?: number }
): TwoQubitTensorState {
  const normTheta1 = normalizeAngleTheta(qubit1.theta);
  const normPhi1 = normalizeAnglePhi(qubit1.phi);
  const q2 = qubit2 ?? { theta: 0, phi: 0 };
  const normTheta2 = normalizeAngleTheta(q2.theta);
  const normPhi2 = normalizeAnglePhi(q2.phi);

  const c1 = Math.cos(normTheta1 / 2);
  const s1 = Math.sin(normTheta1 / 2);
  const c2 = Math.cos(normTheta2 / 2);
  const s2 = Math.sin(normTheta2 / 2);

  const alpha = { real: c1 * c2, imag: 0 };
  const beta = { real: c1 * s2 * Math.cos(normPhi2), imag: c1 * s2 * Math.sin(normPhi2) };
  const gamma = { real: s1 * Math.cos(normPhi1) * c2, imag: s1 * Math.sin(normPhi1) * c2 };
  const delta = {
    real: s1 * s2 * Math.cos(normPhi1 + normPhi2),
    imag: s1 * s2 * Math.sin(normPhi1 + normPhi2),
  };

  const prob00 = c1 ** 2 * c2 ** 2;
  const prob01 = c1 ** 2 * s2 ** 2;
  const prob10 = s1 ** 2 * c2 ** 2;
  const prob11 = s1 ** 2 * s2 ** 2;

  const temp = options?.temperature;
  const purity = temp !== undefined ? purityAtTemperature(temp) : 1.0;

  // Thermal mixing: p_i = purity * P_i + (1 - purity) * 0.25
  const eff00 = purity * prob00 + (1 - purity) * 0.25;
  const eff01 = purity * prob01 + (1 - purity) * 0.25;
  const eff10 = purity * prob10 + (1 - purity) * 0.25;
  const eff11 = purity * prob11 + (1 - purity) * 0.25;

  const effProbs = [eff00, eff01, eff10, eff11];
  let entropy = 0;
  for (const p of effProbs) {
    if (p > 1e-12) {
      entropy -= p * Math.log2(p);
    }
  }
  entropy = Math.max(0, Number(entropy.toFixed(4)));
  const fidelity = Number(purity.toFixed(4));

  const formatAmp = (amp: { real: number; imag: number }, ket: string) => {
    const mag = Math.sqrt(amp.real ** 2 + amp.imag ** 2);
    if (mag < 1e-4) return null;
    return `${mag.toFixed(3)}${ket}`;
  };

  const terms = [
    formatAmp(alpha, '|00⟩'),
    formatAmp(beta, '|01⟩'),
    formatAmp(gamma, '|10⟩'),
    formatAmp(delta, '|11⟩'),
  ].filter(Boolean);

  const dirac = terms.length > 0 ? `|ψ⟩ = ${terms.join(' + ')}` : '|ψ⟩ = 0';

  return {
    alpha,
    beta,
    gamma,
    delta,
    prob00,
    prob01,
    prob10,
    prob11,
    purity,
    entropy,
    fidelity,
    dirac,
  };
}

/**
 * Performs unbiased stochastic collapse for 2-qubit tensor states based on Born probabilities.
 */
export function measureTwoQubitState(
  probs: { prob00: number; prob01: number; prob10: number; prob11: number },
  seed = Math.random()
): TwoQubitMeasurementResult {
  const p00 = Math.max(0, probs.prob00);
  const p01 = Math.max(0, probs.prob01);
  const p10 = Math.max(0, probs.prob10);
  const p11 = Math.max(0, probs.prob11);
  const total = p00 + p01 + p10 + p11 || 1.0;

  const normP00 = p00 / total;
  const normP01 = p01 / total;
  const normP10 = p10 / total;

  if (seed < normP00) {
    return { outcome: '00', alice: 0, bob: 0, state: '|00⟩', probability: normP00 };
  }
  if (seed < normP00 + normP01) {
    return { outcome: '01', alice: 0, bob: 1, state: '|01⟩', probability: normP01 };
  }
  if (seed < normP00 + normP01 + normP10) {
    return { outcome: '10', alice: 1, bob: 0, state: '|10⟩', probability: normP10 };
  }
  return { outcome: '11', alice: 1, bob: 1, state: '|11⟩', probability: p11 / total };
}

export * from './types';
export * from './decoherenceMath';
export * from './algorithms';
