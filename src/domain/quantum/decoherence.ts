/**
 * Thermal Decoherence & Coherence Time T2 Calculations
 */

export function calculateCoherenceTime(temperatureMilliKelvin: number): number {
  return Math.max(
    0.1,
    Math.round(250 * Math.exp(-temperatureMilliKelvin / 800) * 10) / 10
  );
}

export function isCriticalDecoherence(temperatureMilliKelvin: number): boolean {
  return temperatureMilliKelvin > 1200;
}
