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
