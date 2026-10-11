/**
 * QuantumLab 3D - Web Audio API Sound Engine
 * Dual-layer API supporting both object-oriented QuantumAudioEngine singleton
 * and legacy exported audio helper functions for standard/test suite compatibility.
 */

export class QuantumAudioEngine {
  private ctx: AudioContext | null = null;

  /**
   * Lazy initialization for AudioContext.
   * Prevents premature instantiation before user gestures or during SSR.
   */
  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
        }
      } catch (_err) {
        console.warn('AudioContext initialization failed safely:', _err);
        return null;
      }
    }

    return this.ctx;
  }

  /**
   * Resumes the suspended AudioContext.
   */
  public async unlock(): Promise<void> {
    const ctx = this.getContext();
    if (ctx && ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (_err) {
        console.warn('AudioContext unlock failed safely:', _err);
      }
    }
  }

  /**
   * Plays a gate sound effect: Oscillator sine sweep from 440 Hz to 880 Hz over 0.15s.
   * @param gateType - Type of quantum gate being executed.
   */
  public playGateSound(_gateType: string): void {
    if (!isAudioEnabled()) return;
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const duration = 0.15;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + duration);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    } catch (_err) {
      console.warn('playGateSound failed safely:', _err);
    }
  }

  /**
   * Plays a measurement collapse sound effect: Low frequency impact (120 Hz to 30 Hz) with a noise buffer burst.
   */
  public playMeasurementSound(): void {
    if (!isAudioEnabled()) return;
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const duration = 0.25;

      // Low-frequency impact sweep (120 Hz -> 30 Hz)
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(30, now + duration);

      oscGain.gain.setValueAtTime(0.3, now);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);

      osc.onended = () => {
        osc.disconnect();
        oscGain.disconnect();
      };

      // White noise buffer burst
      const noiseDuration = 0.1;
      const bufferSize = Math.floor(ctx.sampleRate * noiseDuration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const noiseSource = ctx.createBufferSource();
      const noiseGain = ctx.createGain();

      noiseSource.buffer = buffer;

      noiseGain.gain.setValueAtTime(0.12, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + noiseDuration);

      noiseSource.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      noiseSource.start(now);
      noiseSource.stop(now + noiseDuration);

      noiseSource.onended = () => {
        noiseSource.disconnect();
        noiseGain.disconnect();
      };
    } catch (_err) {
      console.warn('playMeasurementSound failed safely:', _err);
    }
  }

  /**
   * Plays a success sound effect: Harmonic triad chord (C5, E5, G5).
   */
  public playSuccessSound(): void {
    if (!isAudioEnabled()) return;
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const duration = 0.4;
      const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5

      frequencies.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.08, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + duration);

        osc.onended = () => {
          osc.disconnect();
          gain.disconnect();
        };
      });
    } catch (_err) {
      console.warn('playSuccessSound failed safely:', _err);
    }
  }

  /**
   * Plays an error sound effect: Sawtooth buzz at 150 Hz.
   */
  public playErrorSound(): void {
    if (!isAudioEnabled()) return;
    const ctx = this.getContext();
    if (!ctx || ctx.state !== 'running') return;

    try {
      const now = ctx.currentTime;
      const duration = 0.25;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration);

      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    } catch (_err) {
      console.warn('playErrorSound failed safely:', _err);
    }
  }
}

export const audioEngine = new QuantumAudioEngine();

// ============================================================================
// Legacy Standalone Exports & State Management (For Unit Tests and Consumers)
// ============================================================================

let _userInteracted = false;
let runtimeAudioEnabledOverride: boolean | null = null;

export function isAudioEnabled(): boolean {
  const env = process.env.NEXT_PUBLIC_ENABLE_AUDIO;
  if (env === 'false' || env === '0') return false;
  if (runtimeAudioEnabledOverride !== null) return runtimeAudioEnabledOverride;
  return true;
}

export function setAudioEnabled(enabled: boolean): void {
  runtimeAudioEnabledOverride = enabled;
}

export function toggleAudio(): boolean {
  const nextState = !isAudioEnabled();
  setAudioEnabled(nextState);
  return nextState;
}

export function __markUserInteracted(): void {
  _userInteracted = true;
}

export function __resetAudioOverride(): void {
  runtimeAudioEnabledOverride = null;
  _userInteracted = false;
}

// Standalone Helper Playback Functions

export function playNote(freq: number = 440, duration: number = 0.1): void {
  if (!isAudioEnabled()) return;
  try {
    const AudioContextClass =
      typeof window !== 'undefined'
        ? window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        : null;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (_err) {
    // Handled safely
  }
}

export function playChimeSuccess(): void {
  audioEngine.playSuccessSound();
}

export function playQuantumCollapse(): void {
  audioEngine.playMeasurementSound();
}

export function playMeasurementCollapse(_numQubits?: number): void {
  audioEngine.playMeasurementSound();
}

export function playGateForQubit(_qubitIndex?: number, gateType: string = 'H'): void {
  audioEngine.playGateSound(gateType);
}

export function playDecoherenceAlert(): void {
  audioEngine.playErrorSound();
}

export function playLaserScan(): void {
  audioEngine.playGateSound('LASER');
}

export function playButtonClick(): void {
  playNote(600, 0.05);
}

export function playHover(): void {
  playNote(300, 0.02);
}
