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
  Matrix2x2,
  Matrix4x4,
  ReducedDensityMatrixResult,
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

/**
 * Coordinate Transformations: Standardizing Quantum Physical Space to Three.js Visual Space.
 * - Quantization / Phase Axis (Z_phys): Maps to Three.js +Y (0, 1, 0) [North Pole = |0⟩, South Pole = |1⟩]
 * - Bit-Flip Axis (X_phys): Maps to Three.js +X (1, 0, 0)
 * - Phase-Bit Axis (Y_phys): Maps to Three.js +Z (0, 0, 1)
 */
export function quantumToVisualCoordinates(xPhys: number, yPhys: number, zPhys: number): { x: number; y: number; z: number } {
  return {
    x: xPhys,
    y: zPhys,
    z: yPhys,
  };
}

export function visualToQuantumCoordinates(xVisual: number, yVisual: number, zVisual: number): { x: number; y: number; z: number } {
  return {
    x: xVisual,
    y: zVisual,
    z: yVisual,
  };
}

export function blochSphericalToVisualVector(theta: number, phi: number): { x: number; y: number; z: number } {
  const normTheta = normalizeAngleTheta(theta);
  const normPhi = normalizeAnglePhi(phi);
  const sT = Math.sin(normTheta);
  return {
    x: sT * Math.cos(normPhi),
    y: Math.cos(normTheta),
    z: sT * Math.sin(normPhi),
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
 * Applies unitary gate rotation via SU(2) / Quaternion kinematics to prevent Gimbal Lock near the poles.
 * Rotates physical Bloch vector v_phys = (x, y, z) by quaternion q = (w, u):
 *   v' = v + 2 * u × (u × v + w * v)
 * Supports: H (Hadamard), X (Pauli-X), Y (Pauli-Y), Z (Pauli-Z), S (Phase), T (π/8).
 */
export function applyGate(
  state: QubitState,
  gate: 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T'
): QubitState {
  const normTheta = normalizeAngleTheta(state.theta);
  const normPhi = normalizeAnglePhi(state.phi);

  const vx = Math.sin(normTheta) * Math.cos(normPhi);
  const vy = Math.sin(normTheta) * Math.sin(normPhi);
  const vz = Math.cos(normTheta);

  // Unit quaternion representation q = (w, ux, uy, uz) in physical coordinates:
  let w = 0;
  let ux = 0;
  let uy = 0;
  let uz = 0;

  switch (gate) {
    case 'X': // π rotation around physical X axis (1, 0, 0)
      w = 0;
      ux = 1;
      uy = 0;
      uz = 0;
      break;
    case 'Y': // π rotation around physical Y axis (0, 1, 0)
      w = 0;
      ux = 0;
      uy = 1;
      uz = 0;
      break;
    case 'Z': // π rotation around physical Z axis (0, 0, 1)
      w = 0;
      ux = 0;
      uy = 0;
      uz = 1;
      break;
    case 'H': // π rotation around physical (X + Z)/√2 axis
      w = 0;
      ux = 1 / Math.SQRT2;
      uy = 0;
      uz = 1 / Math.SQRT2;
      break;
    case 'S': // π/2 rotation around physical Z axis (0, 0, 1)
      w = Math.SQRT1_2; // cos(π/4)
      ux = 0;
      uy = 0;
      uz = Math.SQRT1_2; // sin(π/4)
      break;
    case 'T': // π/4 rotation around physical Z axis (0, 0, 1)
      w = Math.cos(Math.PI / 8);
      ux = 0;
      uy = 0;
      uz = Math.sin(Math.PI / 8);
      break;
  }

  // Cross product: t = 2 * (u × v)
  const tx = 2 * (uy * vz - uz * vy);
  const ty = 2 * (uz * vx - ux * vz);
  const tz = 2 * (ux * vy - uy * vx);

  // v' = v + w * t + (u × t)
  const nx = vx + w * tx + (uy * tz - uz * ty);
  const ny = vy + w * ty + (uz * tx - ux * tz);
  const nz = vz + w * tz + (ux * ty - uy * tx);

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

/**
 * Computes global 4x4 density matrix ρ_AB = |ψ_AB⟩⟨ψ_AB| for C⁴ state space.
 */
export function computeDensityMatrix4x4(
  c00: { real: number; imag: number },
  c01: { real: number; imag: number },
  c10: { real: number; imag: number },
  c11: { real: number; imag: number }
): Matrix4x4 {
  const psi = [c00, c01, c10, c11];
  const rho: Matrix4x4 = [];
  for (let i = 0; i < 4; i++) {
    rho[i] = [];
    for (let j = 0; j < 4; j++) {
      // psi[i] * conj(psi[j])
      rho[i][j] = {
        real: psi[i].real * psi[j].real + psi[i].imag * psi[j].imag,
        imag: psi[i].imag * psi[j].real - psi[i].real * psi[j].imag,
      };
    }
  }
  return rho;
}

/**
 * Computes reduced density matrix for Qubit A: ρ_A = Tr_B(|ψ_AB⟩⟨ψ_AB|).
 */
export function computeReducedDensityMatrixA(rhoAB: Matrix4x4): Matrix2x2 {
  return [
    [
      { real: rhoAB[0][0].real + rhoAB[1][1].real, imag: rhoAB[0][0].imag + rhoAB[1][1].imag },
      { real: rhoAB[0][2].real + rhoAB[1][3].real, imag: rhoAB[0][2].imag + rhoAB[1][3].imag },
    ],
    [
      { real: rhoAB[2][0].real + rhoAB[3][1].real, imag: rhoAB[2][0].imag + rhoAB[3][1].imag },
      { real: rhoAB[2][2].real + rhoAB[3][3].real, imag: rhoAB[2][2].imag + rhoAB[3][3].imag },
    ],
  ];
}

/**
 * Computes reduced density matrix for Qubit B: ρ_B = Tr_A(|ψ_AB⟩⟨ψ_AB|).
 */
export function computeReducedDensityMatrixB(rhoAB: Matrix4x4): Matrix2x2 {
  return [
    [
      { real: rhoAB[0][0].real + rhoAB[2][2].real, imag: rhoAB[0][0].imag + rhoAB[2][2].imag },
      { real: rhoAB[0][1].real + rhoAB[2][3].real, imag: rhoAB[0][1].imag + rhoAB[2][3].imag },
    ],
    [
      { real: rhoAB[1][0].real + rhoAB[3][2].real, imag: rhoAB[1][0].imag + rhoAB[3][2].imag },
      { real: rhoAB[1][1].real + rhoAB[3][3].real, imag: rhoAB[1][1].imag + rhoAB[3][3].imag },
    ],
  ];
}

/**
 * Calculates local polarization magnitude (Bloch vector length) r = √(x² + y² + z²).
 * For maximally entangled Bell state: r = 0.0 (vector shrinks to origin (0,0,0), maximally mixed ρ = I/2).
 * For pure separable states: r = 1.0 (vector lies on unit sphere surface).
 */
export function blochVectorFromDensityMatrix(rho: Matrix2x2): { x: number; y: number; z: number; r: number } {
  const x = rho[0][1].real + rho[1][0].real;
  const y = rho[1][0].imag - rho[0][1].imag;
  const z = rho[0][0].real - rho[1][1].real;
  const r = Math.max(0, Math.min(1, Math.sqrt(x * x + y * y + z * z)));
  return {
    x: Number(x.toFixed(6)),
    y: Number(y.toFixed(6)),
    z: Number(z.toFixed(6)),
    r: Number(r.toFixed(6)),
  };
}

/**
 * Computes von Neumann entropy S(ρ) = -Tr(ρ log2 ρ) from Bloch vector length r.
 */
export function entropyFromBlochRadius(r: number): number {
  const clampedR = Math.max(0, Math.min(1, r));
  if (clampedR > 0.9999) return 0;
  if (clampedR < 0.0001) return 1;
  const lambda1 = (1 + clampedR) / 2;
  const lambda2 = (1 - clampedR) / 2;
  let s = 0;
  if (lambda1 > 1e-12) s -= lambda1 * Math.log2(lambda1);
  if (lambda2 > 1e-12) s -= lambda2 * Math.log2(lambda2);
  return Number(Math.max(0, s).toFixed(4));
}

/**
 * Computes full density matrix state for canonical Bell state |Φ+⟩ = 1/√2(|00⟩ + |11⟩).
 * In unmeasured state: rA = 0, rB = 0, entropy = 1.0 (maximally mixed).
 */
export function computeBellReducedDensityMatrices(): ReducedDensityMatrixResult {
  const invSqrt2 = 1 / Math.SQRT2;
  const rhoAB = computeDensityMatrix4x4(
    { real: invSqrt2, imag: 0 },
    { real: 0, imag: 0 },
    { real: 0, imag: 0 },
    { real: invSqrt2, imag: 0 }
  );

  const rhoA = computeReducedDensityMatrixA(rhoAB);
  const rhoB = computeReducedDensityMatrixB(rhoAB);
  const vectorA = blochVectorFromDensityMatrix(rhoA);
  const vectorB = blochVectorFromDensityMatrix(rhoB);
  const purityA = Number((vectorA.r ** 2 + 1) / 2);
  const purityB = Number((vectorB.r ** 2 + 1) / 2);

  return {
    rhoAB,
    rhoA,
    rhoB,
    vectorA,
    vectorB,
    purityA,
    purityB,
    entropyA: entropyFromBlochRadius(vectorA.r),
    entropyB: entropyFromBlochRadius(vectorB.r),
  };
}

/**
 * Performs local measurement on Qubit A, instantly collapsing both reduced density matrices
 * back to pure states (r = 1.0) at the corresponding computational eigenstates (|00⟩ or |11⟩).
 */
export function collapseEntangledDensityMatrices(outcome: 0 | 1): ReducedDensityMatrixResult {
  const c00 = outcome === 0 ? { real: 1, imag: 0 } : { real: 0, imag: 0 };
  const c11 = outcome === 1 ? { real: 1, imag: 0 } : { real: 0, imag: 0 };
  const zero = { real: 0, imag: 0 };

  const rhoAB = computeDensityMatrix4x4(c00, zero, zero, c11);
  const rhoA = computeReducedDensityMatrixA(rhoAB);
  const rhoB = computeReducedDensityMatrixB(rhoAB);
  const vectorA = blochVectorFromDensityMatrix(rhoA);
  const vectorB = blochVectorFromDensityMatrix(rhoB);

  return {
    rhoAB,
    rhoA,
    rhoB,
    vectorA,
    vectorB,
    purityA: 1.0,
    purityB: 1.0,
    entropyA: 0.0,
    entropyB: 0.0,
  };
}

export * from './types';
export * from './decoherenceMath';
export * from './algorithms';
