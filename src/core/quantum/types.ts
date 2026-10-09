export interface Complex {
  re: number;
  im: number;
}

export type StateVector = Complex[];
export type GateMatrix = Complex[][];

export interface QuantumState {
  vector: StateVector;
  nQubits: number;
}

export interface QubitMeasurementResult {
  outcome: 0 | 1;
  collapsed: StateVector;
  probability?: number;
  collapsedBit?: number;
}

export interface MeasurementResult {
  outcomes: number[];
  state: StateVector;
}

export type GateType = 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T' | 'CNOT' | 'CZ' | 'SWAP' | 'I' | string;
export type QubitIndex = number;

export interface PlacedGate {
  id?: string;
  type?: GateType;
  targetQubit?: number;
  controlQubit?: number;
  targets?: number[];
  controls?: number[];
  step?: number;
  [key: string]: unknown;
}

export interface CircuitStep {
  step: number;
  gates: PlacedGate[];
}

export interface QuantumCircuit {
  nQubits: number;
  maxDepth?: number;
  steps: CircuitStep[];
  [key: string]: unknown;
}

export interface StateVectorHistory {
  steps?: StateVector[];
  stepStates?: StateVector[];
  afterEachStep?: StateVector[];
  final: StateVector;
  [key: string]: unknown;
}

export interface ValidationResult {
  valid: boolean;
  ok?: boolean;
  errors: string[];
}
