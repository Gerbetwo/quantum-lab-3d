import { describe, it, expect } from 'vitest';
import {
  I_GATE, X_GATE, Z_GATE, H_GATE,
  applyGate, matrixMultiply, applyCNOT, evaluateCircuit,
  stateToBlochAngles, gatesApproxEqual, stateLabel,
  type StateVector,
} from '@/domain/quantum/gates';

const KET0: StateVector = [{ re: 1, im: 0 }, { re: 0, im: 0 }];
const KET1: StateVector = [{ re: 0, im: 0 }, { re: 1, im: 0 }];
const KET00: StateVector = [
  { re: 1, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 }, { re: 0, im: 0 },
];
const KET10: StateVector = [
  { re: 0, im: 0 }, { re: 0, im: 0 }, { re: 1, im: 0 }, { re: 0, im: 0 },
];

describe('HU-22..HU-26 - Quantum Gates & Circuits', () => {
  describe('Single-qubit gate actions', () => {
    it('X flips |0> to |1>', () => {
      const r = applyGate(KET0, X_GATE);
      expect(r[0].re).toBeCloseTo(0);
      expect(r[1].re).toBeCloseTo(1);
    });

    it('X flips |1> to |0>', () => {
      const r = applyGate(KET1, X_GATE);
      expect(r[0].re).toBeCloseTo(1);
      expect(r[1].re).toBeCloseTo(0);
    });

    it('Z leaves |0> unchanged', () => {
      expect(applyGate(KET0, Z_GATE)).toEqual(KET0);
    });

    it('Z phase-flips |1> to -|1>', () => {
      const r = applyGate(KET1, Z_GATE);
      expect(r[0].re).toBeCloseTo(0);
      expect(r[1].re).toBeCloseTo(-1);
    });

    it('H maps |0> to |+>', () => {
      const r = applyGate(KET0, H_GATE);
      expect(r[0].re).toBeCloseTo(Math.SQRT1_2);
      expect(r[1].re).toBeCloseTo(Math.SQRT1_2);
    });

    it('H maps |1> to |->', () => {
      const r = applyGate(KET1, H_GATE);
      expect(r[0].re).toBeCloseTo(Math.SQRT1_2);
      expect(r[1].re).toBeCloseTo(-Math.SQRT1_2);
    });
  });

  describe('Composition identities', () => {
    it('X^2 = I', () => {
      expect(gatesApproxEqual(matrixMultiply(X_GATE, X_GATE), I_GATE)).toBe(true);
    });

    it('Z^2 = I', () => {
      expect(gatesApproxEqual(matrixMultiply(Z_GATE, Z_GATE), I_GATE)).toBe(true);
    });

    it('H^2 = I', () => {
      expect(gatesApproxEqual(matrixMultiply(H_GATE, H_GATE), I_GATE)).toBe(true);
    });

    it('H * X * H = Z', () => {
      const hxh = matrixMultiply(H_GATE, matrixMultiply(X_GATE, H_GATE));
      expect(gatesApproxEqual(hxh, Z_GATE)).toBe(true);
    });
  });

  describe('CNOT entangling', () => {
    it('CNOT|00> = |00> (control off)', () => {
      expect(applyCNOT(KET00, 0)).toEqual(KET00);
    });

    it('CNOT|10> = |11> (control on, target flips)', () => {
      const r = applyCNOT(KET10, 0);
      expect(r[2].re).toBeCloseTo(0);
      expect(r[3].re).toBeCloseTo(1);
    });

    it('H then CNOT creates a Bell state', () => {
      const h = applyGate(KET0, H_GATE);
      const twoQ: StateVector = [h[0], { re: 0, im: 0 }, h[1], { re: 0, im: 0 }];
      const bell = applyCNOT(twoQ, 0);
      expect(bell[0].re).toBeCloseTo(Math.SQRT1_2);
      expect(bell[3].re).toBeCloseTo(Math.SQRT1_2);
    });
  });

  describe('evaluateCircuit', () => {
    it('empty circuit is identity', () => {
      expect(evaluateCircuit([], KET0)).toEqual(KET0);
    });

    it('H X H |0> = Z|0> = |0>', () => {
      const r = evaluateCircuit([H_GATE, X_GATE, H_GATE], KET0);
      expect(r[0].re).toBeCloseTo(1);
      expect(r[1].re).toBeCloseTo(0);
    });
  });

  describe('stateToBlochAngles', () => {
    it('|0> -> theta ~= 0', () => {
      expect(stateToBlochAngles(KET0).theta).toBeCloseTo(0);
    });
    it('|1> -> theta ~= pi', () => {
      expect(stateToBlochAngles(KET1).theta).toBeCloseTo(Math.PI);
    });
    it('|+> -> theta ~= pi/2', () => {
      const plus = applyGate(KET0, H_GATE);
      expect(stateToBlochAngles(plus).theta).toBeCloseTo(Math.PI / 2);
    });
  });

  describe('stateLabel', () => {
    it('identifies |0>, |1>, |+>, |->', () => {
      expect(stateLabel(KET0)).toBe('|0>');
      expect(stateLabel(KET1)).toBe('|1>');
      expect(stateLabel(applyGate(KET0, H_GATE))).toBe('|+>');
      expect(stateLabel(applyGate(KET1, H_GATE))).toBe('|->');
    });
  });
});
