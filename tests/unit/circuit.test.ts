import { describe, it, expect } from 'vitest';
import { createEmptyCircuit, placeGate, removeGate, evaluateFullCircuit } from '../../src/core/quantum/circuit';

describe('Circuit Unit Tests', () => {
  it('should create and modify circuit', () => {
    let c = createEmptyCircuit(2);
    c = placeGate(c, { id: 'g1', type: 'H', step: 0, targets: [0] }, 0);
    expect(c.steps.length).toBe(1);
    c = removeGate(c, 'g1');
    expect(c.steps[0].gates.length).toBe(0);
  });

  it('should evaluate circuit fully', () => {
    const c = createEmptyCircuit(1);
    const h = evaluateFullCircuit(c);
    expect(h.final.length).toBe(2);
  });
});
