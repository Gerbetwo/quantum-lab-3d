import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import Cookies from "js-cookie";
import { calculateT2CoherenceTime, kelvinToMilliKelvin } from "@/core/decoherenceMath";
import { soundEngine, setAudioEnabled, isAudioEnabled } from "@/lib/soundEngine";
import { type MissionId, getMissionById, getMissionIndex, TOTAL_MISSIONS } from "@/features/missions/missionRegistry";

export type AppViewState = "TITLE" | "CAMPAIGN_SELECT" | "SANDBOX" | "IN_MISSION";

export type MissionPhase =
  | "BRIEFING" | "PREDICTION" | "EXPERIMENT" | "OBSERVATION" | "ANALYSIS"
  | "COMPLETED" | "MANIPULATION" | "MEASUREMENT" | "VERIFICATION" | "SUCCESS";

export type Language = 'en' | 'es';

export interface QuantumStore {
  language: Language;
  appViewState: AppViewState;
  isPauseMenuOpen: boolean;
  theta: number; phi: number; temperatureK: number; coherenceTimeUs: number;
  entanglementDegree: number; isEntangled: boolean; lastOutcome: 0 | 1 | null;
  currentMissionId: MissionId; activeMissionId: MissionId; activeMission: MissionId;
  activeStepIndex: number; currentPhase: MissionPhase; userPredictionProb0: number | null;
  appliedGates: string[]; missionState: Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  completedMissions: number[] & any; completed: any; progress: number[];
  isSandboxUnlocked: boolean;
  elapsedSeconds: number; isRunning: boolean;

  // Algorithm state (Missions 4–6)
  groverStep: number;
  groverTargetIndex: number;
  shorBase: number;
  qecInjectedError: number | null;

  // Audio system state
  isSoundEnabled: boolean;
  soundEnabled: boolean;

  setLanguage: (lang: Language) => void;
  setAppViewState: (view: AppViewState) => void;
  togglePauseMenu: () => void;
  returnToTitle: () => void;
  launchMission: (id: MissionId | number | string) => void;

  setGroverStep: (step: number | ((prev: number) => number)) => void;
  setGroverTargetIndex: (targetIndex: number) => void;
  setShorBase: (shorBase: number) => void;
  setQecInjectedError: (qecInjectedError: number | null) => void;
  toggleSound: () => boolean;
  setSoundEnabled: (enabled: boolean) => void;

  setAngles: (theta: number, phi: number) => void;
  setTheta: (theta: number) => void;
  setPhi: (phi: number) => void;
  setTemperature: (temperatureK: number) => void;
  setTemperatureK: (temperatureK: number) => void;
  setEntangled: (isEntangled: boolean) => void;
  setLastOutcome: (outcome: 0 | 1 | null) => void;
  applyGate: (gate: string) => void;
  applyGateToMission: (gate: string) => void;
  measure: () => 0 | 1;
  setPrediction: (prob0: number) => void;
  setUserPrediction: (prob0: number) => void;
  transitionPhase: (phase: MissionPhase) => void;
  transitionMissionPhase: (phase: MissionPhase) => void;
  evaluateMissionStep: (targetTheta?: number, targetPhi?: number) => boolean;
  markMissionCompleted: (id: number | MissionId | string) => void;
  completeMission: (id: number | MissionId | string) => void;
  setSandboxUnlocked: (unlocked: boolean) => void;
  unlockSandbox: () => void;
  resetProgress: () => void;
  recordMissionTime: (id: MissionId | string, durationSeconds: number) => void;
  jumpToMission: (id: MissionId | number) => void;
  startMission: (id: MissionId | number) => void;
  selectMission: (id: MissionId | number) => void;
  resetState: () => void;
  tick: () => void;
  pause: () => void;
  resume: () => void;
  resetTimer: () => void;
}

const COOKIE_COMPLETED = "quantum_completed_missions";
const COOKIE_SANDBOX = "quantum_sandbox_unlocked";
const COOKIE_LANGUAGE = "quantum_language";

function syncCookies(completed: number[], isSandboxUnlocked: boolean, language?: Language) {
  if (typeof window === "undefined") return;
  try {
    Cookies.set(COOKIE_COMPLETED, JSON.stringify(completed), { expires: 365 });
    Cookies.set(COOKIE_SANDBOX, String(isSandboxUnlocked), { expires: 365 });
    if (language) {
      Cookies.set(COOKIE_LANGUAGE, language, { expires: 365 });
    }
  } catch (_e) { /* Safe */ }
}

