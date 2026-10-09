export function groverIterations(N: number): number {
  return Math.floor((Math.PI / 4) * Math.sqrt(N));
}

export function classicalExpectedTrials(N: number): number {
  return N / 2;
}

export function uniformAmplitudes(N: number): number[] {
  const amp = 1 / Math.sqrt(N);
  return new Array(N).fill(amp);
}

export function simulateGroverStep(amplitudes: number[], markedIndex: number): number[] {
  const N = amplitudes.length;
  const oracleState = amplitudes.map((amp, idx) => (idx === markedIndex ? -amp : amp));
  const mean = oracleState.reduce((sum, val) => sum + val, 0) / N;
  return oracleState.map((val) => 2 * mean - val);
}

export function measureAmplitude(amplitudes: number[], rng: () => number = Math.random): number {
  const probs = amplitudes.map((a) => a * a);
  const r = rng();
  let cumulative = 0;
  for (let i = 0; i < probs.length; i++) {
    cumulative += probs[i];
    if (r <= cumulative) return i;
  }
  return amplitudes.length - 1;
}

export function groverSuccessProbability(N: number, iterations: number): number {
  if (iterations === 0) return 1 / N;
  const theta = Math.asin(1 / Math.sqrt(N));
  return Math.sin((2 * iterations + 1) * theta) ** 2;
}
