import { describe, it, expect } from 'vitest';
import {
  bitFlipEncode, bitFlipDecode, detectBitFlipSyndrome,
  injectBitFlip, phaseFlipEncode, injectPhaseFlip, applyRepetitionCode3,
  type BitTriple,
} from '@/core/quantum/algorithms/errorCorrection';

describe('HU-32..HU-36 - Error Correction', () => {
  describe('bitFlipEncode', () => {
    it('encodes 0 as [0,0,0]', () => expect(bitFlipEncode(0)).toEqual([0, 0, 0]));
    it('encodes 1 as [1,1,1]', () => expect(bitFlipEncode(1)).toEqual([1, 1, 1]));
  });

  describe('injectBitFlip', () => {
    it('flips index 0', () => expect(injectBitFlip([0, 0, 0], 0)).toEqual([1, 0, 0]));
    it('flips index 1', () => expect(injectBitFlip([0, 0, 0], 1)).toEqual([0, 1, 0]));
    it('flips index 2', () => expect(injectBitFlip([0, 0, 0], 2)).toEqual([0, 0, 1]));
    it('flips 1 -> 0 at index 1', () => expect(injectBitFlip([1, 1, 1], 1)).toEqual([1, 0, 1]));
  });

  describe('bitFlipDecode (majority vote)', () => {
    it('[1,1,0] -> 1', () => expect(bitFlipDecode([1, 1, 0])).toBe(1));
    it('[0,0,1] -> 0', () => expect(bitFlipDecode([0, 0, 1])).toBe(0));
    it('[1,1,1] -> 1', () => expect(bitFlipDecode([1, 1, 1])).toBe(1));
    it('[0,0,0] -> 0', () => expect(bitFlipDecode([0, 0, 0])).toBe(0));
  });

  describe('detectBitFlipSyndrome - no error', () => {
    it('[0,0,0] -> syndrome 0, errorIndex -1', () => {
      const r = detectBitFlipSyndrome([0, 0, 0]);
      expect(r.syndrome).toBe(0);
      expect(r.errorIndex).toBe(-1);
    });
    it('[1,1,1] -> syndrome 0, errorIndex -1', () => {
      const r = detectBitFlipSyndrome([1, 1, 1]);
      expect(r.syndrome).toBe(0);
      expect(r.errorIndex).toBe(-1);
    });
  });

  describe('detectBitFlipSyndrome - single bit errors', () => {
    it('error at index 0 -> syndrome 1', () => {
      const r = detectBitFlipSyndrome([1, 0, 0]);
      expect(r.syndrome).toBe(1);
      expect(r.errorIndex).toBe(0);
      expect(r.corrected).toEqual([0, 0, 0]);
    });
    it('error at index 1 -> syndrome 2', () => {
      const r = detectBitFlipSyndrome([0, 1, 0]);
      expect(r.syndrome).toBe(2);
      expect(r.errorIndex).toBe(1);
      expect(r.corrected).toEqual([0, 0, 0]);
    });
    it('error at index 2 -> syndrome 3', () => {
      const r = detectBitFlipSyndrome([0, 0, 1]);
      expect(r.syndrome).toBe(3);
      expect(r.errorIndex).toBe(2);
      expect(r.corrected).toEqual([0, 0, 0]);
    });
  });

  describe('syndrome decoding bijection', () => {
    it('syndromes 1/2/3 map uniquely to error indices 0/1/2', () => {
      const seen = new Set<number>();
      for (const idx of [0, 1, 2] as const) {
        const corrupted = injectBitFlip([0, 0, 0], idx);
        const r = detectBitFlipSyndrome(corrupted);
        expect(r.errorIndex).toBe(idx);
        seen.add(r.syndrome);
      }
      expect(seen.size).toBe(3);
    });
  });

  describe('double error is not correctable', () => {
    it('two flips of |000> miscorrect to 1', () => {
      let c: BitTriple = [0, 0, 0];
      c = injectBitFlip(c, 0);
      c = injectBitFlip(c, 1);
      // c = [1,1,0], majority = 1
      const r = detectBitFlipSyndrome(c);
      expect(bitFlipDecode(r.corrected)).toBe(1);
      // Original was 0 -> decoder miscorrects
    });
  });

  describe('phaseFlipEncode', () => {
    it('alpha=1 -> |+> amplitudes', () => {
      const r = phaseFlipEncode(1);
      expect(r.plus).toBeCloseTo(1 / Math.SQRT2);
      expect(r.minus).toBeCloseTo(1 / Math.SQRT2);
    });
    it('alpha=0 -> |-> amplitudes', () => {
      const r = phaseFlipEncode(0);
      expect(r.plus).toBeCloseTo(1 / Math.SQRT2);
      expect(r.minus).toBeCloseTo(-1 / Math.SQRT2);
    });
    it('alpha=1/sqrt(2) -> pure |+>', () => {
      const r = phaseFlipEncode(1 / Math.SQRT2);
      expect(r.plus).toBeCloseTo(1);
      expect(r.minus).toBeCloseTo(0);
    });
  });

  describe('injectPhaseFlip', () => {
    it('preserves amplitudes and records error index', () => {
      const enc = phaseFlipEncode(1);
      const r = injectPhaseFlip(enc, 1);
      expect(r.plus).toBeCloseTo(enc.plus);
      expect(r.minus).toBeCloseTo(enc.minus);
      expect(r.errorIndex).toBe(1);
    });
  });

  describe('applyRepetitionCode3', () => {
    it('no error: not detected', () => {
      const r = applyRepetitionCode3(0, 'none');
      expect(r.corrected).toBe(0);
      expect(r.detected).toBe(false);
      expect(r.syndrome).toBe(0);
    });
    it('bit error: detected and corrected', () => {
      const r = applyRepetitionCode3(0, 'bit');
      expect(r.corrected).toBe(0);
      expect(r.detected).toBe(true);
      expect(r.syndrome).toBeGreaterThan(0);
    });
    it('phase error: invisible in computational basis', () => {
      const r = applyRepetitionCode3(1, 'phase');
      expect(r.corrected).toBe(1);
      expect(r.detected).toBe(false);
      expect(r.syndrome).toBe(0);
    });
  });
});
