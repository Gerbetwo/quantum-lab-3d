/**
 * QuantumLab 3D - Procedural Web Audio API Sound Engine
 * Generates synthesized acoustic cues for quantum interactions without external MP3 files.
 */

let runtimeAudioOverride: boolean | null = null;

export function isAudioEnabled(): boolean {
  if (typeof process !== 'undefined' && process.env) {
    const env = process.env.NEXT_PUBLIC_ENABLE_AUDIO;
    if (env === 'false' || env === '0') return false;
  }
  return runtimeAudioOverride !== null ? runtimeAudioOverride : true;
}

export function setAudioEnabled(enabled: boolean): void {
  runtimeAudioOverride = enabled;
}

export function toggleAudio(): boolean {
  const next = !isAudioEnabled();
  setAudioEnabled(next);
  return next;
}

let _userInteracted = false;

export function __markUserInteracted(): void {
  _userInteracted = true;
}

export function __resetAudioOverride(): void {
  runtimeAudioOverride = null;
  _userInteracted = false;
}

export class SoundEngine {
  private ctx: AudioContext | null = null;

  public getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      } catch (_err) {
        return null;
      }
    }
    return this.ctx;
  }

  public async unlock(): Promise<void> {
    const ctx = this.getContext();
    if (ctx && ctx.state === 'suspended') {
      try { await ctx.resume(); } catch (_err) { /* no-op */ }
    }
  }

  /** Vector Snap: Crisp high-frequency snap cue on Bloch pole / axis snap. */
  public playVectorSnap(): void {
    if (!isAudioEnabled()) return;
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const duration = 0.04;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + duration);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
    } catch (_err) { /* fail-safe */ }
  }

  /** Gate Execution: Synthesized frequency-swept tone based on quantum gate (H, X, Z). */
  public playGateSound(gateType: string = 'H'): void {
    if (!isAudioEnabled()) return;
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const duration = 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const [startFreq, endFreq] = gateType === 'X' ? [350, 700] : gateType === 'Z' ? [600, 300] : [440, 880];

      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
    } catch (_err) { /* fail-safe */ }
  }

  /** State Collapse: Sub-bass exponential drop with white-noise burst. */
  public playStateCollapse(): void {
    if (!isAudioEnabled()) return;
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const duration = 0.22;
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(130, now);
      osc.frequency.exponentialRampToValueAtTime(32, now + duration);
      oscGain.gain.setValueAtTime(0.25, now);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
      osc.onended = () => { osc.disconnect(); oscGain.disconnect(); };

      // Noise burst
      const noiseDur = 0.08;
      const bufSize = Math.floor(ctx.sampleRate * noiseDur);
      const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

      const noise = ctx.createBufferSource();
      const noiseGain = ctx.createGain();
      noise.buffer = buffer;
      noiseGain.gain.setValueAtTime(0.1, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + noiseDur);

      noise.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + noiseDur);
      noise.onended = () => { noise.disconnect(); noiseGain.disconnect(); };
    } catch (_err) { /* fail-safe */ }
  }

  /** Mission Completion: Resonant harmonic triad chord (C5, E5, G5). */
  public playMissionComplete(): void {
    if (!isAudioEnabled()) return;
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const duration = 0.38;
      const triad = [523.25, 659.25, 783.99];

      triad.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.03);
        gain.gain.setValueAtTime(0, now + idx * 0.03);
        gain.gain.linearRampToValueAtTime(0.07, now + idx * 0.03 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.03);
        osc.stop(now + duration);
        osc.onended = () => { osc.disconnect(); gain.disconnect(); };
      });
    } catch (_err) { /* fail-safe */ }
  }

  public playErrorSound(): void {
    if (!isAudioEnabled()) return;
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return;
    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
    } catch (_err) { /* Safe */ }
  }

  // Compatibility aliases
  public playMeasurementSound(): void { this.playStateCollapse(); }
  public playSuccessSound(): void { this.playMissionComplete(); }
  public playGateExecution(gateType: string = 'H'): void { this.playGateSound(gateType); }
}

// Global Singleton Export
export const soundEngine = new SoundEngine();
export const audioEngine = soundEngine;
export const QuantumAudioEngine = SoundEngine;

// Standalone Helper Functions
export const playVectorSnap = (): void => soundEngine.playVectorSnap();
export const playGateExecution = (gate?: string): void => soundEngine.playGateExecution(gate);
export const playGateSound = (gate?: string): void => soundEngine.playGateSound(gate);
export const playStateCollapse = (): void => soundEngine.playStateCollapse();
export const playMeasurementSound = (): void => soundEngine.playMeasurementSound();
export const playMissionComplete = (): void => soundEngine.playMissionComplete();
export const playSuccessSound = (): void => soundEngine.playSuccessSound();
export const playErrorSound = (): void => soundEngine.playErrorSound();

export function playNote(freq = 440, duration = 0.1): void {
  if (!isAudioEnabled()) return;
  const ctx = soundEngine.getContext();
  if (!ctx || ctx.state !== 'running') return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (_err) { /* Safe */ }
}

export const playChimeSuccess = (): void => soundEngine.playSuccessSound();
export const playQuantumCollapse = (): void => soundEngine.playMeasurementSound();
export const playMeasurementCollapse = (_n?: number): void => soundEngine.playMeasurementSound();
export const playGateForQubit = (_q?: number, gate = 'H'): void => soundEngine.playGateSound(gate);
export const playDecoherenceAlert = (): void => soundEngine.playErrorSound();
export const playLaserScan = (): void => soundEngine.playGateSound('LASER');
export const playButtonClick = (): void => playNote(600, 0.05);
export const playHover = (): void => playNote(300, 0.02);

