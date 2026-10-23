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
} from './types';

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

export * from './types';
export * from './decoherenceMath';
export * from './algorithms';
