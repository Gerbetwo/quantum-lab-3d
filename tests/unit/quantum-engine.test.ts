import { describe, it, expect } from 'vitest';
import {
  createZeroState, probability, probabilities, norm,
  type StateVector, type Complex,
} from '@/domain/quantum/statevector';
import {
  applyGateN, applyCNOT_N, applyCZ_N, applySWAP_N, applyControlledPhaseN,
  H, X, Y, Z, S, T, I, type GateMatrix,
} from '@/domain/quantum/gatesN';
import { applyGate, H_GATE, X_GATE, Z_GATE } from '@/domain/quantum/gates';
import {
   evaluateFullCircuit,
} from '@/domain/quantum/circuit';
import {
  ghz6Circuit, qft3Circuit, teleportation3Circuit, ghzState,
} from '@/domain/quantum/presets';
import { measureQubitN } from '@/domain/quantum/measureN';

const EPS = 1e-7;

function stratifiedRng(N: number): () => number {
  let i = 0;
  return () => (i++ + 0.5) / N;
}

function assertNormOne(state: StateVector): void {
  expect(Math.abs(norm(state) - 1)).toBeLessThan(EPS);
}

function assertProbsSumOne(state: StateVector): void {
  const total = probabilities(state).reduce((a, b) => a + b, 0);
  expect(Math.abs(total - 1)).toBeLessThan(EPS);
}

function applySequence(seed: number, len: number): StateVector {
  let s = seed >>> 0 || 1;
  const rand = (): number => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return ((s >>> 0) % 1_000_000) / 1_000_000;
  };
  let state = createZeroState(6);
  const singles: GateMatrix[] = [H, X, Y, Z, S, T, I];
  for (let i = 0; i < len; i++) {
    const kind = Math.floor(rand() * 4);
    const q = Math.floor(rand() * 6);
    if (kind === 0) {
      state = applyGateN(state, singles[Math.floor(rand() * singles.length)], q, 6);
    } else if (kind === 1) {
      let q2 = Math.floor(rand() * 6);
      if (q2 === q) q2 = (q + 1) % 6;
      state = applyCNOT_N(state, q, q2, 6);
    } else if (kind === 2) {
      let q2 = Math.floor(rand() * 6);
      if (q2 === q) q2 = (q + 1) % 6;
      state = applySWAP_N(state, q, q2, 6);
    } else {
      let q2 = Math.floor(rand() * 6);
      if (q2 === q) q2 = (q + 1) % 6;
      state = applyCZ_N(state, q, q2, 6);
    }
  }
  return state;
}

