/**
 * Pure Quantum Mechanics Data Types
 * Framework-agnostic mathematical state representations
 */

export interface ComplexType {
  real: number;
  imag: number;
}

export type Complex = ComplexType;

export interface QuantumState {
  alpha: ComplexType;
  beta: ComplexType;
  theta: number;
  phi: number;
}

export interface QubitBlochState {
  x: number;
  y: number;
  z: number;
  theta: number;
  phi: number;
  prob0: number;
  prob1: number;
}

export interface MeasurementResult {
  outcome: 0 | 1;
  probability: number;
  collapsedState: QuantumState;
}

export type StateVector = ComplexType[];
export type QubitIndex = number;
export type GateType =
  | 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T' | 'I' | 'CNOT' | 'CZ' | 'SWAP'
  | 'CS' | 'CT' | 'CPHASE' | 'CR' | 'TOFFOLI' | 'MEASURE' | 'CUSTOM';
export type GateMatrix = ComplexType[][];

export interface StateVectorHistoryDetails {
  steps: StateVector[];
  stepStates: StateVector[];
  afterEachStep: StateVector[];
  final: StateVector;
}

export type StateVectorHistory = StateVector[] & StateVectorHistoryDetails;

export interface PlacedGate {
  id: string;
  type: GateType;
  targetQubit: number;
  controlQubit?: number;
  step?: number;
  targets?: number[];
  controls?: number[];
}

export interface CircuitStep {
  step: number;
  gates: PlacedGate[];
}

export interface QuantumCircuit {
  numQubits: number;
  maxDepth?: number;
  steps: CircuitStep[];
}
