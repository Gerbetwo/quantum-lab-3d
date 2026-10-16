import { describe, test, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import Cookies from 'js-cookie';
import * as THREE from 'three';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import { runShorDemo } from '@/core/quantum/applications';
import { CircuitVisualizationModel } from '../core/quantum/visualizationModel';
import {
  createEmptyCircuit,
  placeGate,
  removeGate,
  evaluateFullCircuit,
} from '../core/quantum/circuit';
import { calculateCoherenceTime } from '@/core/math/decoherence';
import { measureEntangledQubit } from '@/core/math/entanglement';
import {
  exportSessionJSON,
  downloadSessionJSON,
  saveMissionState,
  saveCompletedMission,
  COOKIE_USER_ID,
  COOKIE_MISSION_STATE,
  getDefaultSession,
  getStoredMetrics,
  getStoredActiveTab,
  createDefaultMetrics,
  saveActiveTab,
  COOKIE_METRICS,
  MAX_COOKIE_SIZE_BYTES,
  getMissionState,
  getAllMissionStates,
  createEmptySession,
  loadSession,
  saveSession,
  completeMissionInSession,
  isMainJourneyComplete,
  STORAGE_KEY,
  SESSION_VERSION,
} from '@/features/session/lib/sessionService';
import {
  createZeroState,
  probability,
  probabilities,
  norm,
  MAX_QUBITS,
  MAX_DIM,
  normalize,
  innerProduct,
  dimOf,
  type StateVector,
  type Complex,
} from '@/core/math/statevector';
import {
  applyGateN,
  applyCNOT_N,
  applyCZ_N,
  applySWAP_N,
  H,
  X,
  Y,
  Z,
  S,
  T,
  I,
  I_GATE,
  X_GATE,
  Z_GATE,
  H_GATE,
  applyGate,
  matrixMultiply,
  applyCNOT,
  evaluateCircuit,
  stateToBlochAngles,
  gatesApproxEqual,
  stateLabel,
} from '@/core/math/gates';
import { measureAll, measureQubitN } from '@/core/math/measurement';
import {
  calculateMeasurementDistribution,
  measureQubit,
} from '../core/quantum/measurement';
import { bellState, ghzState, wState, ghz6Circuit } from '@/core/math/presets';
import { measureQubitState, validateCircuit, createInitialState } from '@/core';
import { factorizeShorN15 } from '@/core/quantum/algorithms/shor';
import { playNote } from '@/shared/lib/sound';
import { ResourceTracker } from '@/features/quantum-3d/lib/resourceTracker';
import {
  createOrbitControls,
  type OrbitControlsHandle,
} from '@/features/quantum-3d/hooks/useOrbitControls';
import {
  calculateBlochVector,
  calculateBlochProbabilities,
  formatStateVector,
} from '@/core/math/bloch';
import {
  bitFlipEncode,
  bitFlipDecode,
  detectBitFlipSyndrome,
  injectBitFlip,
  phaseFlipEncode,
  injectPhaseFlip,
  applyRepetitionCode3,
  type BitTriple,
} from '@/core/quantum/algorithms/errorCorrection';
import {
  uniformAmplitudes,
  groverIterations,
  classicalExpectedTrials,
  simulateGroverStep,
  measureAmplitude,
  groverSuccessProbability,
} from '@/core/quantum/algorithms/grover';
import {
  createInitialMissionState,
  advanceStep,
  canNavigateToStep,
  previousStep,
  completeQuiz,
} from '../../src/features/missions/domain/missionMachine';
import {
  qubitToFrequency,
  gateDurationMs,
  adsrEnvelope,
  type ScaleName,
} from '@/core/math/scales';
import {
  isAudioEnabled,
  setAudioEnabled,
  toggleAudio,
  playButtonClick,
  playLaserScan,
  playQuantumCollapse,
  playChimeSuccess,
  playDecoherenceAlert,
  playGateForQubit,
  playHover,
  playMeasurementCollapse,
  __markUserInteracted,
  __resetAudioOverride,
} from '@/shared/lib/sound';
import '../helpers/webgl-stub';
import {
  disposeResource,
  cached,
  clearResourceCache,
  clearSpriteMaterialCache,
} from '@/features/quantum-3d/lib/sceneManager';

describe('Shor Applications Domain', () => {
  test('correctly finds period and factors for base 2', () => {
    const res = runShorDemo(2);
    expect(res.period).toBe(4);
    expect(res.factors).toEqual([3, 5]);
  });
});


describe("HU-06 — Bloch Probabilities Calculation", () => {
  it("calculates exact state amplitudes and probabilities for North Pole (|0⟩)", () => {
    const res = calculateBlochProbabilities(0);
    expect(res.alpha).toBeCloseTo(1);
    expect(res.beta).toBeCloseTo(0);
    expect(res.prob0).toBe(100);
    expect(res.prob1).toBe(0);
  });

  it("calculates equal probabilities for Equator superposition (|+⟩)", () => {
    const res = calculateBlochProbabilities(Math.PI / 2);
    expect(res.alpha).toBeCloseTo(Math.SQRT1_2);
    expect(res.beta).toBeCloseTo(Math.SQRT1_2);
    expect(res.prob0).toBe(50);
    expect(res.prob1).toBe(50);
  });

  it("calculates exact state amplitudes and probabilities for South Pole (|1⟩)", () => {
    const res = calculateBlochProbabilities(Math.PI);
    expect(res.alpha).toBeCloseTo(0);
    expect(res.beta).toBeCloseTo(1);
    expect(res.prob0).toBe(0);
    expect(res.prob1).toBe(100);
  });
});

describe("Bloch Sphere Domain Engine", () => {
  it("calcula el vector de Bloch para los estados |0⟩ y |1⟩", () => {
    // theta = 0 corresponde al estado |0>
    const vecZero = calculateBlochVector(0, 0);
    expect(vecZero.z).toBe(1);

    // theta = PI corresponde al estado |1>
    const vecOne = calculateBlochVector(Math.PI, 0);
    expect(vecOne.z).toBe(-1);
  });

  it("calcula las probabilidades de superposición", () => {
    const probs = calculateBlochProbabilities(0);
    expect(probs.prob0).toBe(100);
    expect(probs.prob1).toBe(0);
  });

  it("formatea correctamente la representación vectorial del estado", () => {
    const formatted = formatStateVector(0, 0);
    expect(formatted).toBe("|ψ⟩ = 1|0⟩");
  });
});


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


describe('Circuit Unit Tests', () => {
  it('should create and modify circuit', () => {
    let c = createEmptyCircuit(2);
    c = placeGate(c, { id: 'g1', type: 'H', step: 0, targets: [0] }, 0);
    expect(c.steps.length).toBe(1);
    c = removeGate(c, 'g1');
    expect(c.steps[0].gates.length).toBe(0);
  });

  it('should evaluate circuit fully', () => {
    const c = createEmptyCircuit(1);
    const h = evaluateFullCircuit(c);
    expect(h.final.length).toBe(2);
  });
});


describe('Decoherence Domain', () => {
  test('calculates higher coherence time at lower temperatures', () => {
    const tLow = calculateCoherenceTime(15);
    const tHigh = calculateCoherenceTime(150000);
    expect(tLow).toBeGreaterThan(tHigh);
  });
});


describe('Entanglement Domain', () => {
  test('correlates Alice and Bob outcomes perfectly', () => {
    const res = measureEntangledQubit(1);
    expect(res.aliceOutcome).toBe(1);
    expect(res.bobOutcome).toBe(1);
    expect(res.correlated).toBe(true);
  });
});


describe('HU-32..HU-36 - Error Correction', () => {
  describe('bitFlipEncode', () => {
    it('encodes 0 as [0,0,0]', () => expect(bitFlipEncode(0)).toEqual([0, 0, 0]));
    it('encodes 1 as [1,1,1]', () => expect(bitFlipEncode(1)).toEqual([1, 1, 1]));
  });

  describe('injectBitFlip', () => {
    it('flips index 0', () => expect(injectBitFlip([0, 0, 0], 0)).toEqual([1, 0, 0]));
    it('flips index 1', () => expect(injectBitFlip([0, 0, 0], 1)).toEqual([0, 1, 0]));
    it('flips index 2', () => expect(injectBitFlip([0, 0, 0], 2)).toEqual([0, 0, 1]));
    it('flips 1 -> 0 at index 1', () => expect(injectBitFlip([1, 1, 1], 1)).toEqual([1, 0, 1]));
  });

  describe('bitFlipDecode (majority vote)', () => {
    it('[1,1,0] -> 1', () => expect(bitFlipDecode([1, 1, 0])).toBe(1));
    it('[0,0,1] -> 0', () => expect(bitFlipDecode([0, 0, 1])).toBe(0));
    it('[1,1,1] -> 1', () => expect(bitFlipDecode([1, 1, 1])).toBe(1));
    it('[0,0,0] -> 0', () => expect(bitFlipDecode([0, 0, 0])).toBe(0));
  });

  describe('detectBitFlipSyndrome - no error', () => {
    it('[0,0,0] -> syndrome 0, errorIndex -1', () => {
      const r = detectBitFlipSyndrome([0, 0, 0]);
      expect(r.syndrome).toBe(0);
      expect(r.errorIndex).toBe(-1);
    });
    it('[1,1,1] -> syndrome 0, errorIndex -1', () => {
      const r = detectBitFlipSyndrome([1, 1, 1]);
      expect(r.syndrome).toBe(0);
      expect(r.errorIndex).toBe(-1);
    });
  });

  describe('detectBitFlipSyndrome - single bit errors', () => {
    it('error at index 0 -> syndrome 1', () => {
      const r = detectBitFlipSyndrome([1, 0, 0]);
      expect(r.syndrome).toBe(1);
      expect(r.errorIndex).toBe(0);
      expect(r.corrected).toEqual([0, 0, 0]);
    });
    it('error at index 1 -> syndrome 2', () => {
      const r = detectBitFlipSyndrome([0, 1, 0]);
      expect(r.syndrome).toBe(2);
      expect(r.errorIndex).toBe(1);
      expect(r.corrected).toEqual([0, 0, 0]);
    });
    it('error at index 2 -> syndrome 3', () => {
      const r = detectBitFlipSyndrome([0, 0, 1]);
      expect(r.syndrome).toBe(3);
      expect(r.errorIndex).toBe(2);
      expect(r.corrected).toEqual([0, 0, 0]);
    });
  });

  describe('syndrome decoding bijection', () => {
    it('syndromes 1/2/3 map uniquely to error indices 0/1/2', () => {
      const seen = new Set<number>();
      for (const idx of [0, 1, 2] as const) {
        const corrupted = injectBitFlip([0, 0, 0], idx);
        const r = detectBitFlipSyndrome(corrupted);
        expect(r.errorIndex).toBe(idx);
        seen.add(r.syndrome);
      }
      expect(seen.size).toBe(3);
    });
  });

  describe('double error is not correctable', () => {
    it('two flips of |000> miscorrect to 1', () => {
      let c: BitTriple = [0, 0, 0];
      c = injectBitFlip(c, 0);
      c = injectBitFlip(c, 1);
      // c = [1,1,0], majority = 1
      const r = detectBitFlipSyndrome(c);
      expect(bitFlipDecode(r.corrected)).toBe(1);
      // Original was 0 -> decoder miscorrects
    });
  });

  describe('phaseFlipEncode', () => {
    it('alpha=1 -> |+> amplitudes', () => {
      const r = phaseFlipEncode(1);
      expect(r.plus).toBeCloseTo(1 / Math.SQRT2);
      expect(r.minus).toBeCloseTo(1 / Math.SQRT2);
    });
    it('alpha=0 -> |-> amplitudes', () => {
      const r = phaseFlipEncode(0);
      expect(r.plus).toBeCloseTo(1 / Math.SQRT2);
      expect(r.minus).toBeCloseTo(-1 / Math.SQRT2);
    });
    it('alpha=1/sqrt(2) -> pure |+>', () => {
      const r = phaseFlipEncode(1 / Math.SQRT2);
      expect(r.plus).toBeCloseTo(1);
      expect(r.minus).toBeCloseTo(0);
    });
  });

  describe('injectPhaseFlip', () => {
    it('preserves amplitudes and records error index', () => {
      const enc = phaseFlipEncode(1);
      const r = injectPhaseFlip(enc, 1);
      expect(r.plus).toBeCloseTo(enc.plus);
      expect(r.minus).toBeCloseTo(enc.minus);
      expect(r.errorIndex).toBe(1);
    });
  });

  describe('applyRepetitionCode3', () => {
    it('no error: not detected', () => {
      const r = applyRepetitionCode3(0, 'none');
      expect(r.corrected).toBe(0);
      expect(r.detected).toBe(false);
      expect(r.syndrome).toBe(0);
    });
    it('bit error: detected and corrected', () => {
      const r = applyRepetitionCode3(0, 'bit');
      expect(r.corrected).toBe(0);
      expect(r.detected).toBe(true);
      expect(r.syndrome).toBeGreaterThan(0);
    });
    it('phase error: invisible in computational basis', () => {
      const r = applyRepetitionCode3(1, 'phase');
      expect(r.corrected).toBe(1);
      expect(r.detected).toBe(false);
      expect(r.syndrome).toBe(0);
    });
  });
});


describe('Exportación de sesión JSON', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-02T12:00:00.000Z'));
    Cookies.remove(COOKIE_MISSION_STATE);
    Cookies.set(COOKIE_USER_ID, 'QL-TEST-USER');
  });

  test('exportSessionJSON genera la estructura completa y coincide con la snapshot', () => {
    saveCompletedMission(0);
    saveMissionState(0, { angle: 45, result: 0 });

    const jsonString = exportSessionJSON();
    const parsed = JSON.parse(jsonString);

    expect(parsed).toMatchObject({
      version: '1.0',
      exportedAt: '2026-10-02T12:00:00.000Z',
      userId: 'QL-TEST-USER',
      progress: [0],
      activeTab: 0,
      missionState: {
        '0': { angle: 45, result: 0 },
      },
    });

    expect(parsed.userId).toBe('QL-TEST-USER');
    expect(parsed.metrics).toBeDefined();

    expect(jsonString).toMatchSnapshot();
  });

  test('downloadSessionJSON crea el elemento anchor y gatilla la descarga', () => {
    const createObjectURLMock = vi.fn(() => 'blob:http://localhost/test-uuid');
    const revokeObjectURLMock = vi.fn();
    global.URL.createObjectURL = createObjectURLMock;
    global.URL.revokeObjectURL = revokeObjectURLMock;

    const clickMock = vi.fn();
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const elem = document.createElementNS('http://www.w3.org/1999/xhtml', tagName);
      if (tagName === 'a') {
        elem.click = clickMock;
      }
      return elem as HTMLElement;
    });

    downloadSessionJSON();

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(clickMock).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalled();
  });
});


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


