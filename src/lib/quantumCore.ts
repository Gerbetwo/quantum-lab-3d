export type QubitIndex = number;
export interface Complex { re: number; im: number; }
export type Matrix = Complex[][];
export type GateMatrix = Matrix;
export type StateVector = Complex[];
export interface StateVectorHistoryDetails {
  steps: StateVector[];
  stepStates: StateVector[];
  afterEachStep: StateVector[];
  final: StateVector;
}

export type StateVectorHistory = StateVector[] & StateVectorHistoryDetails;

export type GateType = 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T' | 'I' | 'CNOT' | 'CZ' | 'SWAP' | 'CPHASE' | 'CR' | 'CS' | 'CT' | 'TOFFOLI' | 'MEASURE' | 'CUSTOM';

export interface PlacedGate {
  id: string;
  type: GateType;
  targetQubit: number;
  controlQubit?: number;
  step: number;
  params?: Record<string, number>;
  targets?: QubitIndex[];
  controls?: QubitIndex[];
  phi?: number;
}

export interface CircuitStep {
  step: number;
  gates: PlacedGate[];
}

export interface QuantumCircuit {
  numQubits: number;
  nQubits?: number;
  steps: CircuitStep[];
  maxDepth?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  ok?: boolean;
}

export interface QubitMeasurementResult {
  qubit: number;
  outcome: 0 | 1;
  probability: number;
  collapsed?: StateVector;
  collapsedBit?: 0 | 1;
}

export type MeasurementResult = QubitMeasurementResult[];

export interface LabSnapshot {
  timestamp: number;
  stateVector: StateVector;
  circuit: QuantumCircuit;
}

export interface LabEvent {
  id: string;
  type: string;
  payload: Record<string, unknown>;
}

export type BitTriple = [0 | 1, 0 | 1, 0 | 1];

export function bitFlipEncode(_bit: 0 | 1): BitTriple {
  return _bit === 1 ? [1, 1, 1] : [0, 0, 0];
}

export function injectBitFlip(_triple: BitTriple, index: 0 | 1 | 2): BitTriple {
  const copy: BitTriple = [..._triple];
  copy[index] = copy[index] === 1 ? 0 : 1;
  return copy;
}

export function bitFlipDecode(triple: BitTriple): 0 | 1 {
  const sum = triple[0] + triple[1] + triple[2];
  return sum >= 2 ? 1 : 0;
}

export function detectBitFlipSyndrome(triple: BitTriple): {
  syndrome: number;
  errorIndex: number;
  corrected: BitTriple;
} {
  const [b0, b1, b2] = triple;
  let errorIndex = -1;
  const corrected: BitTriple = [...triple];

  if (b0 !== b1 && b0 !== b2) {
    errorIndex = 0;
    corrected[0] = (1 - b0) as 0 | 1;
  } else if (b1 !== b0 && b1 !== b2) {
    errorIndex = 1;
    corrected[1] = (1 - b1) as 0 | 1;
  } else if (b2 !== b0 && b2 !== b1) {
    errorIndex = 2;
    corrected[2] = (1 - b2) as 0 | 1;
  }

  const syndrome = errorIndex === 0 ? 1 : errorIndex === 1 ? 2 : errorIndex === 2 ? 3 : 0;

  return { syndrome, errorIndex, corrected };
}

export function phaseFlipEncode(alpha: number): { plus: number; minus: number } {
  const beta = Math.sqrt(Math.max(0, 1 - alpha * alpha));
  return {
    plus: (alpha + beta) / Math.SQRT2,
    minus: (alpha - beta) / Math.SQRT2,
  };
}

export function injectPhaseFlip(
  _state: { plus: number; minus: number },
  errorIndex: number
): { plus: number; minus: number; errorIndex: number } {
  return { ..._state, errorIndex };
}

export function applyRepetitionCode3(
  bit: 0 | 1,
  errorType: 'none' | 'bit' | 'phase',
  errorIndex: 0 | 1 | 2 = 0
): { corrected: 0 | 1; detected: boolean; syndrome: number } {
  if (errorType === 'none') {
    return { corrected: bit, detected: false, syndrome: 0 };
  }
  if (errorType === 'bit') {
    const encoded = bitFlipEncode(bit);
    const corrupted = injectBitFlip(encoded, errorIndex);
    const syn = detectBitFlipSyndrome(corrupted);
    return {
      corrected: bitFlipDecode(syn.corrected),
      detected: syn.errorIndex !== -1,
      syndrome: syn.syndrome,
    };
  }
  // Phase errors: standard 3-qubit bit flip repetition code cannot detect or correct phase flips in computational basis
  return { corrected: bit, detected: false, syndrome: 0 };
}

export function groverIterations(_N: number): number {
  return Math.floor((Math.PI / 4) * Math.sqrt(_N));
}

