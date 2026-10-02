import { describe, it, expect } from 'vitest';
import { formatShorResult, updateExploredApplications } from '@/domain/quantum/applications';

describe('HU-20 — Shor Algorithm & Applications Domain', () => {
  it('formats Shor algorithm completion result correctly', () => {
    const formatted = formatShorResult(0.42);
    expect(formatted).toContain('0.42 segundos');
    expect(formatted).toContain('Shor');
  });

  it('deduplicates explored applications without duplicates', () => {
    const apps = updateExploredApplications(['molecular_simulation'], ['molecular_simulation', 'cryptography_shor']);
    expect(apps).toEqual(['molecular_simulation', 'cryptography_shor']);
  });
});
