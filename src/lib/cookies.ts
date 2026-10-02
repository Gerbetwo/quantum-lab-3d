import Cookies from 'js-cookie';

export const COOKIE_USER_ID = 'quantum_user_id';
export const COOKIE_PROGRESS = 'quantum_lab_progress';
export const COOKIE_METRICS = 'quantum_lab_metrics';
export const COOKIE_ACTIVE_TAB = 'quantum_lab_active_tab';

export const DEFAULT_COOKIE_OPTIONS: Cookies.CookieAttributes = {
  expires: 30,
  sameSite: 'lax',
};

/** Cookies are capped at ~4 KB. Keep a safe margin. */
export const MAX_COOKIE_SIZE_BYTES = 3072;

export interface UserMetrics {
  totalTimeSeconds: number;
  missionTimes: {
    superposition: number;
    entanglement: number;
    decoherence: number;
    applications: number;
  };
  actions: {
    superpositionMeasurements: number;
    entanglementMeasurements: number;
    decoherenceTested: boolean;
    applicationsExplored: string[];
  };
}

/** Frozen template. Never return it directly; use createDefaultMetrics(). */
export const DEFAULT_METRICS: Readonly<UserMetrics> = Object.freeze({
  totalTimeSeconds: 0,
  missionTimes: Object.freeze({
    superposition: 0,
    entanglement: 0,
    decoherence: 0,
    applications: 0,
  }),
  actions: Object.freeze({
    superpositionMeasurements: 0,
    entanglementMeasurements: 0,
    decoherenceTested: false,
    applicationsExplored: Object.freeze([]) as unknown as string[],
  }),
}) as Readonly<UserMetrics>;

/** Returns a fresh, mutable default metrics object. */
export function createDefaultMetrics(): UserMetrics {
  return {
    totalTimeSeconds: DEFAULT_METRICS.totalTimeSeconds,
    missionTimes: { ...DEFAULT_METRICS.missionTimes },
    actions: {
      ...DEFAULT_METRICS.actions,
      applicationsExplored: [...DEFAULT_METRICS.actions.applicationsExplored],
    },
  };
}

export function getOrCreateUserId(): string {
  let userId = Cookies.get(COOKIE_USER_ID);
  if (!userId) {
    const randomHex = Math.floor(Math.random() * 0xffff)
      .toString(16)
      .padStart(4, '0')
      .toUpperCase();
    userId = `QL-${randomHex}`;
    Cookies.set(COOKIE_USER_ID, userId, DEFAULT_COOKIE_OPTIONS);
  }
  return userId;
}

/**
 * Returns the set of completed mission indices (0-3), sorted ascending.
 * It is a SET, not a sequence: e.g. re-completing mission 1 does not change
 * the array order, and duplicates are impossible by construction.
 */
export function getStoredProgress(): number[] {
  const stored = Cookies.get(COOKIE_PROGRESS);
  if (!stored) return [0];
  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.every((n) => typeof n === 'number')) {
      return parsed.length > 0 ? Array.from(new Set(parsed)).sort((a, b) => a - b) : [0];
    }
    return [0];
  } catch {
    return [0];
  }
}

export function saveCompletedMission(missionIndex: number): number[] {
  const currentProgress = getStoredProgress();
  const updated = Array.from(new Set([...currentProgress, missionIndex])).sort((a, b) => a - b);
  Cookies.set(COOKIE_PROGRESS, JSON.stringify(updated), DEFAULT_COOKIE_OPTIONS);
  return updated;
}

export function getStoredMetrics(): UserMetrics {
  const stored = Cookies.get(COOKIE_METRICS);
  if (!stored) return createDefaultMetrics();
  try {
    const parsed = JSON.parse(stored);
    return {
      totalTimeSeconds: typeof parsed.totalTimeSeconds === 'number' ? parsed.totalTimeSeconds : 0,
      missionTimes: {
        superposition: parsed.missionTimes?.superposition ?? 0,
        entanglement: parsed.missionTimes?.entanglement ?? 0,
        decoherence: parsed.missionTimes?.decoherence ?? 0,
        applications: parsed.missionTimes?.applications ?? 0,
      },
      actions: {
        superpositionMeasurements: parsed.actions?.superpositionMeasurements ?? 0,
        entanglementMeasurements: parsed.actions?.entanglementMeasurements ?? 0,
        decoherenceTested: Boolean(parsed.actions?.decoherenceTested),
        applicationsExplored: Array.isArray(parsed.actions?.applicationsExplored)
          ? parsed.actions.applicationsExplored
          : [],
      },
    };
  } catch {
    return createDefaultMetrics();
  }
}