export function classicalExpectedTrials(_N: number): number {
  return _N / 2;
}

export function uniformAmplitudes(N: number): number[] {
  const amp = 1 / Math.sqrt(N);
  return new Array(N).fill(amp);
}

export function executeGroverStep(amplitudes: number[], markedIndex: number): number[] {
  const N = amplitudes.length;
  // Step 1: Deterministic Oracle phase inversion
  const oracleState = amplitudes.map((amp, idx) => (idx === markedIndex ? -amp : amp));
  // Step 2: Diffusion inversion about the mean
  const mean = oracleState.reduce((sum, val) => sum + val, 0) / N;
  return oracleState.map((val) => 2 * mean - val);
}

export const simulateGroverStep = executeGroverStep;

export function measureAmplitude(amplitudes: number[], _rng: () => number = Math.random): number {
  const probs = amplitudes.map((a) => a * a);
  const r = _rng();
  let cumulative = 0;
  for (let i = 0; i < probs.length; i++) {
    cumulative += probs[i];
    if (r <= cumulative) return i;
  }
  return amplitudes.length - 1;
}

export function groverSuccessProbability(N: number, iterations: number): number {
  if (iterations === 0) return 1 / N;
  const theta = Math.asin(1 / Math.sqrt(N));
  return Math.sin((2 * iterations + 1) * theta) ** 2;
}

export interface ShorResult {
  isSuccess: boolean;
  period: number | null;
  factors: [number, number] | null;
}

export function factorizeShorN15(a: number): ShorResult {
  if (a <= 1 || a >= 15 || a % 3 === 0 || a % 5 === 0) {
    return { isSuccess: false, period: null, factors: null };
  }
  let r = 1;
  let val = a % 15;
  while (val !== 1 && r < 15) {
    val = (val * a) % 15;
    r++;
  }
  if (r % 2 === 0) {
    return { isSuccess: true, period: r, factors: [3, 5] };
  }
  return { isSuccess: false, period: r, factors: null };
}

export interface QuantumAlgorithmStrategy<TInput, TOutput> {
  name: string;
  execute(params: TInput): TOutput;
  getCircuitState(): StateVector;
}

export interface ShorDemoResult {
  base: number;
  sequence: number[];
  period: number;
  factors: [number, number];
  explanation: string;
}

export function runShorDemo(base: number): ShorDemoResult {
  const shor = factorizeShorN15(base);
  const period = shor.period ?? 4;
  const factors: [number, number] = shor.factors ?? [3, 5];

  const sequence: number[] = [];
  let val = 1;
  for (let i = 0; i < period; i++) {
    sequence.push(val);
    val = (val * base) % 15;
  }

  return {
    base,
    sequence,
    period,
    factors,
    explanation: `Para N = 15 y base a = ${base}, la secuencia modular revela un período r = ${period}. Usando el cálculo cuántico de período, extraemos los factores primos ${factors[0]} y ${factors[1]}.`
  };
}

export interface BlochVector {
  x: number;
  y: number;
  z: number;
}

export interface BlochProbabilities {
  alpha: number;
  beta: number;
  prob0: number;
  prob1: number;
}

export function calculateBlochVector(theta: number, phi: number = 0): BlochVector {
  const x = Math.sin(theta) * Math.cos(phi);
  const y = Math.sin(theta) * Math.sin(phi);
  const z = Math.cos(theta);
  return {
    x: Math.abs(x) < 1e-12 ? 0 : Math.round(x * 1000) / 1000,
    y: Math.abs(y) < 1e-12 ? 0 : Math.round(y * 1000) / 1000,
    z: Math.abs(z) < 1e-12 ? 0 : Math.round(z * 1000) / 1000,
  };
}

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

export function calculateBlochProbabilities(theta: number): BlochProbabilities {
  const alpha = Math.cos(theta / 2);
  const beta = Math.sin(theta / 2);
  const prob0 = Math.round(alpha * alpha * 100);
  const prob1 = 100 - prob0;
  return { alpha, beta, prob0, prob1 };
}

export function formatStateVector(theta: number, _phi: number = 0): string {
  const cos = Math.round(Math.cos(theta / 2) * 100) / 100;
  const sin = Math.round(Math.sin(theta / 2) * 100) / 100;
  if (sin === 0) return `|ψ⟩ = ${cos}|0⟩`;
  if (cos === 0) return `|ψ⟩ = ${sin}|1⟩`;
  return `|ψ⟩ = ${cos}|0⟩ + ${sin}|1⟩`;
}

export const MAX_DEPTH = 32;

export function createEmptyCircuit(numQubits: number, maxDepth: number = MAX_DEPTH): QuantumCircuit {
  if (numQubits <= 0 || maxDepth <= 0 || maxDepth > 64) {
    throw new Error('Invalid circuit dimensions');
  }
  return { numQubits, maxDepth, steps: [] };
}

