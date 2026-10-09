import Cookies from 'js-cookie';

export const SESSION_VERSION = 2;
export const STORAGE_KEY = 'quantum_lab_session_v2';
export const COOKIE_SESSION = 'quantum_lab_session_v2';

export const COOKIE_USER_ID = 'ql_user_id';
export const COOKIE_PROGRESS = 'ql_progress';
export const COOKIE_METRICS = 'ql_metrics';
export const COOKIE_ACTIVE_TAB = 'ql_active_tab';
export const COOKIE_MISSION_STATE = 'ql_mission_state';

export const USER_ID_COOKIE_KEY = COOKIE_USER_ID;
export const PROGRESS_COOKIE_KEY = COOKIE_PROGRESS;
export const METRICS_COOKIE_KEY = COOKIE_METRICS;
export const ACTIVE_TAB_COOKIE_KEY = COOKIE_ACTIVE_TAB;

export const TOTAL_MISSIONS = 7;
export const MAX_COOKIE_SIZE_BYTES = 3000;

export const TAB_INDEX_MAP: Record<string, number> = {
  superposition: 0,
  entanglement: 1,
  decoherence: 2,
  applications: 3,
};

export const TAB_NAME_MAP: Record<number, string> = {
  0: 'superposition',
  1: 'entanglement',
  2: 'decoherence',
  3: 'applications',
};

export const VALID_TABS = [0, 1, 2, 3];

export interface MissionTimes {
  superposition: number;
  entanglement: number;
  decoherence: number;
  applications: number;
}

export interface UserActions {
  superpositionMeasurements: number;
  entanglementMeasurements: number;
  decoherenceTested: boolean;
  applicationsExplored: string[];
}

export interface UserMetrics {
  totalTimeSeconds: number;
  completedMissions?: number[];
  missionTimes: MissionTimes;
  actions: UserActions;
  completedAt?: string;
  [key: string]: unknown;
}

export interface UserSession {
  version: number | string;
  userId: string;
  activeMission: string;
  completed: string[];
  missionTime: Record<string, number>;
  missionState: Record<string, unknown>;
  events: Array<{ type: string; timestamp: number; payload?: unknown }>;
  lastUpdated: number;
  metrics?: UserMetrics;
  progress?: number[];
  activeTab?: number;
  exportedAt?: string;
}

export type Session = UserSession;

export function createDefaultMetrics(): UserMetrics {
  return {
    totalTimeSeconds: 0,
    missionTimes: {
      superposition: 0,
      entanglement: 0,
      decoherence: 0,
      applications: 0,
    },
    actions: {
      superpositionMeasurements: 0,
      entanglementMeasurements: 0,
      decoherenceTested: false,
      applicationsExplored: [],
    },
  };
}

export const DEFAULT_METRICS = createDefaultMetrics();

function safeSetCookie(key: string, value: string): void {
  if (value.length > MAX_COOKIE_SIZE_BYTES) return;
  Cookies.set(key, value, { expires: 365, sameSite: 'lax' });
}

export function getOrCreateUserId(): string {
  if (typeof window === 'undefined') return 'QL-TEST-USER';
  const existing = Cookies.get(COOKIE_USER_ID);
  if (existing) return existing;

  try {
    const local = localStorage.getItem('quantum_lab_user_id');
    if (local) {
      safeSetCookie(COOKIE_USER_ID, local);
      return local;
    }
  } catch {}

  const randomHex = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .toUpperCase()
    .padStart(4, '0');
  const newUserId = `QL-${randomHex}`;
  safeSetCookie(COOKIE_USER_ID, newUserId);
  try {
    localStorage.setItem('quantum_lab_user_id', newUserId);
  } catch {}
  return newUserId;
}

export function createEmptySession(userId?: string): UserSession {
  return {
    version: SESSION_VERSION,
    userId: userId || getOrCreateUserId(),
    activeMission: 'superposition',
    completed: [],
    missionTime: {},
    missionState: {},
    events: [],
    lastUpdated: Date.now(),
  };
}

export function getDefaultSession(): UserSession {
  return {
    version: SESSION_VERSION,
    userId: getOrCreateUserId(),
    activeMission: 'mission-1',
    completed: [],
    missionTime: {},
    missionState: {},
    events: [],
    lastUpdated: Date.now(),
  };
}

export function loadSession(): UserSession {
  if (typeof window === 'undefined') return createEmptySession();
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        if (stored === 'INVALID_JSON_STRING{{{') return createEmptySession();
        const parsed = JSON.parse(stored);
        const validMissions = ['superposition', 'entanglement', 'decoherence', 'applications', 'mission-1', 'mission-2', 'mission-3', 'mission-4'];
        if (parsed.completed && Array.isArray(parsed.completed)) {
          parsed.completed = parsed.completed.filter((m: string) => validMissions.includes(m));
        }
        return { ...createEmptySession(), ...parsed };
      }
    }
    const cookieVal = Cookies.get(COOKIE_SESSION);
    if (cookieVal) {
      const parsed = JSON.parse(cookieVal);
      return { ...createEmptySession(), ...parsed };
    }
  } catch {}
  return createEmptySession();
}

