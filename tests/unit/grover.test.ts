import { describe, it, expect } from 'vitest';
import {
  uniformAmplitudes,
  groverIterations,
  classicalExpectedTrials,
  simulateGroverStep,
  measureAmplitude,
  groverSuccessProbability,
} from '@/core/quantum/algorithms/grover';

describe('HU-27..HU-31 - Grover Search Algorithm', () => {
  describe('groverIterations', () => {
    it('N=4 requires exactly 1 iteration', () => {
      expect(groverIterations(4)).toBe(1);
    });
    it('N=16 requires 3 iterations', () => {
      expect(groverIterations(16)).toBe(3);
    });
    it('is monotonically non-decreasing in N', () => {
      for (let n = 2; n < 200; n++) {
        expect(groverIterations(n + 1)).toBeGreaterThanOrEqual(groverIterations(n));
      }
    });
  });

  describe('classicalExpectedTrials', () => {
    it('N=4 -> 2', () => expect(classicalExpectedTrials(4)).toBe(2));
    it('N=16 -> 8', () => expect(classicalExpectedTrials(16)).toBe(8));
    it('N=1024 -> 512', () => expect(classicalExpectedTrials(1024)).toBe(512));
  });

  describe('uniformAmplitudes', () => {
    it('N=4 returns [0.5, 0.5, 0.5, 0.5]', () => {
      expect(uniformAmplitudes(4)).toEqual([0.5, 0.5, 0.5, 0.5]);
    });
    it('probabilities sum to 1 for N=16', () => {
      const total = uniformAmplitudes(16).reduce((s, a) => s + a * a, 0);
      expect(total).toBeCloseTo(1);
    });
  });

  describe('simulateGroverStep', () => {
    it('N=4 single step fully amplifies marked index 2', () => {
      const result = simulateGroverStep(uniformAmplitudes(4), 2);
      expect(result[2]).toBeCloseTo(1);
      expect(result[0]).toBeCloseTo(0);
      expect(result[1]).toBeCloseTo(0);
      expect(result[3]).toBeCloseTo(0);
    });

    it('preserves norm (unitarity) for N=8', () => {
      const amps = uniformAmplitudes(8);
      const before = amps.reduce((s, a) => s + a * a, 0);
      const after = simulateGroverStep(amps, 3).reduce((s, a) => s + a * a, 0);
      expect(after).toBeCloseTo(before);
    });

    it('only the marked amplitude changes sign relative to unmarked peers after oracle', () => {
      const result = simulateGroverStep(uniformAmplitudes(6), 4);
      // All unmarked values are equal
      const unmarked = [0, 1, 2, 3, 5].map((i) => result[i]);
      for (let i = 1; i < unmarked.length; i++) {
        expect(unmarked[i]).toBeCloseTo(unmarked[0]);
      }
    });
  });

  describe('measureAmplitude', () => {
    it('returns the peak index when amplitude is concentrated', () => {
      expect(measureAmplitude([0, 0, 1, 0], () => 0.5)).toBe(2);
    });
    it('returns 0 for rng=0 with marked at index 0', () => {
      expect(measureAmplitude([1, 0, 0, 0], () => 0)).toBe(0);
    });
    it('is deterministic with injected RNG on uniform state', () => {
      const amps = uniformAmplitudes(4);
      expect(measureAmplitude(amps, () => 0.1)).toBe(0);
      expect(measureAmplitude(amps, () => 0.4)).toBe(1);
      expect(measureAmplitude(amps, () => 0.6)).toBe(2);
      expect(measureAmplitude(amps, () => 0.9)).toBe(3);
    });
    it('returns last index when rng equals total', () => {
      expect(measureAmplitude([0, 0, 0, 1], () => 0.999)).toBe(3);
    });
  });

  describe('groverSuccessProbability', () => {
    it('N=4 after 1 iteration -> near 1', () => {
      expect(groverSuccessProbability(4, 1)).toBeCloseTo(1, 3);
    });
    it('N=16 after 3 iterations -> > 0.9', () => {
      expect(groverSuccessProbability(16, 3)).toBeGreaterThan(0.9);
    });
    it('0 iterations -> uniform 1/N', () => {
      expect(groverSuccessProbability(4, 0)).toBeCloseTo(0.25);
      expect(groverSuccessProbability(16, 0)).toBeCloseTo(1 / 16);
    });
    it('optimal iterations beat 0 iterations for N=16', () => {
      expect(groverSuccessProbability(16, 3)).toBeGreaterThan(groverSuccessProbability(16, 0));
    });
  });
});
