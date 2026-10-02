import { normalizeStateVector } from './statevector';
/**
 * Quantum Circuit Domain Model (pure, no React, no Three.js).
 *
 * Supports up to 6 qubits and 16 time steps.
 * Gates: H, X, Y, Z, S, T, CNOT, CZ, SWAP, CS, CT.
 */

import type { StateVector } from './statevector';
import { createZeroState } from './statevector';
import {
  H, X, Y, Z, S, T,
  applyGateN, applyCNOT_N, applyCZ_N, applySWAP_N, applyControlledPhaseN,
} from './gatesN';

export type GateType = 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T'
                     | 'CNOT' | 'CZ' | 'SWAP' | 'CS' | 'CT';

export type QubitIndex = 0 | 1 | 2 | 3 | 4 | 5;

export const MAX_DEPTH = 16;
export const MIN_QUBITS_CIRCUIT = 1;
export const MAX_QUBITS_CIRCUIT = 6;

export interface PlacedGate {
  readonly id: string;
  readonly type: GateType;
  readonly step: number;
  readonly targets: readonly QubitIndex[];
  readonly controls?: readonly QubitIndex[];
}

export interface CircuitStep {
  readonly index: number;
  readonly gates: readonly PlacedGate[];
}

export interface QuantumCircuit {
  readonly nQubits: number;
  readonly depth: number;
  readonly steps: readonly CircuitStep[];
}

export interface StateVectorHistory {
  readonly initial: StateVector;
  readonly afterEachStep: readonly StateVector[];
  readonly final: StateVector;
}

export interface ValidationResult {
  readonly ok: boolean;
  readonly errors: readonly string[];
}

function assertNever(x: never): never {
  throw new Error('Unhandled gate type: ' + String(x));
}

export function createEmptyCircuit(nQubits: number, depth: number = MAX_DEPTH): QuantumCircuit {
  if (!Number.isInteger(nQubits) || nQubits < MIN_QUBITS_CIRCUIT || nQubits > MAX_QUBITS_CIRCUIT) {
    throw new RangeError('nQubits must be an integer in [1, 6], got ' + nQubits);
  }
  if (!Number.isInteger(depth) || depth < 1 || depth > MAX_DEPTH) {
    throw new RangeError('depth must be an integer in [1, ' + MAX_DEPTH + '], got ' + depth);
  }
  const steps: CircuitStep[] = [];
  for (let i = 0; i < depth; i++) steps.push({ index: i, gates: [] });
  return { nQubits, depth, steps };
}

function gateId(type: GateType, step: number, targets: readonly QubitIndex[]): string {
  return 'g-' + step + '-' + type + '-' + targets.join('-');
}

function validateGate(circuit: QuantumCircuit, gate: Omit<PlacedGate, 'id'>): void {
  const ctrls = gate.controls ?? [];
  if (!Number.isInteger(gate.step) || gate.step < 0 || gate.step >= circuit.depth) {
    throw new RangeError('step ' + gate.step + ' out of range [0, ' + circuit.depth + ')');
  }
  const totalQubits = gate.targets.length + ctrls.length;
  if (totalQubits < 1) throw new Error('gate must act on at least one qubit');
  if (totalQubits > 2) throw new Error('gate cannot act on more than 2 qubits');
  const all = [...gate.targets, ...ctrls];
  for (const q of all) {
    if (!Number.isInteger(q) || q < 0 || q >= circuit.nQubits) {
      throw new RangeError('qubit ' + q + ' out of range [0, ' + circuit.nQubits + ')');
    }
  }
  if (new Set(all).size !== all.length) {
    throw new RangeError('gate has duplicate qubits: ' + all.join(','));
  }
}

function gateTouchesQubit(gate: PlacedGate, q: QubitIndex): boolean {
  if (gate.targets.includes(q)) return true;
  if (gate.controls && gate.controls.includes(q)) return true;
  return false;
}

export function placeGate(circuit: QuantumCircuit, gate: Omit<PlacedGate, 'id'>): QuantumCircuit {
  validateGate(circuit, gate);
  const newGate: PlacedGate = {
    id: gateId(gate.type, gate.step, gate.targets),
    type: gate.type,
    step: gate.step,
    targets: gate.targets,
    ...(gate.controls && gate.controls.length > 0 ? { controls: gate.controls } : {}),
  };
  const allQubits = [...gate.targets, ...(gate.controls ?? [])];
  const newSteps = circuit.steps.map((step) => {
    if (step.index !== gate.step) return step;
    const filtered = step.gates.filter((g) => !allQubits.some((q) => gateTouchesQubit(g, q)));
    return { index: step.index, gates: [...filtered, newGate] };
  });
  return { nQubits: circuit.nQubits, depth: circuit.depth, steps: newSteps };
}

