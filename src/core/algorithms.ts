/**
 * Didactic Quantum Algorithms Mechanics
 * Grover Search, Shor (N=15), 3-Qubit QEC
 */

export interface GroverStepState {
  step: number;
  amplitudes: number[];
  probabilities: number[];
  targetFound: boolean;
}

export function simulateGroverStep(
  numQubits: number,
  targetIndex: number,
  currentStep: number
): GroverStepState {
  const N = Math.pow(2, numQubits);
  let amplitudes = Array(N).fill(1 / Math.sqrt(N));

  for (let s = 0; s < currentStep; s++) {
    // Oracle Phase Flip
    amplitudes[targetIndex] = -amplitudes[targetIndex];

    // Diffusion Inversion about Mean
    const mean = amplitudes.reduce((acc, val) => acc + val, 0) / N;
    amplitudes = amplitudes.map((amp) => 2 * mean - amp);
  }

  const probabilities = amplitudes.map((amp) => Math.pow(amp, 2));
  const targetFound = probabilities[targetIndex] > 0.8;

  return {
    step: currentStep,
    amplitudes,
    probabilities,
    targetFound,
  };
}

export interface ShorFactorResult {
  N: number;
  base: number;
  period: number;
  factors: [number, number];
  success: boolean;
}

export function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

export function simulateShorN15(base: number): ShorFactorResult {
  const N = 15;
  const validBases = [2, 7, 8, 11, 13];

  if (!validBases.includes(base)) {
    throw new Error(`Invalid coprime base ${base} for N=15. Choose from ${validBases.join(', ')}`);
  }

  // Find period r for a^x mod 15
  let r = 1;
  let val = base % N;
  while (val !== 1 && r < 20) {
    val = (val * base) % N;
    r++;
  }

  if (r % 2 !== 0) {
    return { N, base, period: r, factors: [1, N], success: false };
  }

  const halfPower = Math.pow(base, r / 2);
  const factor1 = gcd(Math.round(halfPower - 1), N);
  const factor2 = gcd(Math.round(halfPower + 1), N);

  const success = factor1 * factor2 === N && factor1 > 1 && factor2 > 1;

  return {
    N,
    base,
    period: r,
    factors: [factor1, factor2],
    success,
  };
}

export interface QECResult {
  syndrome: [number, number];
  errorQubitIndex: number | null;
  recoveredState: string;
}

export function simulate3QubitBitFlipEC(errorInjectedIndex: number | null): QECResult {
  if (errorInjectedIndex === null) {
    return { syndrome: [0, 0], errorQubitIndex: null, recoveredState: 'α|000⟩ + β|111⟩ (Clean)' };
  }

  const syndromeMap: Record<number, [number, number]> = {
    0: [1, 0],
    1: [1, 1],
    2: [0, 1],
  };

  const syndrome = syndromeMap[errorInjectedIndex] || [0, 0];

  return {
    syndrome,
    errorQubitIndex: errorInjectedIndex,
    recoveredState: `Corrected Qubit ${errorInjectedIndex} -> α|000⟩ + β|111⟩ (100% Fidelity)`,
  };
}
