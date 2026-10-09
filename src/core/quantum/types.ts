export interface Complex {
  re: number;
  im: number;
}

export type StateVector = Complex[];
export type GateMatrix = Complex[][];
export type Matrix = GateMatrix;

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

export type ViewMode = 'bloch' | 'histogram' | 'phase-disk';
export type PresetName = 'ghz6' | 'teleportation3' | 'qft3';

export type LabEvent =
  | { readonly type: 'GATE_PLACED';       readonly step: number;   readonly qubit: QubitIndex; readonly gate: GateType }
  | { readonly type: 'GATE_REMOVED';      readonly gateId: string }
  | { readonly type: 'PLAYHEAD_SET';      readonly step: number }
  | { readonly type: 'VIEW_CHANGED';      readonly mode: ViewMode }
  | { readonly type: 'PRESET_LOADED';     readonly name: PresetName }
  | { readonly type: 'CIRCUIT_RUN' }
  | { readonly type: 'CIRCUIT_RESET' }
  | { readonly type: 'COLLAPSE_TRIGGERED'; readonly qubit: QubitIndex; readonly outcome: 0 | 1 };

export interface LabSnapshot {
  readonly circuit: QuantumCircuit;
  readonly playhead: number;
  readonly viewMode: ViewMode;
  readonly activeGate: GateType | null;
  readonly commandPaletteOpen: boolean;
  readonly isDirty: boolean;
  readonly lastRunAt: number | null;
}

export interface LabState {
  readonly snapshot: Readonly<LabSnapshot>;
  dispatch(event: LabEvent): void;
  reset(): void;
}

export interface QuantumEngineContract {
  evaluate(circuit: QuantumCircuit): StateVectorHistory;
  evaluateUpTo(circuit: QuantumCircuit, n: number): StateVector;
  measure(
    state: StateVector,
    target: number,
    nQubits: number,
    rng?: () => number,
  ): QubitMeasurementResult;
  norm(state: StateVector): number;
  probabilities(state: StateVector): number[];
}

export interface AudioVisualEngineContract {
  playGatePlaced(): void;
  playMeasurementCollapse(qubit: number): void;
  playStepAdvance(): void;
  triggerParticleBurst(origin: [number, number, number], color: number, count: number): void;
  dispose(): void;
}
