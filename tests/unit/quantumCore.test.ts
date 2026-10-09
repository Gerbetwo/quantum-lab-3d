import { describe, test, expect } from 'vitest';
import { measureQubitState, validateCircuit, createInitialState } from '../../src/domain/quantum';

describe('Capa de Dominio Cuántico (Motor Canónico)', () => {
  test('Validación de circuitos: detecta índices de qubit inválidos', () => {
    const invalidCircuit = {
      numQubits: 2,
      gates: [{ id: 'g1', type: 'H' as const, targetQubit: 5 }],
    };
    const validation = validateCircuit(invalidCircuit);
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });

  test('Medición determinista con inyección de RNG', () => {
    const state: [number, number] = [Math.SQRT1_2, Math.SQRT1_2]; // prob0 = 0.5
    const result0 = measureQubitState(0, state, () => 0.2);
    expect(result0.collapsedBit).toBe(0);

    const result1 = measureQubitState(0, state, () => 0.8);
    expect(result1.collapsedBit).toBe(1);
  });

  test('Inicialización de estado', () => {
    const states = createInitialState(3);
    expect(states.length).toBe(3);
    expect(states[0]).toEqual([1, 0]);
  });
});