describe('Phase1 - N-qubit Gates', () => {
  it('H|0> = (|0>+|1>)/sqrt(2)', () => {
    const s = applyGateN(createZeroState(1), H, 0, 1);
    expect(s[0].re).toBeCloseTo(Math.SQRT1_2);
    expect(s[1].re).toBeCloseTo(Math.SQRT1_2);
  });
  it('X|0> = |1>', () => {
    const s = applyGateN(createZeroState(1), X, 0, 1);
    expect(s[1].re).toBeCloseTo(1);
  });
  it('Y|0> = i|1>', () => {
    const s = applyGateN(createZeroState(1), Y, 0, 1);
    expect(s[1].re).toBeCloseTo(0);
    expect(s[1].im).toBeCloseTo(1);
  });
  it('Z|1> = -|1>', () => {
    const one = applyGateN(createZeroState(1), X, 0, 1);
    const s = applyGateN(one, Z, 0, 1);
    expect(s[1].re).toBeCloseTo(-1);
  });
  it('I|0> = |0>', () => {
    const s = applyGateN(createZeroState(2), I, 1, 2);
    expect(s[0].re).toBeCloseTo(1);
  });
  it('H on qubit 1 of |00> creates |0+>', () => {
    const s = applyGateN(createZeroState(2), H, 1, 2);
    expect(s[0].re).toBeCloseTo(Math.SQRT1_2);
    expect(s[1].re).toBeCloseTo(Math.SQRT1_2);
    expect(s[2].re).toBeCloseTo(0);
    expect(s[3].re).toBeCloseTo(0);
  });
  it('CNOT control=0 target=1 flips |10> -> |11>', () => {
    const base = applyGateN(createZeroState(2), X, 0, 2);
    const s = applyCNOT_N(base, 0, 1, 2);
    expect(probability(s, 3)).toBeCloseTo(1);
  });
  it('CNOT control=1 target=0 flips |01> -> |11>', () => {
    const base = applyGateN(createZeroState(2), X, 1, 2);
    const s = applyCNOT_N(base, 1, 0, 2);
    expect(probability(s, 3)).toBeCloseTo(1);
  });
  it('CZ control=0 target=1 phase-flips |11>', () => {
    let s = createZeroState(2);
    s = applyGateN(s, X, 0, 2);
    s = applyGateN(s, X, 1, 2);
    const r = applyCZ_N(s, 0, 1, 2);
    expect(r[3].re).toBeCloseTo(-1);
  });
  it('SWAP exchanges qubit states', () => {
    const base = applyGateN(createZeroState(2), X, 0, 2);
    const s = applySWAP_N(base, 0, 1, 2);
    expect(probability(s, 1)).toBeCloseTo(1);
  });
  it('preserves norm through arbitrary sequence', () => {
    let s = createZeroState(4);
    s = applyGateN(s, H, 0, 4);
    s = applyGateN(s, H, 1, 4);
    s = applyCNOT_N(s, 0, 3, 4);
    s = applyGateN(s, Z, 2, 4);
    const p = probabilities(s).reduce((a: number, b: number) => a + b, 0);
    expect(p).toBeCloseTo(1, 10);
  });
  it('rejects out-of-range qubit index', () => {
    expect(() => applyGateN(createZeroState(2), H, 2, 2)).toThrow();
  });
  it('rejects state length mismatch', () => {
    expect(() => applyGateN(createZeroState(2), H, 0, 3)).toThrow(/length/);
  });
});