export function placeGate(circuit: QuantumCircuit, gate: PlacedGate, stepIndex?: number): QuantumCircuit {
  const actualStep = stepIndex !== undefined ? stepIndex : (gate.step !== undefined ? gate.step : 0);
  if (actualStep < 0 || actualStep >= (circuit.maxDepth || MAX_DEPTH)) {
    throw new Error('Step out of range');
  }
  const nQ = circuit.numQubits;
  if (gate.targets) {
    for (const t of gate.targets) {
      if (t < 0 || t >= nQ) throw new Error('Qubit out of range');
    }
  }
  if (gate.targetQubit !== undefined && (gate.targetQubit < 0 || gate.targetQubit >= nQ)) {
    throw new Error('Qubit out of range');
  }
  if (gate.controls) {
    for (const c of gate.controls) {
      if (c < 0 || c >= nQ) throw new Error('Qubit out of range');
    }
  }
  if (gate.controlQubit !== undefined && (gate.controlQubit < 0 || gate.controlQubit >= nQ)) {
    throw new Error('Qubit out of range');
  }

  const newSteps = [...circuit.steps];
  while (newSteps.length <= actualStep) {
    newSteps.push({ step: newSteps.length, gates: [] });
  }
  const gateId = gate.id || `gate-${Math.random().toString(36).substr(2, 9)}`;
  const gateWithId = { ...gate, id: gateId, step: actualStep };
  const currentGates = newSteps[actualStep].gates.filter(_g => _g.id !== gateId);
  newSteps[actualStep] = { ...newSteps[actualStep], gates: [...currentGates, gateWithId] };
  return { ...circuit, steps: newSteps };
}

export function removeGate(circuit: QuantumCircuit, _gateId: string): QuantumCircuit {
  const newSteps = circuit.steps.map(s => ({
    ...s,
    gates: s.gates.filter(_g => _g.id !== _gateId)
  }));
  return { ...circuit, steps: newSteps };
}

export function clearStep(circuit: QuantumCircuit, _stepIndex: number): QuantumCircuit {
  const newSteps = circuit.steps.map(s => (s.step === _stepIndex ? { ...s, gates: [] } : s));
  return { ...circuit, steps: newSteps };
}

export function validateCircuit(_circuit: unknown): ValidationResult {
  const errors: string[] = [];
  const c = _circuit as { numQubits?: number; steps?: CircuitStep[]; gates?: PlacedGate[] };
  const nQ = c?.numQubits;
  if (!c || typeof nQ !== 'number' || nQ <= 0) {
    errors.push('Invalid number of qubits');
  } else {
    const steps = c.steps || (c.gates ? [{ step: 0, gates: c.gates }] : []);
    for (const step of steps) {
      for (const gate of step.gates || []) {
        const targets = gate.targets || (gate.targetQubit !== undefined ? [gate.targetQubit] : []);
        const controls = gate.controls || (gate.controlQubit !== undefined ? [gate.controlQubit] : []);
        for (const t of targets) {
          if (t < 0 || t >= nQ) errors.push(`Target qubit ${t} out of range`);
        }
        for (const co of controls) {
          if (co < 0 || co >= nQ) errors.push(`Control qubit ${co} out of range`);
        }
      }
    }
  }
  const isOk = errors.length === 0;
  return { valid: isOk, ok: isOk, errors };
}

export function evaluateCircuitStep(_state: StateVector, _step: CircuitStep, numQubits: number): StateVector {
  let currentState = [..._state];
  for (const gate of _step.gates || []) {
    const type = gate.type;
    const targets = gate.targets || (gate.targetQubit !== undefined ? [gate.targetQubit] : []);
    const controls = gate.controls || (gate.controlQubit !== undefined ? [gate.controlQubit] : []);

    if (type === 'H') {
      currentState = applyGateN(currentState, H, targets[0], numQubits);
    } else if (type === 'X') {
      currentState = applyGateN(currentState, X, targets[0], numQubits);
    } else if (type === 'Y') {
      currentState = applyGateN(currentState, Y, targets[0], numQubits);
    } else if (type === 'Z') {
      currentState = applyGateN(currentState, Z, targets[0], numQubits);
    } else if (type === 'S') {
      currentState = applyGateN(currentState, S, targets[0], numQubits);
    } else if (type === 'T') {
      currentState = applyGateN(currentState, T, targets[0], numQubits);
    } else if (type === 'I') {
      currentState = applyGateN(currentState, I, targets[0], numQubits);
    } else if (type === 'CNOT') {
      currentState = applyCNOT_N(currentState, controls[0], targets[0], numQubits);
    } else if (type === 'CZ') {
      currentState = applyCZ_N(currentState, controls[0], targets[0], numQubits);
    } else if (type === 'SWAP') {
      currentState = applySWAP_N(currentState, targets[0], targets[1], numQubits);
    } else if (type === 'CPHASE' || type === 'CR') {
      const phi = (gate.phi as number) || Math.PI / 2;
      currentState = applyControlledPhaseN(currentState, controls[0], targets[0], phi, numQubits);
    }
  }
  return currentState;
}

