import { StateVector } from './statevector';

export interface BasisProbability {
  basisState: string;
  probability: number;
}

export interface PhaseAmplitudeData {
  basisState: string;
  amplitude: number;
  phase: number;
}

export interface QubitBlochState {
  qubitIndex: number;
  x: number;
  y: number;
  z: number;
}

export interface CircuitVisualizationModel {
  activeState: StateVector;
  probabilities: BasisProbability[];
  phaseData: PhaseAmplitudeData[];
  qubitBlochStates: QubitBlochState[];
}