describe('Phase 4 - Quantum Engine Precision (6 qubits, eps=1e-7)', () => {
  describe('A. Norm and unitarity', () => {
    it('canonical sequence preserves norm', () => {
      let state = createZeroState(6);
      state = applyGateN(state, H, 0, 6);
      state = applyGateN(state, X, 1, 6);
      state = applyGateN(state, Y, 2, 6);
      state = applyGateN(state, Z, 3, 6);
      state = applyGateN(state, S, 4, 6);
      state = applyGateN(state, T, 5, 6);
      state = applyCNOT_N(state, 0, 1, 6);
      state = applyCZ_N(state, 2, 3, 6);
      state = applySWAP_N(state, 4, 5, 6);
      assertNormOne(state);
      assertProbsSumOne(state);
    });

    it('50 pseudo-random sequences of 20 gates preserve norm', () => {
      for (let seed = 1; seed <= 50; seed++) {
        const state = applySequence(seed, 20);
        assertNormOne(state);
        assertProbsSumOne(state);
      }
    });
  });

  describe('B. GHZ-6 matrix validation', () => {
    it('produces (|0..0> + |1..1>)/sqrt(2)', () => {
      const h = evaluateFullCircuit(ghz6Circuit());
      expect(probability(h.final, 0)).toBeCloseTo(0.5, 7);
      expect(probability(h.final, 63)).toBeCloseTo(0.5, 7);
      for (let i = 1; i < 63; i++) {
        expect(probability(h.final, i)).toBeLessThan(EPS);
      }
    });

    it('relative phase between |0..0> and |1..1> is 0 or pi', () => {
      const h = evaluateFullCircuit(ghz6Circuit());
      const a0 = h.final[0], a63 = h.final[63];
      const p0 = Math.atan2(a0.im, a0.re);
      const p63 = Math.atan2(a63.im, a63.re);
      const rel = ((p0 - p63) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
      const ok = Math.abs(rel) < EPS || Math.abs(rel - Math.PI) < EPS;
      expect(ok).toBe(true);
    });

    it('measuring q0 collapses all 6 qubits consistently', () => {
      const h = evaluateFullCircuit(ghz6Circuit());
      const r0 = measureQubitN(h.final, 0, 6, () => 0.4);
      if (r0.outcome === 0) {
        expect(probability(r0.collapsed, 0)).toBeCloseTo(1, 6);
        expect(probability(r0.collapsed, 63)).toBeLessThan(EPS);
      } else {
        expect(probability(r0.collapsed, 63)).toBeCloseTo(1, 6);
        expect(probability(r0.collapsed, 0)).toBeLessThan(EPS);
      }
    });
  });

  describe('C. Quantum Teleportation (3 qubits) with classical corrections', () => {
    interface TeleResult {
      rho: number[][];
      rhoIm: number[][];
      m0: 0 | 1;
      m1: 0 | 1;
    }

    function runTeleportation(alpha: number, beta: number, rng0: number, rng1: number): TeleResult {
      // Index layout for 3 qubits (q0 = MSB): idx = q0*4 + q1*2 + q2
      let state: Complex[] = new Array(8).fill(0).map(() => ({ re: 0, im: 0 }));
      state[0] = { re: alpha, im: 0 }; // |000>
      state[4] = { re: beta, im: 0 };  // |100>

      // Bell on q1,q2
      state = applyGateN(state, H, 1, 3);
      state = applyCNOT_N(state, 1, 2, 3);

      // Alice ops
      state = applyCNOT_N(state, 0, 1, 3);
      state = applyGateN(state, H, 0, 3);

      // Alice measures q0 then q1
      const m0 = measureQubitN(state, 0, 3, () => rng0);
      const m1 = measureQubitN(m0.collapsed, 1, 3, () => rng1);

      let corrected = m1.collapsed;
      // Apply X if q1 outcome = 1, then Z if q0 outcome = 1
      if (m1.outcome === 1) corrected = applyGateN(corrected, X, 2, 3);
      if (m0.outcome === 1) corrected = applyGateN(corrected, Z, 2, 3);

      // Trace out q0,q1 to obtain q2 reduced density matrix
      const rho = [[0, 0], [0, 0]];
      const rhoIm = [[0, 0], [0, 0]];
      for (let m0b = 0; m0b < 2; m0b++) {
        for (let m1b = 0; m1b < 2; m1b++) {
          const base = m0b * 4 + m1b * 2;
          for (let k = 0; k < 2; k++) {
            for (let kp = 0; kp < 2; kp++) {
              const a = corrected[base + k];
              const b = corrected[base + kp];
              rho[k][kp] += a.re * b.re + a.im * b.im;
              rhoIm[k][kp] += a.im * b.re - a.re * b.im;
            }
          }
        }
      }
      return { rho, rhoIm, m0: m0.outcome, m1: m1.outcome };
    }

    it('teleports |+> correctly across all 4 measurement branches', () => {
      const alpha = Math.SQRT1_2, beta = Math.SQRT1_2;
      const expected = [
        [alpha * alpha, alpha * beta],
        [alpha * beta, beta * beta],
      ];
      const branches: Array<[number, number]> = [[0.2, 0.2], [0.2, 0.8], [0.8, 0.2], [0.8, 0.8]];
      for (const [r0, r1] of branches) {
        const { rho, rhoIm } = runTeleportation(alpha, beta, r0, r1);
        for (let k = 0; k < 2; k++) {
          for (let kp = 0; kp < 2; kp++) {
            expect(Math.abs(rho[k][kp] - expected[k][kp])).toBeLessThan(1e-6);
            expect(Math.abs(rhoIm[k][kp])).toBeLessThan(1e-6);
          }
        }
      }
    });

    it('teleports |0> correctly', () => {
      const branches: Array<[number, number]> = [[0.2, 0.2], [0.8, 0.8]];
      for (const [r0, r1] of branches) {
        const { rho } = runTeleportation(1, 0, r0, r1);
        expect(Math.abs(rho[0][0] - 1)).toBeLessThan(1e-6);
        expect(Math.abs(rho[1][1])).toBeLessThan(1e-6);
      }
    });

    it('preset teleportation3Circuit produces a valid normalized state', () => {
      const h = evaluateFullCircuit(teleportation3Circuit());
      assertNormOne(h.final);
      assertProbsSumOne(h.final);
    });
  });

  describe('D. QFT-3 matrix validation', () => {
    function dft3(k: number): Complex[] {
      const out: Complex[] = [];
      for (let j = 0; j < 8; j++) {
        const angle = 2 * Math.PI * j * k / 8;
        out.push({ re: Math.cos(angle) / Math.sqrt(8), im: Math.sin(angle) / Math.sqrt(8) });
      }
      return out;
    }

    function applyQFT3FromK(k: number): Complex[] {
      let s = createZeroState(3);
      for (let b = 0; b < 3; b++) {
        if ((k >> (2 - b)) & 1) s = applyGateN(s, X, b, 3);
      }
      s = applyGateN(s, H, 0, 3);
      s = applyControlledPhaseN(s, 0, 1, Math.PI / 2, 3);
      s = applyControlledPhaseN(s, 0, 2, Math.PI / 4, 3);
      s = applyGateN(s, H, 1, 3);
      s = applyControlledPhaseN(s, 1, 2, Math.PI / 2, 3);
      s = applyGateN(s, H, 2, 3);
      s = applySWAP_N(s, 0, 2, 3);
      return s;
    }

    it('QFT-3 on |000> gives uniform amplitudes', () => {
      const h = evaluateFullCircuit(qft3Circuit());
      for (let i = 0; i < 8; i++) {
        expect(probability(h.final, i)).toBeCloseTo(1 / 8, 7);
      }
    });

    it('QFT-3 on |001> matches analytic DFT', () => {
      const expected = dft3(1);
      const actual = applyQFT3FromK(1);
      for (let i = 0; i < 8; i++) {
        expect(Math.abs(actual[i].re - expected[i].re)).toBeLessThan(1e-6);
        expect(Math.abs(actual[i].im - expected[i].im)).toBeLessThan(1e-6);
      }
    });

    it('QFT-3 on |100> matches analytic DFT', () => {
      const expected = dft3(4);
      const actual = applyQFT3FromK(4);
      for (let i = 0; i < 8; i++) {
        expect(Math.abs(actual[i].re - expected[i].re)).toBeLessThan(1e-6);
        expect(Math.abs(actual[i].im - expected[i].im)).toBeLessThan(1e-6);
      }
    });

    it('QFT-3 on |111> matches analytic DFT', () => {
      const expected = dft3(7);
      const actual = applyQFT3FromK(7);
      for (let i = 0; i < 8; i++) {
        expect(Math.abs(actual[i].re - expected[i].re)).toBeLessThan(1e-6);
        expect(Math.abs(actual[i].im - expected[i].im)).toBeLessThan(1e-6);
      }
    });
  });

  describe('E. Born rule and collapse', () => {
    function make1Q(theta: number): StateVector {
      return [
        { re: Math.cos(theta / 2), im: 0 },
        { re: Math.sin(theta / 2), im: 0 },
      ];
    }

    it('converges to P(0)=0.75 for theta=pi/3 (stratified RNG, N=1000)', () => {
      const N = 1000;
      const rng = stratifiedRng(N);
      let zeros = 0;
      for (let i = 0; i < N; i++) {
        const r = measureQubitN(make1Q(Math.PI / 3), 0, 1, rng);
        if (r.outcome === 0) zeros++;
      }
      expect(Math.abs(zeros / N - 0.75)).toBeLessThan(0.02);
    });

    it('converges to P(0)=0.25 for theta=2pi/3 (stratified RNG, N=1000)', () => {
      const N = 1000;
      const rng = stratifiedRng(N);
      let zeros = 0;
      for (let i = 0; i < N; i++) {
        const r = measureQubitN(make1Q(2 * Math.PI / 3), 0, 1, rng);
        if (r.outcome === 0) zeros++;
      }
      expect(Math.abs(zeros / N - 0.25)).toBeLessThan(0.02);
    });

    it('measurement does not mutate the input state', () => {
      const state = make1Q(Math.PI / 3);
      const before = JSON.parse(JSON.stringify(state));
      measureQubitN(state, 0, 1, () => 0.5);
      expect(state).toEqual(before);
    });

    it('double measurement on collapsed state is idempotent', () => {
      const state = make1Q(Math.PI / 3);
      const r1 = measureQubitN(state, 0, 1, () => 0.2);
      const r2 = measureQubitN(r1.collapsed, 0, 1, () => 0.8);
      expect(r2.outcome).toBe(r1.outcome);
    });
  });

  describe('F. Cross-module consistency', () => {
    it('evaluateFullCircuit(ghz6Circuit()) matches ghzState(6)', () => {
      const h = evaluateFullCircuit(ghz6Circuit());
      const g = ghzState(6);
      for (let i = 0; i < 64; i++) {
        expect(Math.abs(h.final[i].re - g[i].re)).toBeLessThan(EPS);
        expect(Math.abs(h.final[i].im - g[i].im)).toBeLessThan(EPS);
      }
    });

    it('gatesN.applyGateN matches gates.applyGate for H/X/Z on 1 qubit', () => {
      const pairs: Array<[GateMatrix, typeof H_GATE]> = [
        [H, H_GATE], [X, X_GATE], [Z, Z_GATE],
      ];
      const kets: StateVector[] = [
        [{ re: 1, im: 0 }, { re: 0, im: 0 }],
        [{ re: 0, im: 0 }, { re: 1, im: 0 }],
      ];
      for (const [gn, gl] of pairs) {
        for (const base of kets) {
          const outN = applyGateN(base, gn, 0, 1);
          const outG = applyGate(base, gl);
          for (let i = 0; i < 2; i++) {
            expect(Math.abs(outN[i].re - outG[i].re)).toBeLessThan(EPS);
            expect(Math.abs(outN[i].im - outG[i].im)).toBeLessThan(EPS);
          }
        }
      }
    });
  });
});
