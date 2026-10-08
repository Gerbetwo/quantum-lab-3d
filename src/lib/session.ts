/**
 * Canonical Session Management & Legacy Cookie Migration
 */

import { MissionId, isMissionId, CORE_MISSION_IDS, MISSIONS } from '@/config/missions';

export const SESSION_VERSION = 2;
export const STORAGE_KEY = 'quantumlab_session_v2';

export interface Session {
  version: number;
  userId: string;
  activeMission: MissionId | null;
  completed: MissionId[];
  missionTime: Record<MissionId, number>;
  missionState: Partial<Record<MissionId, Record<string, unknown>>>;
  events: Record<string, number>;
  lastUpdated: number;
}

const LEGACY_INDEX_MAP: Record<number, MissionId> = {
  0: 'superposition',
  1: 'entanglement',
  2: 'decoherence',
  3: 'applications',
  4: 'gates',
  5: 'grover',
  6: 'error-correction',
};

function generateUserId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'usr_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

export function createEmptySession(userId?: string): Session {
  const timeRecord = {} as Record<MissionId, number>;
  MISSIONS.forEach(m => {
    timeRecord[m.id] = 0;
  });

  return {
    version: SESSION_VERSION,
    userId: userId || generateUserId(),
    activeMission: 'superposition',
    completed: [],
    missionTime: timeRecord,
    missionState: {},
    events: {},
    lastUpdated: Date.now(),
  };
}

export function migrateLegacyCookies(): Partial<Session> | null {
  if (typeof document === 'undefined') return null;

  try {
    const cookies = document.cookie.split(';').reduce((acc, curr) => {
      const [key, value] = curr.trim().split('=');
      if (key && value) acc[key] = decodeURIComponent(value);
      return acc;
    }, {} as Record<string, string>);

    const rawProgress = cookies['quantum_progress'];
    const rawTab = cookies['quantum_tab'];

    if (!rawProgress && !rawTab) return null;

    const completed: MissionId[] = [];
    if (rawProgress) {
      try {
        const parsed = JSON.parse(rawProgress);
        if (Array.isArray(parsed)) {
          parsed.forEach((item: unknown) => {
            if (typeof item === 'number' && LEGACY_INDEX_MAP[item]) {
              const mappedId = LEGACY_INDEX_MAP[item];
              if (!completed.includes(mappedId)) completed.push(mappedId);
            }
          });
        }
      } catch {
        console.warn('Failed to parse legacy quantum_progress cookie');
      }
    }

    let activeMission: MissionId | null = null;
    if (rawTab) {
      const tabNum = parseInt(rawTab, 10);
      if (!isNaN(tabNum) && LEGACY_INDEX_MAP[tabNum]) {
        activeMission = LEGACY_INDEX_MAP[tabNum];
      }
    }

    return { completed, activeMission };
  } catch (err) {
    console.error('Error migrating legacy cookies:', err);
    return null;
  }
}

export function clearLegacyCookies(): void {
  if (typeof document === 'undefined') return;
  const legacyKeys = ['quantum_progress', 'quantum_tab', 'quantum_session'];
  legacyKeys.forEach(key => {
    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });
}

export function loadSession(): Session {
  if (typeof window === 'undefined') return createEmptySession('server_session');

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object' && parsed.version === SESSION_VERSION) {
        const validCompleted = Array.isArray(parsed.completed)
          ? parsed.completed.filter(isMissionId)
          : [];

        return {
          ...createEmptySession(parsed.userId),
          ...parsed,
          completed: Array.from(new Set(validCompleted)),
          activeMission: isMissionId(parsed.activeMission) ? parsed.activeMission : 'superposition',
        };
      }
    }

    const legacyData = migrateLegacyCookies();
    const newSession = createEmptySession();

    if (legacyData) {
      if (legacyData.completed) {
        newSession.completed = Array.from(new Set(legacyData.completed.filter(isMissionId)));
      }
      if (legacyData.activeMission) {
        newSession.activeMission = legacyData.activeMission;
      }
    }

    saveSession(newSession);
    clearLegacyCookies();
    return newSession;
  } catch (e) {
    console.warn('LocalStorage error during session load:', e);
    return createEmptySession();
  }
}

export function saveSession(session: Session): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const updated = { ...session, lastUpdated: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return true;
  } catch (e) {
    console.error('Failed to save session to localStorage:', e);
    return false;
  }
}

export function completeMissionInSession(session: Session, missionId: MissionId): Session {
  if (!isMissionId(missionId) || session.completed.includes(missionId)) return session;
  const updated: Session = { ...session, completed: [...session.completed, missionId] };
  saveSession(updated);
  return updated;
}

export function recordMissionTimeInSession(session: Session, missionId: MissionId, seconds: number): Session {
  if (!isMissionId(missionId) || seconds <= 0) return session;
  const currentTime = session.missionTime[missionId] || 0;
  const updated: Session = {
    ...session,
    missionTime: { ...session.missionTime, [missionId]: currentTime + seconds },
  };
  saveSession(updated);
  return updated;
}

export function resetCanonicalSession(): Session {
  const fresh = createEmptySession();
  saveSession(fresh);
  clearLegacyCookies();
  return fresh;
}

export function isMainJourneyComplete(completed: readonly MissionId[]): boolean {
  return CORE_MISSION_IDS.every(id => completed.includes(id));
}
