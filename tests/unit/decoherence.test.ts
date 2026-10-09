import { describe, test, expect } from 'vitest';
import { calculateCoherenceTime } from '@/core/math/decoherence';

describe('Decoherence Domain', () => {
  test('calculates higher coherence time at lower temperatures', () => {
    const tLow = calculateCoherenceTime(15);
    const tHigh = calculateCoherenceTime(150000);
    expect(tLow).toBeGreaterThan(tHigh);
  });
});
