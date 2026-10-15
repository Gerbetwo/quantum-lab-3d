export type MissionId = 'superposition' | 'entanglement' | 'error-correction' | 'gates' | 'decoherence' | 'grover' | 'applications';

export function isMissionId(id: string): id is MissionId {
  return ['superposition', 'entanglement', 'error-correction', 'gates', 'decoherence', 'grover', 'applications'].includes(id);
}

export function getMissionById(id: MissionId) {
  return { id };
}

'use client';

// ============================================================================
// SOURCE MODULE: src/features/session/lib/sessionService.ts

import { MissionId, CORE_MISSION_IDS, isMissionId, isMainJourneyComplete } from "@/features/MissionControls";
import clsx, { ClassValue } from "clsx";
import Cookies from "js-cookie";
import { useCallback, useMemo, useState, useEffect } from "react";
import { twMerge } from "tailwind-merge";
import { createContext } from "vm";

// ============================================================================
export const SESSION_VERSION = 2;
export const STORAGE_KEY = "quantum_lab_session_v2";
export const COOKIE_SESSION = "quantum_lab_session_v2";

export const RENDER_SAFE_USER_ID = "QL-TEST-USER";
export const DEFAULT_ACTIVE_MISSION: MissionId = "superposition";

export const CANONICAL_MISSION_IDS: readonly MissionId[] = CORE_MISSION_IDS;

export const LEGACY_MISSION_ID_MAP: Readonly<Record<string, MissionId>> = {
  "mission-1": "superposition",
  "mission-2": "entanglement",
  "mission-3": "decoherence",
  "mission-4": "applications",
};

export const COOKIE_USER_ID = "ql_user_id";
export const COOKIE_PROGRESS = "ql_progress";
export const COOKIE_METRICS = "ql_metrics";
export const COOKIE_ACTIVE_TAB = "ql_active_tab";
export const COOKIE_MISSION_STATE = "ql_mission_state";

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
  0: "superposition",
  1: "entanglement",
  2: "decoherence",
  3: "applications",
};

export const VALID_TABS = [0, 1, 2, 3];

export type MissionTimes = Record<MissionId, number>;

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
  elapsedSeconds: number;
  isRunning: boolean;
  version: number | string;
  userId: string;
  activeMission: MissionId;
  completed: MissionId[];
  missionTime: Partial<Record<MissionId, number>>;
  missionState: Partial<Record<MissionId, unknown>>;
  events: Array<{ type: string; timestamp: number; payload?: unknown }>;
  lastUpdated: number;
  metrics?: UserMetrics;
  progress?: number[];
  activeTab?: number;
  exportedAt?: string;
}

export type Session = UserSession;

export interface SaveOutcome {
  success: boolean;
  error?: string;
}

export function toCanonicalMissionId(id: unknown): MissionId | null {
  if (typeof id !== "string") return null;
  if (isMissionId(id)) return id;
  return LEGACY_MISSION_ID_MAP[id] ?? null;
}

function emptyMissionTimes(): MissionTimes {
  return {
    superposition: 0,
    entanglement: 0,
    decoherence: 0,
    applications: 0,
    gates: 0,
    grover: 0,
    "error-correction": 0,
  };
}

function emptyUserActions(): UserActions {
  return {
    superpositionMeasurements: 0,
    entanglementMeasurements: 0,
    decoherenceTested: false,
    applicationsExplored: [],
  };
}

export function createDefaultMetrics(): UserMetrics {
  return {
    totalTimeSeconds: 0,
    missionTimes: emptyMissionTimes(),
    actions: emptyUserActions(),
  };
}

export const DEFAULT_METRICS = createDefaultMetrics();

function safeSetCookie(_key: string, value: string): boolean {
  if (value.length > MAX_COOKIE_SIZE_BYTES) return false;
  try {
    Cookies.set(_key, value, { expires: 365, sameSite: "lax" });
    return true;
  } catch {
    return false;
  }
}