export function updateStoredMetrics(
  updater: (prev: UserMetrics) => UserMetrics
): UserMetrics {
  const current = getStoredMetrics();
  const updated = updater(current);
  const json = JSON.stringify(updated);
  if (json.length > MAX_COOKIE_SIZE_BYTES) {
    if (typeof console !== 'undefined' && typeof console.warn === 'function') {
      console.warn(
        `[cookies] metrics payload (${json.length} bytes) exceeds limit (${MAX_COOKIE_SIZE_BYTES}); skipping write`
      );
    }
    return updated;
  }
  Cookies.set(COOKIE_METRICS, json, DEFAULT_COOKIE_OPTIONS);
  return updated;
}

export function incrementActiveMissionTime(missionIndex: number): UserMetrics {
  const missionKeys: Array<keyof UserMetrics['missionTimes']> = [
    'superposition',
    'entanglement',
    'decoherence',
    'applications',
  ];
  const key = missionKeys[missionIndex] || 'superposition';

  return updateStoredMetrics((prev) => ({
    ...prev,
    totalTimeSeconds: prev.totalTimeSeconds + 1,
    missionTimes: {
      ...prev.missionTimes,
      [key]: (prev.missionTimes[key] || 0) + 1,
    },
  }));
}

// ---------------------------------------------------------------------------
// Active tab persistence
// ---------------------------------------------------------------------------

export function getStoredActiveTab(): number {
  const stored = Cookies.get(COOKIE_ACTIVE_TAB);
  if (!stored) return 0;
  const n = parseInt(stored, 10);
  if (!Number.isFinite(n) || n < 0 || n > 3) return 0;
  return n;
}

export function saveActiveTab(tab: number): void {
  if (!Number.isFinite(tab) || tab < 0 || tab > 3) return;
  Cookies.set(COOKIE_ACTIVE_TAB, String(tab), DEFAULT_COOKIE_OPTIONS);
}

// ---------------------------------------------------------------------------
// GDPR / right to erasure
// ---------------------------------------------------------------------------

export function deleteAllUserData(): void {
  Cookies.remove(COOKIE_USER_ID);
  Cookies.remove(COOKIE_PROGRESS);
  Cookies.remove(COOKIE_METRICS);
  Cookies.remove(COOKIE_ACTIVE_TAB);
  Cookies.remove(COOKIE_MISSION_STATE);
}

export const COOKIE_MISSION_STATE = 'quantum_mission_state';

export interface MissionStateMap {
  0: Record<string, unknown>;
  1: Record<string, unknown>;
  2: Record<string, unknown>;
  3: Record<string, unknown>;
  [key: number]: Record<string, unknown>;
}

export function getAllMissionStates(): Record<string, Record<string, unknown>> {
  if (typeof window === 'undefined') return {};
  const raw = Cookies.get(COOKIE_MISSION_STATE);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function getMissionState<K extends keyof MissionStateMap>(mission: K): MissionStateMap[K] | null {
  const allStates = getAllMissionStates();
  const state = allStates[String(mission)];
  return (state as MissionStateMap[K]) ?? null;
}

export function saveMissionState<K extends keyof MissionStateMap>(
  mission: K,
  state: MissionStateMap[K]
): void {
  if (typeof window === 'undefined') return;
  const currentStates = getAllMissionStates();
  const updatedStates = {
    ...currentStates,
    [String(mission)]: state,
  };

  const serialized = JSON.stringify(updatedStates);
  const sizeBytes = new Blob([serialized]).size;

  if (sizeBytes > MAX_COOKIE_SIZE_BYTES) {
    console.warn(
      `[saveMissionState] Límite de tamaño de cookie excedido: ${sizeBytes} bytes > ${MAX_COOKIE_SIZE_BYTES} bytes`
    );
    return;
  }

  Cookies.set(COOKIE_MISSION_STATE, serialized, {
    expires: 365,
    sameSite: 'lax',
  });
}