export function removeGate(circuit: QuantumCircuit, gateIdToRemove: string): QuantumCircuit {
  let changed = false;
  const newSteps = circuit.steps.map((step) => {
    const filtered = step.gates.filter((g) => g.id !== gateIdToRemove);
    if (filtered.length !== step.gates.length) changed = true;
    return changed ? { index: step.index, gates: filtered } : step;
  });
  return changed
    ? { nQubits: circuit.nQubits, depth: circuit.depth, steps: newSteps }
    : circuit;
}

export function clearStep(circuit: QuantumCircuit, stepIndex: number): QuantumCircuit {
  if (!Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex >= circuit.depth) {
    throw new RangeError('step ' + stepIndex + ' out of range [0, ' + circuit.depth + ')');
  }
  const newSteps = circuit.steps.map((s) =>
    s.index === stepIndex ? { index: s.index, gates: [] } : s,
  );
  return { nQubits: circuit.nQubits, depth: circuit.depth, steps: newSteps };
}

export function validateCircuit(circuit: QuantumCircuit): ValidationResult {
  const errors: string[] = [];
  if (!Number.isInteger(circuit.nQubits) || circuit.nQubits < MIN_QUBITS_CIRCUIT || circuit.nQubits > MAX_QUBITS_CIRCUIT) {
    errors.push('nQubits out of range');
  }
  if (!Number.isInteger(circuit.depth) || circuit.depth < 1 || circuit.depth > MAX_DEPTH) {
    errors.push('depth out of range');
  }
  if (circuit.steps.length !== circuit.depth) {
    errors.push('steps.length !== depth');
  }
  circuit.steps.forEach((step, i) => {
    if (step.index !== i) errors.push('step ' + i + ' has wrong index');
    step.gates.forEach((g) => {
      try {
        validateGate(circuit, g);
      } catch (e) {
        errors.push('step ' + i + ': ' + (e as Error).message);
      }
    });
  });
  return { ok: errors.length === 0, errors };
}

function applyGateToState(state: StateVector, gate: PlacedGate, nQubits: number): StateVector {
  const t0 = gate.targets[0];
  const t1 = gate.targets[1];
  const c0 = gate.controls?.[0];
  switch (gate.type) {
    case 'H': return applyGateN(state, H, t0, nQubits);
    case 'X': return applyGateN(state, X, t0, nQubits);
    case 'Y': return applyGateN(state, Y, t0, nQubits);
    case 'Z': return applyGateN(state, Z, t0, nQubits);
    case 'S': return applyGateN(state, S, t0, nQubits);
    case 'T': return applyGateN(state, T, t0, nQubits);
    case 'SWAP':
      if (t1 === undefined) throw new Error('SWAP requires 2 targets');
      return applySWAP_N(state, t0, t1, nQubits);
    case 'CNOT':
      if (c0 === undefined) throw new Error('CNOT requires a control');
      return applyCNOT_N(state, c0, t0, nQubits);
    case 'CZ':
      if (c0 === undefined) throw new Error('CZ requires a control');
      return applyCZ_N(state, c0, t0, nQubits);
    case 'CS':
      if (c0 === undefined) throw new Error('CS requires a control');
      return applyControlledPhaseN(state, c0, t0, Math.PI / 2, nQubits);
    case 'CT':
      if (c0 === undefined) throw new Error('CT requires a control');
      return applyControlledPhaseN(state, c0, t0, Math.PI / 4, nQubits);
    default: return assertNever(gate.type);
  }
}

export function evaluateCircuitStep(state: StateVector, step: CircuitStep, nQubits: number): StateVector {
  let s = state;
  for (const gate of step.gates) s = applyGateToState(s, gate, nQubits);
  return s;
}

export function evaluateFullCircuit(circuit: QuantumCircuit): StateVectorHistory {
  const initial = createZeroState(circuit.nQubits);
  const afterEachStep: StateVector[] = [];
  let current = initial;
  for (const step of circuit.steps) {
    current = evaluateCircuitStep(current, step, circuit.nQubits);
    afterEachStep.push(current);
  }
  return { initial, afterEachStep, final: current };
}

export function evaluateUpToStep(circuit: QuantumCircuit, nSteps: number): StateVector {
  const n = Math.max(0, Math.min(Math.floor(nSteps), circuit.steps.length));
  let state = createZeroState(circuit.nQubits);
  for (let i = 0; i < n; i++) {
    state = evaluateCircuitStep(state, circuit.steps[i], circuit.nQubits);
  }
  return state;
}