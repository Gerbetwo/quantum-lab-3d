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
import { audioEngine } from '../shared/lib/sound';

export interface QuantumState {
  // Parametric Qubit State
  theta: number;
  phi: number;
  temperatureK: number;
  coherenceTimeUs: number;
  isCollapsed: boolean;
  prediction: number | null;
  measuredOutcome: 0 | 1 | null;
  entanglementDegree?: number;
  isEntangled?: boolean;

  // Measurement State
  lastOutcome: 0 | 1 | null;
  lastProbability: number | null;
  measurementCount: number;

  // Navigation & Gamification
  activeMission: number;
  activeMissionId: number;
  completedMissions: boolean[];
  sessionTimeRemaining: number;

  // Mission FSM State
  missionState: MissionProgressState;

  // Actions
  setAngles: (theta: number, phi: number) => void;
  setTemperature: (tempMilliKelvin: number) => void;
  selectMission: (missionId: number) => void;
  resetState: () => void;
  measureQubit: (rng?: () => number) => { outcome: 0 | 1; probability: number };
  completeMission: (missionId: number) => void;
  resetSession: () => void;

  // Mission FSM Actions
  setPrediction: (prob0: number) => void;
  transitionMissionPhase: (nextPhase: MissionPhase) => boolean;
  applyGateToMission: (gateType: string) => void;
  evaluateMissionStep: (targetTheta?: number, targetPhi?: number, tolerance?: number) => boolean;
}

export function calculateCoherenceTime(tempMilliKelvin: number): number {
  return 250 * Math.exp(-tempMilliKelvin / 800);
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
  theta: 0,
  phi: 0,
  temperatureK: 15 / 1000,
  coherenceTimeUs: calculateCoherenceTime(15),
  isCollapsed: false,
  prediction: null,
  measuredOutcome: null,
  entanglementDegree: 0.0,
  isEntangled: false,

  lastOutcome: null,
  lastProbability: null,
  measurementCount: 0,

  activeMission: 0,
  activeMissionId: 0,
  completedMissions: [false, false, false, false],
  sessionTimeRemaining: 600,

  missionState: initialMissionState,

  setAngles: (theta: number, phi: number) => {
    const clampedTheta = Math.min(Math.PI, Math.max(0, theta));
    const twoPi = 2 * Math.PI;
    const normalizedPhi = ((phi % twoPi) + twoPi) % twoPi;
    set({
      theta: clampedTheta,
      phi: normalizedPhi,
      isCollapsed: false,
    });
  },

  setTemperature: (tempMilliKelvin: number) => {
    const clampedMilliKelvin = Math.min(300000, Math.max(15, tempMilliKelvin));
    const coherenceTimeUs = calculateCoherenceTime(clampedMilliKelvin);
    set({
      temperatureK: clampedMilliKelvin / 1000,
      coherenceTimeUs,
    });
  },

  selectMission: (missionId: number) => {
    let missionPhysicalOverrides: Partial<QuantumState> = {};

    if (missionId === 0 || missionId === 1) {
      missionPhysicalOverrides = {
        theta: 0,
        phi: 0,
        isCollapsed: false,
        prediction: null,
        measuredOutcome: null,
      };
    } else if (missionId === 2) {
      missionPhysicalOverrides = {
        isEntangled: true,
        entanglementDegree: 1.0,
        theta: Math.PI / 2,
        phi: 0,
        isCollapsed: false,
        prediction: null,
        measuredOutcome: null,
      };
    } else if (missionId === 3) {
      missionPhysicalOverrides = {
        theta: Math.PI / 2,
        temperatureK: 15 / 1000,
        coherenceTimeUs: calculateCoherenceTime(15),
        isCollapsed: false,
        prediction: null,
        measuredOutcome: null,
      };
    } else if (missionId >= 4 && missionId <= 6) {
      missionPhysicalOverrides = {
        isCollapsed: false,
        prediction: null,
        measuredOutcome: null,
      };
    }

    const currentMissionState = get().missionState;
    set({
      activeMission: missionId,
      activeMissionId: missionId,
      ...missionPhysicalOverrides,
      missionState: {
        ...currentMissionState,
        activeStepIndex: 0,
      },
    });
  },

  resetState: () => {
    set({
      theta: 0,
      phi: 0,
      temperatureK: 15 / 1000,
      coherenceTimeUs: calculateCoherenceTime(15),
      isCollapsed: false,
      prediction: null,
      measuredOutcome: null,
    });
  },

  measureQubit: (rng: () => number = Math.random) => {
    audioEngine.playMeasurementSound();
    const { theta, measurementCount } = get();
    const result = measureQubitState(theta, rng);

    set({
      isCollapsed: true,
      measuredOutcome: result.outcome,
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
      theta: 0,
      phi: 0,
      temperatureK: 15 / 1000,
      coherenceTimeUs: calculateCoherenceTime(15),
      isCollapsed: false,
      prediction: null,
      measuredOutcome: null,
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
      prediction: prob0,
      missionState: {
        ...currentState,
        userPredictionProb0: prob0,
      },
    });
  },

  transitionMissionPhase: (nextPhase: MissionPhase): boolean => {
    const { missionState } = get();
    if (!canTransition(missionState, nextPhase)) {
      audioEngine.playErrorSound();
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
      if (nextPhase === 'SUCCESS') {
        audioEngine.playSuccessSound();
      }
      return true;
    } catch (error) {
      audioEngine.playErrorSound();
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
    audioEngine.playGateSound(gateType);
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