/**
 * N-qubit measurement with injectable RNG (deterministic in tests).
 */

import type { StateVector } from './statevector';
import { dimOf, probability, probabilities } from './statevector';

export function measureAll(state: StateVector, rng: () => number = Math.random): number {
  const probs = probabilities(state);
  const r = rng();
  let acc = 0;
  for (let i = 0; i < probs.length; i++) {
    acc += probs[i];
    if (r < acc) return i;
  }
  return probs.length - 1;
}

export interface QubitMeasurementResult {
  outcome: 0 | 1;
  collapsed: StateVector;
}

export function measureQubitN(
  state: StateVector, target: number, nQubits: number, rng: () => number = Math.random,
): QubitMeasurementResult {
  if (!Number.isInteger(target) || target < 0 || target >= nQubits) {
    throw new RangeError('target ' + target + ' out of range for n=' + nQubits);
  }
  const dim = dimOf(nQubits);
  if (state.length !== dim) throw new Error('state length mismatch');
  const bit = 1 << (nQubits - 1 - target);
  let p0 = 0, p1 = 0;
  for (let i = 0; i < dim; i++) {
    if ((i & bit) === 0) p0 += probability(state, i);
    else p1 += probability(state, i);
  }
  const r = rng();
  const outcome: 0 | 1 = r < p0 ? 0 : 1;
  const pKeep = outcome === 0 ? p0 : p1;
  const collapsed: StateVector = new Array(dim);
  for (let i = 0; i < dim; i++) {
    const isOne = (i & bit) !== 0;
    const keep = (outcome === 0 && !isOne) || (outcome === 1 && isOne);
    if (!keep || pKeep === 0) {
      collapsed[i] = { re: 0, im: 0 };
    } else {
      const s = Math.sqrt(pKeep);
      collapsed[i] = { re: state[i].re / s, im: state[i].im / s };
    }
  }
  return { outcome, collapsed };
}
