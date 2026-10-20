import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import Cookies from "js-cookie";
import { calculateT2CoherenceTime, kelvinToMilliKelvin } from "@/core/decoherenceMath";
import { soundEngine, setAudioEnabled, isAudioEnabled } from "@/lib/soundEngine";
import { type MissionId, getMissionById, getMissionIndex, TOTAL_MISSIONS } from "@/features/missions/missionRegistry";

export type AppViewState = "TITLE" | "CAMPAIGN_SELECT" | "SANDBOX" | "IN_MISSION";
export type Language = 'en' | 'es';
export type Theme = 'dark' | 'light';

export interface QuantumStore {
  theme: Theme;
  language: Language;
  appViewState: AppViewState;
  isPauseMenuOpen: boolean;

  // Physics State
  theta: number;
  phi: number;
  temperatureK: number;
  coherenceTimeUs: number;
  isEntangled: boolean;
  lastOutcome: 0 | 1 | null;

  // Navigation & Progress
  currentMissionId: MissionId;
  completedMissions: number[];
  isSandboxUnlocked: boolean;
  userPredictionProb0: number | null;

  // Algorithm State (Missions 4-6)
  groverStep: number;
  groverTargetIndex: number;
  shorBase: number;
  qecInjectedError: number | null;
  isSoundEnabled: boolean;

  // Actions
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setLanguage: (lang: Language) => void;
  setAppViewState: (view: AppViewState) => void;
  togglePauseMenu: () => void;
  returnToTitle: () => void;
  selectMission: (id: MissionId | number) => void;

  setGroverStep: (step: number | ((prev: number) => number)) => void;
  setGroverTargetIndex: (idx: number) => void;
  setShorBase: (base: number) => void;
  setQecInjectedError: (err: number | null) => void;
  toggleSound: () => boolean;
  setSoundEnabled: (enabled: boolean) => void;

  setAngles: (theta: number, phi: number) => void;
  setTheta: (theta: number) => void;
  setPhi: (phi: number) => void;
  setTemperature: (tempK: number) => void;
  setTemperatureK: (tempK: number) => void;
  setEntangled: (entangled: boolean) => void;
  setLastOutcome: (outcome: 0 | 1 | null) => void;
  applyGate: (gate: string) => void;
  measure: () => 0 | 1;
  setUserPrediction: (prob0: number | null) => void;
  setPrediction: (prob0: number | null) => void;
  markMissionCompleted: (id: number | MissionId) => void;
  completeMission: (id: number | MissionId) => void;
  recordMissionTime: (id?: number | MissionId, time?: number) => void;
  jumpToMission: (id: MissionId | number) => void;
  startMission: (id: MissionId | number) => void;
  launchMission: (id: MissionId | number) => void;
  setSandboxUnlocked: (unlocked: boolean) => void;
  unlockSandbox: () => void;
  resetProgress: () => void;
  resetState: () => void;
}

const COOKIE_COMPLETED = "quantum_completed_missions";
const COOKIE_SANDBOX = "quantum_sandbox_unlocked";
const COOKIE_LANGUAGE = "quantum_language";
const STORAGE_THEME = "quantum_theme";

export function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  try {
    const saved = localStorage.getItem(STORAGE_THEME);
    if (saved === "dark" || saved === "light") return saved;
    return "dark";
  } catch (_e) {
    return "dark";
  }
}

export function syncDocumentTheme(theme: Theme) {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_THEME, theme);
    } catch (_e) { /* Safe */ }
  }
  if (typeof document !== "undefined" && document.documentElement) {
    try {
      const root = document.documentElement.classList;
      if (theme === "dark") {
        root.add("dark", "theme-dark");
        root.remove("theme-light");
      } else {
        root.remove("dark", "theme-dark");
        root.add("theme-light");
      }
    } catch (_e) { /* Safe */ }
  }
}

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
  theta: 0,
  phi: 0,
  temperatureK: 0.015,
  coherenceTimeUs: calculateT2CoherenceTime(15),
  isEntangled: false,
  lastOutcome: null as 0 | 1 | null,
};

