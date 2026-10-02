import { describe, it, expect, beforeEach } from 'vitest';
import Cookies from 'js-cookie';
import {
  getOrCreateUserId,
  getStoredProgress,
  saveCompletedMission,
  getStoredMetrics,
  incrementActiveMissionTime,
  COOKIE_USER_ID,
  COOKIE_PROGRESS,
  COOKIE_METRICS,
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
