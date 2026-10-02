import { describe, it, expect, beforeEach } from 'vitest';
import Cookies from 'js-cookie';
import {
  getOrCreateUserId,
  getStoredProgress,
  saveCompletedMission,
  getStoredMetrics,
  incrementActiveMissionTime,
  getStoredActiveTab,
  saveActiveTab,
  deleteAllUserData,
  COOKIE_USER_ID,
  COOKIE_PROGRESS,
  COOKIE_METRICS,
  COOKIE_ACTIVE_TAB,
  DEFAULT_METRICS,
} from '@/lib/cookies';

describe('Phase 3 — Persistence & Metric Contracts (cookies.ts)', () => {
  beforeEach(() => {
    Object.keys(Cookies.get()).forEach((cookieName) => {
      Cookies.remove(cookieName);
    });
  });

  describe('getOrCreateUserId', () => {
    it('generates a new user ID in QL-XXXX format if no cookie exists', () => {
      const userId = getOrCreateUserId();
      expect(userId).toMatch(/^QL-[0-9A-F]{4}$/);
      expect(Cookies.get(COOKIE_USER_ID)).toBe(userId);
    });

    it('returns existing user ID when cookie is present', () => {
      Cookies.set(COOKIE_USER_ID, 'QL-TEST1234');
      const userId = getOrCreateUserId();
      expect(userId).toBe('QL-TEST1234');
    });
  });

  describe('getStoredProgress', () => {
    it('returns [0] as default when cookie is missing', () => {
      const progress = getStoredProgress();
      expect(progress).toEqual([0]);
    });

    it('returns [0] as fallback when cookie contains invalid JSON', () => {
      Cookies.set(COOKIE_PROGRESS, 'invalid_json{');
      const progress = getStoredProgress();
      expect(progress).toEqual([0]);
    });

    it('parses valid JSON array correctly', () => {
      Cookies.set(COOKIE_PROGRESS, JSON.stringify([0, 1, 2]));
      const progress = getStoredProgress();
      expect(progress).toEqual([0, 1, 2]);
    });
  });

  describe('saveCompletedMission', () => {
    it('appends a new mission index without duplicate entries', () => {
      saveCompletedMission(1);
      let progress = getStoredProgress();
      expect(progress).toEqual([0, 1]);

      saveCompletedMission(1);
      progress = getStoredProgress();
      expect(progress).toEqual([0, 1]);

      saveCompletedMission(2);
      progress = getStoredProgress();
      expect(progress).toEqual([0, 1, 2]);
    });
  });

  describe('getStoredMetrics', () => {
    it('returns DEFAULT_METRICS when cookie is missing', () => {
      const metrics = getStoredMetrics();
      expect(metrics).toEqual(DEFAULT_METRICS);
    });

    it('handles unparseable JSON gracefully by returning default metrics', () => {
      Cookies.set(COOKIE_METRICS, '{{corrupted_json');
      const metrics = getStoredMetrics();
      expect(metrics).toEqual(DEFAULT_METRICS);
    });

    it('parses valid stored metrics correctly', () => {
      const customMetrics = {
        totalTimeSeconds: 15,
        missionTimes: {
          superposition: 10,
          entanglement: 5,
          decoherence: 0,
          applications: 0,
        },
        actions: {
          superpositionMeasurements: 2,
          entanglementMeasurements: 1,
          decoherenceTested: true,
          applicationsExplored: ['molecular_simulation'],
        },
      };
      Cookies.set(COOKIE_METRICS, JSON.stringify(customMetrics));

      const metrics = getStoredMetrics();
      expect(metrics).toEqual(customMetrics);
    });
  });

  describe('incrementActiveMissionTime', () => {
    it('increments totalTimeSeconds and missionTimes corresponding to active tab', () => {
      incrementActiveMissionTime(0);
      let metrics = getStoredMetrics();
      expect(metrics.totalTimeSeconds).toBe(1);
      expect(metrics.missionTimes.superposition).toBe(1);

      incrementActiveMissionTime(1);
      metrics = getStoredMetrics();
      expect(metrics.totalTimeSeconds).toBe(2);
      expect(metrics.missionTimes.superposition).toBe(1);
      expect(metrics.missionTimes.entanglement).toBe(1);

      incrementActiveMissionTime(2);
      metrics = getStoredMetrics();
      expect(metrics.totalTimeSeconds).toBe(3);
      expect(metrics.missionTimes.decoherence).toBe(1);

      incrementActiveMissionTime(3);
      metrics = getStoredMetrics();
      expect(metrics.totalTimeSeconds).toBe(4);
      expect(metrics.missionTimes.applications).toBe(1);
    });
  });
});

// ---------------------------------------------------------------------------
// Phase 5 - Session persistence: active tab survives reload
// ---------------------------------------------------------------------------
describe('Phase 5 - Active tab persistence', () => {
  beforeEach(() => {
    Object.keys(Cookies.get()).forEach((name) => {
      Cookies.remove(name);
    });
  });

  it('saveActiveTab + getStoredActiveTab round-trip for every valid tab', () => {
    for (const tab of [0, 1, 2, 3]) {
      saveActiveTab(tab);
      expect(getStoredActiveTab()).toBe(tab);
    }
  });

  it('simulated reload recovers the last active tab from cookie', () => {
    // User navigates to tab 2 and starts Mission 3.
    saveActiveTab(2);

    // Simulate a page reload: cookies persist, module state is fresh.
    // getStoredActiveTab reads from cookie (js-cookie mock in jsdom).
    const recoveredTab = getStoredActiveTab();
    expect(recoveredTab).toBe(2);
  });

  it('rejects invalid tab values on save (out-of-range, NaN)', () => {
    saveActiveTab(99);
    expect(Cookies.get(COOKIE_ACTIVE_TAB)).toBeUndefined();

    saveActiveTab(-1);
    expect(Cookies.get(COOKIE_ACTIVE_TAB)).toBeUndefined();

    saveActiveTab(Number.NaN);
    expect(Cookies.get(COOKIE_ACTIVE_TAB)).toBeUndefined();
  });

  it('deleteAllUserData also removes the active tab cookie', () => {
    saveActiveTab(1);
    expect(Cookies.get(COOKIE_ACTIVE_TAB)).toBeDefined();
    deleteAllUserData();
    expect(Cookies.get(COOKIE_ACTIVE_TAB)).toBeUndefined();
  });
});
