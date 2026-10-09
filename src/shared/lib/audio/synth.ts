/**
 * Procedural Web Audio synth. AudioContext is INJECTED (no global state).
 * Every public function is a safe no-op if the injected ctx throws.
 */

import type { AdsrEnvelope } from '@/core/quantum/scales';

export interface SynthOptions {
  ctx: AudioContext;
  destination: AudioNode;
  gain?: number;
}

export type Waveform = OscillatorType;

const DEFAULT_GAIN = 0.12;

export function playNote(
  opts: SynthOptions,
  freqHz: number,
  durationMs: number,
  envelope: AdsrEnvelope,
  waveform: Waveform = 'sine'
): void {
  const { ctx, destination, gain = DEFAULT_GAIN } = opts;
  try {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = waveform;
    osc.frequency.setValueAtTime(freqHz, ctx.currentTime);

    const t0 = ctx.currentTime;
    const durSec = durationMs / 1000;
    const peak = Math.max(0.0001, gain);

    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + envelope.attack);
    g.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, peak * envelope.sustain),
      t0 + envelope.attack + envelope.decay
    );
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + durSec + envelope.release);

    osc.connect(g);
    g.connect(destination);
    osc.start(t0);
    osc.stop(t0 + durSec + envelope.release + 0.01);
  } catch {
    /* no-op in unsupported environments */
  }
}

export function playSweep(
  opts: SynthOptions,
  fromHz: number,
  toHz: number,
  durationMs: number,
  waveform: Waveform = 'sawtooth'
): void {
  const { ctx, destination, gain = DEFAULT_GAIN } = opts;
  try {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = waveform;
    const t0 = ctx.currentTime;
    const durSec = durationMs / 1000;

    osc.frequency.setValueAtTime(fromHz, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, toHz), t0 + durSec);

    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + durSec);

    osc.connect(g);
    g.connect(destination);
    osc.start(t0);
    osc.stop(t0 + durSec + 0.02);
  } catch {
    /* no-op */
  }
}

export function playChord(
  opts: SynthOptions,
  freqsHz: number[],
  durationMs: number,
  envelope: AdsrEnvelope = { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.2 }
): void {
  for (const f of freqsHz) {
    playNote(opts, f, durationMs, envelope, 'triangle');
  }
}
