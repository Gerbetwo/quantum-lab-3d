'use client';

import React, { useCallback, useMemo, useEffect } from "react";
import Cookies from "js-cookie";
import clsx, { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  calculateCoherenceTime,
  stateToBlochAngles,
  applyGate,
  StandardGates,
  H,
  c,
  type StateVector,
  type GateMatrix,
  type GateType,
} from "@/lib/quantumCore";
import { audioEngine } from "@/lib/audio/audioEngine";

export type MissionId =
  | "superposition"
  | "entanglement"
  | "error-correction"
  | "gates"
  | "decoherence"
  | "grover"
  | "applications";

export const CORE_MISSION_IDS: readonly MissionId[] = [
  "superposition",
  "entanglement",
  "error-correction",
  "gates",
  "decoherence",
  "grover",
  "applications",
];

export function isMissionId(id: string): id is MissionId {
  return CORE_MISSION_IDS.includes(id as MissionId);
}

export const MAIN_JOURNEY_MISSION_IDS: readonly MissionId[] = [
  "superposition",
  "entanglement",
  "decoherence",
  "applications",
];

export function isMainJourneyComplete(
  completed: MissionId[] | readonly MissionId[]
): boolean {
  return MAIN_JOURNEY_MISSION_IDS.every((id) => completed.includes(id));
}

export function getMissionById(id: MissionId | string) {
  return { id: id as MissionId };
}

export const MISSIONS: any = Object.assign(
  CORE_MISSION_IDS.map((id) => ({ id })),
  Object.fromEntries(CORE_MISSION_IDS.map((id) => [id, { id }]))
);

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

// ============================================================================
// ZUSTAND QUANTUM STORE & MODERN SLICES
// ============================================================================

export const INITIAL_PHYSICS = {
  theta: 0,
  phi: 0,
  temperatureK: 0.015,
  coherenceTimeUs: 4347.83,
  entanglementDegree: 0,
  isEntangled: false,
  lastOutcome: null as 0 | 1 | null,
};

export type MissionPhase =
  | "BRIEFING"
  | "PREDICTION"
  | "EXPERIMENT"
  | "OBSERVATION"
  | "ANALYSIS"
  | "COMPLETED"
  | "MANIPULATION"
  | "MEASUREMENT"
  | "VERIFICATION"
  | "SUCCESS";

export const INITIAL_MISSION_RUN = {
  currentMissionId: "superposition" as MissionId,
  activeMissionId: "superposition" as MissionId,
  activeMission: "superposition" as MissionId,
  activeStepIndex: 0,
  currentPhase: "BRIEFING" as MissionPhase,
  userPredictionProb0: null as number | null,
  appliedGates: [] as string[],
  missionState: {} as Record<string, unknown>,
};

export interface PhysicsSlice {
  theta: number;
  phi: number;
  temperatureK: number;
  coherenceTimeUs: number;
  entanglementDegree: number;
  isEntangled: boolean;
  lastOutcome: 0 | 1 | null;
  setAngles: (theta: number, phi: number) => void;
  applyGate: (gate: string | GateMatrix | GateType) => void;
  setTemperature: (temperatureK: number) => void;
  measure: () => 0 | 1;
}

export interface MissionRunSlice {
  currentMissionId: MissionId | null;
  activeMissionId: MissionId | null;
  activeMission: MissionId | null;
  activeStepIndex: number;
  currentPhase: MissionPhase;
  userPredictionProb0: number | null;
  appliedGates: string[];
  missionState: Record<string, unknown>;
  startMission: (id: MissionId) => void;
  selectMission: (id: MissionId) => void;
  setPrediction: (prob0: number) => void;
  transitionPhase: (phase: MissionPhase) => void;
  transitionMissionPhase: (phase: MissionPhase) => void;
  applyGateToMission: (gate: string) => void;
  evaluateMissionStep: (targetTheta?: number, targetPhi?: number) => boolean;
  resetState: () => void;
}

