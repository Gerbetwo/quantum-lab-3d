export type QubitState = [number, number];

export type GateType = 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T' | 'CNOT' | 'SWAP' | 'CZ' | 'CS' | 'CT';

export type QubitIndex = 0 | 1 | 2 | 3 | 4 | 5;

export interface Complex {
  re: number;
  im: number;
}

export type StateVector = Complex[];
export type GateMatrix = Complex[][];

export interface PlacedGate {
  id: string;
  type: GateType;
  targetQubit?: number;
  controlQubit?: number;
  targets?: number[];
  controls?: number[];
  step?: number;
}

export interface CircuitStep {
  step: number;
  gates: PlacedGate[];
}

export interface QuantumCircuit {
  numQubits: number;
  nQubits: number;
  depth: number;
  steps: CircuitStep[];
  gates?: PlacedGate[];
}

export interface StateVectorHistory {
  stepStates: StateVector[];
  afterEachStep: StateVector[];
  final: StateVector;
}

export interface ValidationResult {
  ok: boolean;
  valid: boolean;
  errors: string[];
}

export interface MeasurementResult {
  qubitIndex: number;
  collapsedBit: 0 | 1;
  probabilityZero: number;
  probabilityOne: number;
}

export interface QubitMeasurementResult {
  outcome: 0 | 1;
  probabilityZero: number;
  probabilityOne: number;
}
