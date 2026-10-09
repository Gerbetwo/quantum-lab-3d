import { QuantumCircuit, CircuitStep, PlacedGate, StateVectorHistory, StateVector, ValidationResult, GateType, QubitIndex } from './types';
import { applyGateN, applyCNOT_N, applyCZ_N, applySWAP_N, applyControlledPhaseN, H, X, Y, Z, S, T, I } from './gates';

export type { QuantumCircuit, CircuitStep, PlacedGate, StateVectorHistory, StateVector, ValidationResult, GateType, QubitIndex };

export const MAX_DEPTH = 32;

export function createEmptyCircuit(nQubits: number, maxDepth: number = MAX_DEPTH): QuantumCircuit {
  if (nQubits <= 0 || maxDepth <= 0 || maxDepth > 64) {
    throw new Error('Invalid circuit dimensions');
  }
  return { nQubits, maxDepth, steps: [] };
}

export function placeGate(circuit: QuantumCircuit, gate: PlacedGate, stepIndex?: number): QuantumCircuit {
  const actualStep = stepIndex !== undefined ? stepIndex : (gate.step !== undefined ? gate.step : 0);
  if (actualStep < 0 || actualStep >= (circuit.maxDepth || MAX_DEPTH)) {
    throw new Error('Step out of range');
  }
  const nQ = circuit.nQubits;
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
  const currentGates = newSteps[actualStep].gates.filter(g => g.id !== gateId);
  newSteps[actualStep] = { ...newSteps[actualStep], gates: [...currentGates, gateWithId] };
  return { ...circuit, steps: newSteps };
}

export function removeGate(circuit: QuantumCircuit, gateId: string): QuantumCircuit {
  const newSteps = circuit.steps.map(s => ({
    ...s,
    gates: s.gates.filter(g => g.id !== gateId)
  }));
  return { ...circuit, steps: newSteps };
}

export function clearStep(circuit: QuantumCircuit, stepIndex: number): QuantumCircuit {
  const newSteps = circuit.steps.map(s => (s.step === stepIndex ? { ...s, gates: [] } : s));
  return { ...circuit, steps: newSteps };
}

export function validateCircuit(circuit: unknown): ValidationResult {
  const errors: string[] = [];
  const c = circuit as { nQubits?: number; numQubits?: number; steps?: CircuitStep[]; gates?: PlacedGate[] };
  const nQ = c?.nQubits ?? c?.numQubits;
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

export function evaluateCircuitStep(state: StateVector, step: CircuitStep, nQubits: number): StateVector {
  let currentState = [...state];
  for (const gate of step.gates || []) {
    const type = gate.type;
    const targets = gate.targets || (gate.targetQubit !== undefined ? [gate.targetQubit] : []);
    const controls = gate.controls || (gate.controlQubit !== undefined ? [gate.controlQubit] : []);

    if (type === 'H') {
      currentState = applyGateN(currentState, H, targets[0], nQubits);
    } else if (type === 'X') {
      currentState = applyGateN(currentState, X, targets[0], nQubits);
    } else if (type === 'Y') {
      currentState = applyGateN(currentState, Y, targets[0], nQubits);
    } else if (type === 'Z') {
      currentState = applyGateN(currentState, Z, targets[0], nQubits);
    } else if (type === 'S') {
      currentState = applyGateN(currentState, S, targets[0], nQubits);
    } else if (type === 'T') {
      currentState = applyGateN(currentState, T, targets[0], nQubits);
    } else if (type === 'I') {
      currentState = applyGateN(currentState, I, targets[0], nQubits);
    } else if (type === 'CNOT') {
      currentState = applyCNOT_N(currentState, controls[0], targets[0], nQubits);
    } else if (type === 'CZ') {
      currentState = applyCZ_N(currentState, controls[0], targets[0], nQubits);
    } else if (type === 'SWAP') {
      currentState = applySWAP_N(currentState, targets[0], targets[1], nQubits);
    } else if (type === 'CPHASE' || type === 'CR') {
      const phi = (gate.phi as number) || Math.PI / 2;
      currentState = applyControlledPhaseN(currentState, controls[0], targets[0], phi, nQubits);
    }
  }
  return currentState;
}

export function evaluateUpToStep(circuit: QuantumCircuit, maxStep: number): StateVectorHistory {
  const size = 1 << circuit.nQubits;
  let currentState: StateVector = new Array(size).fill(0).map((_, i) => ({ re: i === 0 ? 1 : 0, im: 0 }));
  const stepStates: StateVector[] = [currentState];

  for (let i = 0; i <= maxStep && i < (circuit.steps?.length || 0); i++) {
    currentState = evaluateCircuitStep(currentState, circuit.steps[i], circuit.nQubits);
    stepStates.push(currentState);
  }

  return {
    steps: stepStates,
    stepStates,
    afterEachStep: stepStates,
    final: currentState
  };
}

export function evaluateFullCircuit(circuit: QuantumCircuit): StateVectorHistory {
  const maxStep = (circuit.steps?.length || 1) - 1;
  return evaluateUpToStep(circuit, maxStep);
}

export function getStateAtStep(history: StateVectorHistory, stepIndex: number): StateVector {
  const states = history.stepStates || history.steps || [];
  if (states.length === 0) return history.final;
  const clamped = Math.max(0, Math.min(stepIndex, states.length - 1));
  return states[clamped] ?? history.final;
}
