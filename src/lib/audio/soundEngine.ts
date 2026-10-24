/**
 * QuantumLab 3D - Procedural Web Audio API Sound FX Engine
 * Generates synthesized acoustic cues for quantum interactions without external MP3 files.
 */

let runtimeAudioOverride: boolean | null = null;
let gestureListenersAttached = false;
let masterVolume: number = 0.8;

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

export function getVolume(): number {
  return masterVolume;
}

export function setVolume(volume: number): void {
  masterVolume = Math.max(0, Math.min(1, Number.isFinite(volume) ? volume : 0.8));
}

export class SoundEngine {
  private ctx: AudioContext | null = null;

  constructor() {
    this.attachGestureListeners();
  }

  private attachGestureListeners(): void {
    if (typeof window === 'undefined' || gestureListenersAttached) return;
    gestureListenersAttached = true;

    const unlockOnGesture = () => {
      this.unlock();
      window.removeEventListener('pointerdown', unlockOnGesture);
      window.removeEventListener('keydown', unlockOnGesture);
      window.removeEventListener('click', unlockOnGesture);
    };

    window.addEventListener('pointerdown', unlockOnGesture, { passive: true });
    window.addEventListener('keydown', unlockOnGesture, { passive: true });
    window.addEventListener('click', unlockOnGesture, { passive: true });
  }

  public getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      } catch {
        return null;
      }
    }
    return this.ctx;
  }

  public async unlock(): Promise<void> {
    const ctx = this.getContext();
    if (ctx && ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        // no-op
      }
    }
  }

  /**
   * Vector Snap: Crisp high-frequency snap cue on Bloch pole / axis snap.
   * Frequency ramp: 880 Hz -> 220 Hz, duration 80ms.
   */
  public playVectorSnap(): void {
    if (!isAudioEnabled()) return;
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const duration = 0.08; // 80ms
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + duration);

      gain.gain.setValueAtTime(0.12 * masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    } catch {
      // Safe fallback
    }
  }

  /**
   * Gate Sweep: Frequency-swept tone based on quantum gate type.
   * Sweep profiles:
   *  - X: 350 Hz -> 700 Hz
   *  - Z: 600 Hz -> 300 Hz
   *  - H: 440 Hz -> 880 Hz
   */
  public playGateSweep(gateType: string = 'H'): void {
    if (!isAudioEnabled()) return;
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const duration = 0.12;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      const [startFreq, endFreq] =
        gateType === 'X'
          ? [350, 700]
          : gateType === 'Z'
          ? [600, 300]
          : [440, 880];

      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

      gain.gain.setValueAtTime(0.14 * masterVolume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    } catch {
      // Safe fallback
    }
  }

  /**
   * State Collapse Drop: Exponential sub-bass drop with white-noise burst.
   * Drop: 130 Hz -> 32 Hz, duration ~220ms.
   * Noise burst duration: ~80ms.
   */
  public playCollapseDrop(): void {
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
      oscGain.gain.setValueAtTime(0.25 * masterVolume, now);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
      osc.onended = () => {
        osc.disconnect();
        oscGain.disconnect();
      };

      // Synthesized white-noise burst
      const noiseDur = 0.08;
      const bufSize = Math.floor(ctx.sampleRate * noiseDur);
      const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      const noiseGain = ctx.createGain();
      noise.buffer = buffer;
      noiseGain.gain.setValueAtTime(0.1 * masterVolume, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + noiseDur);

      noise.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + noiseDur);
      noise.onended = () => {
        noise.disconnect();
        noiseGain.disconnect();
      };
    } catch {
      // Safe fallback
    }
  }

  /**
   * Completion Triad: Resonant harmonic chord C5-E5-G5 (523 Hz, 659 Hz, 783 Hz).
   */
  public playCompletionTriad(): void {
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
        gain.gain.linearRampToValueAtTime(0.07 * masterVolume, now + idx * 0.03 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.03);
        osc.stop(now + duration);
        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };
      });
    } catch {
      // Safe fallback
    }
  }

  public getVolume(): number {
    return getVolume();
  }

  public setVolume(vol: number): void {
    setVolume(vol);
  }

  public isAudioEnabled(): boolean {
    return isAudioEnabled();
  }

  public setAudioEnabled(enabled: boolean): void {
    setAudioEnabled(enabled);
  }

  public toggleAudio(): boolean {
    return toggleAudio();
  }

  // Backward compatibility aliases
  public playGateSound(gateType: string = 'H'): void {
    this.playGateSweep(gateType);
  }
  public playGateExecution(gateType: string = 'H'): void {
    this.playGateSweep(gateType);
  }
  public playStateCollapse(): void {
    this.playCollapseDrop();
  }
  public playMeasurementSound(): void {
    this.playCollapseDrop();
  }
  public playMissionComplete(): void {
    this.playCompletionTriad();
  }
  public playSuccessSound(): void {
    this.playCompletionTriad();
  }
}

// Global Singleton Export
export const soundEngine = new SoundEngine();
export const audioEngine = soundEngine;
export const QuantumAudioEngine = SoundEngine;

// Standalone Functional Exports
export const playVectorSnap = (): void => soundEngine.playVectorSnap();
export const playGateSweep = (gate?: string): void => soundEngine.playGateSweep(gate);
export const playGateSound = (gate?: string): void => soundEngine.playGateSweep(gate);
export const playGateExecution = (gate?: string): void => soundEngine.playGateSweep(gate);
export const playCollapseDrop = (): void => soundEngine.playCollapseDrop();
export const playStateCollapse = (): void => soundEngine.playCollapseDrop();
export const playMeasurementSound = (): void => soundEngine.playCollapseDrop();
export const playCompletionTriad = (): void => soundEngine.playCompletionTriad();
export const playMissionComplete = (): void => soundEngine.playCompletionTriad();
export const playSuccessSound = (): void => soundEngine.playCompletionTriad();