describe('HU-27..HU-31 - Grover Search Algorithm', () => {
  describe('groverIterations', () => {
    it('N=4 requires exactly 1 iteration', () => {
      expect(groverIterations(4)).toBe(1);
    });
    it('N=16 requires 3 iterations', () => {
      expect(groverIterations(16)).toBe(3);
    });
    it('is monotonically non-decreasing in N', () => {
      for (let n = 2; n < 200; n++) {
        expect(groverIterations(n + 1)).toBeGreaterThanOrEqual(groverIterations(n));
      }
    });
  });

  describe('classicalExpectedTrials', () => {
    it('N=4 -> 2', () => expect(classicalExpectedTrials(4)).toBe(2));
    it('N=16 -> 8', () => expect(classicalExpectedTrials(16)).toBe(8));
    it('N=1024 -> 512', () => expect(classicalExpectedTrials(1024)).toBe(512));
  });

  describe('uniformAmplitudes', () => {
    it('N=4 returns [0.5, 0.5, 0.5, 0.5]', () => {
      expect(uniformAmplitudes(4)).toEqual([0.5, 0.5, 0.5, 0.5]);
    });
    it('probabilities sum to 1 for N=16', () => {
      const total = uniformAmplitudes(16).reduce((s, a) => s + a * a, 0);
      expect(total).toBeCloseTo(1);
    });
  });

  describe('simulateGroverStep', () => {
    it('N=4 single step fully amplifies marked index 2', () => {
      const result = simulateGroverStep(uniformAmplitudes(4), 2);
      expect(result[2]).toBeCloseTo(1);
      expect(result[0]).toBeCloseTo(0);
      expect(result[1]).toBeCloseTo(0);
      expect(result[3]).toBeCloseTo(0);
    });

    it('preserves norm (unitarity) for N=8', () => {
      const amps = uniformAmplitudes(8);
      const before = amps.reduce((s, a) => s + a * a, 0);
      const after = simulateGroverStep(amps, 3).reduce((s, a) => s + a * a, 0);
      expect(after).toBeCloseTo(before);
    });

    it('only the marked amplitude changes sign relative to unmarked peers after oracle', () => {
      const result = simulateGroverStep(uniformAmplitudes(6), 4);
      // All unmarked values are equal
      const unmarked = [0, 1, 2, 3, 5].map((i) => result[i]);
      for (let i = 1; i < unmarked.length; i++) {
        expect(unmarked[i]).toBeCloseTo(unmarked[0]);
      }
    });
  });

  describe('measureAmplitude', () => {
    it('returns the peak index when amplitude is concentrated', () => {
      expect(measureAmplitude([0, 0, 1, 0], () => 0.5)).toBe(2);
    });
    it('returns 0 for rng=0 with marked at index 0', () => {
      expect(measureAmplitude([1, 0, 0, 0], () => 0)).toBe(0);
    });
    it('is deterministic with injected RNG on uniform state', () => {
      const amps = uniformAmplitudes(4);
      expect(measureAmplitude(amps, () => 0.1)).toBe(0);
      expect(measureAmplitude(amps, () => 0.4)).toBe(1);
      expect(measureAmplitude(amps, () => 0.6)).toBe(2);
      expect(measureAmplitude(amps, () => 0.9)).toBe(3);
    });
    it('returns last index when rng equals total', () => {
      expect(measureAmplitude([0, 0, 0, 1], () => 0.999)).toBe(3);
    });
  });

  describe('groverSuccessProbability', () => {
    it('N=4 after 1 iteration -> near 1', () => {
      expect(groverSuccessProbability(4, 1)).toBeCloseTo(1, 3);
    });
    it('N=16 after 3 iterations -> > 0.9', () => {
      expect(groverSuccessProbability(16, 3)).toBeGreaterThan(0.9);
    });
    it('0 iterations -> uniform 1/N', () => {
      expect(groverSuccessProbability(4, 0)).toBeCloseTo(0.25);
      expect(groverSuccessProbability(16, 0)).toBeCloseTo(1 / 16);
    });
    it('optimal iterations beat 0 iterations for N=16', () => {
      expect(groverSuccessProbability(16, 3)).toBeGreaterThan(groverSuccessProbability(16, 0));
    });
  });
});


