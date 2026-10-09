import { describe, test, expect } from 'vitest';
import { measureEntangledQubit } from '@/domain/quantum/entanglement';

describe('Entanglement Domain', () => {
  test('correlates Alice and Bob outcomes perfectly', () => {
    const res = measureEntangledQubit(1);
    expect(res.aliceOutcome).toBe(1);
    expect(res.bobOutcome).toBe(1);
    expect(res.correlated).toBe(true);
  });
});
