import Cookies from 'js-cookie';

export const COOKIE_USER_ID = 'quantum_user_id';
export const COOKIE_PROGRESS = 'quantum_lab_progress';
export const COOKIE_METRICS = 'quantum_lab_metrics';

export const DEFAULT_COOKIE_OPTIONS: Cookies.CookieAttributes = {
  expires: 30,
  sameSite: 'lax',
};

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

export const DEFAULT_METRICS: UserMetrics = {
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
  if (!stored) return DEFAULT_METRICS;
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
    return DEFAULT_METRICS;
  }
}

export function updateStoredMetrics(
  updater: (prev: UserMetrics) => UserMetrics
): UserMetrics {
  const current = getStoredMetrics();
  const updated = updater(current);
  Cookies.set(COOKIE_METRICS, JSON.stringify(updated), DEFAULT_COOKIE_OPTIONS);
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