export function evaluateUpToStep(circuit: QuantumCircuit, _maxStep: number): StateVectorHistory {
  const size = 1 << circuit.numQubits;
  let currentState: StateVector = new Array(size).fill(0).map((_, _i) => ({ re: _i === 0 ? 1 : 0, im: 0 }));
  const stepStates: StateVector[] = [currentState];

  for (let i = 0; i <= _maxStep && i < (circuit.steps?.length || 0); i++) {
    currentState = evaluateCircuitStep(currentState, circuit.steps[i], circuit.numQubits);
    stepStates.push(currentState);
  }

  const history = Object.assign([...stepStates], {
    steps: stepStates,
    stepStates,
    afterEachStep: stepStates,
    final: currentState,
  }) as StateVectorHistory;

  return history;
}

export function evaluateFullCircuit(circuit: QuantumCircuit): StateVectorHistory {
  const maxStep = (circuit.steps?.length || 1) - 1;
  return evaluateUpToStep(circuit, maxStep);
}

export function getStateAtStep(history: StateVectorHistory, _stepIndex: number): StateVector {
  const states = history.stepStates || history.steps || [];
  if (states.length === 0) return history.final;
  const clamped = Math.max(0, Math.min(_stepIndex, states.length - 1));
  return states[clamped] ?? history.final;
}

export function calculateCoherenceTime(temperatureKelvin: number): number {
  if (temperatureKelvin <= 0) return 1000;
  const t2 = Math.max(1, 500 / (temperatureKelvin + 0.1));
  return parseFloat(t2.toFixed(2));
}

export function isCriticalDecoherence(_coherenceTime: number, _threshold: number = 20): boolean {
  return _coherenceTime < _threshold;
}

export function applyDecoherenceToState(_state: Array<{ re: number; im: number }>, _factor: number): Array<{ re: number; im: number }> {
  const clampedFactor = Math.max(0, Math.min(1, _factor));
  return _state.map(amp => ({
    re: amp.re * clampedFactor,
    im: amp.im * clampedFactor,
  }));
}

export interface EntanglementState {
  aliceOutcome: 0 | 1 | null;
  bobOutcome: 0 | 1 | null;
  correlated: boolean;
  explanation: string;
}

export function measureEntangledQubit(
  _forcedOutcome?: 0 | 1,
  _random: () => number = Math.random
): EntanglementState {
  const outcome = _forcedOutcome ?? (_random() < 0.5 ? 0 : 1);
  return {
    aliceOutcome: outcome,
    bobOutcome: outcome,
    correlated: true,
    explanation:
      "Al medir el qubit de Alice, colapsa instantáneamente. Debido al entrelazamiento (|Φ+⟩), el qubit de Bob adopta el mismo valor de forma correlacionada, sin que esto transmita información útil más allá de la velocidad de la luz (no-señalización)."
  };
}


export const c = (re: number, im: number = 0): Complex => ({
  re: Math.abs(re) < 1e-12 ? 0 : re,
  im: Math.abs(im) < 1e-12 ? 0 : im,
});

export const add = (a: Complex, b: Complex): Complex => c(a.re + b.re, a.im + b.im);
export const sub = (a: Complex, b: Complex): Complex => c(a.re - b.re, a.im - b.im);
export const mul = (a: Complex, b: Complex): Complex => c(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);

export const H: GateMatrix = [
  [c(1 / Math.SQRT2), c(1 / Math.SQRT2)],
  [c(1 / Math.SQRT2), c(-1 / Math.SQRT2)],
];

export const X: GateMatrix = [
  [c(0), c(1)],
  [c(1), c(0)],
];

export const Y: GateMatrix = [
  [c(0), c(0, -1)],
  [c(0, 1), c(0)],
];

export const Z: GateMatrix = [
  [c(1), c(0)],
  [c(0), c(-1)],
];

export const S: GateMatrix = [
  [c(1), c(0)],
  [c(0), c(0, 1)],
];

export const T: GateMatrix = [
  [c(1), c(0)],
  [c(0), c(Math.SQRT1_2, Math.SQRT1_2)],
];

export const I: GateMatrix = [
  [c(1), c(0)],
  [c(0), c(1)],
];

export const H_GATE = H;
export const X_GATE = X;
export const Y_GATE = Y;
export const Z_GATE = Z;
export const I_GATE = I;

export const StandardGates = { H, X, Y, Z, S, T, I };

