import Cookies from 'js-cookie';

export const COOKIE_USER_ID = 'ql_user_id';
export const COOKIE_PROGRESS = 'ql_progress';

/** Total number of playable missions. */
export const TOTAL_MISSIONS = 7;
export const COOKIE_METRICS = 'ql_metrics';
export const COOKIE_ACTIVE_TAB = 'ql_active_tab';
export const COOKIE_MISSION_STATE = 'ql_mission_state';

export const USER_ID_COOKIE_KEY = COOKIE_USER_ID;
export const PROGRESS_COOKIE_KEY = COOKIE_PROGRESS;
export const METRICS_COOKIE_KEY = COOKIE_METRICS;
export const ACTIVE_TAB_COOKIE_KEY = COOKIE_ACTIVE_TAB;

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
  [key: string]: unknown;
}

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
  if (value.length > MAX_COOKIE_SIZE_BYTES) {
    return;
  }
  Cookies.set(key, value, { expires: 365, sameSite: 'lax' });
}

export function getOrCreateUserId(): string {
  const existing = Cookies.get(COOKIE_USER_ID);
  if (existing) {
    return existing;
  }
  const randomHex = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .toUpperCase()
    .padStart(4, '0');
  const newUserId = `QL-${randomHex}`;
  safeSetCookie(COOKIE_USER_ID, newUserId);
  return newUserId;
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
  if (
    !Number.isInteger(missionIndex) ||
    missionIndex < 0 ||
    missionIndex >= TOTAL_MISSIONS
  ) {
    return;
  }
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
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return defaults;
    }

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

    if (Array.isArray(parsed.completedMissions)) {
      res.completedMissions = parsed.completedMissions;
    }

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
  if (!isNaN(parsedNum) && parsedNum >= 0 && parsedNum <= 3) {
    return parsedNum;
  }
  if (typeof val === 'string' && val in TAB_INDEX_MAP) {
    return TAB_INDEX_MAP[val];
  }
  return 0;
}

export function saveActiveTab(tab: number | string): void {
  let numericTab: number | null = null;
  if (typeof tab === 'number' && tab >= 0 && tab <= 3) {
    numericTab = tab;
  } else if (typeof tab === 'string' && tab in TAB_INDEX_MAP) {
    numericTab = TAB_INDEX_MAP[tab];
  }

  if (numericTab === null || isNaN(numericTab)) return;
  safeSetCookie(COOKIE_ACTIVE_TAB, String(numericTab));
}

export function getAllMissionStates(): Record<string, unknown> {
  const raw = Cookies.get(COOKIE_MISSION_STATE);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed;
    }
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
  const updatedAll = {
    ...currentAll,
    [missionIndex]: state,
  };
  const serialized = JSON.stringify(updatedAll);
  if (serialized.length > MAX_COOKIE_SIZE_BYTES) {
    return;
  }
  safeSetCookie(COOKIE_MISSION_STATE, serialized);
}

export function deleteAllUserData(): void {
  Cookies.remove(COOKIE_USER_ID);
  Cookies.remove(COOKIE_PROGRESS);
  Cookies.remove(COOKIE_METRICS);
  Cookies.remove(COOKIE_ACTIVE_TAB);
  Cookies.remove(COOKIE_MISSION_STATE);
}

/** Returns true only when all seven missions are completed. */
export function areAllMissionsCompleted(): boolean {
  const progress = getStoredProgress();

  return Array.from(
    { length: TOTAL_MISSIONS },
    (_, index) => index,
  ).every((index) => progress.includes(index));
}
