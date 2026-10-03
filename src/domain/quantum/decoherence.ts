/**
 * QuantumLab 3D - Domain: Decoherence
 */

export function calculateCoherenceTime(tempMK: number): number {
  if (tempMK <= 0) return 300;
  const val = Math.max(0, 250 - tempMK * 0.3067);
  return Number(val.toFixed(1));
}

export function isCriticalDecoherence(tempMK: number): boolean {
  return tempMK > 1200;
}
