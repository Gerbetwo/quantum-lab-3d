/**
 * Pure microtonal scale & frequency mapping.
 * No React, no Three.js, no window, no Math.random, no Date.now.
 */

export type ScaleName = 'pentatonic-major' | 'pentatonic-minor' | 'microtonal-quarter';

const SCALE_RATIOS: Record<ScaleName, readonly number[]> = {
  'pentatonic-major': [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3],
  'pentatonic-minor': [1, 6 / 5, 3 / 2, 9 / 5, 5 / 2],
  'microtonal-quarter': [1, 17 / 16, 9 / 8, 19 / 16, 5 / 4, 21 / 16],
};

const DEFAULT_BASE_HZ = 220;

function ratioFor(qubitIndex: number, scale: ScaleName): number {
  const ratios = SCALE_RATIOS[scale];
  const octave = Math.floor(qubitIndex / ratios.length);
  const idx = qubitIndex % ratios.length;
  return ratios[idx] * Math.pow(2, octave);
}

export function qubitToFrequency(
  qubitIndex: number,
  baseHz: number = DEFAULT_BASE_HZ,
  scale: ScaleName = 'pentatonic-major'
): number {
  if (!Number.isInteger(qubitIndex) || qubitIndex < 0) {
    throw new RangeError('qubitIndex must be a non-negative integer, got ' + qubitIndex);
  }
  if (!Number.isFinite(baseHz) || baseHz <= 0) {
    throw new RangeError('baseHz must be a positive finite number, got ' + baseHz);
  }
  if (!(scale in SCALE_RATIOS)) {
    throw new RangeError('Unknown scale: ' + String(scale));
  }
  return baseHz * ratioFor(qubitIndex, scale);
}

const MULTI_QUBIT_GATES = new Set(['CNOT', 'CZ', 'SWAP', 'CS', 'CT']);
const SINGLE_QUBIT_DURATION_MS = 140;
const MULTI_QUBIT_DURATION_MS = 260;

export function gateDurationMs(gateType: string): number {
  return MULTI_QUBIT_GATES.has(gateType) ? MULTI_QUBIT_DURATION_MS : SINGLE_QUBIT_DURATION_MS;
}

export interface AdsrEnvelope {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

const ENVELOPES: Record<'pluck' | 'pad' | 'chirp', AdsrEnvelope> = {
  pluck: { attack: 0.005, decay: 0.06, sustain: 0.15, release: 0.12 },
  pad:   { attack: 0.15,  decay: 0.3,  sustain: 0.6,  release: 0.4  },
  chirp: { attack: 0.01,  decay: 0.1,  sustain: 0.25, release: 0.25 },
};

export function adsrEnvelope(type: 'pluck' | 'pad' | 'chirp'): AdsrEnvelope {
  const e = ENVELOPES[type];
  return { attack: e.attack, decay: e.decay, sustain: e.sustain, release: e.release };
}