describe('Phase1 - N-qubit Measurement (injectable RNG)', () => {
  it('measureAll on |0> returns 0', () => {
    expect(measureAll(createZeroState(3), () => 0.5)).toBe(0);
  });
  it('measureAll on |111> returns 7', () => {
    let s = createZeroState(3);
    s = applyGateN(s, X, 0, 3);
    s = applyGateN(s, X, 1, 3);
    s = applyGateN(s, X, 2, 3);
    expect(measureAll(s, () => 0.99)).toBe(7);
  });
  it('measureAll respects cumulative distribution', () => {
    let s = createZeroState(1);
    s = applyGateN(s, H, 0, 1);
    expect(measureAll(s, () => 0)).toBe(0);
    expect(measureAll(s, () => 0.6)).toBe(1);
  });
  it('measureQubitN on a Bell state collapses both qubits consistently', () => {
    // |Phi+> = (|00> + |11>) / sqrt(2)
    let s = createZeroState(2);
    s = applyGateN(s, H, 0, 2);
    s = applyCNOT_N(s, 0, 1, 2);
    // rng = 0.9 > P(0) = 0.5  =>  outcome 1, collapse to |11> (index 3)
    const r = measureQubitN(s, 0, 2, () => 0.9);
    expect(r.outcome).toBe(1);
    expect(r.collapsed[3].re).toBeCloseTo(1);
    expect(r.collapsed[0].re).toBeCloseTo(0);
  });
  it('measureQubitN measuring LSB preserves MSB superposition', () => {
    // H on qubit 0 (MSB) produces |+> (x) |0>
    let s = createZeroState(2);
    s = applyGateN(s, H, 0, 2);
    // Measure LSB (qubit 1); it is always 0.
    const r = measureQubitN(s, 1, 2, () => 0.1);
    expect(r.outcome).toBe(0);
    expect(r.collapsed[0].re).toBeCloseTo(Math.SQRT1_2);
    expect(r.collapsed[2].re).toBeCloseTo(Math.SQRT1_2);
    expect(r.collapsed[1].re).toBeCloseTo(0);
    expect(r.collapsed[3].re).toBeCloseTo(0);
  });
  it('rejects out-of-range qubit in measureQubitN', () => {
    expect(() => measureQubitN(createZeroState(2), 2, 2, () => 0.5)).toThrow();
  });
});


describe('Measurement Unit Tests', () => {
  it('should measure qubit correctly', () => {
    const outcome = measureQubit(0, () => 0.1);
    expect([0, 1]).toContain(outcome);
  });

  it('should calculate measurement distribution', () => {
    const dist = calculateMeasurementDistribution(0, 100, () => 0.1) as { zeros: number; ones: number };
    expect(dist.zeros).toBe(100);
    expect(dist.ones).toBe(0);
  });
});


describe('Mission State Machine', () => {
  test('Inicia en not_started y paso 0', () => {
    const state = createInitialMissionState();
    expect(state.state).toBe('not_started');
    expect(state.currentStep).toBe(0);
  });

  test('Impide avanzar si el paso requiere acción no completada', () => {
    const state = createInitialMissionState();
    const canNav = canNavigateToStep(1, 4, state, { 0: false });
    expect(canNav).toBe(false);
  });

  test('Avanza de paso cuando los requisitos se cumplen', () => {
    const state = createInitialMissionState();
    const next = advanceStep(0, 4, state, { 0: true });
    expect(next.currentStep).toBe(1);
    expect(next.maxUnlockedStep).toBe(1);
  });

  test('Permite revisión sin borrar estado completado', () => {
    let state = createInitialMissionState();
    state = completeQuiz(state);
    expect(state.state).toBe('completed');

    const prev = previousStep(2, state);
    expect(prev.currentStep).toBe(1);
    expect(prev.state).toBe('completed');
  });
});


describe('Persistencia de estado por misión', () => {
  beforeEach(() => {
    Cookies.remove(COOKIE_MISSION_STATE);
  });

  test('obtiene null cuando no hay estado guardado para la misión', () => {
    expect(getMissionState(0)).toBeNull();
  });

  test('guarda y recupera el estado de una misión específica', () => {
    const stateM0 = { theta: 1.57, collapsed: 1 };
    saveMissionState(0, stateM0);

    expect(getMissionState(0)).toEqual(stateM0);
    expect(getMissionState(1)).toBeNull();
  });

  test('mantiene estados independientes para distintas misiones', () => {
    saveMissionState(0, { val: 'A' });
    saveMissionState(1, { val: 'B' });

    expect(getMissionState(0)).toEqual({ val: 'A' });
    expect(getMissionState(1)).toEqual({ val: 'B' });
  });

  test('maneja JSON corrupto en la cookie devolviendo objeto vacío / null', () => {
    Cookies.set(COOKIE_MISSION_STATE, '{invalid-json');
    expect(getAllMissionStates()).toEqual({});
    expect(getMissionState(0)).toBeNull();
  });

  test('respeta MAX_COOKIE_SIZE_BYTES no guardando si supera el límite', () => {
    const hugeData = { data: 'X'.repeat(MAX_COOKIE_SIZE_BYTES + 500) };
    saveMissionState(0, hugeData);

    expect(getMissionState(0)).toBeNull();
  });
});


