import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isAudioEnabled,
  setAudioEnabled,
  toggleAudio,
  playButtonClick,
  playLaserScan,
  playQuantumCollapse,
  playChimeSuccess,
  playDecoherenceAlert,
  playGateForQubit,
  playHover,
  playMeasurementCollapse,
  __markUserInteracted,
  __resetAudioOverride,
} from '@/shared/lib/sound';

describe('Suite Unificada de Pruebas de Sonido', () => {
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

  describe('isAudioEnabled', () => {
    it('true when env undefined', () => {
      delete process.env.NEXT_PUBLIC_ENABLE_AUDIO;
      expect(isAudioEnabled()).toBe(true);
    });
    it('false when "false"', () => {
      process.env.NEXT_PUBLIC_ENABLE_AUDIO = 'false';
      expect(isAudioEnabled()).toBe(false);
    });
    it('false when "0"', () => {
      process.env.NEXT_PUBLIC_ENABLE_AUDIO = '0';
      expect(isAudioEnabled()).toBe(false);
    });
    it('true when "true"', () => {
      process.env.NEXT_PUBLIC_ENABLE_AUDIO = 'true';
      expect(isAudioEnabled()).toBe(true);
    });
  });

  describe('runtime override', () => {
    it('respects env=false over setAudioEnabled(true)', () => {
      process.env.NEXT_PUBLIC_ENABLE_AUDIO = 'false';
      setAudioEnabled(true);
      expect(isAudioEnabled()).toBe(false);
    });

    it('toggleAudio flips and returns new state', () => {
      delete process.env.NEXT_PUBLIC_ENABLE_AUDIO;
      expect(isAudioEnabled()).toBe(true);
      expect(toggleAudio()).toBe(false);
      expect(isAudioEnabled()).toBe(false);
    });
  });

  describe('playback functions', () => {
    it('playLaserScan does not throw', () => {
      expect(() => playLaserScan()).not.toThrow();
    });
    it('playQuantumCollapse does not throw', () => {
      expect(() => playQuantumCollapse()).not.toThrow();
    });
    it('playChimeSuccess schedules notes without throwing', () => {
      expect(() => playChimeSuccess()).not.toThrow();
      vi.advanceTimersByTime(400);
    });
    it('playDecoherenceAlert does not throw', () => {
      expect(() => playDecoherenceAlert()).not.toThrow();
    });
    it('playButtonClick does not throw', () => {
      expect(() => playButtonClick()).not.toThrow();
    });
    it('playGateForQubit does not throw', () => {
      expect(() => playGateForQubit(0, 'H')).not.toThrow();
    });
    it('playHover does not throw', () => {
      expect(() => playHover()).not.toThrow();
    });
    it('playMeasurementCollapse does not throw', () => {
      expect(() => playMeasurementCollapse(2)).not.toThrow();
    });
  });
});
