import { create } from 'zustand';

export type MissionPhase = 'exploration' | 'prediction' | 'execution' | 'evaluation' | string;

export interface MissionState {
  currentPhase: MissionPhase;
  prediction: string | number | null;
  step: number;
  isCompleted: boolean;
}

export interface QuantumStoreState {
  // Shared Physics & Telemetry
  theta: number;
  phi: number;
  lastOutcome: number | null;
  temperatureK: number;
  coherenceTimeUs: number;
  entanglementDegree: number;

  // Mission Navigation & State
  activeMissionId: string;
  currentStepIndex: number;
  completedSteps: Record<string | number, boolean>;
  missionState: MissionState;

  // Action Helpers
  setTheta: (theta: number) => void;
  setPhi: (phi: number) => void;
  setAngles: (theta: number, phi: number) => void;
  triggerMeasurement: () => void;
  measureQubit: () => void;
  setActiveMissionId: (id: string) => void;
  transitionMissionPhase: (phase: MissionPhase | number) => void;
  setPrediction: (prediction: string | number | null) => void;
  applyGateToMission: (gate: string | number) => void;
  evaluateMissionStep: (...args: unknown[]) => boolean;

  // Mission 1: Superposition
  isMeasured: boolean;
  measuredOutcome: number | null;

  // Mission 2: Entanglement
  isEntangled: boolean;
  aliceBobDistance: number;
  entangledOutcome: [number, number] | null;
  prepareBellPair: () => void;
  setDistance: (d: number) => void;
  measureEntangledPair: () => void;

  // Mission 3: Decoherence
  temperature: number;
  photonCollisions: number;
  setTemperature: (t: number) => void;
  addCollision: () => void;
  resetCooling: () => void;

  // Mission 4: Applications
  shorExecuted: boolean;
  runShor: () => void;

  // Mission 5: Single-Qubit Gates
  appliedGates: string[];
  addGate: (gate: 'X' | 'Z' | 'H') => void;

  // Mission 6: Grover
  groverIterations: number;
  groverMeasured: boolean;
  stepGrover: () => void;
  measureGrover: () => void;

  // Mission 7: Error Correction
  physicalQubits: [number, number, number];
  syndromeDetected: boolean;
  toggleBitFlip: (index: number) => void;
  applyRecovery: () => void;

  // Step Completion
  completeStep: (stepKey: string | number) => void;
  nextStep: () => void;
  resetMissionState: () => void;
}

export const useQuantumStore = create<QuantumStoreState>((set) => ({
  theta: Math.PI / 4,
  phi: 0,
  lastOutcome: null,
  temperatureK: 0.015,
  coherenceTimeUs: 100,
  entanglementDegree: 1.0,

  activeMissionId: 'superposition',
  currentStepIndex: 0,
  completedSteps: {},
  missionState: {
    currentPhase: 'exploration',
    prediction: null,
    step: 0,
    isCompleted: false,
  },

  isMeasured: false,
  measuredOutcome: null,

  setTheta: (theta) => set({ theta, isMeasured: false }),
  setPhi: (phi) => set({ phi }),
  setAngles: (theta, phi) => set({ theta, phi }),
  triggerMeasurement: () => set((s) => {
    const outcome = Math.random() < Math.cos(s.theta / 2) ** 2 ? 0 : 1;
    return { isMeasured: true, measuredOutcome: outcome, lastOutcome: outcome };
  }),
  measureQubit: () => set((s) => {
    const outcome = Math.random() < Math.cos(s.theta / 2) ** 2 ? 0 : 1;
    return { isMeasured: true, measuredOutcome: outcome, lastOutcome: outcome };
  }),
  setActiveMissionId: (activeMissionId) => set({ activeMissionId }),
  transitionMissionPhase: (phase) => set((s) => ({
    missionState: { ...s.missionState, currentPhase: String(phase) },
  })),
  setPrediction: (prediction) => set((s) => ({
    missionState: { ...s.missionState, prediction: prediction !== null ? String(prediction) : null },
  })),
  applyGateToMission: (gate) => set((s) => ({
    appliedGates: [...s.appliedGates.slice(-2), String(gate)],
  })),
  evaluateMissionStep: () => true,

  isEntangled: false,
  aliceBobDistance: 1000,
  entangledOutcome: null,
  prepareBellPair: () => set({ isEntangled: true, entangledOutcome: null }),
  setDistance: (aliceBobDistance) => set({ aliceBobDistance }),
  measureEntangledPair: () => set({
    entangledOutcome: Math.random() > 0.5 ? [1, 1] : [0, 0],
  }),

  temperature: 15,
  photonCollisions: 0,
  setTemperature: (temperature) => set({
    temperature,
    temperatureK: temperature / 1000,
    coherenceTimeUs: Math.max(0, 100 - temperature * 0.02),
  }),
  addCollision: () => set((s) => ({
    photonCollisions: s.photonCollisions + 1,
    coherenceTimeUs: Math.max(0, s.coherenceTimeUs - 10),
  })),
  resetCooling: () => set({ temperature: 15, temperatureK: 0.015, photonCollisions: 0, coherenceTimeUs: 100 }),

  shorExecuted: false,
  runShor: () => set({ shorExecuted: true }),

  appliedGates: [],
  addGate: (gate) => set((s) => ({ appliedGates: [...s.appliedGates.slice(-2), gate] })),

  groverIterations: 0,
  groverMeasured: false,
  stepGrover: () => set((s) => ({ groverIterations: Math.min(s.groverIterations + 1, 2) })),
  measureGrover: () => set({ groverMeasured: true }),

  physicalQubits: [0, 0, 0],
  syndromeDetected: false,
  toggleBitFlip: (idx) => set((s) => {
    const updated = [...s.physicalQubits] as [number, number, number];
    updated[idx] = updated[idx] === 0 ? 1 : 0;
    return { physicalQubits: updated, syndromeDetected: true };
  }),
  applyRecovery: () => set({ physicalQubits: [0, 0, 0], syndromeDetected: false }),

  completeStep: (stepKey) => set((s) => ({ completedSteps: { ...s.completedSteps, [stepKey]: true } })),
  nextStep: () => set((s) => ({ currentStepIndex: s.currentStepIndex + 1 })),
  resetMissionState: () => set({
    currentStepIndex: 0,
    isMeasured: false,
    isEntangled: false,
    shorExecuted: false,
    appliedGates: [],
    groverIterations: 0,
    groverMeasured: false,
    physicalQubits: [0, 0, 0],
    syndromeDetected: false,
  }),
}));
