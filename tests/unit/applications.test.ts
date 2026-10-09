import { describe, test, expect } from 'vitest';
import { runShorDemo } from '@/domain/quantum/applications';

describe('Shor Applications Domain', () => {
  test('correctly finds period and factors for base 2', () => {
    const res = runShorDemo(2);
    expect(res.period).toBe(4);
    expect(res.factors).toEqual([3, 5]);
  });
});