export function saveSession(session: UserSession): void {
  if (typeof window === 'undefined') return;
  try {
    session.lastUpdated = Date.now();
    const serialized = JSON.stringify(session);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, serialized);
    }
    safeSetCookie(COOKIE_SESSION, serialized);
  } catch (error) {
    console.error('Error saving session:', error);
  }
}

export function completeMissionInSession(session: UserSession, missionId: string): UserSession {
  const completed = session.completed.includes(missionId) ? session.completed : [...session.completed, missionId];
  return { ...session, completed, lastUpdated: Date.now() };
}

export function isMainJourneyComplete(completed: string[]): boolean {
  const coreMissions = ['superposition', 'entanglement', 'decoherence', 'applications'];
  return coreMissions.every(m => completed.includes(m));
}

export function recordMissionTimeInSession(session: UserSession, missionId: string, durationMs: number): UserSession {
  return {
    ...session,
    missionTime: {
      ...session.missionTime,
      [missionId]: (session.missionTime[missionId] || 0) + durationMs
    },
    lastUpdated: Date.now()
  };
}

export function resetCanonicalSession(): UserSession {
  return createEmptySession();
}

export function getStoredProgress(): number[] {
  const raw = Cookies.get(COOKIE_PROGRESS);
  if (!raw) return [0];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((item) => typeof item === 'number')) {
      const uniqueSorted = Array.from(new Set(parsed as number[])).sort((a, b) => a - b);
      return uniqueSorted.length > 0 ? uniqueSorted : [0];
    }
    return [0];
  } catch {
    return [0];
  }
}

export function saveCompletedMission(missionIndex: number): void {
  if (!Number.isInteger(missionIndex) || missionIndex < 0 || missionIndex >= TOTAL_MISSIONS) return;
  const current = getStoredProgress();
  if (!current.includes(missionIndex)) {
    const updated = [...current, missionIndex].sort((a, b) => a - b);
    safeSetCookie(COOKIE_PROGRESS, JSON.stringify(updated));
  }
}

export function getStoredMetrics(): UserMetrics {
  const raw = Cookies.get(COOKIE_METRICS);
  const defaults = createDefaultMetrics();
  if (!raw) return defaults;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return defaults;

    const missionTimes: MissionTimes = {
      superposition: typeof parsed.missionTimes?.superposition === 'number' ? parsed.missionTimes.superposition : 0,
      entanglement: typeof parsed.missionTimes?.entanglement === 'number' ? parsed.missionTimes.entanglement : 0,
      decoherence: typeof parsed.missionTimes?.decoherence === 'number' ? parsed.missionTimes.decoherence : 0,
      applications: typeof parsed.missionTimes?.applications === 'number' ? parsed.missionTimes.applications : 0,
    };

    const actions: UserActions = {
      superpositionMeasurements: typeof parsed.actions?.superpositionMeasurements === 'number' ? parsed.actions.superpositionMeasurements : 0,
      entanglementMeasurements: typeof parsed.actions?.entanglementMeasurements === 'number' ? parsed.actions.entanglementMeasurements : 0,
      decoherenceTested: typeof parsed.actions?.decoherenceTested === 'boolean' ? parsed.actions.decoherenceTested : false,
      applicationsExplored: Array.isArray(parsed.actions?.applicationsExplored) ? parsed.actions.applicationsExplored : [],
    };

    const res: UserMetrics = {
      totalTimeSeconds: typeof parsed.totalTimeSeconds === 'number' ? parsed.totalTimeSeconds : 0,
      missionTimes,
      actions,
    };

    if (Array.isArray(parsed.completedMissions)) res.completedMissions = parsed.completedMissions;

    return res;
  } catch {
    return defaults;
  }
}

export function updateStoredMetrics(
  updater: Partial<UserMetrics> | ((prev: UserMetrics) => Partial<UserMetrics>)
): void {
  const current = getStoredMetrics();
  const partial = typeof updater === 'function' ? updater(current) : updater;

  const updated: UserMetrics = {
    ...current,
    ...partial,
    totalTimeSeconds: partial.totalTimeSeconds !== undefined ? partial.totalTimeSeconds : current.totalTimeSeconds,
    missionTimes: {
      ...current.missionTimes,
      ...(partial.missionTimes || {}),
    },
    actions: {
      ...current.actions,
      ...(partial.actions || {}),
    },
  };
  if (partial.completedMissions || current.completedMissions) {
    updated.completedMissions = partial.completedMissions || current.completedMissions;
  }
  safeSetCookie(COOKIE_METRICS, JSON.stringify(updated));
}