export function kroneckerProduct(m1: GateMatrix, m2: GateMatrix): GateMatrix {
  const r1 = m1.length;
  const c1 = m1[0].length;
  const r2 = m2.length;
  const c2 = m2[0].length;

  const result: GateMatrix = Array.from({ length: r1 * r2 }, () =>
    Array(c1 * c2).fill(c(0, 0))
  );

  for (let i = 0; i < r1; i++) {
    for (let j = 0; j < c1; j++) {
      for (let k = 0; k < r2; k++) {
        for (let l = 0; l < c2; l++) {
          result[i * r2 + k][j * c2 + l] = mul(m1[i][j], m2[k][l]);
        }
      }
    }
  }
  return result;
}

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

export function applyGate(state: StateVector, gate: GateMatrix): StateVector {
  if (state.length !== gate.length) return state;
  const res: StateVector = [];
  for (let i = 0; i < gate.length; i++) {
    let sum = c(0, 0);
    for (let j = 0; j < gate[i].length; j++) {
      sum = add(sum, mul(gate[i][j], state[j]));
    }
    res.push(sum);
  }
  return res;
}

export function matrixMultiply(m1: GateMatrix, m2: GateMatrix): GateMatrix {
  const rows = m1.length;
  const cols = m2[0].length;
  const shared = m2.length;
  const res: GateMatrix = Array.from({ length: rows }, () => Array(cols).fill(c(0)));

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      let sum = c(0);
      for (let k = 0; k < shared; k++) {
        sum = add(sum, mul(m1[i][k], m2[k][j]));
      }
      res[i][j] = sum;
    }
  }
  return res;
}

export function applyCNOT(state: StateVector, controlQubit: number = 0): StateVector {
  const numQubits = Math.round(Math.log2(state.length));
  const targetQubit = controlQubit === 0 ? 1 : 0;
  return applyCNOT_N(state, controlQubit, targetQubit, numQubits);
}

export function evaluateCircuit(_gates: GateMatrix[], _initialState: StateVector): StateVector {
  let curr = _initialState;
  for (const g of _gates) {
    curr = applyGate(curr, g);
  }
  return curr;
}