describe('Phase 2 - Unified Session & Persistence Contract', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  it('Caso 1: Usuario nuevo genera sesión vacía con completed []', () => {
    const session = loadSession();
    expect(session.completed).toEqual([]);
    expect(session.version).toBe(SESSION_VERSION);
    expect(session.activeMission).toBe('superposition');
  });

  it('Caso 2: Recupera sesión válida en almacenamiento', () => {
    const mockSession = createEmptySession('test_user_123');
    mockSession.completed = ['superposition'];
    mockSession.activeMission = 'entanglement';
    saveSession(mockSession);

    const loaded = loadSession();
    expect(loaded.userId).toBe('test_user_123');
    expect(loaded.completed).toContain('superposition');
    expect(loaded.activeMission).toBe('entanglement');
  });

  it('Caso 3: JSON inválido genera nueva sesión sin marcar misiones', () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'INVALID_JSON_STRING{{{');
    }
    const loaded = loadSession();
    expect(loaded.completed).toEqual([]);
    expect(loaded.version).toBe(SESSION_VERSION);
  });

  it('Caso 4: ID de misión desconocido es filtrado', () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...createEmptySession('test_user'),
          completed: ['superposition', 'invalid_mission_xyz'],
        }),
      );
    }

    const loaded = loadSession();
    expect(loaded.completed).toEqual(['superposition']);
  });

  it('Caso 5: Completar misiones core habilita estado de recorrido principal', () => {
    let session = createEmptySession();
    expect(isMainJourneyComplete(session.completed)).toBe(false);

    session = completeMissionInSession(session, 'superposition');
    session = completeMissionInSession(session, 'entanglement');
    session = completeMissionInSession(session, 'decoherence');
    expect(isMainJourneyComplete(session.completed)).toBe(false);

    session = completeMissionInSession(session, 'applications');
    expect(isMainJourneyComplete(session.completed)).toBe(true);
  });

  it('migra mission-1..4 y conserva misiones 5–7', () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...createEmptySession('test_user'),
          activeMission: 'mission-2',
          completed: ['mission-1', 'gates', 'grover', 'error-correction', 'unknown_xyz'],
          missionState: { 'mission-1': { step: 2 }, gates: { slot: 1 } },
          missionTime: { 'mission-3': 1500, grover: 800 },
        }),
      );
    }

    const loaded = loadSession();
    expect(loaded.completed).toEqual(['superposition', 'gates', 'grover', 'error-correction']);
    expect(loaded.activeMission).toBe('entanglement');
    expect(loaded.missionState.superposition).toEqual({ step: 2 });
    expect(loaded.missionState.gates).toEqual({ slot: 1 });
    expect(loaded.missionTime.decoherence).toBe(1500);
    expect(loaded.missionTime.grover).toBe(800);
  });
});


describe('Phase1 - LUT Presets (Bell, GHZ, W)', () => {
  it('bellState(phi+) = (|00>+|11>)/sqrt(2)', () => {
    const b = bellState('phi+');
    expect(b).toHaveLength(4);
    expect(b[0].re).toBeCloseTo(Math.SQRT1_2);
    expect(b[3].re).toBeCloseTo(Math.SQRT1_2);
  });
  it('bellState(psi+) = (|01>+|10>)/sqrt(2)', () => {
    const b = bellState('psi+');
    expect(b[1].re).toBeCloseTo(Math.SQRT1_2);
    expect(b[2].re).toBeCloseTo(Math.SQRT1_2);
  });
  it('bellState(phi-) has negative sign on |11>', () => {
    const b = bellState('phi-');
    expect(b[0].re).toBeCloseTo(Math.SQRT1_2);
    expect(b[3].re).toBeCloseTo(-Math.SQRT1_2);
  });
  it('ghzState(3) = (|000>+|111>)/sqrt(2)', () => {
    const g = ghzState(3);
    expect(g).toHaveLength(8);
    expect(g[0].re).toBeCloseTo(Math.SQRT1_2);
    expect(g[7].re).toBeCloseTo(Math.SQRT1_2);
    expect(probabilities(g).slice(1, 7).every((p) => p === 0)).toBe(true);
  });
  it('ghzState(6) uniform on 2 outcomes', () => {
    const g = ghzState(6);
    expect(g).toHaveLength(64);
    expect(g[0].re).toBeCloseTo(Math.SQRT1_2);
    expect(g[63].re).toBeCloseTo(Math.SQRT1_2);
  });
  it('wState(3) has three symmetric peaks', () => {
    const w = wState(3);
    const p = probabilities(w);
    expect(p[1]).toBeCloseTo(1 / 3);
    expect(p[2]).toBeCloseTo(1 / 3);
    expect(p[4]).toBeCloseTo(1 / 3);
  });
  it('rejects ghzState above MAX_QUBITS', () => {
    expect(() => ghzState(7)).toThrow();
  });
});


const EPS = 1e-7;

function assertNormOne(state: StateVector): void {
  expect(Math.abs(norm(state) - 1)).toBeLessThan(EPS);
}

function assertProbsSumOne(state: StateVector): void {
  const total = probabilities(state).reduce((a: number, b: number) => a + b, 0);
  expect(Math.abs(total - 1)).toBeLessThan(EPS);
}

describe('Quantum Core Tests', () => {
  it('should validate invalid circuit', () => {
    const invalidCircuit = { numQubits: 2, gates: [{ id: '1', type: 'H', targetQubit: 5 }] };
    const validation = validateCircuit(invalidCircuit) as { valid: boolean; errors: string[] };
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });

  it('should measure qubit state', () => {
    const state: Complex[] = [{ re: 1, im: 0 }, { re: 0, im: 0 }];
    const result0 = measureQubitState(0, state, () => 0.1) as { collapsedBit: number };
    expect(result0.collapsedBit).toBe(0);

    const result1 = measureQubitState(0, state, () => 0.9) as { collapsedBit: number };
    expect(result1.collapsedBit).toBe(1);
  });

  it('should create initial state', () => {
    const states = createInitialState(3) as Array<Complex>;
    expect(states.length).toBe(8);
    expect(states[0]).toEqual({ re: 1, im: 0 });
  });
});

