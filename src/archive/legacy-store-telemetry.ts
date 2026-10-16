// @ts-nocheck
/* eslint-disable */
// Archived from src/store/useQuantumStore.tsx

// Symbol: getMissionById
export function getMissionById(id: MissionId | string) {
  return { id: id as MissionId };
}

// Symbol: recordMissionTimeInSession
export function recordMissionTimeInSession(
  session: UserSession,
  _missionId: string,
  _durationMs: number,
): UserSession {
  const canonical = toCanonicalMissionId(_missionId);
  if (!canonical) return session;
  return {
    ...session,
    missionTime: {
      ...session.missionTime,
      [canonical]: (session.missionTime[canonical] || 0) + _durationMs,
    },
    lastUpdated: Date.now(),
  };
}

// Symbol: resetCanonicalSession
export function resetCanonicalSession(): UserSession {
  if (typeof window === "undefined") return createEmptySession();
  return createEmptySession(getOrCreateUserId());
}

// Symbol: incrementActiveMissionTime
export function incrementActiveMissionTime(
  tabInput: number | string,
  deltaSeconds: number = 1,
): void {
  let tabKey: keyof MissionTimes | null = null;
  if (typeof tabInput === "number" && tabInput >= 0 && tabInput <= 3) {
    tabKey = TAB_NAME_MAP[tabInput] as keyof MissionTimes;
  } else if (typeof tabInput === "string" && tabInput in TAB_INDEX_MAP) {
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

// Symbol: deleteAllUserData
export function deleteAllUserData(): void {
  deleteAllLocalProgress();
}

// Symbol: areAllMissionsCompleted
export function areAllMissionsCompleted(): boolean {
  const progress = getStoredProgress();
  return Array.from({ length: TOTAL_MISSIONS }, (_, _index) => _index).every(
    (_index) => progress.includes(_index),
  );
}

// Symbol: exportCanonicalSessionData
export function exportCanonicalSessionData(): string {
  return exportSessionJSON(loadSession());
}

// Symbol: downloadSessionExport
export function downloadSessionExport(
  _filename = "quantumlab_session.json",
): void {
  downloadSessionJSON(undefined, _filename);
}

// Symbol: cn
export function cn(..._inputs: ClassValue[]) {
  return twMerge(clsx(_inputs));
}

// Symbol: USER_ID_COOKIE_KEY
export const USER_ID_COOKIE_KEY = COOKIE_USER_ID;

// Symbol: PROGRESS_COOKIE_KEY
export const PROGRESS_COOKIE_KEY = COOKIE_PROGRESS;

// Symbol: METRICS_COOKIE_KEY
export const METRICS_COOKIE_KEY = COOKIE_METRICS;

// Symbol: ACTIVE_TAB_COOKIE_KEY
export const ACTIVE_TAB_COOKIE_KEY = COOKIE_ACTIVE_TAB;

// Symbol: TAB_NAME_MAP
export const TAB_NAME_MAP: Record<number, string> = {
  0: "superposition",
  1: "entanglement",
  2: "decoherence",
  3: "applications",
};

// Symbol: VALID_TABS
export const VALID_TABS = [0, 1, 2, 3];

// Symbol: Session
export type Session = UserSession;