export function stateToBlochAngles(state: StateVector): { theta: number; phi: number } {
  const a = state[0] || c(1, 0);
  const b = state[1] || c(0, 0);
  const normSq = a.re * a.re + a.im * a.im + b.re * b.re + b.im * b.im;
  const normVal = normSq > 0 ? Math.sqrt(normSq) : 1;
  const alphaMag = Math.sqrt(a.re * a.re + a.im * a.im) / normVal;
  const theta = 2 * Math.acos(Math.min(1, Math.max(0, alphaMag)));
  let phi = Math.atan2(b.im, b.re) - Math.atan2(a.im, a.re);
  phi = (phi % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
  if (Math.abs(theta) < 1e-6 || Math.abs(theta - Math.PI) < 1e-6) {
    phi = 0;
  }
  return { theta, phi };
}

export function gatesApproxEqual(g1: GateMatrix, g2: GateMatrix, eps = 1e-5): boolean {
  if (g1.length !== g2.length || g1[0].length !== g2[0].length) return false;
  for (let i = 0; i < g1.length; i++) {
    for (let j = 0; j < g1[0].length; j++) {
      if (Math.abs(g1[i][j].re - g2[i][j].re) > eps || Math.abs(g1[i][j].im - g2[i][j].im) > eps) {
        return false;
      }
    }
  }
  return true;
}

export function stateLabel(state: StateVector): string {
  if (!state || state.length < 2) return '|0>';
  const a0 = state[0];
  const a1 = state[1];
  if (Math.abs(a0.re - 1) < 1e-3) return '|0>';
  if (Math.abs(a1.re - 1) < 1e-3) return '|1>';
  if (Math.abs(a0.re - Math.SQRT1_2) < 1e-3 && Math.abs(a1.re - Math.SQRT1_2) < 1e-3) return '|+>';
  if (Math.abs(a0.re - Math.SQRT1_2) < 1e-3 && Math.abs(a1.re + Math.SQRT1_2) < 1e-3) return '|->';
  return '|0>';
}

export function applyGateN(state: StateVector, gate: GateMatrix, targetQubit: number, numQubits: number): StateVector {
  const expectedDim = 1 << numQubits;
  if (state.length !== expectedDim) {
    throw new Error(`State length mismatch: expected ${expectedDim}, got ${state.length}`);
  }
  if (targetQubit < 0 || targetQubit >= numQubits) {
    throw new Error(`Target qubit out of range: ${targetQubit}`);
  }

  const result: StateVector = new Array(expectedDim);
  const bit = 1 << (numQubits - 1 - targetQubit);

  for (let i = 0; i < expectedDim; i++) {
    if ((i & bit) === 0) {
      const i0 = i;
      const i1 = i | bit;
      const v0 = state[i0];
      const v1 = state[i1];

      result[i0] = add(mul(gate[0][0], v0), mul(gate[0][1], v1));
      result[i1] = add(mul(gate[1][0], v0), mul(gate[1][1], v1));
    }
  }
  return result;
}

export function applyCNOT_N(state: StateVector, controlQubit: number, targetQubit: number, numQubits: number): StateVector {
  const dim = 1 << numQubits;
  if (state.length !== dim) {
    throw new Error(`State length mismatch: expected ${dim}, got ${state.length}`);
  }
  if (controlQubit < 0 || controlQubit >= numQubits || targetQubit < 0 || targetQubit >= numQubits) {
    throw new Error('Qubit out of range');
  }
  const result: StateVector = [...state];
  const cBit = 1 << (numQubits - 1 - controlQubit);
  const tBit = 1 << (numQubits - 1 - targetQubit);

  for (let i = 0; i < dim; i++) {
    if ((i & cBit) !== 0 && (i & tBit) === 0) {
      const i0 = i;
      const i1 = i | tBit;
      const tmp = result[i0];
      result[i0] = result[i1];
      result[i1] = tmp;
    }
  }
  return result;
}

export function applyCZ_N(state: StateVector, controlQubit: number, targetQubit: number, numQubits: number): StateVector {
  const dim = 1 << numQubits;
  if (state.length !== dim) {
    throw new Error(`State length mismatch: expected ${dim}, got ${state.length}`);
  }
  if (controlQubit < 0 || controlQubit >= numQubits || targetQubit < 0 || targetQubit >= numQubits) {
    throw new Error('Qubit out of range');
  }
  const result: StateVector = [...state];
  const cBit = 1 << (numQubits - 1 - controlQubit);
  const tBit = 1 << (numQubits - 1 - targetQubit);

  for (let i = 0; i < dim; i++) {
    if ((i & cBit) !== 0 && (i & tBit) !== 0) {
      result[i] = c(-result[i].re, -result[i].im);
    }
  }
  return result;
}

export function applySWAP_N(state: StateVector, q1: number, q2: number, numQubits: number): StateVector {
  const dim = 1 << numQubits;
  if (state.length !== dim) {
    throw new Error(`State length mismatch: expected ${dim}, got ${state.length}`);
  }
  if (q1 < 0 || q1 >= numQubits || q2 < 0 || q2 >= numQubits) {
    throw new Error('Qubit out of range');
  }
  const result: StateVector = [...state];
  const bit1 = 1 << (numQubits - 1 - q1);
  const bit2 = 1 << (numQubits - 1 - q2);

  for (let i = 0; i < dim; i++) {
    const b1 = (i & bit1) !== 0 ? 1 : 0;
    const b2 = (i & bit2) !== 0 ? 1 : 0;
    if (b1 === 1 && b2 === 0) {
      const j = (i ^ bit1) | bit2;
      const tmp = result[i];
      result[i] = result[j];
      result[j] = tmp;
    }
  }
  return result;
}

export function applyControlledPhaseN(state: StateVector, controlQubit: number, targetQubit: number, phi: number, numQubits: number): StateVector {
  const dim = 1 << numQubits;
  if (state.length !== dim) {
    throw new Error(`State length mismatch: expected ${dim}, got ${state.length}`);
  }
  if (controlQubit < 0 || controlQubit >= numQubits || targetQubit < 0 || targetQubit >= numQubits) {
    throw new Error('Qubit out of range');
  }
  const result: StateVector = [...state];
  const cBit = 1 << (numQubits - 1 - controlQubit);
  const tBit = 1 << (numQubits - 1 - targetQubit);
  const phaseVal = c(Math.cos(phi), Math.sin(phi));

  for (let i = 0; i < dim; i++) {
    if ((i & cBit) !== 0 && (i & tBit) !== 0) {
      result[i] = mul(result[i], phaseVal);
    }
  }
  return result;
}

export function measureQubit(theta: number, rng?: () => number): 0 | 1 {
  const p0 = Math.cos(theta / 2) ** 2;
  const random = rng ? rng() : Math.random();
  return random < p0 ? 0 : 1;
}

export function measureQubitN(
  state: StateVector,
  qubitIndex: number,
  numQubits: number,
  rng?: () => number
): QubitMeasurementResult {
  if (qubitIndex < 0 || qubitIndex >= numQubits) {
    throw new Error('Qubit out of range');
  }
  const bitMask = 1 << (numQubits - 1 - qubitIndex);
  const probs = probabilities(state);

  let prob1 = 0;
  for (let i = 0; i < probs.length; i++) {
    if ((i & bitMask) !== 0) {
      prob1 += probs[i];
    }
  }
  const p0 = 1 - prob1;
  const random = rng ? rng() : Math.random();
  const outcome: 0 | 1 = random >= p0 ? 1 : 0;
  
  const collapsed: StateVector = state.map(() => ({ re: 0, im: 0 }));
  const normFactor = Math.sqrt(outcome === 1 ? prob1 : p0);

  for (let i = 0; i < state.length; i++) {
    const bit = (i & bitMask) !== 0 ? 1 : 0;
    if (bit === outcome) {
      collapsed[i] = {
        re: normFactor > 0 ? (state[i]?.re ?? 0) / normFactor : 0,
        im: normFactor > 0 ? (state[i]?.im ?? 0) / normFactor : 0,
      };
    }
  }

  return {
    qubit: qubitIndex,
    outcome,
    collapsedBit: outcome,
    collapsed,
    probability: outcome === 1 ? prob1 : p0
  };
}

export function measureAll(state: StateVector, rng?: () => number): number {
  const probs = probabilities(state);
  const random = rng ? rng() : Math.random();
  let cumulative = 0;
  for (let i = 0; i < probs.length; i++) {
    cumulative += probs[i];
    if (random <= cumulative) return i;
  }
  return probs.length - 1;
}

export function calculateMeasurementDistribution(thetaOrState: unknown, shots: number = 100, rng?: () => number): unknown {
  if (typeof thetaOrState === 'number') {
    const p0 = Math.cos(thetaOrState / 2) ** 2;
    let zeros = 0;
    for (let i = 0; i < shots; i++) {
      const r = rng ? rng() : Math.random();
      if (r < p0) zeros++;
    }
    return { zeros, ones: shots - zeros };
  }
  if (Array.isArray(thetaOrState)) {
    return probabilities(thetaOrState as StateVector);
  }
  return { zeros: shots, ones: 0 };
}

export function measureQubitState(qubitOrTheta: unknown, stateOrRng?: unknown, rng?: unknown): unknown {
  if (typeof qubitOrTheta === 'number' && Array.isArray(stateOrRng) && typeof rng === 'function') {
    const r = (rng as () => number)();
    const outcome: 0 | 1 = r > 0.5 ? 1 : 0;
    return { outcome, collapsedBit: outcome, state: stateOrRng };
  }
  if (typeof qubitOrTheta === 'number' && Array.isArray(stateOrRng)) {
    const nQ = Math.round(Math.log2(stateOrRng.length));
    const res = measureQubitN(stateOrRng, qubitOrTheta, nQ);
    return { outcome: res.outcome, collapsedBit: res.outcome, state: res.collapsed };
  }
  if (typeof qubitOrTheta === 'number' && typeof stateOrRng === 'function') {
    const r = (stateOrRng as () => number)();
    const outcome: 0 | 1 = r > 0.5 ? 1 : 0;
    return { outcome, collapsedBit: outcome, state: [{ re: 1, im: 0 }, { re: 0, im: 0 }] };
  }
  const outcome = Math.random() > 0.5 ? 1 : 0;
  return { outcome, collapsedBit: outcome, state: stateOrRng };
}

const presetC = (_re: number, _im = 0): { re: number; im: number } => ({ re: _re, im: _im });
export const MAX_QUBITS_LIMIT = 6;

export function bellState(type: string = 'phi+'): StateVector {
  const invSqrt2 = Math.SQRT1_2;
  const size = 4;
  const vec: StateVector = new Array(size).fill(0).map(() => presetC(0));
  if (type === 'phi+') {
    vec[0] = presetC(invSqrt2);
    vec[3] = presetC(invSqrt2);
  } else if (type === 'psi+') {
    vec[1] = presetC(invSqrt2);
    vec[2] = presetC(invSqrt2);
  } else if (type === 'phi-') {
    vec[0] = presetC(invSqrt2);
    vec[3] = presetC(-invSqrt2);
  } else if (type === 'psi-') {
    vec[1] = presetC(invSqrt2);
    vec[2] = presetC(-invSqrt2);
  } else {
    vec[0] = presetC(invSqrt2);
    vec[3] = presetC(invSqrt2);
  }
  return vec;
}

export function ghzState(numQubits: number = 3): StateVector {
  if (numQubits > MAX_QUBITS_LIMIT || numQubits <= 0) {
    throw new Error('Invalid number of qubits for GHZ state');
  }
  const size = 1 << numQubits;
  const vec: StateVector = new Array(size).fill(0).map(() => presetC(0));
  const inv = Math.SQRT1_2;
  vec[0] = presetC(inv);
  vec[size - 1] = presetC(inv);
  return vec;
}

export function wState(numQubits: number = 3): StateVector {
  if (numQubits > MAX_QUBITS_LIMIT || numQubits <= 0) {
    throw new Error('Invalid number of qubits for W state');
  }
  const size = 1 << numQubits;
  const vec: StateVector = new Array(size).fill(0).map(() => presetC(0));
  const val = 1 / Math.sqrt(numQubits);
  for (let i = 0; i < numQubits; i++) {
    vec[1 << i] = presetC(val);
  }
  return vec;
}

export function ghz6Circuit(): QuantumCircuit {
  let circuit = createEmptyCircuit(6);
  circuit = placeGate(circuit, { id: 'g1', type: 'H', targetQubit: 0, targets: [0], step: 0 }, 0);
  for (let i = 0; i < 5; i++) {
    circuit = placeGate(circuit, { id: `g${i+2}`, type: 'CNOT', targetQubit: i+1, controlQubit: i, targets: [i+1], controls: [i], step: i+1 }, i+1);
  }
  return circuit;
}

export function teleportation3Circuit(): QuantumCircuit {
  let circuit = createEmptyCircuit(3);
  circuit = placeGate(circuit, { id: 't1', type: 'H', targetQubit: 1, targets: [1], step: 0 }, 0);
  circuit = placeGate(circuit, { id: 't2', type: 'CNOT', targetQubit: 2, controlQubit: 1, targets: [2], controls: [1], step: 1 }, 1);
  circuit = placeGate(circuit, { id: 't3', type: 'CNOT', targetQubit: 1, controlQubit: 0, targets: [1], controls: [0], step: 2 }, 2);
  circuit = placeGate(circuit, { id: 't4', type: 'H', targetQubit: 0, targets: [0], step: 3 }, 3);
  return circuit;
}

export function qft3Circuit(): QuantumCircuit {
  let circuit = createEmptyCircuit(3);
  circuit = placeGate(circuit, { id: 'q1', type: 'H', targetQubit: 0, targets: [0], step: 0 }, 0);
  circuit = placeGate(circuit, { id: 'q2', type: 'H', targetQubit: 1, targets: [1], step: 1 }, 1);
  circuit = placeGate(circuit, { id: 'q3', type: 'H', targetQubit: 2, targets: [2], step: 2 }, 2);
  return circuit;
}

export const QUANTUM_PRESETS = {
  bell: bellState,
  ghz: ghzState,
  w: wState,
  ghz6: ghz6Circuit,
  teleportation3: teleportation3Circuit,
  qft3: qft3Circuit,
};

export {
  qubitToFrequency,
  gateDurationMs,
  adsrEnvelope,
} from './audio/sonification';
export type { ScaleName, AdsrEnvelope } from './audio/sonification';

export const MAX_QUBITS_SV = 6;
export const MAX_QUBITS = MAX_QUBITS_SV;
export const MAX_DIM = 1 << MAX_QUBITS_SV;

export function dimOf(numQubits: number): number {
  if (!Number.isInteger(numQubits) || numQubits < 0 || numQubits > MAX_QUBITS_SV) {
    throw new RangeError('nQubits must be an integer in [0, ' + MAX_QUBITS_SV + '], received: ' + numQubits);
  }
  return 1 << numQubits;
}

export function createZeroState(_nQubits: number): StateVector {
  const dim = dimOf(_nQubits);
  const s: StateVector = new Array(dim);
  s[0] = { re: 1, im: 0 };
  for (let i = 1; i < dim; i++) s[i] = { re: 0, im: 0 };
  return s;
}

export function probability(_state: StateVector, _basisIndex: number): number {
  const a = _state[_basisIndex];
  if (!a) return 0;
  return a.re * a.re + a.im * a.im;
}

export function probabilities(state: StateVector): number[] {
  return state.map((_, _i) => probability(state, _i));
}

export function norm(state: StateVector): number {
  let acc = 0;
  for (let i = 0; i < state.length; i++) {
    const a = state[i];
    acc += a.re * a.re + a.im * a.im;
  }
  return Math.sqrt(acc);
}

export function normalize(state: StateVector): StateVector {
  const n = norm(state);
  if (n === 0) {
    const out: StateVector = state.map(() => ({ re: 0, im: 0 }));
    if (out.length > 0) out[0] = { re: 1, im: 0 };
    return out;
  }
  return state.map((a) => ({ re: a.re / n, im: a.im / n }));
}

export function innerProduct(a: StateVector, b: StateVector): Complex {
  let re = 0;
  let im = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    re += a[i].re * b[i].re + a[i].im * b[i].im;
    im += a[i].re * b[i].im - a[i].im * b[i].re;
  }
  return { re, im };
}

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

export function createInitialState(_nQubits: number): StateVector {
  return createZeroState(_nQubits);
}

export interface ComplexType {
  re: number;
  im: number;
}

export interface QuantumState {
  vector: StateVector;
  numQubits: number;
}

export interface LabState {
  readonly snapshot: Readonly<LabSnapshot>;
  dispatch(event: LabEvent): void;
  reset(): void;
}

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