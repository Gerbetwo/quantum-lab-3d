/**
 * Pure Quantum Mechanics Data Types
 * Framework-agnostic mathematical state representations
 */

export interface ComplexType {
  real: number;
  imag: number;
}

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
