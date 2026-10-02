import { describe, it, expect, afterEach } from 'vitest';
import { isAudioEnabled, playButtonClick } from '@/lib/sound';

describe('Phase 4 - sound.ts gating', () => {
  const original = process.env.NEXT_PUBLIC_ENABLE_AUDIO;

  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_ENABLE_AUDIO;
    else process.env.NEXT_PUBLIC_ENABLE_AUDIO = original;
  });

  it('returns true when env var is undefined (backward compatible)', () => {
    delete process.env.NEXT_PUBLIC_ENABLE_AUDIO;
    expect(isAudioEnabled()).toBe(true);
  });

  it('returns false when env var is "false"', () => {
    process.env.NEXT_PUBLIC_ENABLE_AUDIO = 'false';
    expect(isAudioEnabled()).toBe(false);
  });

  it('returns false when env var is "0"', () => {
    process.env.NEXT_PUBLIC_ENABLE_AUDIO = '0';
    expect(isAudioEnabled()).toBe(false);
  });

  it('returns true when env var is "true"', () => {
    process.env.NEXT_PUBLIC_ENABLE_AUDIO = 'true';
    expect(isAudioEnabled()).toBe(true);
  });

  it('playButtonClick is a silent no-op when audio disabled', () => {
    process.env.NEXT_PUBLIC_ENABLE_AUDIO = 'false';
    expect(() => playButtonClick()).not.toThrow();
  });
});
