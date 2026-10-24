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
export type GateType = 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T' | 'I';

export interface QubitState {
  theta: number;
  phi: number;
}

export interface StateMetrics {
  alpha: number;
  betaReal: number;
  betaImag: number;
  prob0: number;
  prob1: number;
}

export type BitTriple = [0 | 1, 0 | 1, 0 | 1];

export interface SyndromeResult {
  syndrome: number;
  errorIndex: number;
  corrected: BitTriple;
}

export interface TwoQubitTensorState {
  alpha: ComplexType; // |00⟩
  beta: ComplexType;  // |01⟩
  gamma: ComplexType; // |10⟩
  delta: ComplexType; // |11⟩
  prob00: number;
  prob01: number;
  prob10: number;
  prob11: number;
  purity: number;
  entropy: number;
  fidelity: number;
  dirac: string;
}

export interface TwoQubitMeasurementResult {
  outcome: '00' | '01' | '10' | '11';
  alice: 0 | 1;
  bob: 0 | 1;
  state: string;
  probability: number;
}

export type Matrix2x2 = [[ComplexType, ComplexType], [ComplexType, ComplexType]];
export type Matrix4x4 = ComplexType[][];

export interface ReducedDensityMatrixResult {
  rhoAB: Matrix4x4;
  rhoA: Matrix2x2;
  rhoB: Matrix2x2;
  vectorA: { x: number; y: number; z: number; r: number };
  vectorB: { x: number; y: number; z: number; r: number };
  purityA: number;
  purityB: number;
  entropyA: number;
  entropyB: number;
}
