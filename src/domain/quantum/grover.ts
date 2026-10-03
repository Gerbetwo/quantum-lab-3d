/**
 * Grover's Search Algorithm (pure domain, no React / no Three.js)
 *
 * Convention: amplitudes are REAL numbers. For Grover's algorithm starting
 * from a uniform real superposition, the state stays real throughout.
 */

export function uniformAmplitudes(N: number): number[] {
  const a = 1 / Math.sqrt(N);
  return new Array(N).fill(a);
}

export function groverIterations(N: number): number {
  return Math.floor((Math.PI / 4) * Math.sqrt(N));
}

export function classicalExpectedTrials(N: number): number {
  return N / 2;
}

/**
 * One Grover iteration: oracle (sign flip on marked) + diffusion (reflect
 * about the mean). Preserves the sum of squared amplitudes (unitary).
 */
export function simulateGroverStep(amplitudes: number[], markedIndex: number): number[] {
  const afterOracle = amplitudes.map((a, i) => (i === markedIndex ? -a : a));
  const mean = afterOracle.reduce((s, a) => s + a, 0) / afterOracle.length;
  return afterOracle.map((a) => 2 * mean - a);
}

/**
 * Samples an index from the squared-amplitude distribution.
 * RNG is injectable for deterministic tests.
 */
export function measureAmplitude(amplitudes: number[], rng: () => number = Math.random): number {
  const probs = amplitudes.map((a) => a * a);
  const total = probs.reduce((s, p) => s + p, 0) || 1;
  const r = rng() * total;
  let acc = 0;
  for (let i = 0; i < probs.length; i++) {
    acc += probs[i];
    if (r < acc) return i;
  }
  return probs.length - 1;
}

export function groverSuccessProbability(N: number, iterations: number): number {
  const marked = 0;
  let amps = uniformAmplitudes(N);
  for (let i = 0; i < iterations; i++) amps = simulateGroverStep(amps, marked);
  return amps[marked] * amps[marked];
}