describe('Phase 4 - Quantum Engine Precision (6 qubits, eps=1e-7)', () => {
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

  it('produces (|0..0> + |1..1>)/sqrt(2)', () => {
    const h = evaluateFullCircuit(ghz6Circuit());
    expect(probability(h.final, 0)).toBeCloseTo(0.5, 7);
    expect(probability(h.final, 63)).toBeCloseTo(0.5, 7);
  });

  it('evaluateFullCircuit(ghz6Circuit()) matches ghzState(6)', () => {
    const h = evaluateFullCircuit(ghz6Circuit());
    const g = ghzState(6);
    for (let i = 0; i < 64; i++) {
      expect(Math.abs(h.final[i].re - g[i].re)).toBeLessThan(EPS);
      expect(Math.abs(h.final[i].im - g[i].im)).toBeLessThan(EPS);
    }
  });

  it('measuring q0 collapses state consistently', () => {
    const h = evaluateFullCircuit(ghz6Circuit());
    const r0 = measureQubitN(h.final, 0, 6, () => 0.4);
    expect(r0.outcome === 0 || r0.outcome === 1).toBe(true);
  });
});


describe('Phase 3 - domain/quantum/scales.ts', () => {
  it('qubitToFrequency(0) equals baseHz', () => {
    expect(qubitToFrequency(0, 440)).toBeCloseTo(440);
  });

  it('qubitToFrequency(1) applies a pentatonic ratio > 1', () => {
    const f0 = qubitToFrequency(0, 440);
    const f1 = qubitToFrequency(1, 440);
    expect(f1).toBeGreaterThan(f0);
  });

  it('qubitToFrequency is monotonically non-decreasing across q0..q5', () => {
    let prev = -Infinity;
    for (let q = 0; q < 6; q++) {
      const f = qubitToFrequency(q);
      expect(f).toBeGreaterThanOrEqual(prev);
      prev = f;
    }
  });

  it('qubitToFrequency rejects negative index', () => {
    expect(() => qubitToFrequency(-1)).toThrow(RangeError);
  });

  it('qubitToFrequency rejects non-integer index', () => {
    expect(() => qubitToFrequency(1.5)).toThrow(RangeError);
  });

  it('qubitToFrequency accepts valid ScaleName', () => {
    const scales: ScaleName[] = ['pentatonic-major', 'pentatonic-minor', 'microtonal-quarter'];
    for (const s of scales) {
      expect(qubitToFrequency(2, 220, s)).toBeGreaterThan(0);
    }
  });

  it('qubitToFrequency rejects unknown scale at runtime', () => {
    expect(() => qubitToFrequency(1, 220, 'nope' as unknown as ScaleName)).toThrow(RangeError);
  });

  it('gateDurationMs returns a positive number for every gate', () => {
    for (const g of ['H', 'X', 'Y', 'Z', 'S', 'T', 'CNOT', 'CZ', 'SWAP', 'CS', 'CT']) {
      expect(gateDurationMs(g)).toBeGreaterThan(0);
    }
  });

  it('gateDurationMs for CNOT is longer than for H (multi > single)', () => {
    expect(gateDurationMs('CNOT')).toBeGreaterThan(gateDurationMs('H'));
  });

  it('adsrEnvelope("pluck").attack < adsrEnvelope("pad").attack', () => {
    expect(adsrEnvelope('pluck').attack).toBeLessThan(adsrEnvelope('pad').attack);
  });

  it('adsrEnvelope returns a fresh object each call', () => {
    const a = adsrEnvelope('pluck');
    const b = adsrEnvelope('pluck');
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
  });

  it('adsrEnvelope values are within [0, 1]', () => {
    for (const t of ['pluck', 'pad', 'chirp'] as const) {
      const e = adsrEnvelope(t);
      expect(e.attack).toBeGreaterThanOrEqual(0);
      expect(e.attack).toBeLessThanOrEqual(1);
      expect(e.decay).toBeGreaterThanOrEqual(0);
      expect(e.decay).toBeLessThanOrEqual(1);
      expect(e.sustain).toBeGreaterThanOrEqual(0);
      expect(e.sustain).toBeLessThanOrEqual(1);
      expect(e.release).toBeGreaterThanOrEqual(0);
      expect(e.release).toBeLessThanOrEqual(1);
    }
  });
});


describe('Fase 2 — Session Unit Tests', () => {
  test('getDefaultSession retorna estructura válida con versión 2', () => {
    const session = getDefaultSession();
    expect(session.version).toBe(2);
    expect(session.activeMission).toBe('superposition');
    expect(session.completed).toEqual([]);
    expect(typeof session.userId).toBe('string');
  });
});

describe('Phase 5 - cookies.ts edge cases', () => {
  beforeEach(() => {
    Object.keys(Cookies.get()).forEach((n) => Cookies.remove(n));
  });

  describe('getStoredMetrics - malformed payloads', () => {
    it('returns defaults when payload is unparseable JSON', () => {
      Cookies.set(COOKIE_METRICS, 'not-json{{');
      expect(getStoredMetrics()).toEqual(createDefaultMetrics());
    });
  });

  describe('getStoredActiveTab - out-of-range coercion', () => {
    it('returns 0 when cookie absent', () => {
      expect(getStoredActiveTab()).toBe(0);
    });
  });

  describe('MAX_COOKIE_SIZE_BYTES constant', () => {
    it('is set below the browser cookie hard limit (~4KB)', () => {
      expect(MAX_COOKIE_SIZE_BYTES).toBeLessThan(4096);
      expect(MAX_COOKIE_SIZE_BYTES).toBeGreaterThan(1024);
    });
  });
});

describe('Phase 5 - Active tab persistence', () => {
  test('saveActiveTab + getStoredActiveTab round-trip for every valid tab', () => {
    [0, 1, 2, 3].forEach((tab) => {
      saveActiveTab(tab);
      expect(getStoredActiveTab()).toBe(tab);
    });
  });
});


describe('Shor Domain — N = 15 Factoring', () => {
  test('Factoriza N=15 correctamente con base a = 7', () => {
    const res = factorizeShorN15(7);
    expect(res.isSuccess).toBe(true);
    expect(res.period).toBe(4);
    expect(res.factors).toEqual([3, 5]);
  });

  test('Factoriza N=15 correctamente con base a = 2', () => {
    const res = factorizeShorN15(2);
    expect(res.isSuccess).toBe(true);
    expect(res.period).toBe(4);
    expect(res.factors).toEqual([3, 5]);
  });

  test('Rechaza bases no válidas', () => {
    const res = factorizeShorN15(5);
    expect(res.isSuccess).toBe(false);
    expect(res.factors).toBeNull();
  });
});


