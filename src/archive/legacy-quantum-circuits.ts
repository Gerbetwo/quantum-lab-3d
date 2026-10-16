/**
 * Legacy & Archive Quantum Circuit Presets & Matrix Utilities
 * Moved from src/lib/quantumCore.ts during Architecture Consolidation
 */

import { ComplexType } from '../core/types';

export interface QuantumCircuitGate {
  id: string;
  type: string;
  targetQubit: number;
  controlQubit?: number;
  params?: Record<string, number>;
}

export interface QuantumCircuitStep {
  stepIndex: number;
  gates: QuantumCircuitGate[];
}

export function kroneckerProduct(m1: ComplexType[][], m2: ComplexType[][]): ComplexType[][] {
  const r1 = m1.length, c1 = m1[0].length;
  const r2 = m2.length, c2 = m2[0].length;
  const result: ComplexType[][] = Array.from({ length: r1 * r2 }, () =>
    Array.from({ length: c1 * c2 }, () => ({ real: 0, imag: 0 }))
  );

  for (let i = 0; i < r1; i++) {
    for (let j = 0; j < c1; j++) {
      for (let k = 0; k < r2; k++) {
        for (let l = 0; l < c2; l++) {
          const a = m1[i][j];
          const b = m2[k][l];
          result[i * r2 + k][j * c2 + l] = {
            real: a.real * b.real - a.imag * b.imag,
            imag: a.real * b.imag + a.imag * b.real,
          };
        }
      }
    }
  }
  return result;
}

export function evaluateCircuitStep(state: ComplexType[], gates: QuantumCircuitGate[]): ComplexType[] {
  // Pass-through state evaluation stub for legacy circuit execution
  return [...state];
}

export function teleportation3Circuit(): QuantumCircuitStep[] {
  return [
    { stepIndex: 0, gates: [{ id: 'h0', type: 'H', targetQubit: 1 }] },
    { stepIndex: 1, gates: [{ id: 'cx12', type: 'CX', targetQubit: 2, controlQubit: 1 }] },
    { stepIndex: 2, gates: [{ id: 'cx01', type: 'CX', targetQubit: 1, controlQubit: 0 }] },
    { stepIndex: 3, gates: [{ id: 'h0_2', type: 'H', targetQubit: 0 }] },
  ];
}

export function qft3Circuit(): QuantumCircuitStep[] {
  return [
    { stepIndex: 0, gates: [{ id: 'qft_h0', type: 'H', targetQubit: 0 }] },
    { stepIndex: 1, gates: [{ id: 'qft_cp01', type: 'CP', targetQubit: 1, controlQubit: 0 }] },
    { stepIndex: 2, gates: [{ id: 'qft_h1', type: 'H', targetQubit: 1 }] },
  ];
}

export type AdsrEnvelope = {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
};
