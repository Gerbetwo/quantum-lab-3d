/**
 * QuantumLab 3D - Domain: Decoherence
 */

export function calculateCoherenceTime(temperatureMilliKelvin: number): number {
  if (temperatureMilliKelvin < 0) return 0.1;
  const time = 250 * Math.exp(-temperatureMilliKelvin / 800);
  return Math.max(0.1, Math.round(time * 10) / 10);
}

export function isCriticalDecoherence(temperatureMilliKelvin: number): boolean {
  return (
    temperatureMilliKelvin > 1200 ||
    calculateCoherenceTime(temperatureMilliKelvin) < 1.0
  );
}
