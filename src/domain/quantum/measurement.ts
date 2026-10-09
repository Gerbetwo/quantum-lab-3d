import { StateVector, MeasurementResult, QubitMeasurementResult } from './types';

export function measureQubit(theta: number, rng?: () => number): 0 | 1;
export function measureQubit(
  state: StateVector,
  qubitIndex?: number,
  rng?: () => number
): QubitMeasurementResult;
export function measureQubit(
  stateOrTheta: StateVector | number,
  qubitIndexOrRng?: number | (() => number),
  rngParam: () => number = Math.random
): 0 | 1 | QubitMeasurementResult {
  if (typeof stateOrTheta === 'number') {
    const theta = stateOrTheta;
    const rng = typeof qubitIndexOrRng === 'function' ? qubitIndexOrRng : rngParam;
    const prob1 = Math.pow(Math.sin(theta / 2), 2);
    const sample = rng();
    return sample < 1 - prob1 ? 0 : 1;
  }

  const state = stateOrTheta;
  const rng = typeof qubitIndexOrRng === 'function' ? qubitIndexOrRng : rngParam;

  if (!state || state.length < 2) {
    return { outcome: 0, probabilityZero: 1, probabilityOne: 0 };
  }

  const alpha = state[0];
  const beta = state[1];
  const prob0 = alpha.re * alpha.re + alpha.im * alpha.im;
  const prob1 = beta.re * beta.re + beta.im * beta.im;

  const total = prob0 + prob1 || 1;
  const p0 = prob0 / total;
  const p1 = prob1 / total;

  const outcome: 0 | 1 = rng() < p0 ? 0 : 1;

  return {
    outcome,
    probabilityZero: Math.round(p0 * 100) / 100,
    probabilityOne: Math.round(p1 * 100) / 100,
  };
}

export function calculateMeasurementDistribution(
  theta: number,
  shots?: number,
  rng?: () => number
): { zeros: number; ones: number };
export function calculateMeasurementDistribution(state: StateVector): number[];
export function calculateMeasurementDistribution(
  stateOrTheta: StateVector | number,
  shots?: number,
  rng: () => number = Math.random
): number[] | { zeros: number; ones: number } {
  if (typeof stateOrTheta === 'number') {
    const theta = stateOrTheta;
    const totalShots = shots || 100;
    const prob1 = Math.pow(Math.sin(theta / 2), 2);
    const threshold = 1 - prob1;
    let zeros = 0;
    let ones = 0;
    for (let i = 0; i < totalShots; i++) {
      if (rng() < threshold) zeros++;
      else ones++;
    }
    return { zeros, ones };
  }

  return stateOrTheta.map((c) => c.re * c.re + c.im * c.im);
}

export function measureQubitState(
  qubitIndex: number,
  state: [number, number],
  random: () => number = Math.random
): MeasurementResult {
  const [alpha, beta] = state;
  const prob0 = alpha * alpha;
  const prob1 = beta * beta;
  const sample = random();
  const collapsedBit: 0 | 1 = sample < prob0 ? 0 : 1;

  return {
    qubitIndex,
    collapsedBit,
    probabilityZero: Math.round(prob0 * 100) / 100,
    probabilityOne: Math.round(prob1 * 100) / 100,
  };
}