export interface ProgressSlice {
  userId: string;
  completedMissions: MissionId[];
  completed: MissionId[];
  missionTimes: Record<MissionId, number>;
  missionTime: Partial<Record<MissionId, number>>;
  progress: number[];
  metrics: UserMetrics;
  completeMission: (id: MissionId | string) => void;
  recordMissionTime: (id: MissionId | string, durationSeconds: number) => void;
  resetProgress: () => void;
}

export interface TimerSlice {
  elapsedSeconds: number;
  isRunning: boolean;
  tick: () => void;
  pause: () => void;
  resume: () => void;
  resetTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
}

export type QuantumStore = PhysicsSlice &
  MissionRunSlice &
  ProgressSlice &
  TimerSlice;

export const useQuantumStore = create<QuantumStore>()(
  persist(
    (set, get) => ({
      // --- PhysicsSlice ---
      ...INITIAL_PHYSICS,
      setAngles: (theta: number, phi: number) => {
        set({ theta, phi });
      },
      applyGate: (gate: string | GateMatrix | GateType) => {
        const { theta, phi } = get();
        // Construct single-qubit state: |psi> = cos(theta/2)|0> + e^(i phi) sin(theta/2)|1>
        const alpha = Math.cos(theta / 2);
        const betaMag = Math.sin(theta / 2);
        const betaRe = betaMag * Math.cos(phi);
        const betaIm = betaMag * Math.sin(phi);
        const stateVector: StateVector = [c(alpha, 0), c(betaRe, betaIm)];

        let gateMatrix: GateMatrix;
        let gateName = "GATE";
        if (typeof gate === "string") {
          gateName = gate;
          gateMatrix =
            (StandardGates as Record<string, GateMatrix>)[gate] ?? H;
        } else {
          gateMatrix = gate;
        }

        const nextState = applyGate(stateVector, gateMatrix);
        const nextAngles = stateToBlochAngles(nextState);
        set({ theta: nextAngles.theta, phi: nextAngles.phi });
        audioEngine.playGateSound(gateName);
      },
      setTemperature: (temperatureK: number) => {
        const coherenceTimeUs = calculateCoherenceTime(temperatureK);
        set({ temperatureK, coherenceTimeUs });
      },
      measure: () => {
        const { theta } = get();
        const p0 = Math.cos(theta / 2) ** 2;
        const outcome: 0 | 1 = Math.random() < p0 ? 0 : 1;
        if (outcome === 0) {
          set({ theta: 0, phi: 0, lastOutcome: 0 });
        } else {
          set({ theta: Math.PI, phi: 0, lastOutcome: 1 });
        }
        audioEngine.playMeasurementSound();
        return outcome;
      },

      // --- MissionRunSlice ---
      ...INITIAL_MISSION_RUN,
      startMission: (id: MissionId) => {
        set({
          ...INITIAL_PHYSICS,
          currentMissionId: id,
          activeMissionId: id,
          activeMission: id,
          activeStepIndex: 0,
          currentPhase: "BRIEFING",
          userPredictionProb0: null,
          appliedGates: [],
        });
      },
      selectMission: (id: MissionId) => {
        get().startMission(id);
      },
      setPrediction: (prob0: number) => {
        set({ userPredictionProb0: prob0 });
      },
      transitionPhase: (phase: MissionPhase) => {
        set({ currentPhase: phase });
      },
      transitionMissionPhase: (phase: MissionPhase) => {
        set({ currentPhase: phase });
      },
      applyGateToMission: (gate: string) => {
        set((state) => ({ appliedGates: [...state.appliedGates, gate] }));
        get().applyGate(gate);
      },
      evaluateMissionStep: (targetTheta?: number, targetPhi?: number): boolean => {
        set((state) => ({ activeStepIndex: state.activeStepIndex + 1 }));
        if (targetTheta !== undefined && targetPhi !== undefined) {
          const { theta, phi } = get();
          const thetaDiff = Math.abs(theta - targetTheta);
          const normPhiActual = ((phi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
          const normPhiTarget = ((targetPhi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
          const rawPhiDiff = Math.abs(normPhiActual - normPhiTarget);
          const phiDiff = Math.min(rawPhiDiff, 2 * Math.PI - rawPhiDiff);
          return thetaDiff <= 0.05 && phiDiff <= 0.05;
        }
        return true;
      },
      resetState: () => {
        set({
          ...INITIAL_PHYSICS,
          ...INITIAL_MISSION_RUN,
          completed: [],
          completedMissions: [],
          elapsedSeconds: 0,
        });
      },

      // --- ProgressSlice ---
      userId: getOrCreateUserId(),
      completedMissions: [],
      completed: [],
      missionTimes: emptyMissionTimes(),
      missionTime: {},
      progress: [0],
      metrics: DEFAULT_METRICS,
      completeMission: (id: MissionId | string) => {
        const canonical = toCanonicalMissionId(id);
        if (!canonical) return;
        const currentCompleted = get().completedMissions;
        if (!currentCompleted.includes(canonical)) {
          const updated = [...currentCompleted, canonical];
          set((state) => ({
            completedMissions: updated,
            completed: updated,
            progress: Array.from(new Set([...state.progress, updated.length])),
          }));
          audioEngine.playSuccessSound();
        }
      },
      recordMissionTime: (id: MissionId | string, durationSeconds: number) => {
        const canonical = toCanonicalMissionId(id);
        if (!canonical) return;
        set((state) => {
          const prevTime = state.missionTimes[canonical] || 0;
          const nextTimes = {
            ...state.missionTimes,
            [canonical]: prevTime + durationSeconds,
          };
          return {
            missionTimes: nextTimes,
            missionTime: nextTimes,
          };
        });
      },
      resetProgress: () => {
        set({
          completedMissions: [],
          completed: [],
          missionTimes: emptyMissionTimes(),
          missionTime: {},
          progress: [0],
        });
      },

      // --- TimerSlice ---
      elapsedSeconds: 0,
      isRunning: true,
      tick: () => {
        if (get().isRunning) {
          set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 }));
        }
      },
      pause: () => set({ isRunning: false }),
      resume: () => set({ isRunning: true }),
      resetTimer: () => set({ elapsedSeconds: 0 }),
      pauseTimer: () => set({ isRunning: false }),
      resumeTimer: () => set({ isRunning: true }),
      pauseSession: () => set({ isRunning: false }),
      resumeSession: () => set({ isRunning: true }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => {
        if (typeof window !== "undefined" && window.localStorage) {
          return window.localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      partialize: (state) => ({
        userId: state.userId,
        completedMissions: state.completedMissions,
        completed: state.completed,
        missionTimes: state.missionTimes,
        missionTime: state.missionTime,
        progress: state.progress,
        metrics: state.metrics,
      }),
    }
  )
);

// ============================================================================
// BACKWARD COMPATIBILITY ADAPTERS
// ============================================================================

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
  const userId = useQuantumStore((s) => s.userId);
  const activeMission = useQuantumStore(
    (s) => s.currentMissionId ?? "superposition"
  );
  const completed = useQuantumStore((s) => s.completedMissions);
  const missionTime = useQuantumStore((s) => s.missionTimes);
  const missionState = useQuantumStore((s) => s.missionState);
  const elapsedSeconds = useQuantumStore((s) => s.elapsedSeconds);
  const isRunning = useQuantumStore((s) => s.isRunning);
  const metrics = useQuantumStore((s) => s.metrics);
  const progress = useQuantumStore((s) => s.progress);

  const startMission = useQuantumStore((s) => s.startMission);
  const completeMissionStore = useQuantumStore((s) => s.completeMission);
  const recordMissionTimeStore = useQuantumStore((s) => s.recordMissionTime);
  const resetState = useQuantumStore((s) => s.resetState);
  const pause = useQuantumStore((s) => s.pause);
  const resume = useQuantumStore((s) => s.resume);

  const session: UserSession = useMemo(
    () => ({
      userId,
      activeMission: activeMission as MissionId,
      completed,
      missionTime,
      missionState,
      events: [],
      lastUpdated: 0,
      metrics,
      progress,
      activeTab: 0,
      elapsedSeconds,
      isRunning,
      version: SESSION_VERSION,
    }),
    [
      userId,
      activeMission,
      completed,
      missionTime,
      missionState,
      metrics,
      progress,
      elapsedSeconds,
      isRunning,
    ]
  );

  const setActiveMission = useCallback(
    (missionId: MissionId | null) => {
      if (missionId) startMission(missionId);
    },
    [startMission]
  );

  const completeMission = useCallback(
    (missionId: string) => {
      completeMissionStore(missionId);
    },
    [completeMissionStore]
  );

  const recordTime = useCallback(
    (_missionId: MissionId, _seconds: number) => {
      recordMissionTimeStore(_missionId, _seconds);
    },
    [recordMissionTimeStore]
  );

  const recordMissionTime = useCallback(
    (missionId: string, durationMs: number) => {
      recordMissionTimeStore(missionId, Math.round(durationMs / 1000));
    },
    [recordMissionTimeStore]
  );

  const updateMissionState = useCallback(
    (missionId: string, state: Record<string, unknown>) => {
      useQuantumStore.setState((prev) => ({
        missionState: {
          ...prev.missionState,
          [missionId]: {
            ...((prev.missionState[missionId] as Record<string, unknown>) || {}),
            ...state,
          },
        },
      }));
    },
    []
  );

  const isUnlocked = useCallback(
    (missionId: MissionId): boolean => {
      if (!isMissionId(missionId)) return false;
      const index = MISSION_ORDER.indexOf(missionId);
      if (index <= 0) return true;
      const prevMission = MISSION_ORDER[index - 1];
      return completed.includes(prevMission);
    },
    [completed]
  );

  return {
    session,
    isHydrated: true,
    storageWarning: null,
    setActiveMission,
    completeMission,
    recordTime,
    recordMissionTime,
    updateMissionState,
    resetSession: resetState,
    isUnlocked,
    elapsedSeconds,
    isRunning,
    pauseSession: pause,
    resumeSession: resume,
    incrementActionCount: () => {},
  };
}

export interface UseSessionTimerResult {
  elapsedSeconds: number;
  formattedTime: string;
  isRunning: boolean;
  pauseTimer: () => void;
  resumeTimer: () => void;
  recordAction: (actionType: string) => void;
}

export function useSessionTimer(): UseSessionTimerResult {
  const elapsedSeconds = useQuantumStore((s) => s.elapsedSeconds);
  const isRunning = useQuantumStore((s) => s.isRunning);
  const pause = useQuantumStore((s) => s.pause);
  const resume = useQuantumStore((s) => s.resume);

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
    pauseTimer: pause,
    resumeTimer: resume,
    recordAction: () => {},
  };
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const interval = setInterval(() => {
      useQuantumStore.getState().tick();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return <>{children}</>;
}

// Re-export Audio Engine and sound helpers from audioEngine.ts
export {
  QuantumAudioEngine,
  audioEngine,
  isAudioEnabled,
  setAudioEnabled,
  toggleAudio,
  __markUserInteracted,
  __resetAudioOverride,
  playNote,
  playChimeSuccess,
  playQuantumCollapse,
  playMeasurementCollapse,
  playGateForQubit,
  playDecoherenceAlert,
  playLaserScan,
  playButtonClick,
  playHover,
} from "@/lib/audio/audioEngine";

export function cn(..._inputs: ClassValue[]) {
  return twMerge(clsx(_inputs));
}

