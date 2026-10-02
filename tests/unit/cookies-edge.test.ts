import { describe, it, expect, beforeEach } from 'vitest';
import Cookies from 'js-cookie';
import {
  getStoredMetrics,
  getStoredProgress,
  getStoredActiveTab,
  getOrCreateUserId,
  createDefaultMetrics,
  COOKIE_METRICS,
  COOKIE_PROGRESS,
  COOKIE_ACTIVE_TAB,
  COOKIE_USER_ID,
  MAX_COOKIE_SIZE_BYTES,
} from '@/lib/cookies';

describe('Phase 5 - cookies.ts edge cases', () => {
  beforeEach(() => {
    Object.keys(Cookies.get()).forEach((n) => Cookies.remove(n));
  });

  describe('getStoredMetrics - malformed payloads', () => {
    it('returns defaults when payload is unparseable JSON', () => {
      Cookies.set(COOKIE_METRICS, 'not-json{{');
      expect(getStoredMetrics()).toEqual(createDefaultMetrics());
    });

    it('coerces NaN/undefined/invalid types to safe defaults', () => {
      Cookies.set(COOKIE_METRICS, JSON.stringify({
        totalTimeSeconds: 'abc',
        missionTimes: { superposition: NaN },
        actions: { superpositionMeasurements: null },
      }));
      const m = getStoredMetrics();
      expect(m.totalTimeSeconds).toBe(0);
      expect(m.missionTimes.superposition).toBe(0);
      expect(m.missionTimes.entanglement).toBe(0);
      expect(m.actions.superpositionMeasurements).toBe(0);
      expect(m.actions.decoherenceTested).toBe(false);
      expect(m.actions.applicationsExplored).toEqual([]);
    });

    it('fills partial missionTimes with 0', () => {
      Cookies.set(COOKIE_METRICS, JSON.stringify({
        missionTimes: { superposition: 5, entanglement: 3 },
      }));
      const m = getStoredMetrics();
      expect(m.missionTimes).toEqual({
        superposition: 5,
        entanglement: 3,
        decoherence: 0,
        applications: 0,
      });
    });

    it('falls back to [] when applicationsExplored is not an array', () => {
      Cookies.set(COOKIE_METRICS, JSON.stringify({
        actions: { applicationsExplored: 'not-an-array' },
      }));
      expect(getStoredMetrics().actions.applicationsExplored).toEqual([]);
    });

    it('preserves valid applicationsExplored array', () => {
      Cookies.set(COOKIE_METRICS, JSON.stringify({
        actions: { applicationsExplored: ['a', 'b'] },
      }));
      expect(getStoredMetrics().actions.applicationsExplored).toEqual(['a', 'b']);
    });
  });

  describe('getStoredProgress - malformed payloads', () => {
    it('returns [0] for non-array JSON', () => {
      Cookies.set(COOKIE_PROGRESS, JSON.stringify({ x: 1 }));
      expect(getStoredProgress()).toEqual([0]);
    });

    it('returns [0] for array with non-number elements', () => {
      Cookies.set(COOKIE_PROGRESS, JSON.stringify([0, 'one', 2]));
      expect(getStoredProgress()).toEqual([0]);
    });

    it('deduplicates and sorts a valid array', () => {
      Cookies.set(COOKIE_PROGRESS, JSON.stringify([3, 1, 2, 1, 3]));
      expect(getStoredProgress()).toEqual([1, 2, 3]);
    });

    it('returns [0] for empty array', () => {
      Cookies.set(COOKIE_PROGRESS, JSON.stringify([]));
      expect(getStoredProgress()).toEqual([0]);
    });
  });

  describe('getStoredActiveTab - out-of-range coercion', () => {
    it('returns 0 when cookie absent', () => {
      expect(getStoredActiveTab()).toBe(0);
    });

    it('coerces negative values to 0', () => {
      Cookies.set(COOKIE_ACTIVE_TAB, '-1');
      expect(getStoredActiveTab()).toBe(0);
    });

    it('coerces values > 3 to 0', () => {
      Cookies.set(COOKIE_ACTIVE_TAB, '99');
      expect(getStoredActiveTab()).toBe(0);
    });

    it('coerces non-numeric to 0', () => {
      Cookies.set(COOKIE_ACTIVE_TAB, 'abc');
      expect(getStoredActiveTab()).toBe(0);
    });

    it('accepts all valid tabs 0..3', () => {
      for (const n of [0, 1, 2, 3]) {
        Cookies.set(COOKIE_ACTIVE_TAB, String(n));
        expect(getStoredActiveTab()).toBe(n);
      }
    });
  });

  describe('MAX_COOKIE_SIZE_BYTES constant', () => {
    it('is set below the browser cookie hard limit (~4KB)', () => {
      expect(MAX_COOKIE_SIZE_BYTES).toBeLessThan(4096);
      expect(MAX_COOKIE_SIZE_BYTES).toBeGreaterThan(1024);
    });
  });

  describe('getOrCreateUserId', () => {
    it('persists across calls and returns same value', () => {
      const a = getOrCreateUserId();
      const b = getOrCreateUserId();
      expect(a).toBe(b);
      expect(Cookies.get(COOKIE_USER_ID)).toBe(a);
    });

    it('returns existing cookie verbatim', () => {
      Cookies.set(COOKIE_USER_ID, 'QL-CUSTOM');
      expect(getOrCreateUserId()).toBe('QL-CUSTOM');
    });
  });
});