export function getOrCreateUserId(): string {
  if (typeof window === "undefined") return RENDER_SAFE_USER_ID;
  try {
    const existing = Cookies.get(COOKIE_USER_ID);
    if (existing) return existing;

    const local = localStorage.getItem("quantum_lab_user_id");
    if (local) {
      safeSetCookie(COOKIE_USER_ID, local);
      return local;
    }

    const randomHex = Math.floor(Math.random() * 0xffff)
      .toString(16)
      .toUpperCase()
      .padStart(4, "0");
    const newUserId = `QL-${randomHex}`;
    safeSetCookie(COOKIE_USER_ID, newUserId);
    localStorage.setItem("quantum_lab_user_id", newUserId);
    return newUserId;
  } catch {
    return RENDER_SAFE_USER_ID;
  }
}

function migrateCompleted(ids: unknown): MissionId[] {
  if (!Array.isArray(ids)) return [];
  const migrated: MissionId[] = [];
  for (const id of ids) {
    const canonical = toCanonicalMissionId(id);
    if (canonical && !migrated.includes(canonical)) migrated.push(canonical);
  }
  return migrated;
}

function migrateKeyedRecord<T>(record: unknown): Partial<Record<MissionId, T>> {
  if (!record || typeof record !== "object" || Array.isArray(record)) return {};
  const fromLegacy: Partial<Record<MissionId, T>> = {};
  const fromCanonical: Partial<Record<MissionId, T>> = {};
  try {
    for (const [key, value] of Object.entries(record as Record<string, T>)) {
      if (isMissionId(key)) {
        fromCanonical[key] = value;
      }
      const canonical = toCanonicalMissionId(key);
      if (canonical) fromLegacy[canonical] = value;
    }
  } catch {
    /* empty */
  }
  return { ...fromLegacy, ...fromCanonical };
}

function coerceMissionTimes(_raw: unknown): MissionTimes {
  const times = emptyMissionTimes();
  const migrated = migrateKeyedRecord<number>(_raw);
  for (const id of CANONICAL_MISSION_IDS) {
    const value = migrated[id];
    if (typeof value === "number" && Number.isFinite(value)) times[id] = value;
  }
  return times;
}

function coerceActions(raw: unknown): UserActions {
  const defaults = emptyUserActions();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return defaults;
  const parsed = raw as Partial<UserActions>;
  return {
    superpositionMeasurements:
      typeof parsed.superpositionMeasurements === "number" &&
      Number.isFinite(parsed.superpositionMeasurements)
        ? parsed.superpositionMeasurements
        : 0,
    entanglementMeasurements:
      typeof parsed.entanglementMeasurements === "number" &&
      Number.isFinite(parsed.entanglementMeasurements)
        ? parsed.entanglementMeasurements
        : 0,
    decoherenceTested:
      typeof parsed.decoherenceTested === "boolean"
        ? parsed.decoherenceTested
        : false,
    applicationsExplored: Array.isArray(parsed.applicationsExplored)
      ? parsed.applicationsExplored.filter(
          (item): item is string => typeof item === "string",
        )
      : [],
  };
}

function coerceMetrics(raw: unknown): UserMetrics {
  const defaults = createDefaultMetrics();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return defaults;
  const parsed = raw as UserMetrics;
  const metrics: UserMetrics = {
    ...parsed,
    totalTimeSeconds:
      typeof parsed.totalTimeSeconds === "number" &&
      Number.isFinite(parsed.totalTimeSeconds)
        ? parsed.totalTimeSeconds
        : 0,
    missionTimes: coerceMissionTimes(parsed.missionTimes),
    actions: coerceActions(parsed.actions),
  };
  if (Array.isArray(parsed.completedMissions)) {
    metrics.completedMissions = parsed.completedMissions.filter(
      (item): item is number =>
        typeof item === "number" && Number.isInteger(item),
    );
  }
  if (typeof parsed.completedAt === "string")
    metrics.completedAt = parsed.completedAt;
  return metrics;
}