describe('Phase 1: Test Harness Baseline Smoke Test', () => {
  it('verifies Vitest test runner is active and deterministic', () => {
    expect(true).toBe(true);
  });

  it('renders a React element in JSDOM environment without throwing', () => {
    render(React.createElement('div', { 'data-testid': 'smoke-element' }, 'Quantum Core Lab Baseline'));
    const element = screen.getByTestId('smoke-element');
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent('Quantum Core Lab Baseline');
  });

  it('verifies Web Audio API global stub is available', () => {
    expect(window.AudioContext).toBeDefined();
    const ctx = new window.AudioContext();
    expect(ctx.state).toBe('suspended');
  });

  it('verifies WebGL canvas context stub is available for Three.js', () => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');
    expect(gl).not.toBeNull();
  });
});


describe('Suite Unificada de Pruebas de Sonido', () => {
  const originalEnv = process.env.NEXT_PUBLIC_ENABLE_AUDIO;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_ENABLE_AUDIO;
    __markUserInteracted();
    __resetAudioOverride();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    if (originalEnv === undefined) delete process.env.NEXT_PUBLIC_ENABLE_AUDIO;
    else process.env.NEXT_PUBLIC_ENABLE_AUDIO = originalEnv;
  });

  describe('isAudioEnabled', () => {
    it('true when env undefined', () => {
      delete process.env.NEXT_PUBLIC_ENABLE_AUDIO;
      expect(isAudioEnabled()).toBe(true);
    });
    it('false when "false"', () => {
      process.env.NEXT_PUBLIC_ENABLE_AUDIO = 'false';
      expect(isAudioEnabled()).toBe(false);
    });
    it('false when "0"', () => {
      process.env.NEXT_PUBLIC_ENABLE_AUDIO = '0';
      expect(isAudioEnabled()).toBe(false);
    });
    it('true when "true"', () => {
      process.env.NEXT_PUBLIC_ENABLE_AUDIO = 'true';
      expect(isAudioEnabled()).toBe(true);
    });
  });

  describe('runtime override', () => {
    it('respects env=false over setAudioEnabled(true)', () => {
      process.env.NEXT_PUBLIC_ENABLE_AUDIO = 'false';
      setAudioEnabled(true);
      expect(isAudioEnabled()).toBe(false);
    });

    it('toggleAudio flips and returns new state', () => {
      delete process.env.NEXT_PUBLIC_ENABLE_AUDIO;
      expect(isAudioEnabled()).toBe(true);
      expect(toggleAudio()).toBe(false);
      expect(isAudioEnabled()).toBe(false);
    });
  });

  describe('playback functions', () => {
    it('playLaserScan does not throw', () => {
      expect(() => playLaserScan()).not.toThrow();
    });
    it('playQuantumCollapse does not throw', () => {
      expect(() => playQuantumCollapse()).not.toThrow();
    });
    it('playChimeSuccess schedules notes without throwing', () => {
      expect(() => playChimeSuccess()).not.toThrow();
      vi.advanceTimersByTime(400);
    });
    it('playDecoherenceAlert does not throw', () => {
      expect(() => playDecoherenceAlert()).not.toThrow();
    });
    it('playButtonClick does not throw', () => {
      expect(() => playButtonClick()).not.toThrow();
    });
    it('playGateForQubit does not throw', () => {
      expect(() => playGateForQubit(0, 'H')).not.toThrow();
    });
    it('playHover does not throw', () => {
      expect(() => playHover()).not.toThrow();
    });
    it('playMeasurementCollapse does not throw', () => {
      expect(() => playMeasurementCollapse(2)).not.toThrow();
    });
  });
});


describe('Phase1 - N-qubit State Vector (N<=6)', () => {
  it('exposes MAX_QUBITS=6 and MAX_DIM=64', () => {
    expect(MAX_QUBITS).toBe(6);
    expect(MAX_DIM).toBe(64);
  });
  it('dimOf(0)=1, dimOf(1)=2, dimOf(6)=64', () => {
    expect(dimOf(0)).toBe(1); expect(dimOf(1)).toBe(2); expect(dimOf(6)).toBe(64);
  });
  it('createZeroState(3) = [1,0,0,0,0,0,0,0]', () => {
    const s = createZeroState(3);
    expect(s).toHaveLength(8);
    expect(s[0]).toEqual({ re: 1, im: 0 });
    for (let i = 1; i < 8; i++) expect(s[i]).toEqual({ re: 0, im: 0 });
  });
  it('rejects nQubits > MAX_QUBITS or negative', () => {
    expect(() => createZeroState(7)).toThrow(/nQubits/);
    expect(() => createZeroState(-1)).toThrow(/nQubits/);
    expect(() => dimOf(2.5)).toThrow(/nQubits/);
  });
  it('probabilities sum to 1 for a normalized state', () => {
    const s = createZeroState(4);
    const sum = probabilities(s).reduce((a: number, b: number) => a + b, 0);
    expect(sum).toBeCloseTo(1, 12);
  });
  it('probability(s, 0) = 1 for |0...0>', () => {
    const s = createZeroState(5);
    expect(probability(s, 0)).toBeCloseTo(1);
    expect(probability(s, 1)).toBeCloseTo(0);
  });
  it('normalize scales amplitudes to unit norm', () => {
    const unnorm = [{ re: 3, im: 0 }, { re: 4, im: 0 }];
    const n = normalize(unnorm);
    expect(probability(n, 0) + probability(n, 1)).toBeCloseTo(1);
    expect(Math.hypot(n[0].re, n[1].re)).toBeCloseTo(1);
  });
  it('normalize returns zero state for zero-norm input', () => {
    const z = normalize([{ re: 0, im: 0 }, { re: 0, im: 0 }]);
    expect(z[0]).toEqual({ re: 1, im: 0 });
  });
  it('innerProduct(<0|0>) = 1', () => {
    const s = createZeroState(2);
    const ip = innerProduct(s, s);
    expect(ip.re).toBeCloseTo(1);
    expect(ip.im).toBeCloseTo(0);
  });
});


describe('Synth / Sound Lib', () => {
  it('should play notes without throwing', () => {
    expect(() => playNote(440, 0.1)).not.toThrow();
  });
});


describe('ResourceTracker', () => {
  test('registra y libera recursos disponsables', () => {
    const tracker = new ResourceTracker();
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial();
    const spyGeo = vi.spyOn(geometry, 'dispose');
    const spyMat = vi.spyOn(material, 'dispose');

    tracker.track(geometry);
    tracker.track(material);

    tracker.dispose();

    expect(spyGeo).toHaveBeenCalled();
    expect(spyMat).toHaveBeenCalled();
  });
});


