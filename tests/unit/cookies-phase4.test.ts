import { describe, test, expect, beforeEach } from 'vitest';
import Cookies from 'js-cookie';
import {
  saveActiveTab,
  getStoredActiveTab,
  deleteAllUserData,
  COOKIE_ACTIVE_TAB,
  COOKIE_USER_ID,
  COOKIE_PROGRESS,
  COOKIE_METRICS,
} from '@/features/session/lib/cookies';

describe('Phase 5 - Active tab persistence', () => {
  beforeEach(() => {
    deleteAllUserData();
  });

  test('saveActiveTab + getStoredActiveTab round-trip for every valid tab', () => {
    [0, 1, 2, 3].forEach((tab) => {
      saveActiveTab(tab);
      expect(getStoredActiveTab()).toBe(tab);
    });
  });

  test('simulated reload recovers the last active tab from cookie', () => {
    saveActiveTab(1);
    const recovered = getStoredActiveTab();
    expect(recovered).toBe(1);
  });

  test('rejects invalid tab values on save (out-of-range, NaN)', () => {
    const invalidTabs: unknown[] = ['invalid_tab', 123, null, undefined, NaN, {}, []];
    invalidTabs.forEach((invalid) => {
      saveActiveTab(invalid as unknown as string);
      expect(getStoredActiveTab()).toBe(0);
    });
  });

  test('deleteAllUserData also removes the active tab cookie', () => {
    saveActiveTab(2);
    expect(Cookies.get(COOKIE_ACTIVE_TAB)).toBe('2');

    deleteAllUserData();

    expect(Cookies.get(COOKIE_USER_ID)).toBeUndefined();
    expect(Cookies.get(COOKIE_PROGRESS)).toBeUndefined();
    expect(Cookies.get(COOKIE_METRICS)).toBeUndefined();
    expect(Cookies.get(COOKIE_ACTIVE_TAB)).toBeUndefined();
    expect(getStoredActiveTab()).toBe(0);
  });
});
