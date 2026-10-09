import { describe, test, expect } from 'vitest';
import { getDefaultSession } from '@/features/session/lib/session';

describe('Fase 2 — Session Unit Tests', () => {
  test('getDefaultSession retorna estructura válida con versión 2', () => {
    const session = getDefaultSession();
    expect(session.version).toBe(2);
    expect(session.activeMission).toBe('mission-1');
    expect(session.completed).toEqual([]);
    expect(typeof session.userId).toBe('string');
  });
});