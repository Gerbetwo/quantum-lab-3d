// High performance synthesized quantum sound engine via Web Audio API

let audioCtx: AudioContext | null = null;
let userInteracted = false;

if (typeof window !== 'undefined') {
  const setInteracted = () => { userInteracted = true; };
  window.addEventListener('pointerdown', setInteracted, { once: true, passive: true });
  window.addEventListener('keydown', setInteracted, { once: true, passive: true });
}

let runtimeAudioEnabled: boolean | null = null;

export function isAudioEnabled(): boolean {
  if (runtimeAudioEnabled !== null) return runtimeAudioEnabled;
  const v = process.env.NEXT_PUBLIC_ENABLE_AUDIO;
  if (v === undefined) return true;
  if (v === 'false' || v === '0') return false;
  return true;
}

/** Runtime override for session-scoped audio toggling. */
export function setAudioEnabled(enabled: boolean): void {
  runtimeAudioEnabled = enabled;
}

/** Flips the runtime override and returns the new state. */
export function toggleAudio(): boolean {
  const next = !isAudioEnabled();
  runtimeAudioEnabled = next;
  return next;
}

/** Test-only: clear the runtime override so env vars take precedence again. */
export function __resetAudioOverride(): void {
  runtimeAudioEnabled = null;
}

/** Test-only: mark the user as having interacted so getAudioContext can proceed. */
export function __markUserInteracted(): void {
  userInteracted = true;
}

function getAudioContext(): AudioContext | null {
  if (!isAudioEnabled()) return null;
  if (typeof window === 'undefined') return null;
  if (!userInteracted) return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playLaserScan() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch {}
}

export function playQuantumCollapse() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(130, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.4);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(520, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(260, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.4);
    osc2.stop(ctx.currentTime + 0.4);
  } catch {}
}

export function playChimeSuccess() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!ctx) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }, idx * 75);
    });
  } catch {}
}

export function playDecoherenceAlert() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(140, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch {}
}

export function playButtonClick() {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, ctx.currentTime);
    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  } catch {}
}
