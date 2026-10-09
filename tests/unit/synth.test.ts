import { describe, it, expect } from 'vitest';
import { playNote } from '@/shared/lib/sound';

describe('Synth / Sound Lib', () => {
  it('should play notes without throwing', () => {
    expect(() => playNote(440, 0.1)).not.toThrow();
  });
});
