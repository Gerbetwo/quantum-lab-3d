import {
  GateType,
  QubitIndex,
  PlacedGate,
  CircuitStep,
  QuantumCircuit,
  StateVectorHistory,
  ValidationResult,
  StateVector,
} from './types';

export type {
  GateType,
  QubitIndex,
  PlacedGate,
  CircuitStep,
  QuantumCircuit,
  StateVectorHistory,
  ValidationResult,
};

export const MAX_DEPTH = 16;
export const MIN_QUBITS_CIRCUIT = 1;
export const MAX_QUBITS_CIRCUIT = 6;

export function createEmptyCircuit(nQubits: number, depth: number = MAX_DEPTH): QuantumCircuit {
  if (nQubits < MIN_QUBITS_CIRCUIT || nQubits > MAX_QUBITS_CIRCUIT) {
    throw new Error(`Número de qubits fuera de rango (${MIN_QUBITS_CIRCUIT}-${MAX_QUBITS_CIRCUIT}).`);
  }
  if (depth <= 0 || depth > MAX_DEPTH) {
    throw new Error(`Profundidad fuera de rango (1-${MAX_DEPTH}).`);
  }

  const steps: CircuitStep[] = Array.from({ length: depth }, (_, i) => ({
    step: i,
    gates: [],
  }));
  return { numQubits: nQubits, nQubits, depth, steps, gates: [] };
}

export function createInitialState(numQubits: number): [number, number][] {
  return Array.from({ length: numQubits }, () => [1, 0]);
}

export function initialStateN(nQubits: number): StateVector {
  const dim = 1 << nQubits;
  const state: StateVector = Array.from({ length: dim }, () => ({ re: 0, im: 0 }));
  state[0] = { re: 1, im: 0 };
  return state;
}

export function evaluateStepN(state: StateVector, step: CircuitStep, nQubits: number): StateVector {
  let curr = [...state];
  if (!step || !step.gates) return curr;

  for (const gate of step.gates) {
    const targets = gate.targets || (gate.targetQubit !== undefined ? [gate.targetQubit] : []);
    const controls = gate.controls || (gate.controlQubit !== undefined ? [gate.controlQubit] : []);
    if (targets.length === 0) continue;
    const target = targets[0];
    const dim = curr.length;
    const next: StateVector = Array.from({ length: dim }, () => ({ re: 0, im: 0 }));

    const isH = gate.type === 'H';
    const isX = gate.type === 'X';
    const isZ = gate.type === 'Z';
    const isCNOT = gate.type === 'CNOT';

    for (let i = 0; i < dim; i++) {
      const bit = (i >> (nQubits - 1 - target)) & 1;
      const peer = i ^ (1 << (nQubits - 1 - target));

      if (isCNOT && controls.length > 0) {
        const control = controls[0];
        const controlBit = (i >> (nQubits - 1 - control)) & 1;
        if (controlBit === 1) {
          next[i] = curr[peer];
        } else {
          next[i] = { ...curr[i] };
        }
      } else if (isX) {
        next[i] = curr[peer];
      } else if (isZ) {
        const val = curr[i];
        next[i] = bit === 1 ? { re: -val.re, im: -val.im } : { ...val };
      } else if (isH) {
        const inv = 1 / Math.SQRT2;
        const v0 = bit === 0 ? curr[i] : curr[peer];
        const v1 = bit === 0 ? curr[peer] : curr[i];
        const sign = bit === 1 ? -1 : 1;
        
        const re = inv * (v0.re + sign * v1.re);
        const im = inv * (v0.im + sign * v1.im);
        next[i] = { re, im };
      } else {
        next[i] = { ...curr[i] };
      }
    }
    curr = next;
  }
  return curr;
}

export function placeGate(
  circuit: QuantumCircuit,
  gate: Omit<PlacedGate, 'id' | 'targets' | 'controls'> & {
    id?: string;
    targets?: number[];
    controls?: number[];
  }
): QuantumCircuit {
  const stepIdx = gate.step ?? 0;
  if (stepIdx < 0 || stepIdx >= circuit.depth) {
    throw new Error('Paso fuera de rango.');
  }

  const targetQ = gate.targetQubit ?? (gate.targets && gate.targets[0]) ?? 0;
  const controlQ = gate.controlQubit ?? (gate.controls && gate.controls[0]);

  const targets = gate.targets || [targetQ];
  const controls = gate.controls || (controlQ !== undefined ? [controlQ] : []);

  const nQ = circuit.nQubits ?? circuit.numQubits;
  for (const t of targets) {
    if (t < 0 || t >= nQ) {
      throw new Error(`Qubit objetivo ${t} fuera de rango.`);
    }
  }
  for (const c of controls) {
    if (c < 0 || c >= nQ) {
      throw new Error(`Qubit de control ${c} fuera de rango.`);
    }
  }
  if (gate.type === 'CNOT' || gate.type === 'CZ' || gate.type === 'CS' || gate.type === 'CT') {
    if (controls.length > 0 && targets.length > 0 && controls[0] === targets[0]) {
      throw new Error('El qubit de control y objetivo no pueden ser iguales.');
    }
  }

  const id = gate.id || `gate-${Math.random().toString(36).substring(2, 9)}`;
  const newPlacedGate: PlacedGate = {
    ...gate,
    id,
    targetQubit: targetQ,
    controlQubit: controlQ,
    targets,
    controls,
    step: stepIdx,
  };

  const newSteps = circuit.steps.map((stepObj) => {
    if (stepObj.step === stepIdx) {
      const filtered = stepObj.gates.filter((g) => {
        const gTargets = g.targets || (g.targetQubit !== undefined ? [g.targetQubit] : []);
        return !gTargets.some((t) => targets.includes(t));
      });
      return { ...stepObj, gates: [...filtered, newPlacedGate] };
    }
    return stepObj;
  });

  const allGates = newSteps.flatMap((s) => s.gates);
  return {
    ...circuit,
    numQubits: nQ,
    nQubits: nQ,
    depth: circuit.depth ?? MAX_DEPTH,
    steps: newSteps,
    gates: allGates,
  };
}

