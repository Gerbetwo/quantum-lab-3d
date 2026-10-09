/**
 * Synthesized Web Audio engine with env gate + runtime override.
 * Delegates procedural synthesis to @/shared/lib/audio/synth.
 *
 * Public API: legacy functions (playLaserScan, playQuantumCollapse, playChimeSuccess,
 * playDecoherenceAlert, playButtonClick, playSound, IS_AUDIO_ENABLED, isAudioEnabled,
 * setAudioEnabled, toggleAudio, __markUserInteracted, __resetAudioOverride) preserved
 * verbatim. Phase 3 adds: playGatePlaced, playStepAdvance, playGateForQubit, playHover,
 * playMeasurementCollapse.
 */

import { qubitToFrequency, gateDurationMs, adsrEnvelope } from '@/core/quantum/scales';
import { playNote, playSweep } from '@/shared/lib/audio/synth';

let audioOverride: boolean | null = null;
let userInteracted = false;

if (typeof window !== 'undefined') {
  const mark = () => { userInteracted = true; };
  window.addEventListener('pointerdown', mark, { once: true, passive: true });
  window.addEventListener('keydown', mark, { once: true });
}

export function isAudioEnabled(): boolean {
  if (audioOverride !== null) return audioOverride;
  if (typeof process !== 'undefined' && process.env) {
    const envVal = process.env.NEXT_PUBLIC_ENABLE_AUDIO;
    if (envVal === 'false' || envVal === '0') return false;
  }
  return true;
}

export function setAudioEnabled(enabled: boolean): void {
  audioOverride = enabled;
}

export function toggleAudio(): boolean {
  const next = !isAudioEnabled();
  audioOverride = next;
  return next;
}

export function __resetAudioOverride(): void {
  audioOverride = null;
}

export function __markUserInteracted(): void {
  userInteracted = true;
}

function hasUserInteracted(): boolean {
  return userInteracted;
}

let cachedCtx: AudioContext | null = null;
let cachedCtor: unknown = null;

function getAudioContext(): AudioContext | null {
  if (!isAudioEnabled()) return null;
  if (!hasUserInteracted()) return null;
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    AudioContext?: new () => AudioContext;
    webkitAudioContext?: new () => AudioContext;
  };
  const Ctor = w.AudioContext ?? w.webkitAudioContext;
  if (!Ctor) return null;
  if (cachedCtx && cachedCtor === Ctor) return cachedCtx;
  try {
    cachedCtx = new Ctor();
    cachedCtor = Ctor;
    if (cachedCtx.state === 'suspended') {
      void cachedCtx.resume().catch(() => {});
    }
  } catch {
    cachedCtx = null;
    cachedCtor = null;
    return null;
  }
  return cachedCtx;
}

// ---------------------------------------------------------------------------
// Legacy API (unchanged behaviour)
// ---------------------------------------------------------------------------

export function playLaserScan(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(1800, t + 0.28);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.15, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.32);
  } catch { /* no-op */ }
}

export function playQuantumCollapse(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.25);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.4);
  } catch { /* no-op */ }
}

export function playChimeSuccess(): void {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => {
    setTimeout(() => {
      const ctx = getAudioContext();
      if (!ctx) return;
      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        const t = ctx.currentTime;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.32);
      } catch { /* no-op */ }
    }, i * 90);
  });
}

export function playDecoherenceAlert(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      const t = ctx.currentTime + i * 0.09;
      osc.frequency.setValueAtTime(180, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.09);
    }
  } catch { /* no-op */ }
}

export function playButtonClick(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(1200, t);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.07);
  } catch { /* no-op */ }
}

export function playGatePlaced(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(900, t);
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.1);
  } catch { /* no-op */ }
}

export function playStepAdvance(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.1);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.13);
  } catch { /* no-op */ }
}

export const playSound = (soundName: string): void => {
  if (!isAudioEnabled()) return;
  void soundName;
};

export const IS_AUDIO_ENABLED: boolean = isAudioEnabled();

// ---------------------------------------------------------------------------
// Phase 3 - qubit-indexed procedural synthesis
// ---------------------------------------------------------------------------

export function playGateForQubit(qubit: number, gateType: string): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const freq = qubitToFrequency(qubit, 220, 'pentatonic-major');
    const dur = gateDurationMs(gateType);
    const env = adsrEnvelope(gateType.length > 2 ? 'pad' : 'pluck');
    const waveform: OscillatorType = gateType.length > 2 ? 'triangle' : 'sine';
    playNote({ ctx, destination: ctx.destination, gain: 0.09 }, freq, dur, env, waveform);
  } catch { /* no-op */ }
}

export function playHover(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    playNote(
      { ctx, destination: ctx.destination, gain: 0.03 },
      1600,
      40,
      { attack: 0.001, decay: 0.02, sustain: 0.01, release: 0.02 },
      'sine'
    );
  } catch { /* no-op */ }
}

export function playMeasurementCollapse(qubit: number = 0): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const fromHz = qubitToFrequency(qubit, 220, 'pentatonic-major') * 4;
    const toHz = Math.max(60, qubitToFrequency(qubit, 220, 'pentatonic-major') / 2);
    playSweep({ ctx, destination: ctx.destination, gain: 0.16 }, fromHz, toHz, 320, 'sawtooth');
  } catch { /* no-op */ }
}


// ---------------------------------------------------------------------------
// Phase 4 - explicit AudioContext lifecycle control (test + HMR safety)
// ---------------------------------------------------------------------------

export function __closeAudioContext(): void {
  if (cachedCtx) {
    try { void cachedCtx.close(); } catch { /* no-op */ }
    cachedCtx = null;
    cachedCtor = null;
  }
}

interface HotContext { hot?: { dispose(cb: () => void): void } }
const hotCtx = (typeof module !== 'undefined' ? module : undefined) as unknown as HotContext | undefined;
hotCtx?.hot?.dispose(() => { __closeAudioContext(); });
