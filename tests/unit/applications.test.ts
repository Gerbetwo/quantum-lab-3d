import { describe, test, expect } from 'vitest';
import { updateExploredApplications, factorizeShorN15 } from '@/domain/quantum/applications';

describe('Applications Domain', () => {
  test('updateExploredApplications añade un elemento sin duplicar', () => {
    const list = ['molecular_simulation'];
    const updated = updateExploredApplications(list, 'cryptography_shor');
    expect(updated).toEqual(['molecular_simulation', 'cryptography_shor']);

    const same = updateExploredApplications(updated, 'cryptography_shor');
    expect(same).toBe(updated);
  });

  test('factorizeShorN15 re-exportado funciona correctamente', () => {
    const res = factorizeShorN15(7);
    expect(res.isSuccess).toBe(true);
    expect(res.factors).toEqual([3, 5]);
  });
});
