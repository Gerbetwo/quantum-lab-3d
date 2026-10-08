import { describe, it, expect, beforeEach } from 'vitest';
import {
  createEmptySession,
  loadSession,
  saveSession,
  completeMissionInSession,
  isMainJourneyComplete,
  STORAGE_KEY,
  SESSION_VERSION,
} from '@/lib/session';

describe('Phase 2 - Unified Session & Persistence Contract', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('Caso 1: Usuario nuevo genera sesión vacía con completed []', () => {
    const session = loadSession();
    expect(session.completed).toEqual([]);
    expect(session.version).toBe(SESSION_VERSION);
    expect(session.activeMission).toBe('superposition');
  });

  it('Caso 2: Recupera sesión válida en almacenamiento', () => {
    const mockSession = createEmptySession('test_user_123');
    mockSession.completed = ['superposition'];
    mockSession.activeMission = 'entanglement';
    saveSession(mockSession);

    const loaded = loadSession();
    expect(loaded.userId).toBe('test_user_123');
    expect(loaded.completed).toContain('superposition');
    expect(loaded.activeMission).toBe('entanglement');
  });

  it('Caso 3: JSON inválido genera nueva sesión sin marcar misiones', () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'INVALID_JSON_STRING{{{');
    }
    const loaded = loadSession();
    expect(loaded.completed).toEqual([]);
    expect(loaded.version).toBe(SESSION_VERSION);
  });

  it('Caso 4: ID de misión desconocido es filtrado', () => {
    const mockSession = createEmptySession('test_user');
    // @ts-expect-error -- Allow invalid mission string for testing
    mockSession.completed = ['superposition', 'invalid_mission_xyz'];
    saveSession(mockSession);

    const loaded = loadSession();
    expect(loaded.completed).toEqual(['superposition']);
  });

  it('Caso 5: Completar misiones core habilita estado de recorrido principal', () => {
    let session = createEmptySession();
    expect(isMainJourneyComplete(session.completed)).toBe(false);

    session = completeMissionInSession(session, 'superposition');
    session = completeMissionInSession(session, 'entanglement');
    session = completeMissionInSession(session, 'decoherence');
    expect(isMainJourneyComplete(session.completed)).toBe(false);

    session = completeMissionInSession(session, 'applications');
    expect(isMainJourneyComplete(session.completed)).toBe(true);
  });
});
