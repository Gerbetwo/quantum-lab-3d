import { describe, it, expect } from 'vitest';
import {
  createEmptyCircuit, placeGate, removeGate, clearStep,
  evaluateCircuitStep, evaluateFullCircuit, evaluateUpToStep,
  MAX_DEPTH,
} from '@/domain/quantum/circuit';
import { probability } from '@/domain/quantum/statevector';
import { ghz6Circuit, qft3Circuit } from '@/domain/quantum/presets';

describe('circuit - createEmptyCircuit', () => {
  it('creates a 6-qubit 16-depth circuit by default', () => {
    const c = createEmptyCircuit(6);
    expect(c.nQubits).toBe(6);
    expect(c.depth).toBe(16);
    expect(c.steps).toHaveLength(16);
    expect(c.steps.every((s) => s.gates.length === 0)).toBe(true);
  });
  it('rejects nQubits > 6', () => {
    expect(() => createEmptyCircuit(7)).toThrow();
  });
  it('rejects nQubits < 1', () => {
    expect(() => createEmptyCircuit(0)).toThrow();
  });
  it('rejects depth 0 or > 16', () => {
    expect(() => createEmptyCircuit(2, 0)).toThrow();
    expect(() => createEmptyCircuit(2, 17)).toThrow();
  });
  it('exposes MAX_DEPTH=16', () => {
    expect(MAX_DEPTH).toBe(16);
  });
});

describe('circuit - placeGate', () => {
  it('places a gate and returns a new circuit (immutability)', () => {
    const c0 = createEmptyCircuit(2);
    const c1 = placeGate(c0, { type: 'H', step: 0, targets: [0] });
    expect(c1.steps[0].gates).toHaveLength(1);
    expect(c1.steps[0].gates[0].type).toBe('H');
    expect(c0.steps[0].gates).toHaveLength(0);
    expect(c0).not.toBe(c1);
  });
  it('overwrites a previous gate on the same qubit+step', () => {
    let c = createEmptyCircuit(2);
    c = placeGate(c, { type: 'H', step: 0, targets: [0] });
    c = placeGate(c, { type: 'X', step: 0, targets: [0] });
    expect(c.steps[0].gates).toHaveLength(1);
    expect(c.steps[0].gates[0].type).toBe('X');
  });
  it('rejects same control and target for CNOT', () => {
    const c = createEmptyCircuit(2);
    expect(() => placeGate(c, { type: 'CNOT', step: 0, targets: [0], controls: [0] })).toThrow();
  });
  it('rejects out-of-range qubit', () => {
    const c = createEmptyCircuit(2);
    expect(() => placeGate(c, { type: 'H', step: 0, targets: [5] })).toThrow();
  });
  it('rejects out-of-range step', () => {
    const c = createEmptyCircuit(2, 4);
    expect(() => placeGate(c, { type: 'H', step: 4, targets: [0] })).toThrow();
    expect(() => placeGate(c, { type: 'H', step: -1, targets: [0] })).toThrow();
  });
});

describe('circuit - removeGate / clearStep', () => {
  it('removes a gate by id', () => {
    let c = createEmptyCircuit(2);
    c = placeGate(c, { type: 'H', step: 0, targets: [0] });
    const id = c.steps[0].gates[0].id;
    c = removeGate(c, id);
    expect(c.steps[0].gates).toHaveLength(0);
  });
  it('no-ops on unknown id', () => {
    let c = createEmptyCircuit(2);
    c = placeGate(c, { type: 'H', step: 0, targets: [0] });
    const c2 = removeGate(c, 'nope');
    expect(c2.steps[0].gates).toHaveLength(1);
  });
  it('clearStep empties the specified step', () => {
    let c = createEmptyCircuit(2);
    c = placeGate(c, { type: 'H', step: 3, targets: [0] });
    c = placeGate(c, { type: 'X', step: 3, targets: [1] });
    c = clearStep(c, 3);
    expect(c.steps[3].gates).toHaveLength(0);
  });
  it('clearStep rejects out-of-range step', () => {
    const c = createEmptyCircuit(2, 4);
    expect(() => clearStep(c, 4)).toThrow();
  });
});

describe('circuit - evaluateCircuitStep', () => {
  it('does not mutate the input state', () => {
    const s = [{ re: 1, im: 0 }, { re: 0, im: 0 }];
    const sCopy = JSON.parse(JSON.stringify(s));
    const c = placeGate(createEmptyCircuit(1), { type: 'H', step: 0, targets: [0] });
    evaluateCircuitStep(s, c.steps[0], 1);
    expect(s).toEqual(sCopy);
  });
  it('X on |0> yields |1>', () => {
    const c = placeGate(createEmptyCircuit(1), { type: 'X', step: 0, targets: [0] });
    const out = evaluateCircuitStep([{ re: 1, im: 0 }, { re: 0, im: 0 }], c.steps[0], 1);
    expect(probability(out, 1)).toBeCloseTo(1);
  });
  it('H on |0> yields 50/50 superposition', () => {
    const c = placeGate(createEmptyCircuit(1), { type: 'H', step: 0, targets: [0] });
    const out = evaluateCircuitStep([{ re: 1, im: 0 }, { re: 0, im: 0 }], c.steps[0], 1);
    expect(probability(out, 0)).toBeCloseTo(0.5);
    expect(probability(out, 1)).toBeCloseTo(0.5);
  });
});

describe('circuit - evaluateFullCircuit', () => {
  it('produces GHZ-6 from ghz6Circuit()', () => {
    const h = evaluateFullCircuit(ghz6Circuit());
    expect(probability(h.final, 0)).toBeCloseTo(0.5);
    expect(probability(h.final, 63)).toBeCloseTo(0.5);
  });
  it('produces uniform distribution from QFT-3 on |000>', () => {
    const h = evaluateFullCircuit(qft3Circuit());
    for (let i = 0; i < 8; i++) {
      expect(probability(h.final, i)).toBeCloseTo(1 / 8, 4);
    }
  });
  it('afterEachStep has length equal to depth', () => {
    const h = evaluateFullCircuit(ghz6Circuit());
    expect(h.afterEachStep).toHaveLength(16);
    expect(h.final).toBe(h.afterEachStep[15]);
  });
});

describe('circuit - evaluateUpToStep', () => {
  it('returns the initial state for n=0', () => {
    const c = ghz6Circuit();
    const s = evaluateUpToStep(c, 0);
    expect(probability(s, 0)).toBeCloseTo(1);
  });
  it('matches evaluateFullCircuit at n=depth', () => {
    const c = ghz6Circuit();
    const s = evaluateUpToStep(c, 16);
    const h = evaluateFullCircuit(c);
    for (let i = 0; i < 64; i++) {
      expect(probability(s, i)).toBeCloseTo(probability(h.final, i), 6);
    }
  });
  it('clamps n to [0, depth]', () => {
    const c = ghz6Circuit();
    const sNeg = evaluateUpToStep(c, -5);
    expect(probability(sNeg, 0)).toBeCloseTo(1);
    const sBig = evaluateUpToStep(c, 999);
    expect(probability(sBig, 0)).toBeCloseTo(0.5);
  });
});

describe('circuit - validateCircuit', () => {
  it('returns ok for a well-formed circuit', async () => {
    const { validateCircuit } = await import('@/domain/quantum/circuit');
    const c = ghz6Circuit();
    expect(validateCircuit(c).ok).toBe(true);
  });
});