export function toCanonicalSession(
  raw: unknown,
  userId = RENDER_SAFE_USER_ID,
): UserSession {
  const obj =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  const preservedUserId =
    typeof obj.userId === "string" && obj.userId.length > 0
      ? obj.userId
      : userId;
  const activeMission =
    toCanonicalMissionId(obj.activeMission) ?? DEFAULT_ACTIVE_MISSION;
  const completed = migrateCompleted(obj.completed);
  const missionTime = migrateKeyedRecord<number>(obj.missionTime);
  const missionState = migrateKeyedRecord<unknown>(obj.missionState);
  const events = Array.isArray(obj.events)
    ? obj.events.filter((e) => e && typeof e === "object")
    : [];
  const lastUpdated =
    typeof obj.lastUpdated === "number" && Number.isFinite(obj.lastUpdated)
      ? obj.lastUpdated
      : 0;
  const version =
    typeof obj.version === "number" || typeof obj.version === "string"
      ? obj.version
      : SESSION_VERSION;

  const session: UserSession = {
    version,
    userId: preservedUserId,
    activeMission,
    completed,
    missionTime,
    missionState,
    events: events as UserSession["events"],
    lastUpdated,
    metrics: coerceMetrics(obj.metrics),
    elapsedSeconds: 0,
    isRunning: false,
  };

  if (
    Array.isArray(obj.progress) &&
    obj.progress.every(
      (item) => typeof item === "number" && Number.isFinite(item),
    )
  ) {
    session.progress = obj.progress as number[];
  }
  if (typeof obj.activeTab === "number" && Number.isFinite(obj.activeTab))
    session.activeTab = obj.activeTab;
  if (typeof obj.exportedAt === "string") session.exportedAt = obj.exportedAt;

  return session;
}

export function createEmptySession(userId?: string): UserSession {
  return toCanonicalSession(undefined, userId ?? RENDER_SAFE_USER_ID);
}

export function getDefaultSession(): UserSession {
  return createEmptySession();
}

export function loadSession(): UserSession {
  if (typeof window === "undefined") return createEmptySession();
  try {
    if (typeof localStorage !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        try {
          const parsed = JSON.parse(stored);
          return toCanonicalSession(parsed, getOrCreateUserId());
        } catch {
          return createEmptySession(getOrCreateUserId());
        }
      }
    }
  } catch {
    /* empty */
  }
  return createEmptySession(getOrCreateUserId());
}

export function saveSession(session: UserSession): SaveOutcome {
  if (typeof window === "undefined") {
    return { success: false, error: "SSR environment" };
  }

  if (!session) {
    return { success: false, error: "Session object is undefined" };
  }

  try {
    const sessionCopy = JSON.parse(JSON.stringify(session));
    const canonical = toCanonicalSession(sessionCopy, sessionCopy.userId);
    canonical.lastUpdated = Date.now();

    const serialized = JSON.stringify(canonical);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, serialized);
    } else {
      return { success: false, error: "localStorage unavailable" };
    }
    return { success: true };
  } catch (err) {
    console.error("[Session Persistence Error]:", err);
    return { success: false, error: "Persistence failure" };
  }
}

export function completeMissionInSession(
  session: UserSession,
  _missionId: string,
): UserSession {
  const canonical = toCanonicalMissionId(_missionId);
  if (!canonical) return session;
  const completed = session.completed.includes(canonical)
    ? session.completed
    : [...session.completed, canonical];
  return { ...session, completed, lastUpdated: Date.now() };
}

export { isMainJourneyComplete };

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

export function resetCanonicalSession(): UserSession {
  if (typeof window === "undefined") return createEmptySession();
  return createEmptySession(getOrCreateUserId());
}

