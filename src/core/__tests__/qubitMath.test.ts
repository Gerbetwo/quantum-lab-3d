import { describe, it, expect } from 'vitest';
import {
  normalizeAngleTheta,
  normalizeAnglePhi,
  computeStateVector,
  computeBlochCoordinates,
  measureQuantumState,
  createBellState,
  bellState,
  measureEntangledQubit,
  createEmptyCircuit,
  evaluateFullCircuit,
} from '../qubitMath';
import {
  calculateT2CoherenceTime,
  calculateCoherenceTime,
  kelvinToMilliKelvin,
  milliKelvinToKelvin,
  applyPhaseDecay,
} from '../decoherenceMath';

describe('qubitMath - Core Kinematics & Math Invariants', () => {
  describe('Angle Normalization Constraints', () => {
    it('clamps polar angle theta to [0, π]', () => {
      expect(normalizeAngleTheta(-1)).toBe(0);
      expect(normalizeAngleTheta(-0.0001)).toBe(0);
      expect(normalizeAngleTheta(0)).toBe(0);
      expect(normalizeAngleTheta(Math.PI / 2)).toBeCloseTo(Math.PI / 2);
      expect(normalizeAngleTheta(Math.PI)).toBeCloseTo(Math.PI);
      expect(normalizeAngleTheta(4.0)).toBeCloseTo(Math.PI);
      expect(normalizeAngleTheta(2 * Math.PI)).toBeCloseTo(Math.PI);
    });

    it('normalizes azimuthal angle phi into [0, 2π)', () => {
      expect(normalizeAnglePhi(0)).toBe(0);
      expect(normalizeAnglePhi(Math.PI)).toBeCloseTo(Math.PI);
      expect(normalizeAnglePhi(2 * Math.PI)).toBeCloseTo(0);
      expect(normalizeAnglePhi(3 * Math.PI)).toBeCloseTo(Math.PI);
      expect(normalizeAnglePhi(-Math.PI / 2)).toBeCloseTo(1.5 * Math.PI);
      expect(normalizeAnglePhi(-2 * Math.PI)).toBeCloseTo(0);
      expect(normalizeAnglePhi(5 * Math.PI / 2)).toBeCloseTo(Math.PI / 2);
    });
  });

  describe('Invariant: State Vector Normalization |α|² + |β|² = 1.0', () => {
    it('satisfies normalization for canonical basis states', () => {
      // |0⟩ state (theta = 0, phi = 0)
      const state0 = computeStateVector(0, 0);
      const prob0 = state0.alpha.real ** 2 + state0.alpha.imag ** 2;
      const prob1 = state0.beta.real ** 2 + state0.beta.imag ** 2;
      expect(prob0).toBeCloseTo(1.0, 7);
      expect(prob1).toBeCloseTo(0.0, 7);
      expect(prob0 + prob1).toBeCloseTo(1.0, 7);

      // |1⟩ state (theta = π, phi = 0)
      const state1 = computeStateVector(Math.PI, 0);
      const prob0_1 = state1.alpha.real ** 2 + state1.alpha.imag ** 2;
      const prob1_1 = state1.beta.real ** 2 + state1.beta.imag ** 2;
      expect(prob0_1).toBeCloseTo(0.0, 7);
      expect(prob1_1).toBeCloseTo(1.0, 7);
      expect(prob0_1 + prob1_1).toBeCloseTo(1.0, 7);
    });

    it('satisfies normalization for equatorial superposition states |+⟩, |-⟩, |+i⟩, |-i⟩', () => {
      const equatorial = [
        { name: '|+⟩', theta: Math.PI / 2, phi: 0 },
        { name: '|-⟩', theta: Math.PI / 2, phi: Math.PI },
        { name: '|+i⟩', theta: Math.PI / 2, phi: Math.PI / 2 },
        { name: '|-i⟩', theta: Math.PI / 2, phi: 1.5 * Math.PI },
      ];

      equatorial.forEach(({ theta, phi }) => {
        const state = computeStateVector(theta, phi);
        const normAlpha = state.alpha.real ** 2 + state.alpha.imag ** 2;
        const normBeta = state.beta.real ** 2 + state.beta.imag ** 2;
        expect(normAlpha).toBeCloseTo(0.5, 7);
        expect(normBeta).toBeCloseTo(0.5, 7);
        expect(normAlpha + normBeta).toBeCloseTo(1.0, 7);
      });
    });

    it('satisfies |α|² + |β|² = 1.0 across full parameter grid sweep', () => {
      const thetas = [0, 0.2, Math.PI / 6, Math.PI / 4, Math.PI / 3, Math.PI / 2, 2 * Math.PI / 3, Math.PI];
      const phis = [0, Math.PI / 4, Math.PI / 2, Math.PI, 1.5 * Math.PI, 1.9 * Math.PI];

      for (const theta of thetas) {
        for (const phi of phis) {
          const state = computeStateVector(theta, phi);
          const magAlpha = state.alpha.real ** 2 + state.alpha.imag ** 2;
          const magBeta = state.beta.real ** 2 + state.beta.imag ** 2;
          expect(magAlpha + magBeta).toBeCloseTo(1.0, 7);
        }
      }
    });
  });

  describe('Invariant: Bloch Sphere Coordinates & Born Rule Probabilities', () => {
    it('preserves unit sphere radius x² + y² + z² = 1.0', () => {
      const thetas = [0, Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4, Math.PI];
      const phis = [0, Math.PI / 3, Math.PI / 2, Math.PI, 5 * Math.PI / 3];

      for (const theta of thetas) {
        for (const phi of phis) {
          const bloch = computeBlochCoordinates(theta, phi);
          const radiusSq = bloch.x ** 2 + bloch.y ** 2 + bloch.z ** 2;
          expect(radiusSq).toBeCloseTo(1.0, 7);
          expect(bloch.prob0 + bloch.prob1).toBeCloseTo(1.0, 7);
          expect(bloch.prob0).toBeGreaterThanOrEqual(0);
          expect(bloch.prob1).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('matches exact Bloch vector coordinates for standard poles and axes', () => {
      // North pole |0⟩: (0, 0, 1)
      const north = computeBlochCoordinates(0, 0);
      expect(north.x).toBeCloseTo(0);
      expect(north.y).toBeCloseTo(0);
      expect(north.z).toBeCloseTo(1);
      expect(north.prob0).toBeCloseTo(1);
      expect(north.prob1).toBeCloseTo(0);

      // South pole |1⟩: (0, 0, -1)
      const south = computeBlochCoordinates(Math.PI, 0);
      expect(south.x).toBeCloseTo(0);
      expect(south.y).toBeCloseTo(0);
      expect(south.z).toBeCloseTo(-1);
      expect(south.prob0).toBeCloseTo(0);
      expect(south.prob1).toBeCloseTo(1);

      // +X pole |+⟩: (1, 0, 0)
      const posX = computeBlochCoordinates(Math.PI / 2, 0);
      expect(posX.x).toBeCloseTo(1);
      expect(posX.y).toBeCloseTo(0);
      expect(posX.z).toBeCloseTo(0);

      // +Y pole |+i⟩: (0, 1, 0)
      const posY = computeBlochCoordinates(Math.PI / 2, Math.PI / 2);
      expect(posY.x).toBeCloseTo(0);
      expect(posY.y).toBeCloseTo(1);
      expect(posY.z).toBeCloseTo(0);
    });
  });

  describe('Measurement & Wave-function Collapse', () => {
    it('deterministically collapses |0⟩ to outcome 0', () => {
      const res1 = measureQuantumState(0, 0, 0.0);
      expect(res1.outcome).toBe(0);
      expect(res1.probability).toBeCloseTo(1.0);
      expect(res1.collapsedState.theta).toBe(0);

      const res2 = measureQuantumState(0, 0, 0.99);
      expect(res2.outcome).toBe(0);
      expect(res2.probability).toBeCloseTo(1.0);
      expect(res2.collapsedState.theta).toBe(0);
    });

    it('deterministically collapses |1⟩ to outcome 1', () => {
      const res1 = measureQuantumState(Math.PI, 0, 0.05);
      expect(res1.outcome).toBe(1);
      expect(res1.probability).toBeCloseTo(1.0);
      expect(res1.collapsedState.theta).toBe(Math.PI);

      const res2 = measureQuantumState(Math.PI, 0, 0.99);
      expect(res2.outcome).toBe(1);
      expect(res2.probability).toBeCloseTo(1.0);
      expect(res2.collapsedState.theta).toBe(Math.PI);
    });

    it('collapses balanced superposition according to randomSeed threshold', () => {
      // prob0 = 0.5
      const res0 = measureQuantumState(Math.PI / 2, 0, 0.49);
      expect(res0.outcome).toBe(0);
      expect(res0.probability).toBeCloseTo(0.5);
      expect(res0.collapsedState.theta).toBe(0);

      const res1 = measureQuantumState(Math.PI / 2, 0, 0.51);
      expect(res1.outcome).toBe(1);
      expect(res1.probability).toBeCloseTo(0.5);
      expect(res1.collapsedState.theta).toBe(Math.PI);
    });
  });

  describe('Bell State Entanglement Correlation', () => {
    it('creates canonical Bell state |Φ+⟩ with 50/50 probabilities', () => {
      const bell = createBellState();
      expect(bell.pair).toBe('|Φ+⟩ = 1/√2(|00⟩ + |11⟩)');
      expect(bell.probability00).toBe(0.5);
      expect(bell.probability11).toBe(0.5);

      const bellAlias = bellState();
      expect(bellAlias).toEqual(bell);
    });

    it('exhibits 100% correlation between Alice and Bob upon entangled measurement', () => {
      // Seed < 0.5 -> |00⟩
      const collapse00 = measureEntangledQubit(0.3);
      expect(collapse00.localOutcome).toBe(0);
      expect(collapse00.remoteOutcome).toBe(0);
      expect(collapse00.aliceOutcome).toBe(0);
      expect(collapse00.bobOutcome).toBe(0);
      expect(collapse00.state).toBe('|00⟩');

      // Seed >= 0.5 -> |11⟩
      const collapse11 = measureEntangledQubit(0.7);
      expect(collapse11.localOutcome).toBe(1);
      expect(collapse11.remoteOutcome).toBe(1);
      expect(collapse11.aliceOutcome).toBe(1);
      expect(collapse11.bobOutcome).toBe(1);
      expect(collapse11.state).toBe('|11⟩');

      // Random sample invariant
      for (let s = 0; s < 1; s += 0.1) {
        const m = measureEntangledQubit(s);
        expect(m.aliceOutcome).toBe(m.bobOutcome);
        expect(m.localOutcome).toBe(m.remoteOutcome);
      }
    });
  });

  describe('Circuit Helpers', () => {
    it('initializes empty circuit with correct structure', () => {
      const circuit = createEmptyCircuit(3, 8);
      expect(circuit.numQubits).toBe(3);
      expect(circuit.maxDepth).toBe(8);
      expect(circuit.steps).toEqual([]);
    });

    it('evaluates full circuit stub gracefully', () => {
      const circuit = createEmptyCircuit(1);
      const evaluated = evaluateFullCircuit(circuit);
      expect(evaluated.final).toEqual([]);
    });
  });

  describe('Thermal Decoherence Invariants: T2 Exponential Decay', () => {
    it('converts between Kelvin and milliKelvin correctly', () => {
      expect(kelvinToMilliKelvin(0.015)).toBe(15);
      expect(kelvinToMilliKelvin(1)).toBe(1000);
      expect(kelvinToMilliKelvin(300)).toBe(300000);

      expect(milliKelvinToKelvin(15)).toBeCloseTo(0.015);
      expect(milliKelvinToKelvin(1000)).toBe(1);
      expect(milliKelvinToKelvin(300000)).toBe(300);
    });

    it('evaluates T2(T) = 250 * e^(-T / 800) μs across temperature range', () => {
      // At baseline cryostat temp 15 mK: 250 * e^(-15 / 800) = 250 * 0.981423... ≈ 245.356 μs
      const t2_15 = calculateT2CoherenceTime(15);
      expect(t2_15).toBeCloseTo(245.356, 2);

      // At characteristic T = 800 mK: 250 * e^(-1) ≈ 91.970 μs
      const t2_800 = calculateT2CoherenceTime(800);
      expect(t2_800).toBeCloseTo(91.970, 2);

      // At T = 1600 mK: 250 * e^(-2) ≈ 33.834 μs
      const t2_1600 = calculateT2CoherenceTime(1600);
      expect(t2_1600).toBeCloseTo(33.834, 2);

      // calculateCoherenceTime helper (Kelvin parameter)
      expect(calculateCoherenceTime(0.015)).toBeCloseTo(t2_15);
    });

    it('clamps temperatures outside [15 mK, 300,000 mK]', () => {
      // Sub-15 mK clamp
      const t2_neg = calculateT2CoherenceTime(-50);
      const t2_zero = calculateT2CoherenceTime(0);
      const t2_min = calculateT2CoherenceTime(15);
      expect(t2_neg).toBe(t2_min);
      expect(t2_zero).toBe(t2_min);

      // Above 300K clamp
      const t2_room = calculateT2CoherenceTime(300000);
      const t2_super = calculateT2CoherenceTime(500000);
      expect(t2_room).toBe(0);
      expect(t2_super).toBe(0);
    });

    it('demonstrates strict monotonic decrease of T2 with temperature', () => {
      const temps = [15, 50, 100, 250, 500, 800, 1500, 5000];
      for (let i = 0; i < temps.length - 1; i++) {
        expect(calculateT2CoherenceTime(temps[i])).toBeGreaterThan(
          calculateT2CoherenceTime(temps[i + 1])
        );
      }
    });

    it('evaluates phase decay and purity reduction over time', () => {
      const initialTheta = Math.PI / 2;
      const initialPhi = 0;
      const t2Us = 250; // 0.25 ms

      // At t = 0 ms, purity is 1.0
      const d0 = applyPhaseDecay(initialTheta, initialPhi, 0, t2Us);
      expect(d0.purity).toBe(1);
      expect(d0.theta).toBe(initialTheta);
      expect(d0.phi).toBe(initialPhi);

      // At t = 0.25 ms (1 * T2), purity is e^(-1) ≈ 0.3679
      const d1 = applyPhaseDecay(initialTheta, initialPhi, 0.25, t2Us);
      expect(d1.purity).toBeCloseTo(Math.exp(-1), 3);

      // Purity remains strictly within [0, 1]
      const dLong = applyPhaseDecay(initialTheta, initialPhi, 100, t2Us);
      expect(dLong.purity).toBeGreaterThanOrEqual(0);
      expect(dLong.purity).toBeLessThan(0.01);
    });
  });
});
