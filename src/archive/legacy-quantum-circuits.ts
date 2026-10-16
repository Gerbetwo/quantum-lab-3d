// @ts-nocheck
/* eslint-disable */
// Archived from src/lib/quantumCore.ts

// Symbol: blochAnglesMatch
export function blochAnglesMatch(
  actualTheta: number,
  actualPhi: number,
  targetTheta: number,
  targetPhi: number,
  tolerance: number = 0.05
): boolean {
  const dTheta = Math.abs(actualTheta - targetTheta);
  if (dTheta > tolerance) return false;

  // At the poles (|0> or |1>), phi is degenerate
  const isPole = (theta: number) => theta <= tolerance || theta >= Math.PI - tolerance;
  if (isPole(targetTheta) || isPole(actualTheta)) {
    return true;
  }

  let dPhi = Math.abs(actualPhi - targetPhi) % (2 * Math.PI);
  if (dPhi > Math.PI) {
    dPhi = 2 * Math.PI - dPhi;
  }
  return dPhi <= tolerance;
}

// Symbol: clearStep
export function clearStep(circuit: QuantumCircuit, _stepIndex: number): QuantumCircuit {
  const newSteps = circuit.steps.map(s => (s.step === _stepIndex ? { ...s, gates: [] } : s));
  return { ...circuit, steps: newSteps };
}

// Symbol: getStateAtStep
export function getStateAtStep(history: StateVectorHistory, _stepIndex: number): StateVector {
  const states = history.stepStates || history.steps || [];
  if (states.length === 0) return history.final;
  const clamped = Math.max(0, Math.min(_stepIndex, states.length - 1));
  return states[clamped] ?? history.final;
}

// Symbol: isCriticalDecoherence
export function isCriticalDecoherence(_coherenceTime: number, _threshold: number = 20): boolean {
  return _coherenceTime < _threshold;
}

// Symbol: applyDecoherenceToState
export function applyDecoherenceToState(_state: Array<{ re: number; im: number }>, _factor: number): Array<{ re: number; im: number }> {
  const clampedFactor = Math.max(0, Math.min(1, _factor));
  return _state.map(amp => ({
    re: amp.re * clampedFactor,
    im: amp.im * clampedFactor,
  }));
}

// Symbol: createMultiQubitGate
export function createMultiQubitGate(_gateMatrix: GateMatrix, _targetQubit: number, _totalQubits: number): GateMatrix {
  let fullMatrix: GateMatrix = [[c(1)]];
  for (let q = 0; q < _totalQubits; q++) {
    const currentGate = q === _targetQubit ? _gateMatrix : I;
    fullMatrix = fullMatrix.length === 1 && fullMatrix[0].length === 1 
      ? currentGate 
      : kroneckerProduct(fullMatrix, currentGate);
  }
  return fullMatrix;
}

// Symbol: normalizeStateVector
export function normalizeStateVector(amplitudes: { re: number; im: number }[]): { re: number; im: number }[] {
  let normSq = 0;
  for (const amp of amplitudes) {
    normSq += amp.re * amp.re + amp.im * amp.im;
  }
  if (normSq === 0) return amplitudes;
  const normVal = Math.sqrt(normSq);
  return amplitudes.map(amp => ({
    re: Math.abs(amp.re / normVal) < 1e-12 ? 0 : amp.re / normVal,
    im: Math.abs(amp.im / normVal) < 1e-12 ? 0 : amp.im / normVal,
  }));
}

// Symbol: MeasurementResult
export type MeasurementResult = QubitMeasurementResult[];

// Symbol: QuantumAlgorithmStrategy
export interface QuantumAlgorithmStrategy<TInput, TOutput> {
  name: string;
  execute(params: TInput): TOutput;
  getCircuitState(): StateVector;
}

// Symbol: sub
export const sub = (a: Complex, b: Complex): Complex => c(a.re - b.re, a.im - b.im);

// Symbol: Y_GATE
export const Y_GATE = Y;

// Symbol: QUANTUM_PRESETS
export const QUANTUM_PRESETS = {
  bell: bellState,
  ghz: ghzState,
  w: wState,
  ghz6: ghz6Circuit,
  teleportation3: teleportation3Circuit,
  qft3: qft3Circuit,
};

// Symbol: ComplexType
export interface ComplexType {
  re: number;
  im: number;
}

// Symbol: QuantumState
export interface QuantumState {
  vector: StateVector;
  numQubits: number;
}

// Symbol: LabState
export interface LabState {
  readonly snapshot: Readonly<LabSnapshot>;
  dispatch(event: LabEvent): void;
  reset(): void;
}
