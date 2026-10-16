import { describe, it, expect } from 'vitest';
import { computeStateVector, computeBlochCoordinates, measureQuantumState } from '../core/qubitMath';
import { calculateT2CoherenceTime, applyPhaseDecay } from '../core/decoherenceMath';
import { simulateGroverStep, simulateShorN15, simulate3QubitBitFlipEC } from '../core/algorithms';

describe('Quantum Core Math (src/core)', () => {
  describe('qubitMath', () => {
    it('computes state vector for |0⟩', () => {
      const state = computeStateVector(0, 0);
      expect(state.alpha.real).toBeCloseTo(1);
      expect(state.beta.real).toBeCloseTo(0);
    });

    it('computes Bloch coordinates for |+⟩', () => {
      const bloch = computeBlochCoordinates(Math.PI / 2, 0);
      expect(bloch.x).toBeCloseTo(1);
      expect(bloch.y).toBeCloseTo(0);
      expect(bloch.z).toBeCloseTo(0);
    });

    it('collapses state upon measurement', () => {
      const result = measureQuantumState(0, 0, 0.1);
      expect(result.outcome).toBe(0);
      expect(result.probability).toBeCloseTo(1);
    });
  });

  describe('decoherenceMath', () => {
    it('calculates T2 coherence time for 15mK', () => {
      const t2 = calculateT2CoherenceTime(15);
      expect(t2).toBeGreaterThan(200);
    });

    it('applies phase decay', () => {
      const decayed = applyPhaseDecay(Math.PI / 2, 0, 100, 250);
      expect(decayed.purity).toBeLessThan(1);
    });
  });

  describe('algorithms', () => {
    it('simulates Grover search step', () => {
      const grover = simulateGroverStep(2, 0, 1);
      expect(grover.probabilities[0]).toBeGreaterThan(0.5);
    });

    it('simulates Shor N=15 factoring', () => {
      const shor = simulateShorN15(7);
      expect(shor.success).toBe(true);
      expect(shor.factors).toContain(3);
      expect(shor.factors).toContain(5);
    });

    it('simulates 3-qubit bitflip error correction', () => {
      const qec = simulate3QubitBitFlipEC(1);
      expect(qec.syndrome).toEqual([1, 1]);
    });
  });
});
