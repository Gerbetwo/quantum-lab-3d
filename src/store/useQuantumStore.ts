import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import Cookies from "js-cookie";
import { calculateT2CoherenceTime, kelvinToMilliKelvin } from "@/core/decoherenceMath";
import { soundEngine } from "@/lib/soundEngine";
import { type MissionId, getMissionById, getMissionIndex, TOTAL_MISSIONS } from "@/features/missions/missionRegistry";

export type MissionPhase =
  | "BRIEFING" | "PREDICTION" | "EXPERIMENT" | "OBSERVATION" | "ANALYSIS"
  | "COMPLETED" | "MANIPULATION" | "MEASUREMENT" | "VERIFICATION" | "SUCCESS";

export interface QuantumStore {
  theta: number; phi: number; temperatureK: number; coherenceTimeUs: number;
  entanglementDegree: number; isEntangled: boolean; lastOutcome: 0 | 1 | null;
  currentMissionId: MissionId; activeMissionId: MissionId; activeMission: MissionId;
  activeStepIndex: number; currentPhase: MissionPhase; userPredictionProb0: number | null;
  appliedGates: string[]; missionState: Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  completedMissions: number[] & any; completed: any; progress: number[];
  isSandboxUnlocked: boolean;
  elapsedSeconds: number; isRunning: boolean;

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

function syncCookies(completed: number[], isSandboxUnlocked: boolean) {
  if (typeof window === "undefined") return;
  try {
    Cookies.set(COOKIE_COMPLETED, JSON.stringify(completed), { expires: 365 });
    Cookies.set(COOKIE_SANDBOX, String(isSandboxUnlocked), { expires: 365 });
  } catch (_e) { /* Safe */ }
}

function getInitialPersisted(): { completedMissions: number[]; isSandboxUnlocked: boolean } {
  if (typeof window === "undefined") return { completedMissions: [], isSandboxUnlocked: false };
  try {
    const c = Cookies.get(COOKIE_COMPLETED);
    const s = Cookies.get(COOKIE_SANDBOX);
    const completedMissions: number[] = c ? JSON.parse(c) : [];
    return { completedMissions, isSandboxUnlocked: s === "true" || completedMissions.length >= TOTAL_MISSIONS };
  } catch (_e) {
    return { completedMissions: [], isSandboxUnlocked: false };
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
      ...INITIAL_PHYSICS,
      currentMissionId: "superposition", activeMissionId: "superposition", activeMission: "superposition",
      activeStepIndex: 0, currentPhase: "BRIEFING", userPredictionProb0: null, appliedGates: [], missionState: {},
      completedMissions: init.completedMissions, completed: init.completedMissions,
      progress: init.completedMissions.length ? [init.completedMissions.length] : [0],
      isSandboxUnlocked: init.isSandboxUnlocked, elapsedSeconds: 0, isRunning: true,

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
      }),
    }
  )
);