export function getStoredProgress(): number[] {
  const raw = Cookies.get(COOKIE_PROGRESS);
  if (!raw) return [0];
  try {
    const parsed = JSON.parse(raw);
    if (
      Array.isArray(parsed) &&
      parsed.length > 0 &&
      parsed.every((_item) => typeof _item === "number")
    ) {
      const uniqueSorted = Array.from(new Set(parsed as number[])).sort(
        (_a, _b) => _a - _b,
      );
      return uniqueSorted.length > 0 ? uniqueSorted : [0];
    }
    return [0];
  } catch {
    return [0];
  }
}

export function saveCompletedMission(missionIndex: number): boolean {
  if (
    !Number.isInteger(missionIndex) ||
    missionIndex < 0 ||
    missionIndex >= TOTAL_MISSIONS
  )
    return false;
  const current = getStoredProgress();
  if (!current.includes(missionIndex)) {
    const updated = [...current, missionIndex].sort((_a, _b) => _a - _b);
    return safeSetCookie(COOKIE_PROGRESS, JSON.stringify(updated));
  }
  return true;
}

export function getStoredMetrics(): UserMetrics {
  const raw = Cookies.get(COOKIE_METRICS);
  const defaults = createDefaultMetrics();
  if (!raw) return defaults;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return defaults;
    return coerceMetrics(parsed);
  } catch {
    return defaults;
  }
}

export function updateStoredMetrics(
  updater: Partial<UserMetrics> | ((prev: UserMetrics) => Partial<UserMetrics>),
): boolean {
  const current = getStoredMetrics();
  const partial = typeof updater === "function" ? updater(current) : updater;

  const updated: UserMetrics = {
    ...current,
    ...partial,
    totalTimeSeconds:
      partial.totalTimeSeconds !== undefined
        ? partial.totalTimeSeconds
        : current.totalTimeSeconds,
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
    updated.completedMissions =
      partial.completedMissions || current.completedMissions;
  }
  return safeSetCookie(COOKIE_METRICS, JSON.stringify(updated));
}

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

export function getStoredActiveTab(): number {
  const val = Cookies.get(COOKIE_ACTIVE_TAB);
  if (val === undefined || val === null) return 0;
  const parsedNum = Number(val);
  if (!isNaN(parsedNum) && parsedNum >= 0 && parsedNum <= 3) return parsedNum;
  if (typeof val === "string" && val in TAB_INDEX_MAP)
    return TAB_INDEX_MAP[val];
  return 0;
}

export function saveActiveTab(tab: unknown): boolean {
  let numericTab: number | null = null;
  if (typeof tab === "number" && !isNaN(tab) && tab >= 0 && tab <= 3) {
    numericTab = tab;
  } else if (typeof tab === "string" && tab in TAB_INDEX_MAP) {
    numericTab = TAB_INDEX_MAP[tab];
  }

  if (numericTab === null) return false;
  return safeSetCookie(COOKIE_ACTIVE_TAB, String(numericTab));
}

export function getAllMissionStates(): Record<string, unknown> {
  const raw = Cookies.get(COOKIE_MISSION_STATE);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
      return parsed;
    return {};
  } catch {
    return {};
  }
}

export function getMissionState(
  missionIndex: number,
): Record<string, unknown> | null {
  const all = getAllMissionStates();
  return all[missionIndex] !== undefined
    ? (all[missionIndex] as Record<string, unknown>)
    : null;
}

export function saveMissionState(
  missionIndex: number,
  state: Record<string, unknown>,
): boolean {
  const currentAll = getAllMissionStates();
  const updatedAll = { ...currentAll, [missionIndex]: state };
  const serialized = JSON.stringify(updatedAll);
  if (serialized.length > MAX_COOKIE_SIZE_BYTES) return false;
  return safeSetCookie(COOKIE_MISSION_STATE, serialized);
}

