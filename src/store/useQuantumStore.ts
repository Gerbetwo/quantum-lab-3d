import { create, StateCreator } from 'zustand';
import {
  canTransition,
  transitionPhase,
  verifyState,
} from '../features/missions/domain/missionMachine';
import {
  MissionPhase,
  MissionProgressState,
} from '../features/missions/types/mission';
import { applyGate } from '../core/math/statevector';

export interface QuantumState {
  // Parametric Qubit State
  theta: number;
  phi: number;
  temperatureK: number;
  coherenceTimeUs: number;
  entanglementDegree?: number;
  isEntangled?: boolean;

  // Measurement State
  lastOutcome: 0 | 1 | null;
  lastProbability: number | null;
  measurementCount: number;

  // Navigation & Gamification
  activeMissionId: number;
  completedMissions: boolean[];
  sessionTimeRemaining: number;

  // Mission FSM State
  missionState: MissionProgressState;

  // Actions
  setAngles: (theta: number, phi: number) => void;
  setTemperature: (tempK: number) => void;
  measureQubit: (rng?: () => number) => { outcome: 0 | 1; probability: number };
  completeMission: (missionId: number) => void;
  resetSession: () => void;

  // Mission FSM Actions
  setPrediction: (prob0: number) => void;
  transitionMissionPhase: (nextPhase: MissionPhase) => boolean;
  applyGateToMission: (gateType: string) => void;
  evaluateMissionStep: (targetTheta?: number, targetPhi?: number, tolerance?: number) => boolean;
}

export function calculateCoherenceTime(temperatureK: number): number {
  return Math.max(1, Math.round(250 * Math.exp(-temperatureK / 0.8)));
}

export function measureQubitState(
  theta: number,
  rng: () => number = Math.random
): { outcome: 0 | 1; probability: number } {
  const prob0 = Math.cos(theta / 2) ** 2;
  const outcome: 0 | 1 = rng() < prob0 ? 0 : 1;
  const probability = outcome === 0 ? prob0 : 1 - prob0;
  return { outcome, probability };
}

const initialMissionState: MissionProgressState = {
  currentMissionId: 'mission-1',
  activeStepIndex: 0,
  currentPhase: 'BRIEFING',
  userPredictionProb0: null,
  appliedGatesHistory: [],
  isVerified: false,
  errorState: null,
};

const storeCreator: StateCreator<QuantumState> = (set, get) => ({
  theta: Math.PI / 2,
  phi: 0,
  temperatureK: 0.015,
  coherenceTimeUs: calculateCoherenceTime(0.015),
  entanglementDegree: 0.0,
  isEntangled: false,

  lastOutcome: null,
  lastProbability: null,
  measurementCount: 0,

  activeMissionId: 0,
  completedMissions: [false, false, false, false],
  sessionTimeRemaining: 600,

  missionState: initialMissionState,

  setAngles: (theta: number, phi: number) => set({ theta, phi }),

  setTemperature: (temperatureK: number) => {
    const coherenceTimeUs = calculateCoherenceTime(temperatureK);
    set({ temperatureK, coherenceTimeUs });
  },

  measureQubit: (rng = Math.random) => {
    const { theta, measurementCount } = get();
    const result = measureQubitState(theta, rng);

    set({
      lastOutcome: result.outcome,
      lastProbability: result.probability,
      measurementCount: measurementCount + 1,
    });

    return result;
  },

  completeMission: (missionId: number) => {
    const completed = [...get().completedMissions];
    if (missionId >= 0 && missionId < completed.length) {
      completed[missionId] = true;
      set({ completedMissions: completed });
    }
  },

  resetSession: () =>
    set({
      theta: Math.PI / 2,
      phi: 0,
      temperatureK: 0.015,
      coherenceTimeUs: calculateCoherenceTime(0.015),
      entanglementDegree: 0.0,
      isEntangled: false,
      lastOutcome: null,
      lastProbability: null,
      measurementCount: 0,
      missionState: initialMissionState,
    }),

  setPrediction: (prob0: number) => {
    const currentState = get().missionState;
    set({
      missionState: {
        ...currentState,
        userPredictionProb0: prob0,
      },
    });
  },

  transitionMissionPhase: (nextPhase: MissionPhase): boolean => {
    const { missionState } = get();
    if (!canTransition(missionState, nextPhase)) {
      set({
        missionState: {
          ...missionState,
          errorState: `Cannot transition from ${missionState.currentPhase} to ${nextPhase}`,
        },
      });
      return false;
    }

    try {
      const updatedState = transitionPhase(missionState, nextPhase);
      set({ missionState: updatedState });
      return true;
    } catch (error) {
      set({
        missionState: {
          ...missionState,
          errorState: (error as Error).message,
        },
      });
      return false;
    }
  },

  applyGateToMission: (gateType: string) => {
    const { theta, phi, missionState } = get();
    const newAngles = applyGate(theta, phi, gateType);

    set({
      theta: newAngles.theta,
      phi: newAngles.phi,
      missionState: {
        ...missionState,
        appliedGatesHistory: [...missionState.appliedGatesHistory, gateType],
      },
    });
  },

  evaluateMissionStep: (
    targetTheta: number = 0,
    targetPhi: number = 0,
    tolerance: number = 0.05
  ): boolean => {
    const { theta, phi, missionState } = get();
    const isVerified = verifyState(theta, phi, targetTheta, targetPhi, tolerance);

    set({
      missionState: {
        ...missionState,
        isVerified,
      },
    });

    return isVerified;
  },
});

export const useQuantumStore = create<QuantumState>(storeCreator);
