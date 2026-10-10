/**
 * QuantumLab 3D - Web Audio API Sound Engine
 * Hardened version with strict environment gating, user gesture validation, and timer cleanup.
 */

let audioOverride: boolean | null = null;
let userInteracted: boolean = false;
let audioCtx: AudioContext | null = null;
const activeTimeouts: ReturnType<typeof setTimeout>[] = [];

/**
 * Determines whether audio is currently enabled based on environment variables,
 * explicit user toggles, and user interaction status.
 * If NEXT_PUBLIC_ENABLE_AUDIO is explicitly 'false' or '0', it overrides everything.
 */
export function isAudioEnabled(): boolean {
  const envVal =
    typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_ENABLE_AUDIO : undefined;
  
  if (envVal === 'false' || envVal === '0') {
    return false;
  }
  if (envVal === 'true') {
    return true;
  }

  if (audioOverride !== null) {
    return audioOverride;
  }

  return userInteracted;
}

export function setAudioEnabled(enabled: boolean) {
  const envVal =
    typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_ENABLE_AUDIO : undefined;
  if (envVal === 'false' || envVal === '0') {
    // Prevent enabling if globally disabled by environment
    audioOverride = false;
    return;
  }
  audioOverride = enabled;
}

export function toggleAudio(): boolean {
  const envVal =
    typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_ENABLE_AUDIO : undefined;
  if (envVal === 'false' || envVal === '0') {
    audioOverride = false;
    return false;
  }
  audioOverride = !isAudioEnabled();
  return audioOverride;
}

export function resetAudioOverride() {
  audioOverride = null;
}

export function markUserInteracted() {
  userInteracted = true;
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

export function hasUserInteracted(): boolean {
  return userInteracted;
}

/**
 * Safely initializes or retrieves the shared AudioContext.
 * Guaranteed never to attempt creation or resumption during render or prior to user gesture.
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!isAudioEnabled() || !userInteracted) return null;

  if (!audioCtx) {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    } catch (e) {
      console.warn('Web Audio API initialization failed safely:', e);
      return null;
    }
  }

  if (audioCtx && audioCtx.state === 'suspended' && userInteracted) {
    audioCtx.resume().catch(() => {
      // Suppress browser restriction rejections
    });
  }

  return audioCtx;
}

/**
 * Clears any pending scheduled sound timeouts to prevent memory leaks or post-unmount execution.
 */
function clearScheduledTimeouts() {
  while (activeTimeouts.length > 0) {
    const timeoutId = activeTimeouts.pop();
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/**
 * Core internal synthesizer for generating envelope-shaped oscillator tones.
 */
function playTone(
  frequency: number,
  type: OscillatorType = 'sine',
  duration: number = 0.15,
  gainValue: number = 0.1,
  freqEnd?: number
) {
  if (!isAudioEnabled() || !userInteracted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(frequency, 10), ctx.currentTime);

    if (freqEnd !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(freqEnd, 10),
        ctx.currentTime + duration
      );
    }

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(gainValue, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);

    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  } catch (err) {
    console.warn('Audio playback safely intercepted (non-blocking):', err);
  }
}

// ==========================================
// Exported Playback Functions
// ==========================================

export function playNote(...args: unknown[]) {
  const freq = typeof args[0] === 'number' ? args[0] : 440;
  const type = (typeof args[1] === 'string' ? args[1] : 'sine') as OscillatorType;
  const duration = typeof args[2] === 'number' ? args[2] : 0.2;
  playTone(freq, type, duration, 0.1);
}

export function playSweep(...args: unknown[]) {
  const startFreq = typeof args[0] === 'number' ? args[0] : 200;
  const endFreq = typeof args[1] === 'number' ? args[1] : 800;
  const duration = typeof args[2] === 'number' ? args[2] : 0.3;
  playTone(startFreq, 'sine', duration, 0.1, endFreq);
}

export function playChord(...args: unknown[]) {
  const freqs = Array.isArray(args[0])
    ? (args[0] as number[])
    : [261.63, 329.63, 392.00]; // Default C major triad
  const duration = typeof args[1] === 'number' ? args[1] : 0.4;
  freqs.forEach((f) => playTone(f, 'triangle', duration, 0.08));
}

export function playButtonClick(..._args: unknown[]) {
  playTone(880, 'sine', 0.04, 0.04, 440);
}

export function playLaserScan(..._args: unknown[]) {
  playTone(1200, 'sawtooth', 0.2, 0.05, 300);
}

export function playQuantumCollapse(..._args: unknown[]) {
  if (!isAudioEnabled() || !userInteracted) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(550, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.45);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.45);
  } catch (e) {
    console.warn('Quantum collapse audio failed safely:', e);
  }
}

export function playChimeSuccess(..._args: unknown[]) {
  clearScheduledTimeouts();
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 arpeggio
  notes.forEach((freq, idx) => {
    const timeoutId = setTimeout(() => {
      playTone(freq, 'sine', 0.3, 0.08);
    }, idx * 75);
    activeTimeouts.push(timeoutId);
  });
}

export function playDecoherenceAlert(..._args: unknown[]) {
  playTone(140, 'square', 0.35, 0.09, 90);
}

export function playGateForQubit(..._args: unknown[]) {
  playTone(659.25, 'triangle', 0.1, 0.07, 987.77);
}

export function playHover(..._args: unknown[]) {
  playTone(440, 'sine', 0.02, 0.02);
}

export function playMeasurementCollapse(..._args: unknown[]) {
  playTone(950, 'sawtooth', 0.12, 0.08, 180);
}

export const __markUserInteracted = markUserInteracted;
export const __resetAudioOverride = resetAudioOverride;
export const __clearScheduledTimeouts = clearScheduledTimeouts;