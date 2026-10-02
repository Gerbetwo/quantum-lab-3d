import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  isAudioEnabled,
  playButtonClick,
  playLaserScan,
  playQuantumCollapse,
  playChimeSuccess,
  playDecoherenceAlert,
} from '@/lib/sound';

describe('Phase 5 - sound.ts full coverage', () => {
  const original = process.env.NEXT_PUBLIC_ENABLE_AUDIO;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_ENABLE_AUDIO;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    if (original === undefined) delete process.env.NEXT_PUBLIC_ENABLE_AUDIO;
    else process.env.NEXT_PUBLIC_ENABLE_AUDIO = original;
  });

  describe('isAudioEnabled', () => {
    it('true when env undefined (backward compatible)', () => {
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
    it('true when any other string', () => {
      process.env.NEXT_PUBLIC_ENABLE_AUDIO = 'maybe';
      expect(isAudioEnabled()).toBe(true);
    });
  });

  describe('playback functions with AudioContext available (MockAudioContext)', () => {
    it('playLaserScan does not throw', () => {
      expect(() => playLaserScan()).not.toThrow();
    });
    it('playQuantumCollapse does not throw', () => {
      expect(() => playQuantumCollapse()).not.toThrow();
    });
    it('playChimeSuccess schedules 4 notes without throwing', () => {
      expect(() => playChimeSuccess()).not.toThrow();
      vi.advanceTimersByTime(400);
    });
    it('playDecoherenceAlert does not throw', () => {
      expect(() => playDecoherenceAlert()).not.toThrow();
    });
    it('playButtonClick does not throw', () => {
      expect(() => playButtonClick()).not.toThrow();
    });
  });

  describe('playback functions when audio is disabled', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_ENABLE_AUDIO = 'false';
    });

    it('every function is a silent no-op', () => {
      expect(() => playLaserScan()).not.toThrow();
      expect(() => playQuantumCollapse()).not.toThrow();
      expect(() => playChimeSuccess()).not.toThrow();
      expect(() => playDecoherenceAlert()).not.toThrow();
      expect(() => playButtonClick()).not.toThrow();
    });
  });

  describe('playback functions when window has no AudioContext', () => {
    beforeEach(() => {
      vi.stubGlobal('AudioContext', undefined);
      vi.stubGlobal('webkitAudioContext', undefined);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('every function is a safe no-op', () => {
      expect(() => playLaserScan()).not.toThrow();
      expect(() => playQuantumCollapse()).not.toThrow();
      expect(() => playChimeSuccess()).not.toThrow();
      expect(() => playDecoherenceAlert()).not.toThrow();
      expect(() => playButtonClick()).not.toThrow();
    });
  });
});
