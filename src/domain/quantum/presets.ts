/**
 * Pre-calculated LUT states for N <= 6 qubits.
 */

import type { StateVector } from './statevector';
import { dimOf, createZeroState } from './statevector';

const S = Math.SQRT1_2;

export type BellVariant = 'phi+' | 'phi-' | 'psi+' | 'psi-';

export function bellState(variant: BellVariant = 'phi+'): StateVector {
  const s: StateVector = [
    { re: 0, im: 0 },
    { re: 0, im: 0 },
    { re: 0, im: 0 },
    { re: 0, im: 0 },
  ];
  switch (variant) {
    case 'phi+': s[0] = { re: S, im: 0 }; s[3] = { re:  S, im: 0 }; break;
    case 'phi-': s[0] = { re: S, im: 0 }; s[3] = { re: -S, im: 0 }; break;
    case 'psi+': s[1] = { re: S, im: 0 }; s[2] = { re:  S, im: 0 }; break;
    case 'psi-': s[1] = { re: S, im: 0 }; s[2] = { re: -S, im: 0 }; break;
  }
  return s;
}

export function ghzState(nQubits: number): StateVector {
  const dim = dimOf(nQubits);
  const s = createZeroState(nQubits);
  s[0] = { re: S, im: 0 };
  s[dim - 1] = { re: S, im: 0 };
  return s;
}

export function wState(nQubits: number): StateVector {
  if (!Number.isInteger(nQubits) || nQubits < 1) throw new RangeError('nQubits must be an integer >= 1');
  const dim = dimOf(nQubits);
  const amp = 1 / Math.sqrt(nQubits);
  const s: StateVector = new Array(dim);
  for (let i = 0; i < dim; i++) s[i] = { re: 0, im: 0 };
  for (let q = 0; q < nQubits; q++) {
    const idx = 1 << (nQubits - 1 - q);
    s[idx] = { re: amp, im: 0 };
  }
  return s;
}