function getInitialPersisted(): { completedMissions: number[]; isSandboxUnlocked: boolean; language: Language } {
  if (typeof window === "undefined") return { completedMissions: [], isSandboxUnlocked: false, language: "es" };
  try {
    const c = Cookies.get(COOKIE_COMPLETED);
    const s = Cookies.get(COOKIE_SANDBOX);
    const l = Cookies.get(COOKIE_LANGUAGE) as Language | undefined;
    const completedMissions: number[] = c ? JSON.parse(c) : [];
    const language: Language = l === 'en' || l === 'es' ? l : 'es';
    return {
      completedMissions,
      isSandboxUnlocked: s === "true" || completedMissions.length >= TOTAL_MISSIONS,
      language,
    };
  } catch (_e) {
    return { completedMissions: [], isSandboxUnlocked: false, language: "es" };
  }
}

const INITIAL_PHYSICS = {
  theta: 0, phi: 0, temperatureK: 0.015, coherenceTimeUs: calculateT2CoherenceTime(15),
  entanglementDegree: 0, isEntangled: false, lastOutcome: null as 0 | 1 | null,
};
const init = getInitialPersisted();

export const useQuantumStore = create<QuantumStore>()(
  persist(
    (set, get) => ({
      language: init.language,
      appViewState: "TITLE",
      isPauseMenuOpen: false,
      ...INITIAL_PHYSICS,
      currentMissionId: "superposition", activeMissionId: "superposition", activeMission: "superposition",
      activeStepIndex: 0, currentPhase: "BRIEFING", userPredictionProb0: null, appliedGates: [], missionState: {},
      completedMissions: init.completedMissions, completed: init.completedMissions,
      progress: init.completedMissions.length ? [init.completedMissions.length] : [0],
      isSandboxUnlocked: init.isSandboxUnlocked, elapsedSeconds: 0, isRunning: true,
      groverStep: 0,
      groverTargetIndex: 2,
      shorBase: 7,
      qecInjectedError: null,
      isSoundEnabled: isAudioEnabled(),
      soundEnabled: isAudioEnabled(),

      setLanguage: (language: Language) => {
        set({ language });
        syncCookies(get().completedMissions, get().isSandboxUnlocked, language);
      },
      setAppViewState: (appViewState) => set({ appViewState }),
      togglePauseMenu: () => set((s) => ({ isPauseMenuOpen: !s.isPauseMenuOpen })),
      returnToTitle: () => set({ appViewState: "TITLE", isPauseMenuOpen: false }),
      launchMission: (id) => {
        get().jumpToMission(id as MissionId | number);
        set({ appViewState: "IN_MISSION", isPauseMenuOpen: false });
      },

      setGroverStep: (step) =>
        set((s) => ({
          groverStep: typeof step === 'function' ? step(s.groverStep) : step,
        })),
      setGroverTargetIndex: (groverTargetIndex) => set({ groverTargetIndex }),
      setShorBase: (shorBase) => set({ shorBase }),
      setQecInjectedError: (qecInjectedError) => set({ qecInjectedError }),

      toggleSound: () => {
        const next = !get().isSoundEnabled;
        setAudioEnabled(next);
        set({ isSoundEnabled: next, soundEnabled: next });
        return next;
      },
      setSoundEnabled: (enabled: boolean) => {
        setAudioEnabled(enabled);
        set({ isSoundEnabled: enabled, soundEnabled: enabled });
      },

      setAngles: (theta, phi) => set({ theta, phi }),
      setTheta: (theta) => set({ theta }),
      setPhi: (phi) => set({ phi }),
      setTemperature: (temperatureK) =>
        set({ temperatureK, coherenceTimeUs: calculateT2CoherenceTime(kelvinToMilliKelvin(temperatureK)) }),
      setTemperatureK: (temperatureK) => get().setTemperature(temperatureK),
      setEntangled: (isEntangled) => set({ isEntangled, entanglementDegree: isEntangled ? 1 : 0 }),
      setLastOutcome: (lastOutcome) => set({ lastOutcome }),

      applyGate: (gate) => {
        const { theta, phi } = get();
        let nextTheta = theta;
        let nextPhi = phi;
        if (gate === "X") nextTheta = Math.PI - theta;
        else if (gate === "Z") nextPhi = (phi + Math.PI) % (2 * Math.PI);
        else if (gate === "H") nextTheta = Math.abs(theta - Math.PI / 2) < 0.1 ? 0 : Math.PI / 2;
        set({ theta: nextTheta, phi: nextPhi });
        soundEngine.playGateSound(gate);
      },

      applyGateToMission: (gate) => {
        set((s) => ({ appliedGates: [...s.appliedGates, gate] }));
        get().applyGate(gate);
      },

      measure: () => {
        const { theta } = get();
        const p0 = Math.cos(theta / 2) ** 2;
        const outcome: 0 | 1 = Math.random() < p0 ? 0 : 1;
        set({ theta: outcome === 0 ? 0 : Math.PI, phi: 0, lastOutcome: outcome });
        soundEngine.playMeasurementSound();
        return outcome;
      },

      setPrediction: (prob0) => set({ userPredictionProb0: prob0 }),
      setUserPrediction: (prob0) => set({ userPredictionProb0: prob0 }),
      transitionPhase: (phase) => set({ currentPhase: phase }),
      transitionMissionPhase: (phase) => set({ currentPhase: phase }),

      evaluateMissionStep: (targetTheta, targetPhi) => {
        set((s) => ({ activeStepIndex: s.activeStepIndex + 1 }));
        if (targetTheta !== undefined && targetPhi !== undefined) {
          const { theta, phi } = get();
          return Math.abs(theta - targetTheta) <= 0.08 && Math.abs(phi - targetPhi) <= 0.08;
        }
        return true;
      },

      markMissionCompleted: (id) => {
        const idx = typeof id === "number" ? id : getMissionIndex(id);
        if (idx < 0) return;
        const current = get().completedMissions;
        if (!current.includes(idx)) {
          const updated = Array.from(new Set([...current, idx])).sort((a, b) => a - b);
          const unlocked = updated.length >= TOTAL_MISSIONS || get().isSandboxUnlocked;
          set({ completedMissions: updated, completed: updated, progress: updated, isSandboxUnlocked: unlocked });
          syncCookies(updated, unlocked);
          soundEngine.playSuccessSound();
        }
      },

      completeMission: (id) => get().markMissionCompleted(id),
      setSandboxUnlocked: (unlocked) => {
        set({ isSandboxUnlocked: unlocked });
        syncCookies(get().completedMissions, unlocked);
      },
      unlockSandbox: () => get().setSandboxUnlocked(true),

      resetProgress: () => {
        if (typeof window !== "undefined") {
          try {
            Cookies.remove(COOKIE_COMPLETED);
            Cookies.remove(COOKIE_SANDBOX);
          } catch (_e) { /* Safe */ }
        }
        set({ completedMissions: [], completed: [], progress: [0], isSandboxUnlocked: false });
      },

      recordMissionTime: () => {},

      jumpToMission: (id) => {
        const config = getMissionById(id) ?? getMissionById(0)!;
        const tempK = config.initialTemperatureK;
        set({
          currentMissionId: config.id, activeMissionId: config.id, activeMission: config.id,
          theta: config.initialTheta, phi: config.initialPhi, temperatureK: tempK,
          coherenceTimeUs: calculateT2CoherenceTime(kelvinToMilliKelvin(tempK)),
          isEntangled: config.id === "entanglement", entanglementDegree: config.id === "entanglement" ? 1 : 0,
          lastOutcome: null, userPredictionProb0: null, currentPhase: "BRIEFING", activeStepIndex: 0, appliedGates: [],
          groverStep: 0, groverTargetIndex: 2, shorBase: 7, qecInjectedError: null,
        });
      },

      startMission: (id) => get().jumpToMission(id),
      selectMission: (id) => get().jumpToMission(id),

      resetState: () =>
        set({
          ...INITIAL_PHYSICS,
          userPredictionProb0: null,
          currentPhase: "BRIEFING",
          activeStepIndex: 0,
          appliedGates: [],
          groverStep: 0,
          groverTargetIndex: 2,
          shorBase: 7,
          qecInjectedError: null,
        }),

      tick: () => {
        if (get().isRunning) set((s) => ({ elapsedSeconds: s.elapsedSeconds + 1 }));
      },
      pause: () => set({ isRunning: false }),
      resume: () => set({ isRunning: true }),
      resetTimer: () => set({ elapsedSeconds: 0 }),
    }),
    {
      name: "quantum_lab_session_v2",
      storage: createJSONStorage(() => (typeof window !== "undefined" && window.localStorage ? window.localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      })),
      partialize: (s) => ({
        completedMissions: s.completedMissions,
        completed: s.completed,
        progress: s.progress,
        isSandboxUnlocked: s.isSandboxUnlocked,
        language: s.language,
      }),
    }
  )
);
