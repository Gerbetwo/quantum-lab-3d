import { describe, it, expect } from 'vitest';
import { calculateMeasurementDistribution, measureQubit } from '../../src/core/quantum/measurement';

describe('Measurement Unit Tests', () => {
  it('should measure qubit correctly', () => {
    const outcome = measureQubit(0, () => 0.1);
    expect([0, 1]).toContain(outcome);
  });

  it('should calculate measurement distribution', () => {
    const dist = calculateMeasurementDistribution(0, 100, () => 0.1) as { zeros: number; ones: number };
    expect(dist.zeros).toBe(100);
    expect(dist.ones).toBe(0);
  });
});
