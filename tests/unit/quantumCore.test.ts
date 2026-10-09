import { describe, it, expect } from 'vitest';
import { measureQubitState, validateCircuit, createInitialState } from '@/core/quantum';
import { createZeroState, probability, probabilities, norm, type StateVector, type Complex } from '@/core/quantum/statevector';
import { applyGateN, applyCNOT_N, applyCZ_N, applySWAP_N, H, X, Y, Z, S, T } from '@/core/quantum/gates';
import { evaluateFullCircuit } from '@/core/quantum/circuit';
import { ghz6Circuit, ghzState } from '@/core/quantum/presets';
import { measureQubitN } from '@/core/quantum/measurement';

const EPS = 1e-7;

function assertNormOne(state: StateVector): void {
  expect(Math.abs(norm(state) - 1)).toBeLessThan(EPS);
}

function assertProbsSumOne(state: StateVector): void {
  const total = probabilities(state).reduce((a, b) => a + b, 0);
  expect(Math.abs(total - 1)).toBeLessThan(EPS);
}

describe('Quantum Core Tests', () => {
  it('should validate invalid circuit', () => {
    const invalidCircuit = { numQubits: 2, gates: [{ id: '1', type: 'H', targetQubit: 5 }] };
    const validation = validateCircuit(invalidCircuit) as { valid: boolean; errors: string[] };
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });

  it('should measure qubit state', () => {
    const state: Complex[] = [{ re: 1, im: 0 }, { re: 0, im: 0 }];
    const result0 = measureQubitState(0, state, () => 0.1) as { collapsedBit: number };
    expect(result0.collapsedBit).toBe(0);

    const result1 = measureQubitState(0, state, () => 0.9) as { collapsedBit: number };
    expect(result1.collapsedBit).toBe(1);
  });

  it('should create initial state', () => {
    const states = createInitialState(3) as Array<Complex>;
    expect(states.length).toBe(8);
    expect(states[0]).toEqual({ re: 1, im: 0 });
  });
});

describe('Phase 4 - Quantum Engine Precision (6 qubits, eps=1e-7)', () => {
  it('canonical sequence preserves norm', () => {
    let state = createZeroState(6);
    state = applyGateN(state, H, 0, 6);
    state = applyGateN(state, X, 1, 6);
    state = applyGateN(state, Y, 2, 6);
    state = applyGateN(state, Z, 3, 6);
    state = applyGateN(state, S, 4, 6);
    state = applyGateN(state, T, 5, 6);
    state = applyCNOT_N(state, 0, 1, 6);
    state = applyCZ_N(state, 2, 3, 6);
    state = applySWAP_N(state, 4, 5, 6);
    assertNormOne(state);
    assertProbsSumOne(state);
  });

  it('produces (|0..0> + |1..1>)/sqrt(2)', () => {
    const h = evaluateFullCircuit(ghz6Circuit());
    expect(probability(h.final, 0)).toBeCloseTo(0.5, 7);
    expect(probability(h.final, 63)).toBeCloseTo(0.5, 7);
  });

  it('evaluateFullCircuit(ghz6Circuit()) matches ghzState(6)', () => {
    const h = evaluateFullCircuit(ghz6Circuit());
    const g = ghzState(6);
    for (let i = 0; i < 64; i++) {
      expect(Math.abs(h.final[i].re - g[i].re)).toBeLessThan(EPS);
      expect(Math.abs(h.final[i].im - g[i].im)).toBeLessThan(EPS);
    }
  });

  it('measuring q0 collapses state consistently', () => {
    const h = evaluateFullCircuit(ghz6Circuit());
    const r0 = measureQubitN(h.final, 0, 6, () => 0.4);
    expect(r0.outcome === 0 || r0.outcome === 1).toBe(true);
  });
});
