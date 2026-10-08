import { describe, it, expect } from 'vitest';
import {
  measureQubit,
  calculateMeasurementDistribution,
} from '../../src/domain/quantum/measurement';
describe('HU-07 — Deterministic Measurement & Collapse', () => {
  it('collapses to 0 when injectable random is less than P(0)', () => {
    const outcome = measureQubit(Math.PI / 2, () => 0.2);
    expect(outcome).toBe(0);
  });

  it('collapses to 1 when injectable random is greater than or equal to P(0)', () => {
    const outcome = measureQubit(Math.PI / 2, () => 0.8);
    expect(outcome).toBe(1);
  });

  it('always collapses to 0 at North Pole (|0⟩) regardless of random sample < 1', () => {
    expect(measureQubit(0, () => 0.99)).toBe(0);
  });

  it('always collapses to 1 at South Pole (|1⟩) regardless of random sample > 0', () => {
    expect(measureQubit(Math.PI, () => 0.01)).toBe(1);
  });
});
describe('Quantum Measurement Engine', () => {
  it('colapsa el estado al medir según el valor de theta', () => {
    // Para theta = 0 (estado |0>), la medición siempre debe dar 0
    const outcome0 = measureQubit(0, () => 0.1);
    expect(outcome0).toBe(0);

    // Para theta = PI (estado |1>), la medición siempre debe dar 1
    const outcome1 = measureQubit(Math.PI, () => 0.1);
    expect(outcome1).toBe(1);
  });

  it('calcula la distribución de mediciones simuladas', () => {
    // Simulamos que el RNG siempre retorna un valor < prob0 para forzar resultado 0
    const dist = calculateMeasurementDistribution(Math.PI / 2, 100, () => 0.1);
    expect(dist.zeros).toBe(100);
    expect(dist.ones).toBe(0);
  });
});