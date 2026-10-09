let audioOverride: boolean | null = null;
let userInteracted: boolean = false;

export function isAudioEnabled(): boolean {
  if (audioOverride !== null) return audioOverride;
  const envVal = process.env.NEXT_PUBLIC_ENABLE_AUDIO;
  if (envVal === 'false' || envVal === '0') return false;
  if (envVal === 'true') return true;
  return userInteracted;
}

export function setAudioEnabled(enabled: boolean) {
  audioOverride = enabled;
}

export function toggleAudio(): boolean {
  audioOverride = !isAudioEnabled();
  return audioOverride;
}

export function resetAudioOverride() {
  audioOverride = null;
}

export function markUserInteracted() {
  userInteracted = true;
}

export function hasUserInteracted(): boolean {
  return userInteracted;
}

export function playNote(..._args: unknown[]) {}
export function playSweep(..._args: unknown[]) {}
export function playChord(..._args: unknown[]) {}
export function playButtonClick(..._args: unknown[]) {}
export function playLaserScan(..._args: unknown[]) {}
export function playQuantumCollapse(..._args: unknown[]) {}
export function playChimeSuccess(..._args: unknown[]) {}
export function playDecoherenceAlert(..._args: unknown[]) {}
export function playGateForQubit(..._args: unknown[]) {}
export function playHover(..._args: unknown[]) {}
export function playMeasurementCollapse(..._args: unknown[]) {}

export const __markUserInteracted = markUserInteracted;
export const __resetAudioOverride = resetAudioOverride;
