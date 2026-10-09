/**
 * Dominio Cuántico: Decoherencia y Entorno Criogénico
 * Modelo puro para cálculo de T2 en función de la temperatura en miliKelvin.
 */

export function calculateCoherenceTime(temperatureMilliKelvin: number): number {
  const safeTemp = Math.max(15, temperatureMilliKelvin);
  // T2(T) = 250 * exp(-T / 800) us
  const t2 = 250 * Math.exp(-safeTemp / 800);
  return Math.max(0.1, Math.round(t2 * 10) / 10);
}

export function isCriticalDecoherence(temperatureMilliKelvin: number): boolean {
  return temperatureMilliKelvin > 150000; // > 150 K
}