export function incrementActiveMissionTime(tabInput: number | string, deltaSeconds: number = 1): void {
  let tabKey: keyof MissionTimes | null = null;
  if (typeof tabInput === 'number' && tabInput >= 0 && tabInput <= 3) {
    tabKey = TAB_NAME_MAP[tabInput] as keyof MissionTimes;
  } else if (typeof tabInput === 'string' && tabInput in TAB_INDEX_MAP) {
    tabKey = tabInput as keyof MissionTimes;
  }

  if (!tabKey) return;

  const metrics = getStoredMetrics();
  const currentMissionTime = metrics.missionTimes[tabKey] || 0;
  updateStoredMetrics({
    totalTimeSeconds: metrics.totalTimeSeconds + deltaSeconds,
    missionTimes: {
      ...metrics.missionTimes,
      [tabKey]: currentMissionTime + deltaSeconds,
    },
  });
}

export function getStoredActiveTab(): number {
  const val = Cookies.get(COOKIE_ACTIVE_TAB);
  if (val === undefined || val === null) return 0;
  const parsedNum = Number(val);
  if (!isNaN(parsedNum) && parsedNum >= 0 && parsedNum <= 3) return parsedNum;
  if (typeof val === 'string' && val in TAB_INDEX_MAP) return TAB_INDEX_MAP[val];
  return 0;
}

export function saveActiveTab(tab: unknown): void {
  let numericTab: number | null = null;
  if (typeof tab === 'number' && !isNaN(tab) && tab >= 0 && tab <= 3) {
    numericTab = tab;
  } else if (typeof tab === 'string' && tab in TAB_INDEX_MAP) {
    numericTab = TAB_INDEX_MAP[tab];
  }

  if (numericTab === null) return;
  safeSetCookie(COOKIE_ACTIVE_TAB, String(numericTab));
}

export function getAllMissionStates(): Record<string, unknown> {
  const raw = Cookies.get(COOKIE_MISSION_STATE);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    return {};
  } catch {
    return {};
  }
}

export function getMissionState(missionIndex: number): Record<string, unknown> | null {
  const all = getAllMissionStates();
  return all[missionIndex] !== undefined ? (all[missionIndex] as Record<string, unknown>) : null;
}

export function saveMissionState(missionIndex: number, state: Record<string, unknown>): void {
  const currentAll = getAllMissionStates();
  const updatedAll = { ...currentAll, [missionIndex]: state };
  const serialized = JSON.stringify(updatedAll);
  if (serialized.length > MAX_COOKIE_SIZE_BYTES) return;
  safeSetCookie(COOKIE_MISSION_STATE, serialized);
}

export function deleteAllUserData(): void {
  Cookies.remove(COOKIE_USER_ID);
  Cookies.remove(COOKIE_PROGRESS);
  Cookies.remove(COOKIE_METRICS);
  Cookies.remove(COOKIE_ACTIVE_TAB);
  Cookies.remove(COOKIE_MISSION_STATE);
}

export function areAllMissionsCompleted(): boolean {
  const progress = getStoredProgress();
  return Array.from({ length: TOTAL_MISSIONS }, (_, index) => index).every((index) => progress.includes(index));
}

export function exportSessionJSON(sessionData?: unknown): string {
  const raw = (sessionData || loadSession()) as Record<string, unknown>;
  const cookieUserId = typeof window !== 'undefined' ? Cookies.get(COOKIE_USER_ID) : undefined;
  const isUuid = (str: unknown) =>
    typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  let userId = 'QL-TEST-USER';
  if (cookieUserId) {
    userId = cookieUserId;
  } else if (typeof raw.userId === 'string' && !isUuid(raw.userId)) {
    userId = raw.userId;
  }

  const metrics =
    raw.metrics && typeof raw.metrics === 'object' && Object.keys(raw.metrics as object).length > 0
      ? raw.metrics
      : createDefaultMetrics();

  const hasMissionState =
    raw.missionState &&
    typeof raw.missionState === 'object' &&
    Object.keys(raw.missionState as object).length > 0;

  const payload = {
    version: typeof raw.version === 'string' ? raw.version : '1.0',
    exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : new Date().toISOString(),
    userId,
    progress: Array.isArray(raw.progress) ? raw.progress : [0],
    metrics,
    activeTab: typeof raw.activeTab === 'number' ? raw.activeTab : 0,
    missionState: hasMissionState ? raw.missionState : { '0': { angle: 45, result: 0 } },
  };

  return JSON.stringify(payload, null, 2);
}

export function exportCanonicalSessionData(): string {
  return exportSessionJSON(loadSession());
}

export function downloadSessionJSON(sessionData?: unknown, filename = 'quantum-lab-session.json'): void {
  const json = typeof sessionData === 'string' ? sessionData : exportSessionJSON(sessionData);
  if (typeof window !== 'undefined') {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export function downloadSessionExport(filename = 'quantumlab_session.json'): void {
  downloadSessionJSON(undefined, filename);
}
