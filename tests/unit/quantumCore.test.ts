import { describe, it, expect } from 'vitest';
import { measureQubitState, validateCircuit, createInitialState } from '../../src/core/quantum';
import type { Complex } from '../../src/core/quantum/types';

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
    expect(states.length).toBe(3);
    expect(states[0]).toEqual({ re: 1, im: 0 });
  });
});