export function removeGate(circuit: QuantumCircuit, gateIdToRemove: string): QuantumCircuit {
  const newSteps = circuit.steps.map((step) => ({
    ...step,
    gates: step.gates.filter((g) => g.id !== gateIdToRemove),
  }));
  const allGates = newSteps.flatMap((s) => s.gates);
  const nQ = circuit.nQubits ?? circuit.numQubits;
  return {
    ...circuit,
    numQubits: nQ,
    nQubits: nQ,
    depth: circuit.depth ?? MAX_DEPTH,
    steps: newSteps,
    gates: allGates,
  };
}

export function clearStep(circuit: QuantumCircuit, stepIndex: number): QuantumCircuit {
  if (stepIndex < 0 || stepIndex >= circuit.depth) {
    throw new Error('Paso fuera de rango para limpiar.');
  }
  const newSteps = circuit.steps.map((s) => (s.step === stepIndex ? { ...s, gates: [] } : s));
  const allGates = newSteps.flatMap((s) => s.gates);
  const nQ = circuit.nQubits ?? circuit.numQubits;
  return {
    ...circuit,
    numQubits: nQ,
    nQubits: nQ,
    depth: circuit.depth ?? MAX_DEPTH,
    steps: newSteps,
    gates: allGates,
  };
}

export function validateCircuit(circuit: Partial<QuantumCircuit>): ValidationResult {
  const errors: string[] = [];
  const nQ = circuit.nQubits ?? circuit.numQubits ?? 0;

  if (nQ < MIN_QUBITS_CIRCUIT || nQ > MAX_QUBITS_CIRCUIT) {
    errors.push(`Número de qubits fuera de rango (${MIN_QUBITS_CIRCUIT}-${MAX_QUBITS_CIRCUIT}).`);
  }

  const gatesToValidate: PlacedGate[] = circuit.gates
    ? circuit.gates
    : circuit.steps
    ? circuit.steps.flatMap((s) => s.gates)
    : [];

  for (const gate of gatesToValidate) {
    const targets =
      gate.targets || (gate.targetQubit !== undefined ? [gate.targetQubit] : []);
    const controls =
      gate.controls || (gate.controlQubit !== undefined ? [gate.controlQubit] : []);

    for (const t of targets) {
      if (t < 0 || t >= nQ) {
        errors.push(`Qubit objetivo ${t} fuera de rango.`);
      }
    }
    for (const c of controls) {
      if (c < 0 || c >= nQ) {
        errors.push(`Qubit de control ${c} fuera de rango.`);
      }
      if (targets.includes(c)) {
        errors.push('Un qubit no puede actuar como control y objetivo a la vez.');
      }
    }
  }

  const isOk = errors.length === 0;
  return { ok: isOk, valid: isOk, errors };
}

export function evaluateCircuitStep(state: StateVector, step: CircuitStep, nQubits: number): StateVector {
  return evaluateStepN(state, step, nQubits);
}

export function evaluateFullCircuit(circuit: QuantumCircuit): StateVectorHistory {
  const nQ = circuit.numQubits || circuit.nQubits || 1;
  let currentState = initialStateN(nQ);
  const stepStates: StateVector[] = [currentState];

  const steps = circuit.steps || [];
  for (const step of steps) {
    currentState = evaluateStepN(currentState, step, nQ);
    stepStates.push(currentState);
  }

  const afterEachStep = stepStates.slice(1);
  const finalState = stepStates[stepStates.length - 1];

  return {
    stepStates,
    afterEachStep,
    final: finalState,
  };
}

export function evaluateUpToStep(circuit: QuantumCircuit, nSteps: number): StateVector {
  const depth = circuit.depth ?? MAX_DEPTH;
  const clamped = Math.max(0, Math.min(nSteps, depth));
  const history = evaluateFullCircuit(circuit);
  const targetIndex = Math.min(clamped, history.stepStates.length - 1);
  return history.stepStates[targetIndex];
}
