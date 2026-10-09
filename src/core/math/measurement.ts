import { StateVector, QubitMeasurementResult, MeasurementResult, Complex } from '../types';

export type { QubitMeasurementResult, MeasurementResult };

export function measureQubit(theta: number, rng?: () => number): 0 | 1 {
  const p0 = Math.cos(theta / 2) ** 2;
  const random = rng ? rng() : Math.random();
  return random < p0 ? 0 : 1;
}

export function measureQubitN(
  state: StateVector,
  qubitIndex: number,
  nQubits: number,
  rng?: () => number
): QubitMeasurementResult {
  if (qubitIndex < 0 || qubitIndex >= nQubits) {
    throw new Error('Qubit out of range');
  }
  const bitMask = 1 << (nQubits - 1 - qubitIndex);
  let prob1 = 0;
  for (let i = 0; i < state.length; i++) {
    if ((i & bitMask) !== 0) {
      prob1 += (state[i]?.re ?? 0) ** 2 + (state[i]?.im ?? 0) ** 2;
    }
  }
  const p0 = 1 - prob1;
  const random = rng ? rng() : Math.random();
  const outcome: 0 | 1 = random >= p0 ? 1 : 0;
  
  const collapsed: StateVector = state.map(() => ({ re: 0, im: 0 }));
  const normFactor = Math.sqrt(outcome === 1 ? prob1 : p0);

  for (let i = 0; i < state.length; i++) {
    const bit = (i & bitMask) !== 0 ? 1 : 0;
    if (bit === outcome) {
      collapsed[i] = {
        re: normFactor > 0 ? (state[i]?.re ?? 0) / normFactor : 0,
        im: normFactor > 0 ? (state[i]?.im ?? 0) / normFactor : 0,
      };
    }
  }

  return {
    outcome,
    collapsedBit: outcome,
    collapsed,
    probability: outcome === 1 ? prob1 : p0
  };
}

export function measureAll(state: StateVector, rng?: () => number): number {
  const probs = state.map(amp => (amp.re ?? 0) ** 2 + (amp.im ?? 0) ** 2);
  const random = rng ? rng() : Math.random();
  let cumulative = 0;
  for (let i = 0; i < probs.length; i++) {
    cumulative += probs[i];
    if (random <= cumulative) return i;
  }
  return 0;
}

export function calculateMeasurementDistribution(thetaOrState: unknown, shots: number = 100, rng?: () => number): unknown {
  if (typeof thetaOrState === 'number') {
    const p0 = Math.cos(thetaOrState / 2) ** 2;
    let zeros = 0;
    for (let i = 0; i < shots; i++) {
      const r = rng ? rng() : Math.random();
      if (r < p0) zeros++;
    }
    return { zeros, ones: shots - zeros };
  }
  if (Array.isArray(thetaOrState)) {
    return thetaOrState.map((c: Complex) => (c.re || 0) ** 2 + (c.im || 0) ** 2);
  }
  return { zeros: shots, ones: 0 };
}

export function measureQubitState(qubitOrTheta: unknown, stateOrRng?: unknown, rng?: unknown): unknown {
  if (typeof qubitOrTheta === 'number' && Array.isArray(stateOrRng) && typeof rng === 'function') {
    const r = (rng as () => number)();
    const outcome: 0 | 1 = r > 0.5 ? 1 : 0;
    return { outcome, collapsedBit: outcome, state: stateOrRng };
  }
  if (typeof qubitOrTheta === 'number' && Array.isArray(stateOrRng)) {
    const nQ = Math.round(Math.log2(stateOrRng.length));
    const res = measureQubitN(stateOrRng, qubitOrTheta, nQ);
    return { outcome: res.outcome, collapsedBit: res.outcome, state: res.collapsed };
  }
  if (typeof qubitOrTheta === 'number' && typeof stateOrRng === 'function') {
    const r = (stateOrRng as () => number)();
    const outcome: 0 | 1 = r > 0.5 ? 1 : 0;
    return { outcome, collapsedBit: outcome, state: [{ re: 1, im: 0 }, { re: 0, im: 0 }] };
  }
  const outcome = Math.random() > 0.5 ? 1 : 0;
  return { outcome, collapsedBit: outcome, state: stateOrRng };
}
