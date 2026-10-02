import { describe, it, expect, beforeEach } from 'vitest';
import Cookies from 'js-cookie';
import {
  createDefaultMetrics,
  getStoredMetrics,
  updateStoredMetrics,
  getStoredActiveTab,
  saveActiveTab,
  deleteAllUserData,
  getOrCreateUserId,
  saveCompletedMission,
  COOKIE_USER_ID,
  COOKIE_PROGRESS,
  COOKIE_METRICS,
  COOKIE_ACTIVE_TAB,
  MAX_COOKIE_SIZE_BYTES,
  DEFAULT_METRICS,
} from '@/lib/cookies';

describe('Phase 4 - cookies.ts hardening', () => {
  beforeEach(() => {
    Object.keys(Cookies.get()).forEach((n) => Cookies.remove(n));
  });

  describe('createDefaultMetrics', () => {
    it('returns a fresh, mutable object each call (immutability)', () => {
      const a = createDefaultMetrics();
      const b = createDefaultMetrics();
      expect(a).toEqual(b);
      expect(a).not.toBe(b);
      expect(a.missionTimes).not.toBe(b.missionTimes);
      expect(a.actions.applicationsExplored).not.toBe(b.actions.applicationsExplored);

      a.actions.applicationsExplored.push('x');
      expect(b.actions.applicationsExplored).toEqual([]);
    });

    it('matches DEFAULT_METRICS shape (backward compat)', () => {
      expect(createDefaultMetrics()).toEqual(DEFAULT_METRICS);
    });
  });

  describe('getStoredMetrics isolation', () => {
    it('returns distinct objects per call (no shared refs)', () => {
      const a = getStoredMetrics();
      const b = getStoredMetrics();
      expect(a).not.toBe(b);
      expect(a.actions.applicationsExplored).not.toBe(b.actions.applicationsExplored);
    });

    it('mutating a returned object does not affect future reads', () => {
      const m = getStoredMetrics();
      m.totalTimeSeconds = 999;
      m.actions.applicationsExplored.push('hacked');

      const fresh = getStoredMetrics();
      expect(fresh.totalTimeSeconds).toBe(0);
      expect(fresh.actions.applicationsExplored).toEqual([]);
    });
  });

  describe('updateStoredMetrics size guard', () => {
    it('skips write when JSON exceeds MAX_COOKIE_SIZE_BYTES', () => {
      const huge = 'x'.repeat(MAX_COOKIE_SIZE_BYTES + 100);
      updateStoredMetrics((prev) => ({
        ...prev,
        actions: { ...prev.actions, applicationsExplored: [huge] },
      }));
      expect(Cookies.get(COOKIE_METRICS)).toBeUndefined();
    });

    it('writes when JSON is within limit', () => {
      updateStoredMetrics((prev) => ({ ...prev, totalTimeSeconds: 42 }));
      expect(Cookies.get(COOKIE_METRICS)).toBeDefined();
    });
  });

  describe('activeTab persistence', () => {
    it('returns 0 when cookie missing', () => {
      expect(getStoredActiveTab()).toBe(0);
    });

    it('round-trips a valid tab (0-3)', () => {
      saveActiveTab(2);
      expect(getStoredActiveTab()).toBe(2);
    });

    it('clamps out-of-range values to 0 on read', () => {
      Cookies.set(COOKIE_ACTIVE_TAB, '99');
      expect(getStoredActiveTab()).toBe(0);
      Cookies.set(COOKIE_ACTIVE_TAB, 'abc');
      expect(getStoredActiveTab()).toBe(0);
    });

    it('ignores writes of out-of-range values', () => {
      saveActiveTab(99);
      expect(Cookies.get(COOKIE_ACTIVE_TAB)).toBeUndefined();
    });
  });

  describe('deleteAllUserData', () => {
    it('removes every quantum_* cookie', () => {
      getOrCreateUserId();
      saveCompletedMission(1);
      updateStoredMetrics((p) => ({ ...p, totalTimeSeconds: 1 }));
      saveActiveTab(2);

      expect(Cookies.get(COOKIE_USER_ID)).toBeDefined();
      expect(Cookies.get(COOKIE_PROGRESS)).toBeDefined();
      expect(Cookies.get(COOKIE_METRICS)).toBeDefined();
      expect(Cookies.get(COOKIE_ACTIVE_TAB)).toBeDefined();

      deleteAllUserData();

      expect(Cookies.get(COOKIE_USER_ID)).toBeUndefined();
      expect(Cookies.get(COOKIE_PROGRESS)).toBeUndefined();
      expect(Cookies.get(COOKIE_METRICS)).toBeUndefined();
      expect(Cookies.get(COOKIE_ACTIVE_TAB)).toBeUndefined();
    });
  });

  describe('getStoredProgress contract (documented: SET, not sequence)', () => {
    it('returns sorted unique set regardless of insertion order', () => {
      saveCompletedMission(2);
      saveCompletedMission(0);
      saveCompletedMission(2);
      saveCompletedMission(1);
      const progress = JSON.parse(Cookies.get(COOKIE_PROGRESS) || '[]');
      expect(progress).toEqual([0, 1, 2]);
    });
  });
});
