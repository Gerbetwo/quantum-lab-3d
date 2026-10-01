import Cookies from 'js-cookie';

const USER_ID_KEY = 'quantum_user_id';
const PROGRESS_KEY = 'quantum_lab_progress';
const METRICS_KEY = 'quantum_lab_metrics';

export interface UserMetrics {
  userId: string;
  startedAt: string;
  completedAt?: string;
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

export function getOrCreateUserId(): string {
  let userId = Cookies.get(USER_ID_KEY);
  if (!userId) {
    userId = 'QL-' + Math.random().toString(36).substring(2, 7).toUpperCase();
    Cookies.set(USER_ID_KEY, userId, { expires: 30, sameSite: 'lax' });
  }
  return userId;
}

export function getStoredProgress(): number[] {
  const data = Cookies.get(PROGRESS_KEY);
  if (!data) return [0]; // Mission 0 active by default
  try {
    return JSON.parse(data);
  } catch {
    return [0];
  }
}

export function saveCompletedMission(missionIndex: number) {
  const current = getStoredProgress();
  if (!current.includes(missionIndex)) {
    const updated = [...current, missionIndex];
    Cookies.set(PROGRESS_KEY, JSON.stringify(updated), { expires: 30, sameSite: 'lax' });
  }
}

export function getStoredMetrics(): UserMetrics {
  const data = Cookies.get(METRICS_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {}
  }

  const initial: UserMetrics = {
    userId: getOrCreateUserId(),
    startedAt: new Date().toISOString(),
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
  Cookies.set(METRICS_KEY, JSON.stringify(initial), { expires: 30, sameSite: 'lax' });
  return initial;
}

export function updateStoredMetrics(updater: (prev: UserMetrics) => UserMetrics) {
  const prev = getStoredMetrics();
  const next = updater(prev);
  Cookies.set(METRICS_KEY, JSON.stringify(next), { expires: 30, sameSite: 'lax' });
}