export function deleteAllLocalProgress(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("quantum_lab_user_id");
  } catch {
    /* empty */
  }
  Cookies.remove(COOKIE_USER_ID);
  Cookies.remove(COOKIE_PROGRESS);
  Cookies.remove(COOKIE_METRICS);
  Cookies.remove(COOKIE_ACTIVE_TAB);
  Cookies.remove(COOKIE_MISSION_STATE);
  Cookies.remove(COOKIE_SESSION);
}

export function deleteAllUserData(): void {
  deleteAllLocalProgress();
}

export function areAllMissionsCompleted(): boolean {
  const progress = getStoredProgress();
  return Array.from({ length: TOTAL_MISSIONS }, (_, _index) => _index).every(
    (_index) => progress.includes(_index),
  );
}

export function exportSessionJSON(_sessionData?: unknown): string {
  const raw = (_sessionData || loadSession()) as Record<string, unknown>;
  const cookieUserId =
    typeof window !== "undefined" ? Cookies.get(COOKIE_USER_ID) : undefined;
  const isUuid = (str: unknown) =>
    typeof str === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\$/i.test(
      str,
    );

  let userId = "QL-TEST-USER";
  if (cookieUserId) {
    userId = cookieUserId;
  } else if (typeof raw.userId === "string" && !isUuid(raw.userId)) {
    userId = raw.userId;
  }

  const metrics =
    raw.metrics &&
    typeof raw.metrics === "object" &&
    Object.keys(raw.metrics as object).length > 0
      ? raw.metrics
      : createDefaultMetrics();

  const hasMissionState =
    raw.missionState &&
    typeof raw.missionState === "object" &&
    Object.keys(raw.missionState as object).length > 0;

  const payload = {
    version: typeof raw.version === "string" ? raw.version : "1.0",
    exportedAt:
      typeof raw.exportedAt === "string"
        ? raw.exportedAt
        : new Date().toISOString(),
    userId,
    progress: Array.isArray(raw.progress) ? raw.progress : [0],
    metrics,
    activeTab: typeof raw.activeTab === "number" ? raw.activeTab : 0,
    missionState: hasMissionState
      ? raw.missionState
      : { "0": { angle: 45, result: 0 } },
  };

  return JSON.stringify(payload, null, 2);
}

export function exportCanonicalSessionData(): string {
  return exportSessionJSON(loadSession());
}

