import { QuantumCircuit, StateVector } from '../types';
import { createEmptyCircuit, placeGate } from './circuit';

const c = (re: number, im = 0): { re: number; im: number } => ({ re, im });
export const MAX_QUBITS = 6;

export function bellState(type: string = 'phi+'): StateVector {
  const invSqrt2 = Math.SQRT1_2;
  const size = 4;
  const vec: StateVector = new Array(size).fill(0).map(() => c(0));
  if (type === 'phi+') {
    vec[0] = c(invSqrt2);
    vec[3] = c(invSqrt2);
  } else if (type === 'psi+') {
    vec[1] = c(invSqrt2);
    vec[2] = c(invSqrt2);
  } else if (type === 'phi-') {
    vec[0] = c(invSqrt2);
    vec[3] = c(-invSqrt2);
  } else if (type === 'psi-') {
    vec[1] = c(invSqrt2);
    vec[2] = c(-invSqrt2);
  } else {
    vec[0] = c(invSqrt2);
    vec[3] = c(invSqrt2);
  }
  return vec;
}

export function ghzState(nQubits: number = 3): StateVector {
  if (nQubits > MAX_QUBITS || nQubits <= 0) {
    throw new Error('Invalid number of qubits for GHZ state');
  }
  const size = 1 << nQubits;
  const vec: StateVector = new Array(size).fill(0).map(() => c(0));
  const inv = Math.SQRT1_2;
  vec[0] = c(inv);
  vec[size - 1] = c(inv);
  return vec;
}

export function wState(nQubits: number = 3): StateVector {
  if (nQubits > MAX_QUBITS || nQubits <= 0) {
    throw new Error('Invalid number of qubits for W state');
  }
  const size = 1 << nQubits;
  const vec: StateVector = new Array(size).fill(0).map(() => c(0));
  const val = 1 / Math.sqrt(nQubits);
  for (let i = 0; i < nQubits; i++) {
    vec[1 << i] = c(val);
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
