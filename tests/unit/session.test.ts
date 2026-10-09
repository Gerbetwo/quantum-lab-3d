import { describe, it, test, expect, beforeEach } from 'vitest';
import Cookies from 'js-cookie';
import {
  getDefaultSession,
  getStoredMetrics,
  getStoredActiveTab,
  createDefaultMetrics,
  saveActiveTab,
  COOKIE_METRICS,
  MAX_COOKIE_SIZE_BYTES,
} from '@/features/session/lib/sessionService';

describe('Fase 2 — Session Unit Tests', () => {
  test('getDefaultSession retorna estructura válida con versión 2', () => {
    const session = getDefaultSession();
    expect(session.version).toBe(2);
    expect(session.activeMission).toBe('mission-1');
    expect(session.completed).toEqual([]);
    expect(typeof session.userId).toBe('string');
  });
});

describe('Phase 5 - cookies.ts edge cases', () => {
  beforeEach(() => {
    Object.keys(Cookies.get()).forEach((n) => Cookies.remove(n));
  });

  describe('getStoredMetrics - malformed payloads', () => {
    it('returns defaults when payload is unparseable JSON', () => {
      Cookies.set(COOKIE_METRICS, 'not-json{{');
      expect(getStoredMetrics()).toEqual(createDefaultMetrics());
    });
  });

  describe('getStoredActiveTab - out-of-range coercion', () => {
    it('returns 0 when cookie absent', () => {
      expect(getStoredActiveTab()).toBe(0);
    });
  });

  describe('MAX_COOKIE_SIZE_BYTES constant', () => {
    it('is set below the browser cookie hard limit (~4KB)', () => {
      expect(MAX_COOKIE_SIZE_BYTES).toBeLessThan(4096);
      expect(MAX_COOKIE_SIZE_BYTES).toBeGreaterThan(1024);
    });
  });
});

describe('Phase 5 - Active tab persistence', () => {
  test('saveActiveTab + getStoredActiveTab round-trip for every valid tab', () => {
    [0, 1, 2, 3].forEach((tab) => {
      saveActiveTab(tab);
      expect(getStoredActiveTab()).toBe(tab);
    });
  });
});
