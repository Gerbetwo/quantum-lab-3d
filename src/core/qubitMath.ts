/**
 * Core Qubit & Bloch Sphere Kinematics (Pure Math)
 * Invariants: θ ∈ [0, π], φ ∈ [0, 2π], P(|0⟩) + P(|1⟩) = 1.0
 */

import {
  QuantumState,
  QubitBlochState,
  MeasurementResult,
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

export * from './types';
export * from './decoherenceMath';
export * from './algorithms';
