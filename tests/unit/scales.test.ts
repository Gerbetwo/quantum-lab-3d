import { describe, it, expect } from 'vitest';
import {
  qubitToFrequency, gateDurationMs, adsrEnvelope,
  type ScaleName,
} from '@/core/math/scales';

describe('Phase 3 - domain/quantum/scales.ts', () => {
  it('qubitToFrequency(0) equals baseHz', () => {
    expect(qubitToFrequency(0, 440)).toBeCloseTo(440);
  });

  it('qubitToFrequency(1) applies a pentatonic ratio > 1', () => {
    const f0 = qubitToFrequency(0, 440);
    const f1 = qubitToFrequency(1, 440);
    expect(f1).toBeGreaterThan(f0);
  });

  it('qubitToFrequency is monotonically non-decreasing across q0..q5', () => {
    let prev = -Infinity;
    for (let q = 0; q < 6; q++) {
      const f = qubitToFrequency(q);
      expect(f).toBeGreaterThanOrEqual(prev);
      prev = f;
    }
  });

  it('qubitToFrequency rejects negative index', () => {
    expect(() => qubitToFrequency(-1)).toThrow(RangeError);
  });

  it('qubitToFrequency rejects non-integer index', () => {
    expect(() => qubitToFrequency(1.5)).toThrow(RangeError);
  });

  it('qubitToFrequency accepts valid ScaleName', () => {
    const scales: ScaleName[] = ['pentatonic-major', 'pentatonic-minor', 'microtonal-quarter'];
    for (const s of scales) {
      expect(qubitToFrequency(2, 220, s)).toBeGreaterThan(0);
    }
  });

  it('qubitToFrequency rejects unknown scale at runtime', () => {
    expect(() => qubitToFrequency(1, 220, 'nope' as unknown as ScaleName)).toThrow(RangeError);
  });

  it('gateDurationMs returns a positive number for every gate', () => {
    for (const g of ['H', 'X', 'Y', 'Z', 'S', 'T', 'CNOT', 'CZ', 'SWAP', 'CS', 'CT']) {
      expect(gateDurationMs(g)).toBeGreaterThan(0);
    }
  });

  it('gateDurationMs for CNOT is longer than for H (multi > single)', () => {
    expect(gateDurationMs('CNOT')).toBeGreaterThan(gateDurationMs('H'));
  });

  it('adsrEnvelope("pluck").attack < adsrEnvelope("pad").attack', () => {
    expect(adsrEnvelope('pluck').attack).toBeLessThan(adsrEnvelope('pad').attack);
  });

  it('adsrEnvelope returns a fresh object each call', () => {
    const a = adsrEnvelope('pluck');
    const b = adsrEnvelope('pluck');
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });

  it('adsrEnvelope values are within [0, 1]', () => {
    for (const t of ['pluck', 'pad', 'chirp'] as const) {
      const e = adsrEnvelope(t);
      expect(e.attack).toBeGreaterThanOrEqual(0);
      expect(e.attack).toBeLessThanOrEqual(1);
      expect(e.decay).toBeGreaterThanOrEqual(0);
      expect(e.decay).toBeLessThanOrEqual(1);
      expect(e.sustain).toBeGreaterThanOrEqual(0);
      expect(e.sustain).toBeLessThanOrEqual(1);
      expect(e.release).toBeGreaterThanOrEqual(0);
      expect(e.release).toBeLessThanOrEqual(1);
    }
  });
});
