import { describe, it, expect } from 'vitest';
import {
  simulateGroverStep,
  uniformAmplitudes,
  groverIterations,
  measureAmplitude,
  simulateShorN15,
  gcd,
  runShorDemo,
  simulate3QubitBitFlipEC,
  bitFlipEncode,
  injectBitFlip,
  detectBitFlipSyndrome,
  type BitTriple,
} from '../algorithms';

describe('algorithms - Didactic Quantum Algorithms Mechanics', () => {
  describe('Grover Amplitude Amplification', () => {
    it('initializes uniform amplitudes with probability sum = 1.0', () => {
      const amps4 = uniformAmplitudes(4);
      expect(amps4).toHaveLength(4);
      amps4.forEach((amp) => expect(amp).toBeCloseTo(0.5));
      const sumProb4 = amps4.reduce((sum, a) => sum + a * a, 0);
      expect(sumProb4).toBeCloseTo(1.0);

      const amps8 = uniformAmplitudes(8);
      expect(amps8).toHaveLength(8);
      const sumProb8 = amps8.reduce((sum, a) => sum + a * a, 0);
      expect(sumProb8).toBeCloseTo(1.0);
    });

    it('determines optimal Grover iteration count', () => {
      // 2 qubits (N=4): floor(π/4 * 2) = floor(1.57) = 1
      expect(groverIterations(4)).toBe(1);
      // 3 qubits (N=8): floor(π/4 * 2.828) = floor(2.22) = 2
      expect(groverIterations(8)).toBe(2);
      // 4 qubits (N=16): floor(π/4 * 4) = floor(3.14) = 3
      expect(groverIterations(16)).toBe(3);
    });

    it('amplifies target state probability to 100% in 1 step for N=4', () => {
      for (let target = 0; target < 4; target++) {
        const result = simulateGroverStep(2, target, 1);
        expect(result.step).toBe(1);
        expect(result.probabilities[target]).toBeCloseTo(1.0);
        expect(result.targetFound).toBe(true);

        // Invariant: sum of probabilities equals 1.0
        const totalProb = result.probabilities.reduce((acc, p) => acc + p, 0);
        expect(totalProb).toBeCloseTo(1.0);

        // Non-target states have zero probability
        result.probabilities.forEach((p, idx) => {
          if (idx !== target) {
            expect(p).toBeCloseTo(0.0);
          }
        });
      }
    });

    it('progressively amplifies target for N=8 over multiple steps', () => {
      const target = 3;
      // Step 1: probability rises from 0.125 to ~0.78
      const step1 = simulateGroverStep(3, target, 1);
      expect(step1.probabilities[target]).toBeGreaterThan(0.7);
      expect(step1.probabilities[target]).toBeLessThan(0.85);

      // Step 2: probability reaches peak ~0.945 > 0.8
      const step2 = simulateGroverStep(3, target, 2);
      expect(step2.probabilities[target]).toBeGreaterThan(0.9);
      expect(step2.targetFound).toBe(true);

      const totalProb = step2.probabilities.reduce((acc, p) => acc + p, 0);
      expect(totalProb).toBeCloseTo(1.0);
    });

    it('operates diffusion transform directly on an amplitudes array', () => {
      // Custom uniform amplitudes for N=4: [0.5, 0.5, 0.5, 0.5]
      const amps = [0.5, 0.5, 0.5, 0.5];
      const target = 1;
      const evolved = simulateGroverStep(amps, target);

      expect(evolved[target]).toBeCloseTo(1.0);
      expect(evolved[0]).toBeCloseTo(0.0);
      expect(evolved[2]).toBeCloseTo(0.0);
      expect(evolved[3]).toBeCloseTo(0.0);
    });

    it('measures amplitude distribution with custom rng sampler', () => {
      // Single amplitude square
      expect(measureAmplitude(0.5)).toBeCloseTo(0.25);

      // Amplitude distribution: [0.5, 0.5, 0.5, 0.5] -> prob each 0.25
      const amps = [0.5, 0.5, 0.5, 0.5];
      expect(measureAmplitude(amps, () => 0.1)).toBe(0);
      expect(measureAmplitude(amps, () => 0.3)).toBe(1);
      expect(measureAmplitude(amps, () => 0.6)).toBe(2);
      expect(measureAmplitude(amps, () => 0.9)).toBe(3);
    });
  });

  describe('Shor Algorithm (Didactic N=15 Period Evaluation)', () => {
    describe('Greatest Common Divisor (gcd)', () => {
      it('calculates gcd correctly for common mathematical cases', () => {
        expect(gcd(15, 5)).toBe(5);
        expect(gcd(48, 15)).toBe(3);
        expect(gcd(50, 15)).toBe(5);
        expect(gcd(7, 13)).toBe(1);
        expect(gcd(15, 0)).toBe(15);
        expect(gcd(0, 15)).toBe(15);
        expect(gcd(-48, 15)).toBe(3);
        expect(gcd(15, -50)).toBe(5);
      });
    });

    describe('N=15 Factorization Invariants', () => {
      const validCoprimeBases = [2, 7, 8, 11, 13];

      it.each(validCoprimeBases)('successfully factorizes 15 using base a=%i', (base) => {
        const result = simulateShorN15(base);
        expect(result.N).toBe(15);
        expect(result.base).toBe(base);
        expect(result.success).toBe(true);

        // Period r must satisfy a^r mod 15 = 1
        expect(Math.pow(base, result.period) % 15).toBe(1);

        // Period r must be even
        expect(result.period % 2).toBe(0);

        // Factors must multiply to 15 and be non-trivial {3, 5}
        const [f1, f2] = result.factors;
        expect(f1 * f2).toBe(15);
        expect([f1, f2].sort()).toEqual([3, 5]);
      });

      it('evaluates periods for specific bases accurately', () => {
        // 2^4 = 16 ≡ 1 mod 15 -> r = 4
        expect(simulateShorN15(2).period).toBe(4);
        // 7^4 = 2401 ≡ 1 mod 15 -> r = 4
        expect(simulateShorN15(7).period).toBe(4);
        // 8^4 = 4096 ≡ 1 mod 15 -> r = 4
        expect(simulateShorN15(8).period).toBe(4);
        // 11^2 = 121 ≡ 1 mod 15 -> r = 2
        expect(simulateShorN15(11).period).toBe(2);
        // 13^4 = 28561 ≡ 1 mod 15 -> r = 4
        expect(simulateShorN15(13).period).toBe(4);
      });

      it('throws descriptive error on invalid or non-coprime bases', () => {
        const invalidBases = [0, 1, 3, 5, 6, 9, 10, 12, 14, 15];
        for (const base of invalidBases) {
          expect(() => simulateShorN15(base)).toThrowError(
            /Invalid coprime base/
          );
        }
      });

      it('executes runShorDemo and generates valid modular exponentiation sequence', () => {
        const demo2 = runShorDemo(2);
        expect(demo2.period).toBe(4);
        expect(demo2.sequence).toEqual([1, 2, 4, 8]);
        expect(demo2.factors.sort()).toEqual([3, 5]);
        expect(demo2.explanation).toContain('Period r = 4');

        const demo11 = runShorDemo(11);
        expect(demo11.period).toBe(2);
        expect(demo11.sequence).toEqual([1, 11]);
        expect(demo11.factors.sort()).toEqual([3, 5]);
      });
    });
  });

  describe('3-Qubit Quantum Error Correction (QEC Bit-Flip Recovery)', () => {
    describe('Syndrome Detection and State Recovery', () => {
      it('identifies clean state when no error is injected', () => {
        const result = simulate3QubitBitFlipEC(null);
        expect(result.syndrome).toEqual([0, 0]);
        expect(result.errorQubitIndex).toBeNull();
        expect(result.recoveredState).toContain('Clean');
      });

      it('detects and identifies bit-flip syndrome on qubit 0', () => {
        const result = simulate3QubitBitFlipEC(0);
        expect(result.syndrome).toEqual([1, 0]);
        expect(result.errorQubitIndex).toBe(0);
        expect(result.recoveredState).toContain('Corrected Qubit 0');
      });

      it('detects and identifies bit-flip syndrome on qubit 1', () => {
        const result = simulate3QubitBitFlipEC(1);
        expect(result.syndrome).toEqual([1, 1]);
        expect(result.errorQubitIndex).toBe(1);
        expect(result.recoveredState).toContain('Corrected Qubit 1');
      });

      it('detects and identifies bit-flip syndrome on qubit 2', () => {
        const result = simulate3QubitBitFlipEC(2);
        expect(result.syndrome).toEqual([0, 1]);
        expect(result.errorQubitIndex).toBe(2);
        expect(result.recoveredState).toContain('Corrected Qubit 2');
      });
    });

    describe('Logical Bit-Flip Pipeline & 100% Recovery Fidelity', () => {
      it('encodes logical 0 into [0, 0, 0] and logical 1 into [1, 1, 1]', () => {
        expect(bitFlipEncode(0)).toEqual([0, 0, 0]);
        expect(bitFlipEncode(1)).toEqual([1, 1, 1]);
      });

      it('injects bit flip at specific index', () => {
        const clean: BitTriple = [0, 0, 0];
        expect(injectBitFlip(clean, 0)).toEqual([1, 0, 0]);
        expect(injectBitFlip(clean, 1)).toEqual([0, 1, 0]);
        expect(injectBitFlip(clean, 2)).toEqual([0, 0, 1]);

        const clean1: BitTriple = [1, 1, 1];
        expect(injectBitFlip(clean1, 0)).toEqual([0, 1, 1]);
        expect(injectBitFlip(clean1, 1)).toEqual([1, 0, 1]);
        expect(injectBitFlip(clean1, 2)).toEqual([1, 1, 0]);
      });

      it('detects uncorrupted triples with syndrome 0 and zero corrections', () => {
        const res0 = detectBitFlipSyndrome([0, 0, 0]);
        expect(res0.syndrome).toBe(0);
        expect(res0.errorIndex).toBe(-1);
        expect(res0.corrected).toEqual([0, 0, 0]);

        const res1 = detectBitFlipSyndrome([1, 1, 1]);
        expect(res1.syndrome).toBe(0);
        expect(res1.errorIndex).toBe(-1);
        expect(res1.corrected).toEqual([1, 1, 1]);
      });

      it('guarantees 100% bit-flip correction fidelity for all combinations', () => {
        const logicalBits: Array<0 | 1> = [0, 1];
        const errorIndices: Array<0 | 1 | 2> = [0, 1, 2];

        for (const logicalBit of logicalBits) {
          const original = bitFlipEncode(logicalBit);

          for (const errorIndex of errorIndices) {
            const corrupted = injectBitFlip(original, errorIndex);
            const recovery = detectBitFlipSyndrome(corrupted);

            expect(recovery.errorIndex).toBe(errorIndex);
            expect(recovery.syndrome).toBe(errorIndex + 1);
            expect(recovery.corrected).toEqual(original);
          }
        }
      });
    });
  });
});
