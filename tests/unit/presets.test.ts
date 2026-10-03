import { describe, it, expect } from 'vitest';
import { bellState, ghzState, wState } from '@/domain/quantum/presets';
import { probabilities } from '@/domain/quantum/statevector';

describe('Phase1 - LUT Presets (Bell, GHZ, W)', () => {
  it('bellState(phi+) = (|00>+|11>)/sqrt(2)', () => {
    const b = bellState('phi+');
    expect(b).toHaveLength(4);
    expect(b[0].re).toBeCloseTo(Math.SQRT1_2);
    expect(b[3].re).toBeCloseTo(Math.SQRT1_2);
  });
  it('bellState(psi+) = (|01>+|10>)/sqrt(2)', () => {
    const b = bellState('psi+');
    expect(b[1].re).toBeCloseTo(Math.SQRT1_2);
    expect(b[2].re).toBeCloseTo(Math.SQRT1_2);
  });
  it('bellState(phi-) has negative sign on |11>', () => {
    const b = bellState('phi-');
    expect(b[0].re).toBeCloseTo(Math.SQRT1_2);
    expect(b[3].re).toBeCloseTo(-Math.SQRT1_2);
  });
  it('ghzState(3) = (|000>+|111>)/sqrt(2)', () => {
    const g = ghzState(3);
    expect(g).toHaveLength(8);
    expect(g[0].re).toBeCloseTo(Math.SQRT1_2);
    expect(g[7].re).toBeCloseTo(Math.SQRT1_2);
    expect(probabilities(g).slice(1, 7).every((p) => p === 0)).toBe(true);
  });
  it('ghzState(6) uniform on 2 outcomes', () => {
    const g = ghzState(6);
    expect(g).toHaveLength(64);
    expect(g[0].re).toBeCloseTo(Math.SQRT1_2);
    expect(g[63].re).toBeCloseTo(Math.SQRT1_2);
  });
  it('wState(3) has three symmetric peaks', () => {
    const w = wState(3);
    const p = probabilities(w);
    expect(p[1]).toBeCloseTo(1 / 3);
    expect(p[2]).toBeCloseTo(1 / 3);
    expect(p[4]).toBeCloseTo(1 / 3);
  });
  it('rejects ghzState above MAX_QUBITS', () => {
    expect(() => ghzState(7)).toThrow();
  });
});
