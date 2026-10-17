/**
 * QuantumLab 3D - Audio Engine (Compatibility Layer)
 * Bridges legacy audio APIs to the unified procedural soundEngine.
 */

import { soundEngine, isAudioEnabled as isSoundEnabled, setAudioEnabled as setSoundEnabled } from '../soundEngine';

let _userInteracted = false;
let runtimeOverride: boolean | null = null;

export function isAudioEnabled(): boolean {
  if (runtimeOverride !== null) return runtimeOverride;
  return isSoundEnabled();
}

export function setAudioEnabled(enabled: boolean): void {
  runtimeOverride = enabled;
  setSoundEnabled(enabled);
}

export function toggleAudio(): boolean {
  const next = !isAudioEnabled();
  setAudioEnabled(next);
  return next;
}

export function __markUserInteracted(): void {
  _userInteracted = true;
}

export function __resetAudioOverride(): void {
  runtimeOverride = null;
  _userInteracted = false;
}

export class QuantumAudioEngine {
  public getContext(): AudioContext | null {
    return soundEngine.getContext();
  }

  public async unlock(): Promise<void> {
    await soundEngine.unlock();
  }

  public playGateSound(gateType: string = 'H'): void {
    if (!isAudioEnabled()) return;
    soundEngine.playGateSound(gateType);
  }

  public playMeasurementSound(): void {
    if (!isAudioEnabled()) return;
    soundEngine.playStateCollapse();
  }

  public playSuccessSound(): void {
    if (!isAudioEnabled()) return;
    soundEngine.playMissionComplete();
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
}

export const audioEngine = new QuantumAudioEngine();

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

export const playChimeSuccess = (): void => audioEngine.playSuccessSound();
export const playQuantumCollapse = (): void => audioEngine.playMeasurementSound();
export const playMeasurementCollapse = (_n?: number): void => audioEngine.playMeasurementSound();
export const playGateForQubit = (_q?: number, gate = 'H'): void => audioEngine.playGateSound(gate);
export const playDecoherenceAlert = (): void => audioEngine.playErrorSound();
export const playLaserScan = (): void => audioEngine.playGateSound('LASER');
export const playButtonClick = (): void => playNote(600, 0.05);
export const playHover = (): void => playNote(300, 0.02);
