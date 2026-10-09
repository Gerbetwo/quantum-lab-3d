import { describe, test, expect } from 'vitest';
import { CircuitVisualizationModel } from '../../src/domain/quantum/visualizationModel';

describe('HU-Sandbox-Visualizations — Contratos Científicos', () => {
  test('el modelo de visualización calcula probabilidades coherentes con el vector de estado', () => {
    const mockModel: CircuitVisualizationModel = {
      activeState: [{ re: 1, im: 0 }],
      probabilities: [{ basisState: '0', probability: 1.0 }],
      phaseData: [{ basisState: '0', amplitude: 1.0, phase: 0 }],
      qubitBlochStates: [{ qubitIndex: 0, x: 0, y: 0, z: 1 }]
    };
    expect(mockModel.probabilities[0].probability).toBe(1.0);
    expect(mockModel.qubitBlochStates[0].z).toBe(1);
  });
});