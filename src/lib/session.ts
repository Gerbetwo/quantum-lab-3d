import { MissionId } from '../config/missions';

export interface SessionV1 {
  version: 1;
  userId: string;
  activeMission: MissionId | null;
  completed: MissionId[];
  missionTime: Record<MissionId, number>;
  events: Record<string, number>;
}

const STORAGE_KEY = 'ql_session_v1';

export function createInitialSession(): SessionV1 {
  return {
    version: 1,
    userId: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'user_' + Math.random().toString(36).substring(2, 9),
    activeMission: 'superposition',
    completed: [], // Vacío para usuario nuevo
    missionTime: {
      superposition: 0,
      entanglement: 0,
      decoherence: 0,
      applications: 0,
      gates: 0,
      grover: 0,
      'error-correction': 0,
    },
    events: {},
  };
}

export function loadSession(): SessionV1 {
  if (typeof window === 'undefined') return createInitialSession();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialSession();
    const data = JSON.parse(raw);
    if (data && data.version === 1 && Array.isArray(data.completed)) {
      return data as SessionV1;
    }
  } catch (e) {
    console.warn('[Session] Fallback por deserialización fallida:', e);
  }
  return createInitialSession();
}

export function saveSession(session: SessionV1): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch (e) {
    console.warn('[Session] Error guardando sesión:', e);
  }
}