const init = getInitialPersisted();
const initialTheme = getInitialTheme();

export function checkMissionObjectiveCompletion(state: QuantumStore): boolean {
  switch (state.currentMissionId) {
    case 'superposition':
      return Math.abs(state.theta - Math.PI / 2) < 0.1 || state.lastOutcome !== null;
    case 'entanglement':
      return state.isEntangled && state.lastOutcome !== null;
    case 'decoherence':
      return state.temperatureK >= 100;
    case 'gates':
      return Math.abs(state.theta - Math.PI / 2) < 0.1 || Math.abs(state.theta - Math.PI) < 0.1;
    case 'grover':
      return state.groverStep >= 2;
    case 'applications':
      return state.shorBase === 7 || state.shorBase === 13;
    case 'error-correction':
      return state.qecInjectedError === null;
    default:
      return false;
  }
}

export const useQuantumStore = create<QuantumStore>()(
  persist(
    (set, get) => {
      const checkAndMarkObjective = () => {
        const state = get();
        if (checkMissionObjectiveCompletion(state)) {
          get().markMissionCompleted(state.currentMissionId);
        }
      };

      return {
        theme: initialTheme,
        language: init.language,
        appViewState: "TITLE",
      isPauseMenuOpen: false,
      ...INITIAL_PHYSICS,
      currentMissionId: "superposition",
      completedMissions: init.completedMissions,
      isSandboxUnlocked: init.isSandboxUnlocked,
      userPredictionProb0: null,

      groverStep: 0,
      groverTargetIndex: 2,
      shorBase: 7,
      qecInjectedError: null,
      isSoundEnabled: isAudioEnabled(),

      setTheme: (theme: Theme) => {
        set({ theme });
        syncDocumentTheme(theme);
      },
      toggleTheme: () => {
        const next = get().theme === "dark" ? "light" : "dark";
        set({ theme: next });
        syncDocumentTheme(next);
      },

      setLanguage: (language: Language) => {
        set({ language });
        syncCookies(get().completedMissions, get().isSandboxUnlocked, language);
      },
      setAppViewState: (appViewState) => set({ appViewState }),
      togglePauseMenu: () => set((s) => ({ isPauseMenuOpen: !s.isPauseMenuOpen })),
      returnToTitle: () => set({ appViewState: "TITLE", isPauseMenuOpen: false }),

      selectMission: (id) => {
        const config = getMissionById(id) ?? getMissionById(0)!;
        const tempK = config.initialTemperatureK;
        set({
          currentMissionId: config.id,
          theta: config.initialTheta,
          phi: config.initialPhi,
          temperatureK: tempK,
          coherenceTimeUs: calculateT2CoherenceTime(kelvinToMilliKelvin(tempK)),
          isEntangled: config.id === "entanglement",
          lastOutcome: null,
          userPredictionProb0: null,
          groverStep: 0,
          groverTargetIndex: 2,
          shorBase: 7,
          qecInjectedError: null,
          appViewState: "IN_MISSION",
          isPauseMenuOpen: false,
        });
      },

      setGroverStep: (step) => {
        set((s) => ({
          groverStep: typeof step === 'function' ? step(s.groverStep) : step,
        }));
        checkAndMarkObjective();
      },
      setGroverTargetIndex: (groverTargetIndex) => set({ groverTargetIndex }),
      setShorBase: (shorBase) => {
        set({ shorBase });
        checkAndMarkObjective();
      },
      setQecInjectedError: (qecInjectedError) => {
        set({ qecInjectedError });
        checkAndMarkObjective();
      },

      toggleSound: () => {
        const next = !get().isSoundEnabled;
        setAudioEnabled(next);
        set({ isSoundEnabled: next });
        return next;
      },
      setSoundEnabled: (enabled: boolean) => {
        setAudioEnabled(enabled);
        set({ isSoundEnabled: enabled });
      },

      setAngles: (theta, phi) => {
        set({ theta, phi });
        checkAndMarkObjective();
      },
      setTheta: (theta) => {
        set({ theta });
        checkAndMarkObjective();
      },
      setPhi: (phi) => set({ phi }),
      setTemperature: (temperatureK) => {
        set({ temperatureK, coherenceTimeUs: calculateT2CoherenceTime(kelvinToMilliKelvin(temperatureK)) });
        checkAndMarkObjective();
      },
      setTemperatureK: (tempK) => get().setTemperature(tempK),
      setEntangled: (isEntangled) => {
        set({ isEntangled });
        checkAndMarkObjective();
      },
      setLastOutcome: (lastOutcome) => set({ lastOutcome }),

      applyGate: (gate) => {
        const { theta, phi } = get();
        let nextTheta = theta;
        let nextPhi = phi;
        switch (gate) {
          case "X":
            nextTheta = Math.PI - theta;
            break;
          case "Y":
            nextTheta = Math.PI - theta;
            nextPhi = (phi + Math.PI / 2) % (2 * Math.PI);
            break;
          case "Z":
            nextPhi = (phi + Math.PI) % (2 * Math.PI);
            break;
          case "H":
            nextTheta = Math.abs(theta - Math.PI / 2) < 0.1 ? 0 : Math.PI / 2;
            break;
          case "S":
            nextPhi = (phi + Math.PI / 2) % (2 * Math.PI);
            break;
          case "T":
            nextPhi = (phi + Math.PI / 4) % (2 * Math.PI);
            break;
        }
        set({ theta: nextTheta, phi: nextPhi });
        soundEngine.playGateSound(gate);
        checkAndMarkObjective();
      },

      measure: () => {
        const { theta } = get();
        const p0 = Math.cos(theta / 2) ** 2;
        const outcome: 0 | 1 = Math.random() < p0 ? 0 : 1;
        set({ theta: outcome === 0 ? 0 : Math.PI, phi: 0, lastOutcome: outcome });
        soundEngine.playMeasurementSound();
        checkAndMarkObjective();
        return outcome;
      },

      setUserPrediction: (prob0) => set({ userPredictionProb0: prob0 }),
      setPrediction: (prob0) => get().setUserPrediction(prob0),

      markMissionCompleted: (id) => {
        const idx = typeof id === "number" ? id : getMissionIndex(id);
        if (idx < 0) return;
        const current = get().completedMissions;
        if (!current.includes(idx)) {
          const updated = Array.from(new Set([...current, idx])).sort((a, b) => a - b);
          const unlocked = updated.length >= TOTAL_MISSIONS || get().isSandboxUnlocked;
          set({ completedMissions: updated, isSandboxUnlocked: unlocked });
          syncCookies(updated, unlocked);
          soundEngine.playSuccessSound();
        }
      },
      completeMission: (id) => get().markMissionCompleted(id),
      recordMissionTime: () => {},

      jumpToMission: (id) => get().selectMission(id),
      startMission: (id) => get().selectMission(id),
      launchMission: (id) => get().selectMission(id),

      setSandboxUnlocked: (isSandboxUnlocked) => {
        set({ isSandboxUnlocked });
        syncCookies(get().completedMissions, isSandboxUnlocked);
      },
      unlockSandbox: () => get().setSandboxUnlocked(true),

      resetProgress: () => {
        if (typeof window !== "undefined") {
          try {
            Cookies.remove(COOKIE_COMPLETED);
            Cookies.remove(COOKIE_SANDBOX);
          } catch (_e) { /* Safe */ }
        }
        set({ completedMissions: [], isSandboxUnlocked: false });
      },

      resetState: () =>
        set({
          ...INITIAL_PHYSICS,
          userPredictionProb0: null,
          groverStep: 0,
          groverTargetIndex: 2,
          shorBase: 7,
          qecInjectedError: null,
        }),
      };
    },
    {
      name: "quantum_lab_session_v3",
      storage: createJSONStorage(() => (typeof window !== "undefined" && window.localStorage ? window.localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      })),
      partialize: (s) => ({
        completedMissions: s.completedMissions,
        isSandboxUnlocked: s.isSandboxUnlocked,
        language: s.language,
        theme: s.theme,
      }),
    }
  )
);
