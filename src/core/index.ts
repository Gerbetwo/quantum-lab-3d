/**
 * Unified Public API for Pure Quantum Core Engine
 */

export * from './types';

// Explicit function exports from math modules to prevent TS2308 ambiguity collisions
export {
  createZeroState,
  createInitialState,
  innerProduct,
  norm,
  normalize,
  probability,
  probabilities
} from './math/statevector';

export {
  H, X, Y, Z, S, T, I,
  H_GATE, X_GATE, Y_GATE, Z_GATE, I_GATE,
  StandardGates,
  matrixMultiply,
  kroneckerProduct,
  applyGate,
  applyGateN,
  applyCNOT,
  applyCNOT_N,
  applyCZ_N,
  applySWAP_N,
  applyControlledPhaseN,
  createMultiQubitGate,
  evaluateCircuit,
  gatesApproxEqual,
  stateToBlochAngles,
  stateLabel,
  add, sub, mul, c
} from './math/gates';

export {
  createEmptyCircuit,
  placeGate,
  removeGate,
  clearStep,
  evaluateCircuitStep,
  evaluateUpToStep,
  evaluateFullCircuit,
  validateCircuit,
  getStateAtStep,
  MAX_DEPTH
} from './math/circuit';

export {
  calculateBlochVector,
  calculateBlochProbabilities,
  formatStateVector
} from './math/bloch';

export {
  calculateCoherenceTime,
  applyDecoherenceToState,
  isCriticalDecoherence
} from './math/decoherence';

export {
  measureEntangledQubit
} from './math/entanglement';

export {
  measureQubit,
  measureQubitN,
  measureAll,
  calculateMeasurementDistribution,
  measureQubitState
} from './math/measurement';

export {
  QUANTUM_PRESETS,
  bellState,
  ghzState,
  wState,
  ghz6Circuit,
  qft3Circuit,
  teleportation3Circuit
} from './math/presets';

export {
  qubitToFrequency,
  gateDurationMs,
  adsrEnvelope
} from './math/scales';