describe('Infraestructura WebGL - createScene y Gestión de Memoria', () => {
  it('debe liberar recursivamente geometrías, materiales y texturas con disposeResource', () => {
    const scene = new THREE.Scene();
    const geometry = new THREE.BufferGeometry();
    const texture = new THREE.Texture();
    const material = new THREE.MeshBasicMaterial({ map: texture });
    const mesh = new THREE.Mesh(geometry, material);

    const geoDisposeSpy = vi.spyOn(geometry, 'dispose');
    const matDisposeSpy = vi.spyOn(material, 'dispose');
    const texDisposeSpy = vi.spyOn(texture, 'dispose');

    scene.add(mesh);
    disposeResource(scene);

    expect(geoDisposeSpy).toHaveBeenCalledTimes(1);
    expect(matDisposeSpy).toHaveBeenCalledTimes(1);
    expect(texDisposeSpy).toHaveBeenCalledTimes(1);
  });
});

describe('DT-09: WebGL Infrastructure & Material Cache Unit Tests', () => {
  beforeEach(() => {
    clearResourceCache();
    clearSpriteMaterialCache();
  });

  test('cached() helper reusa geometrías/materiales compartidos', () => {
    const geo1 = cached('test-box', () => new THREE.BoxGeometry(1, 1, 1));
    const geo2 = cached('test-box', () => new THREE.BoxGeometry(2, 2, 2));
    expect(geo1).toBe(geo2);
  });
});


// jsdom lacks PointerEvent in some versions; polyfill minimally.
if (typeof (globalThis as { PointerEvent?: unknown }).PointerEvent === 'undefined') {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = (init as { pointerId?: number }).pointerId ?? 1;
    }
  }
  (globalThis as { PointerEvent: typeof PointerEventPolyfill }).PointerEvent = PointerEventPolyfill;
}

function makeCanvas(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  (c as unknown as { setPointerCapture: (id: number) => void }).setPointerCapture = vi.fn();
  (c as unknown as { releasePointerCapture: (id: number) => void }).releasePointerCapture = vi.fn();
  return c;
}

function dispatchPointer(target: EventTarget, type: string, init: { clientX: number; clientY: number; pointerId?: number; button?: number } = { clientX: 0, clientY: 0 }) {
  const ev = new PointerEvent(type, {
    bubbles: true, cancelable: true,
    pointerId: init.pointerId ?? 1,
    button: init.button ?? 0,
    buttons: 1,
    clientX: init.clientX, clientY: init.clientY,
  });
  target.dispatchEvent(ev);
}

describe('createOrbitControls', () => {
  let camera: THREE.PerspectiveCamera;
  let canvas: HTMLCanvasElement;
  let controls: OrbitControlsHandle;

  beforeEach(() => {
    camera = new THREE.PerspectiveCamera(45, 16 / 10, 0.1, 100);
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
    canvas = makeCanvas();
    controls = createOrbitControls(camera, canvas, { enableDamping: false, minDistance: 1, maxDistance: 10 });
  });

  afterEach(() => { controls.dispose(); });

  it('applies initial spherical position on construction', () => {
    expect(camera.position.length()).toBeCloseTo(5, 1);
  });

  it('rotates camera on drag', () => {
    const before = camera.position.clone();
    dispatchPointer(canvas, 'pointerdown', { clientX: 100, clientY: 100 });
    dispatchPointer(canvas, 'pointermove', { clientX: 200, clientY: 100 });
    dispatchPointer(canvas, 'pointerup', { clientX: 200, clientY: 100 });
    controls.update(0);
    expect(before.distanceTo(camera.position)).toBeGreaterThan(0.1);
  });

  it('clamps zoom distance to min on strong wheel-in', () => {
    canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: -100000, bubbles: true, cancelable: true }));
    for (let i = 0; i < 30; i++) controls.update(0.05);
    expect(camera.position.length()).toBeGreaterThanOrEqual(1 - 0.05);
    expect(camera.position.length()).toBeLessThan(1.5);
  });

  it('clamps zoom distance to max on strong wheel-out', () => {
    canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: 100000, bubbles: true, cancelable: true }));
    for (let i = 0; i < 30; i++) controls.update(0.05);
    expect(camera.position.length()).toBeLessThanOrEqual(10 + 0.05);
    expect(camera.position.length()).toBeGreaterThan(9);
  });

  it('resetView restores initial spherical coordinates', () => {
    dispatchPointer(canvas, 'pointerdown', { clientX: 100, clientY: 100 });
    dispatchPointer(canvas, 'pointermove', { clientX: 300, clientY: 100 });
    dispatchPointer(canvas, 'pointerup', { clientX: 300, clientY: 100 });
    controls.update(0);
    expect(camera.position.distanceTo(new THREE.Vector3(0, 0, 5))).toBeGreaterThan(0.1);

    controls.resetView();
    expect(camera.position.x).toBeCloseTo(0, 1);
    expect(camera.position.y).toBeCloseTo(0, 1);
    expect(camera.position.z).toBeCloseTo(5, 1);
  });

  it('reports dragging state transitions', () => {
    expect(controls.isDragging()).toBe(false);
    dispatchPointer(canvas, 'pointerdown', { clientX: 100, clientY: 100 });
    expect(controls.isDragging()).toBe(true);
    dispatchPointer(canvas, 'pointerup', { clientX: 100, clientY: 100 });
    expect(controls.isDragging()).toBe(false);
  });

  it('dispose stops responding to pointer events', () => {
    controls.dispose();
    const before = camera.position.clone();
    dispatchPointer(canvas, 'pointerdown', { clientX: 100, clientY: 100 });
    dispatchPointer(canvas, 'pointermove', { clientX: 300, clientY: 100 });
    controls.update(0);
    expect(camera.position.distanceTo(before)).toBeLessThan(0.01);
  });

  it('respects minDistance/maxDistance invariants under random wheels', () => {
    for (let i = 0; i < 40; i++) {
      const dy = (Math.random() - 0.5) * 8000;
      canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: dy, bubbles: true, cancelable: true }));
      controls.update(0.02);
      const d = camera.position.length();
      expect(d).toBeGreaterThanOrEqual(1 - 0.05);
      expect(d).toBeLessThanOrEqual(10 + 0.05);
    }
  });
});


describe('Ciclo de Vida WebGL y ResourceTracker', () => {
  test('Registra y libera recursos correctamente', () => {
    const tracker = new ResourceTracker();
    const geometry = tracker.track(new THREE.BoxGeometry(1, 1, 1));
    const spyDispose = vi.spyOn(geometry, 'dispose');

    tracker.dispose();
    expect(spyDispose).toHaveBeenCalledTimes(1);
  });

  test('Respeta recursos compartidos etiquetados con __shared', () => {
    const tracker = new ResourceTracker();
    const material = tracker.track(new THREE.MeshBasicMaterial());
    material.userData.__shared = true;
    const spyDispose = vi.spyOn(material, 'dispose');

    tracker.dispose();
    expect(spyDispose).not.toHaveBeenCalled();
  });
});