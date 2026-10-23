/**
 * Pure, zero-dependency quantum mechanics engine for a single qubit.
 */

export interface QubitState {
  theta: number;
  phi: number;
}

export interface StateMetrics {
  alpha: number;
  betaReal: number;
  betaImag: number;
  prob0: number;
  prob1: number;
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
 * Calculates the new theta and phi after applying Hadamard (H), Pauli-X (X), or Pauli-Z (Z) gates.
 */
export function applyGate(state: QubitState, gate: 'H' | 'X' | 'Z'): QubitState {
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
    case 'Z':
      nx = -x;
      ny = -y;
      nz = z;
      break;
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
 * Performs stochastic collapse based on prob0.
 * Returns outcome 0 (theta=0, phi=0) or 1 (theta=PI, phi=0).
 */
export function measureState(
  state: QubitState,
  randomValue = Math.random()
): { outcome: 0 | 1; newState: QubitState } {
  const { prob0 } = computeStateMetrics(state);
  const outcome: 0 | 1 = randomValue < prob0 ? 0 : 1;
  const newState: QubitState = outcome === 0
    ? { theta: 0, phi: 0 }
    : { theta: Math.PI, phi: 0 };

  return { outcome, newState };
}
