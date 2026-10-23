import { describe, it, expect } from 'vitest';
import {
  computeStateMetrics,
  applyGate,
  measureState,
  type QubitState,
} from '@/core/qubitMath';

describe('quantumCore - Pure Single-Qubit Engine', () => {
  describe('computeStateMetrics', () => {
    it('verifies probability normalization: prob0 + prob1 === 1.0', () => {
      // Ground state |0⟩
      const state0: QubitState = { theta: 0, phi: 0 };
      const metrics0 = computeStateMetrics(state0);
      expect(metrics0.prob0).toBe(1.0);
      expect(metrics0.prob1).toBe(0.0);
      expect(metrics0.prob0 + metrics0.prob1).toBe(1.0);
      expect(metrics0.prob0 + metrics0.prob1 === 1.0).toBe(true);

      // Excited state |1⟩
      const state1: QubitState = { theta: Math.PI, phi: 0 };
      const metrics1 = computeStateMetrics(state1);
      expect(metrics1.prob1).toBe(1.0);
      expect(metrics1.prob0 + metrics1.prob1).toBe(1.0);
      expect(metrics1.prob0 + metrics1.prob1 === 1.0).toBe(true);

      // Superposition state |+⟩
      const statePlus: QubitState = { theta: Math.PI / 2, phi: 0 };
      const metricsPlus = computeStateMetrics(statePlus);
      expect(metricsPlus.prob0 + metricsPlus.prob1).toBe(1.0);
      expect(metricsPlus.prob0 + metricsPlus.prob1 === 1.0).toBe(true);

      // Arbitrary angles
      const arbitraryStates: QubitState[] = [
        { theta: Math.PI / 4, phi: 0 },
        { theta: Math.PI / 3, phi: Math.PI / 6 },
        { theta: (2 * Math.PI) / 3, phi: Math.PI / 4 },
        { theta: (3 * Math.PI) / 4, phi: Math.PI / 2 },
      ];

      for (const s of arbitraryStates) {
        const m = computeStateMetrics(s);
        expect(m.prob0 + m.prob1).toBeCloseTo(1.0, 10);
      }
    });

    it('computes correct alpha, betaReal, and betaImag components', () => {
      // |+i⟩ state: theta = π/2, phi = π/2
      // |+i⟩ = (1/√2)|0⟩ + (i/√2)|1⟩
      const statePlusI: QubitState = { theta: Math.PI / 2, phi: Math.PI / 2 };
      const metrics = computeStateMetrics(statePlusI);

      expect(metrics.alpha).toBeCloseTo(Math.SQRT1_2);
      expect(metrics.betaReal).toBeCloseTo(0.0);
      expect(metrics.betaImag).toBeCloseTo(Math.SQRT1_2);
      expect(metrics.prob0).toBeCloseTo(0.5);
      expect(metrics.prob1).toBeCloseTo(0.5);
    });
  });

  describe('applyGate', () => {
    it('Hadamard gate applied to |0> yields equal superposition (prob0 ≈ 0.5, prob1 ≈ 0.5)', () => {
      const state0: QubitState = { theta: 0, phi: 0 };
      const stateH = applyGate(state0, 'H');

      expect(stateH.theta).toBeCloseTo(Math.PI / 2);
      expect(stateH.phi).toBe(0);

      const metrics = computeStateMetrics(stateH);
      expect(metrics.prob0).toBeCloseTo(0.5);
      expect(metrics.prob1).toBeCloseTo(0.5);
    });

    it('Pauli-X applied to |0> yields |1> (prob1 === 1.0)', () => {
      const state0: QubitState = { theta: 0, phi: 0 };
      const stateX = applyGate(state0, 'X');

      expect(stateX.theta).toBe(Math.PI);
      expect(stateX.phi).toBe(0);

      const metrics = computeStateMetrics(stateX);
      expect(metrics.prob1).toBe(1.0);
      expect(metrics.prob1 === 1.0).toBe(true);
    });

    it('Pauli-Z applied to |+> yields |->', () => {
      const statePlus: QubitState = { theta: Math.PI / 2, phi: 0 };
      const stateZ = applyGate(statePlus, 'Z');

      expect(stateZ.theta).toBeCloseTo(Math.PI / 2);
      expect(stateZ.phi).toBeCloseTo(Math.PI);

      const metrics = computeStateMetrics(stateZ);
      expect(metrics.betaReal).toBeCloseTo(-Math.SQRT1_2);
      expect(metrics.betaImag).toBeCloseTo(0.0);
      expect(metrics.prob0).toBeCloseTo(0.5);
      expect(metrics.prob1).toBeCloseTo(0.5);
    });

    it('satisfies involution for H, X, and Z gates (U² = I)', () => {
      const state0: QubitState = { theta: 0, phi: 0 };

      // H(H|0⟩) = |0⟩
      const hh0 = applyGate(applyGate(state0, 'H'), 'H');
      expect(hh0.theta).toBe(0);
      expect(hh0.phi).toBe(0);

      // X(X|0⟩) = |0⟩
      const xx0 = applyGate(applyGate(state0, 'X'), 'X');
      expect(xx0.theta).toBe(0);
      expect(xx0.phi).toBe(0);

      // Z(Z|+⟩) = |+⟩
      const statePlus: QubitState = { theta: Math.PI / 2, phi: 0 };
      const zzPlus = applyGate(applyGate(statePlus, 'Z'), 'Z');
      expect(zzPlus.theta).toBeCloseTo(Math.PI / 2);
      expect(zzPlus.phi).toBeCloseTo(0);
    });

    it('Pauli-Y applied to |0> yields |1> with pi phase flip', () => {
      const state0: QubitState = { theta: 0, phi: 0 };
      const stateY = applyGate(state0, 'Y');
      expect(stateY.theta).toBe(Math.PI);

      // Y(Y|0⟩) = |0⟩
      const yy0 = applyGate(stateY, 'Y');
      expect(yy0.theta).toBe(0);
    });

    it('Phase gate S advances phase by π/2 and satisfies S² = Z', () => {
      const statePlus: QubitState = { theta: Math.PI / 2, phi: 0 };
      const stateS = applyGate(statePlus, 'S');

      expect(stateS.theta).toBeCloseTo(Math.PI / 2);
      expect(stateS.phi).toBeCloseTo(Math.PI / 2);

      // S² = Z
      const stateSS = applyGate(stateS, 'S');
      const stateZ = applyGate(statePlus, 'Z');
      expect(stateSS.theta).toBeCloseTo(stateZ.theta);
      expect(stateSS.phi).toBeCloseTo(stateZ.phi);
    });

    it('T gate advances phase by π/4 and satisfies T² = S', () => {
      const statePlus: QubitState = { theta: Math.PI / 2, phi: 0 };
      const stateT = applyGate(statePlus, 'T');

      expect(stateT.theta).toBeCloseTo(Math.PI / 2);
      expect(stateT.phi).toBeCloseTo(Math.PI / 4);

      // T² = S
      const stateTT = applyGate(stateT, 'T');
      const stateS = applyGate(statePlus, 'S');
      expect(stateTT.theta).toBeCloseTo(stateS.theta);
      expect(stateTT.phi).toBeCloseTo(stateS.phi);
    });
  });

  describe('measureState', () => {
    it('collapses state |0> deterministically to outcome 0 (theta=0, phi=0)', () => {
      const state0: QubitState = { theta: 0, phi: 0 };
      const { outcome, newState } = measureState(state0);

      expect(outcome).toBe(0);
      expect(newState.theta).toBe(0);
      expect(newState.phi).toBe(0);
    });

    it('collapses state |1> deterministically to outcome 1 (theta=PI, phi=0)', () => {
      const state1: QubitState = { theta: Math.PI, phi: 0 };
      const { outcome, newState } = measureState(state1);

      expect(outcome).toBe(1);
      expect(newState.theta).toBe(Math.PI);
      expect(newState.phi).toBe(0);
    });

    it('stochastically collapses superposition based on prob0 with controlled random values', () => {
      const equalSuperposition: QubitState = { theta: Math.PI / 2, phi: 0 };

      // randomValue < prob0 (0.2 < 0.5) -> collapses to 0
      const collapsed0 = measureState(equalSuperposition, 0.2);
      expect(collapsed0.outcome).toBe(0);
      expect(collapsed0.newState).toEqual({ theta: 0, phi: 0 });

      // randomValue >= prob0 (0.7 >= 0.5) -> collapses to 1
      const collapsed1 = measureState(equalSuperposition, 0.7);
      expect(collapsed1.outcome).toBe(1);
      expect(collapsed1.newState).toEqual({ theta: Math.PI, phi: 0 });
    });

    it('produces valid outcomes with default stochastic random values', () => {
      const state: QubitState = { theta: Math.PI / 2, phi: 0 };
      const { outcome, newState } = measureState(state);

      expect([0, 1]).toContain(outcome);
      if (outcome === 0) {
        expect(newState).toEqual({ theta: 0, phi: 0 });
      } else {
        expect(newState).toEqual({ theta: Math.PI, phi: 0 });
      }
    });
  });
});
