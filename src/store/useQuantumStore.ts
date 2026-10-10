import { create, StateCreator } from 'zustand';

export interface QuantumState {
  // Parametric Qubit State
  theta: number;
  phi: number;
  temperatureK: number;
  coherenceTimeUs: number;

  // Measurement State
  lastOutcome: 0 | 1 | null;
  lastProbability: number | null;
  measurementCount: number;

  // Navigation & Gamification
  activeMissionId: number;
  completedMissions: boolean[];
  sessionTimeRemaining: number;

  // Actions
  setAngles: (theta: number, phi: number) => void;
  setTemperature: (tempK: number) => void;
  measureQubit: (rng?: () => number) => { outcome: 0 | 1; probability: number };
  completeMission: (missionId: number) => void;
  resetSession: () => void;
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

const storeCreator: StateCreator<QuantumState> = (set, get) => ({
  theta: Math.PI / 2,
  phi: 0,
  temperatureK: 0.015,
  coherenceTimeUs: calculateCoherenceTime(0.015),

  lastOutcome: null,
  lastProbability: null,
  measurementCount: 0,

  activeMissionId: 0,
  completedMissions: [false, false, false, false],
  sessionTimeRemaining: 600,

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
      lastOutcome: null,
      lastProbability: null,
      measurementCount: 0,
    }),
});

export const useQuantumStore = create<QuantumState>(storeCreator);