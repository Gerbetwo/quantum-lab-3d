import { describe, it, expect } from 'vitest';
import {
  evaluateObjective,
  getObjectiveById,
  OBJECTIVES,
} from '../objectivesConfig';

describe('Objectives Evaluation Engine (7 Concepts)', () => {
  it('defines objectives for all 7 concepts', () => {
    expect(OBJECTIVES).toHaveLength(7);
  });

  it('evaluates Superposition objective: reach state |1⟩ in ≤ 2 gates', () => {
    // Aligned: θ > π - 0.035 and gates ≤ 2
    expect(
      evaluateObjective('superposition', {
        state: { theta: Math.PI - 0.01, phi: 0 },
        gateCount: 1,
      })
    ).toBe(true);

    // Failed: not at South pole
    expect(
      evaluateObjective('superposition', {
        state: { theta: 0, phi: 0 },
        gateCount: 1,
      })
    ).toBe(false);

    // Failed: exceeded gate limit
    expect(
      evaluateObjective('superposition', {
        state: { theta: Math.PI, phi: 0 },
        gateCount: 3,
      })
    ).toBe(false);
  });

  it('evaluates Measurement objective: 100 shots matching Born rule', () => {
    // Passed: 100 shots, close to expected
    expect(
      evaluateObjective('measurement', {
        totalShots: 100,
        observedP0: 0.51,
        expectedP0: 0.5,
      })
    ).toBe(true);

    // Failed: under 100 shots
    expect(
      evaluateObjective('measurement', {
        totalShots: 50,
        observedP0: 0.5,
        expectedP0: 0.5,
      })
    ).toBe(false);
  });

  it('evaluates Interferometer objective: lower-arm phase φ = π', () => {
    expect(evaluateObjective('interferometer', { phasePhi: Math.PI })).toBe(true);
    expect(evaluateObjective('interferometer', { phasePhi: 0 })).toBe(false);
  });

  it('evaluates Entanglement objective: Alice & Bob collapse to |11⟩', () => {
    expect(
      evaluateObjective('entanglement', {
        entangledPair: { alice: 1, bob: 1 },
      })
    ).toBe(true);

    expect(
      evaluateObjective('entanglement', {
        entangledPair: { alice: 0, bob: 0 },
      })
    ).toBe(false);
  });

  it('evaluates Decoherence objective: purity > 80% at T ≤ 15 mK', () => {
    expect(
      evaluateObjective('decoherence', {
        temperature: 15,
        purity: 0.95,
      })
    ).toBe(true);

    expect(
      evaluateObjective('decoherence', {
        temperature: 100,
        purity: 0.95,
      })
    ).toBe(false);
  });

  it('evaluates Grover objective: target probability > 90%', () => {
    expect(evaluateObjective('grover', { groverTargetProb: 0.95 })).toBe(true);
    expect(evaluateObjective('grover', { groverTargetProb: 0.5 })).toBe(false);
  });

  it('evaluates QEC objective: syndrome detects and repairs bit flip', () => {
    expect(
      evaluateObjective('qec', {
        qecSyndrome: 2,
        qecCorrectedTriple: [0, 0, 0],
      })
    ).toBe(true);
  });

  it('returns undefined for non-existent objective ID', () => {
    expect(getObjectiveById('non-existent')).toBeUndefined();
  });
});
