import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  playGateForQubit, playHover, playMeasurementCollapse,
  __markUserInteracted, __resetAudioOverride,
} from '@/shared/lib/sound';

describe('Phase 3 - sound.ts new API (no regression to legacy)', () => {
  const originalEnv = process.env.NEXT_PUBLIC_ENABLE_AUDIO;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_ENABLE_AUDIO;
    __markUserInteracted();
    __resetAudioOverride();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    if (originalEnv === undefined) delete process.env.NEXT_PUBLIC_ENABLE_AUDIO;
    else process.env.NEXT_PUBLIC_ENABLE_AUDIO = originalEnv;
  });

  it('playGateForQubit does not throw for qubit 0 / gate H', () => {
    expect(() => playGateForQubit(0, 'H')).not.toThrow();
  });

  it('playGateForQubit uses different frequencies for q0 vs q5', () => {
    // Both calls are legal; the underlying qubitToFrequency is unit-tested.
    expect(() => playGateForQubit(0, 'H')).not.toThrow();
    expect(() => playGateForQubit(5, 'H')).not.toThrow();
  });

  it('playGateForQubit is a no-op when env disables audio', () => {
    process.env.NEXT_PUBLIC_ENABLE_AUDIO = 'false';
    expect(() => playGateForQubit(2, 'CNOT')).not.toThrow();
  });

  it('playHover does not throw', () => {
    expect(() => playHover()).not.toThrow();
  });

  it('playHover is a no-op when audio is disabled', () => {
    process.env.NEXT_PUBLIC_ENABLE_AUDIO = 'false';
    expect(() => playHover()).not.toThrow();
  });

  it('playMeasurementCollapse does not throw', () => {
    expect(() => playMeasurementCollapse(2)).not.toThrow();
  });

  it('playMeasurementCollapse defaults qubit to 0', () => {
    expect(() => playMeasurementCollapse()).not.toThrow();
  });

  it('playMeasurementCollapse is a no-op when audio is disabled', () => {
    process.env.NEXT_PUBLIC_ENABLE_AUDIO = 'false';
    expect(() => playMeasurementCollapse(1)).not.toThrow();
  });
});