export function downloadSessionJSON(
  sessionData?: unknown,
  _filename = "quantum-lab-session.json",
): void {
  const json =
    typeof sessionData === "string"
      ? sessionData
      : exportSessionJSON(sessionData);
  if (typeof window !== "undefined") {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = _filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export function downloadSessionExport(
  _filename = "quantumlab_session.json",
): void {
  downloadSessionJSON(undefined, _filename);
}

("use client");

const MISSION_ORDER: MissionId[] = [
  "superposition",
  "entanglement",
  "decoherence",
  "applications",
  "gates",
  "grover",
  "error-correction",
];

export function useSession() {
  const {
    session,
    isHydrated,
    setActiveMission: setCanonicalActiveMission,
    completeMission,
    recordMissionTime,
    resetSession,
  } = useSessionContext();

  const setActiveMission = useCallback(
    (missionId: MissionId | null) => {
      if (missionId) {
        setCanonicalActiveMission(missionId);
      } else if (session.activeMission) {
        setCanonicalActiveMission(session.activeMission);
      }
    },
    [setCanonicalActiveMission, session.activeMission],
  );

  const recordTime = useCallback(
    (_missionId: MissionId, _seconds: number) => {
      recordMissionTime(_missionId, _seconds);
    },
    [recordMissionTime],
  );

  const isUnlocked = useCallback(
    (missionId: MissionId): boolean => {
      if (!isMissionId(missionId)) return false;
      const index = MISSION_ORDER.indexOf(missionId);
      if (index <= 0) return true;
      const prevMission = MISSION_ORDER[index - 1];
      return session.completed.includes(prevMission);
    },
    [session.completed],
  );

  return {
    session,
    isHydrated,
    setActiveMission,
    completeMission,
    recordTime,
    resetSession,
    isUnlocked,
  };
}

/**
- Canonical Session Timer Hook
- Provides synchronized elapsed time in seconds, pause/resume controls, 
- action tracking, and formatted representation for header consumption.
 */
("use client");

export interface UseSessionTimerResult {
  elapsedSeconds: number;
  formattedTime: string;
  isRunning: boolean;
  pauseTimer: () => void;
  resumeTimer: () => void;
  recordAction: (actionType: string) => void;
}

export function useSessionTimer(): UseSessionTimerResult {
  const {
    elapsedSeconds,
    isRunning,
    pauseSession,
    resumeSession,
    incrementActionCount,
  } = useSession();

  // Format elapsed seconds into MM:SS or HH:MM:SS for header consumption
  const formattedTime = useMemo(() => {
    const hrs = Math.floor(elapsedSeconds / 3600);
    const mins = Math.floor((elapsedSeconds % 3600) / 60);
    const secs = elapsedSeconds % 60;

    const pad = (_n: number) => _n.toString().padStart(2, "0");

    if (hrs > 0) {
      return `${hrs}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  }, [elapsedSeconds]);

  return {
    elapsedSeconds,
    formattedTime,
    isRunning,
    pauseTimer: pauseSession,
    resumeTimer: resumeSession,
    recordAction: incrementActionCount,
  };
}

("use client");

interface SessionContextType {
  session: UserSession;
  isHydrated: boolean;
  storageWarning: string | null;
  elapsedSeconds: number;
  isRunning: boolean;
  setActiveMission: (missionId: MissionId | null) => void;
  completeMission: (missionId: string) => void;
  updateMissionState: (
    missionId: string,
    state: Record<string, unknown>,
  ) => void;
  recordAction: (actionName: string, payload?: unknown) => void;
  recordMissionTime: (missionId: string, durationMs: number) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  incrementActionCount: (actionType: string) => void;
  resetSession: () => void;
  deleteAllProgress: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<UserSession>(() => {
    if (typeof window === "undefined") return getDefaultSession();
    return loadSession();
  });
  const [isHydrated] = useState(true);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);

  // Single source of truth for elapsed time and run state at the provider level
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(true);

  // Centralized timer effect with clean disposal (no duplicate ticking)
  useEffect(() => {
    if (!isRunning || !isHydrated) return;
    const interval = setInterval(() => {
      setElapsedSeconds((_prev) => _prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, isHydrated]);

  const updateAndSave = useCallback(
    (_updater: (prev: UserSession) => UserSession) => {
      setSession((prev) => {
        const nextState = toCanonicalSession(_updater(prev), prev.userId);

        // Save synchronously inside the updater function where nextState is defined
        const outcome = saveSession(nextState);

        if (!outcome.success) {
          setTimeout(() => {
            setStorageWarning(
              outcome.error ?? "Failed to persist session storage.",
            );
          }, 0);
        } else {
          setTimeout(() => {
            setStorageWarning(null);
          }, 0);
        }

        return nextState;
      });
    },
    [],
  );

  const setActiveMission = useCallback(
    (_missionId: string) => {
      const canonical = toCanonicalMissionId(_missionId);
      if (!canonical) return;
      updateAndSave((_prev) => ({ ..._prev, activeMission: canonical }));
    },
    [updateAndSave],
  );

  const completeMission = useCallback(
    (_missionId: string) => {
      updateAndSave((_prev) => completeMissionInSession(_prev, _missionId));
    },
    [updateAndSave],
  );

  const updateMissionState = useCallback(
    (_missionId: string, state: Record<string, unknown>) => {
      const canonical = toCanonicalMissionId(_missionId);
      if (!canonical) return;
      updateAndSave((prev) => ({
        ...prev,
        missionState: {
          ...prev.missionState,
          [canonical]: {
            ...((prev.missionState[canonical] as
              | Record<string, unknown>
              | undefined) || {}),
            ...state,
          },
        },
      }));
    },
    [updateAndSave],
  );

  const recordAction = useCallback(
    (actionName: string, payload?: unknown) => {
      updateAndSave((prev) => ({
        ...prev,
        events: [
          ...prev.events,
          { type: actionName, timestamp: Date.now(), payload },
        ],
      }));
    },
    [updateAndSave],
  );

  const recordMissionTime = useCallback(
    (missionId: string, durationMs: number) => {
      updateAndSave((prev) =>
        recordMissionTimeInSession(prev, missionId, durationMs),
      );
    },
    [updateAndSave],
  );

  const pauseSession = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resumeSession = useCallback(() => {
    setIsRunning(true);
  }, []);

  const incrementActionCount = useCallback(
    (actionType: string) => {
      recordAction(actionType);
    },
    [recordAction],
  );

  const resetSession = useCallback(() => {
    const fresh = resetCanonicalSession();
    setSession(fresh);
    setElapsedSeconds(0);
    setIsRunning(true);
    const outcome = saveSession(fresh);
    if (!outcome.success) {
      setStorageWarning(outcome.error ?? "Failed to persist session storage.");
    } else {
      setStorageWarning(null);
    }
  }, []);

  const deleteAllProgress = useCallback(() => {
    deleteAllLocalProgress();
    const fresh = resetCanonicalSession();
    setSession(fresh);
    setElapsedSeconds(0);
    setIsRunning(true);
    setStorageWarning(null);
  }, []);

  return (
    <SessionContext.Provider
      value={{
        session,
        isHydrated,
        storageWarning,
        elapsedSeconds,
        isRunning,
        setActiveMission,
        completeMission,
        updateMissionState,
        recordAction,
        recordMissionTime,
        pauseSession,
        resumeSession,
        incrementActionCount,
        resetSession,
        deleteAllProgress,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

/**
- QuantumLab 3D - Web Audio API Sound Engine
- Dual-layer API supporting both object-oriented QuantumAudioEngine singleton
- and legacy exported audio helper functions for standard/test suite compatibility.
 */

export class QuantumAudioEngine {
  private ctx: AudioContext | null = null;

  /**
- Lazy initialization for AudioContext.
- Prevents premature instantiation before user gestures or during SSR.
   */
  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;

    if (!this.ctx) {
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
        }
      } catch (_err) {
        console.warn("AudioContext initialization failed safely:", _err);
        return null;
      }
    }

    return this.ctx;
  }

  /**
- Resumes the suspended AudioContext.
   */
  public async unlock(): Promise<void> {
    const ctx = this.getContext();
    if (ctx && ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch (_err) {
        console.warn("AudioContext unlock failed safely:", _err);
      }
    }
  }

  /**
- Plays a gate sound effect: Oscillator sine sweep from 440 Hz to 880 Hz over 0.15s.
- 
- @param gateTypeType of quantum gate being executed.
   */
  public playGateSound(_gateType: string): void {
    if (!isAudioEnabled()) return;
    const ctx = this.getContext();
    if (!ctx || ctx.state !== "running") return;

    try {
      const now = ctx.currentTime;
      const duration = 0.15;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + duration);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    } catch (_err) {
      console.warn("playGateSound failed safely:", _err);
    }
  }

  /**
- Plays a measurement collapse sound effect: Low frequency impact (120 Hz to 30 Hz) with a noise buffer burst.
   */
  public playMeasurementSound(): void {
    if (!isAudioEnabled()) return;
    const ctx = this.getContext();
    if (!ctx || ctx.state !== "running") return;

    try {
      const now = ctx.currentTime;
      const duration = 0.25;

      // Low-frequency impact sweep (120 Hz -> 30 Hz)
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + duration);

      oscGain.gain.setValueAtTime(0.3, now);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);

      osc.onended = () => {
        osc.disconnect();
        oscGain.disconnect();
      };

      // White noise buffer burst
      const noiseDuration = 0.1;
      const bufferSize = Math.floor(ctx.sampleRate * noiseDuration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noiseSource = ctx.createBufferSource();
      const noiseGain = ctx.createGain();

      noiseSource.buffer = buffer;

      noiseGain.gain.setValueAtTime(0.12, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + noiseDuration);

      noiseSource.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noiseSource.start(now);
      noiseSource.stop(now + noiseDuration);

      noiseSource.onended = () => {
        noiseSource.disconnect();
        noiseGain.disconnect();
      };
    } catch (_err) {
      console.warn("playMeasurementSound failed safely:", _err);
    }
  }

  /**
- Plays a success sound effect: Harmonic triad chord (C5, E5, G5).
   */
  public playSuccessSound(): void {
    if (!isAudioEnabled()) return;
    const ctx = this.getContext();
    if (!ctx || ctx.state !== "running") return;

    try {
      const now = ctx.currentTime;
      const duration = 0.4;
      const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5

      frequencies.forEach((_freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(_freq, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + duration);

        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };
      });
    } catch (_err) {
      console.warn("playSuccessSound failed safely:", _err);
    }
  }

  /**
- Plays an error sound effect: Sawtooth buzz at 150 Hz.
   */
  public playErrorSound(): void {
    if (!isAudioEnabled()) return;
    const ctx = this.getContext();
    if (!ctx || ctx.state !== "running") return;

    try {
      const now = ctx.currentTime;
      const duration = 0.25;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    } catch (_err) {
      console.warn("playErrorSound failed safely:", _err);
    }
  }
}

export const audioEngine = new QuantumAudioEngine();

let _userInteracted = false;
let runtimeAudioEnabledOverride: boolean | null = null;

export function isAudioEnabled(): boolean {
  const env = process.env.NEXT_PUBLIC_ENABLE_AUDIO;
  if (env === "false" || env === "0") return false;
  if (runtimeAudioEnabledOverride !== null) return runtimeAudioEnabledOverride;
  return true;
}

export function setAudioEnabled(_enabled: boolean): void {
  runtimeAudioEnabledOverride = _enabled;
}

export function toggleAudio(): boolean {
  const nextState = !isAudioEnabled();
  setAudioEnabled(nextState);
  return nextState;
}

export function __markUserInteracted(): void {
  _userInteracted = true;
}

export function __resetAudioOverride(): void {
  runtimeAudioEnabledOverride = null;
  _userInteracted = false;
}

// Standalone Helper Playback Functions

export function playNote(_freq: number = 440, _duration: number = 0.1): void {
  if (!isAudioEnabled()) return;
  try {
    const AudioContextClass =
      typeof window !== "undefined"
        ? window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext
        : null;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = _freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + _duration);
  } catch (_err) {
    // Handled safely
  }
}

export function playChimeSuccess(): void {
  audioEngine.playSuccessSound();
}

export function playQuantumCollapse(): void {
  audioEngine.playMeasurementSound();
}

export function playMeasurementCollapse(_numQubits?: number): void {
  audioEngine.playMeasurementSound();
}

export function playGateForQubit(
  _qubitIndex?: number,
  _gateType: string = "H",
): void {
  audioEngine.playGateSound(_gateType);
}

export function playDecoherenceAlert(): void {
  audioEngine.playErrorSound();
}

export function playLaserScan(): void {
  audioEngine.playGateSound("LASER");
}

export function playButtonClick(): void {
  playNote(600, 0.05);
}

export function playHover(): void {
  playNote(300, 0.02);
}

export function cn(..._inputs: ClassValue[]) {
  return twMerge(clsx(_inputs));
}
