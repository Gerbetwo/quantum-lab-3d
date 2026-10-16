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
): GroverStepState;
export function simulateGroverStep(
  amplitudes: number[],
  targetIndex: number
): number[];
export function simulateGroverStep(
  numQubitsOrAmps: number | number[],
  targetIndex: number,
  currentStep = 1
): GroverStepState | number[] {
  if (Array.isArray(numQubitsOrAmps)) {
    const N = numQubitsOrAmps.length;
    const amplitudes = numQubitsOrAmps.map((amp, idx) => (idx === targetIndex ? -amp : amp));
    const mean = amplitudes.reduce((acc, val) => acc + val, 0) / N;
    return amplitudes.map((amp) => 2 * mean - amp);
  }

  const N = Math.pow(2, numQubitsOrAmps);
  let amplitudes = Array(N).fill(1 / Math.sqrt(N));

  for (let s = 0; s < currentStep; s++) {
    amplitudes[targetIndex] = -amplitudes[targetIndex];
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

export type BitTriple = [0 | 1, 0 | 1, 0 | 1];

export function bitFlipEncode(bit: 0 | 1): BitTriple {
  return bit === 1 ? [1, 1, 1] : [0, 0, 0];
}

export function injectBitFlip(triple: BitTriple, index: 0 | 1 | 2): BitTriple {
  const copy: BitTriple = [...triple];
  copy[index] = copy[index] === 1 ? 0 : 1;
  return copy;
}

export function detectBitFlipSyndrome(triple: BitTriple): {
  syndrome: number;
  errorIndex: number;
  corrected: BitTriple;
} {
  const [b0, b1, b2] = triple;
  let errorIndex = -1;
  const corrected: BitTriple = [...triple];
  if (b0 !== b1 && b0 !== b2) errorIndex = 0;
  else if (b1 !== b0 && b1 !== b2) errorIndex = 1;
  else if (b2 !== b0 && b2 !== b1) errorIndex = 2;
  if (errorIndex !== -1) corrected[errorIndex] = corrected[errorIndex] === 1 ? 0 : 1;
  return { syndrome: errorIndex === -1 ? 0 : errorIndex + 1, errorIndex, corrected };
}

export function uniformAmplitudes(N: number): number[] {
  return Array(N).fill(1 / Math.sqrt(N));
}

export function groverIterations(N: number): number {
  return Math.max(1, Math.floor((Math.PI / 4) * Math.sqrt(N)));
}

export function measureAmplitude(
  amplitudes: number[] | number,
  _rng: () => number = Math.random
): number {
  if (typeof amplitudes === 'number') return amplitudes * amplitudes;
  const probs = amplitudes.map((a) => a * a);
  const r = _rng();
  let cumulative = 0;
  for (let i = 0; i < probs.length; i++) {
    cumulative += probs[i];
    if (r <= cumulative) return i;
  }
  return amplitudes.length - 1;
}

export interface ShorDemoResult {
  period: number;
  sequence: number[];
  factors: [number, number];
  explanation?: string;
}

export function runShorDemo(base: number): ShorDemoResult {
  const shor = simulateShorN15(base);
  const sequence: number[] = [];
  let val = 1;
  for (let i = 0; i < shor.period; i++) {
    sequence.push(val);
    val = (val * base) % 15;
  }
  return {
    period: shor.period,
    sequence,
    factors: shor.factors,
    explanation: `Period r = ${shor.period}, Factors = ${shor.factors.join(', ')}`,
  };
}
