import { describe, test, expect } from 'vitest';
import { factorizeShorN15 } from '../../src/domain/quantum/shor';

describe('Shor Domain — N = 15 Factoring', () => {
  test('Factoriza N=15 correctamente con base a = 7', () => {
    const res = factorizeShorN15(7);
    expect(res.isSuccess).toBe(true);
    expect(res.period).toBe(4);
    expect(res.factors).toEqual([3, 5]);
  });

  test('Factoriza N=15 correctamente con base a = 2', () => {
    const res = factorizeShorN15(2);
    expect(res.isSuccess).toBe(true);
    expect(res.period).toBe(4);
    expect(res.factors).toEqual([3, 5]);
  });

  test('Rechaza bases no válidas', () => {
    const res = factorizeShorN15(5);
    expect(res.isSuccess).toBe(false);
    expect(res.factors).toBeNull();
  });
});
