export function milliKelvinToKelvin(mK: number): number {
  return Math.round((mK / 1000) * 1000) / 1000;
}

export function kelvinToMilliKelvin(K: number): number {
  return Math.round(K * 1000);
}

export function calculateCoherenceTime(temperatureMilliKelvin: number): number {
  const clampedT = Math.max(15, Math.min(300000, temperatureMilliKelvin));
  const t2 = 250 * Math.exp(-clampedT / 800);
  return Math.max(0.01, Math.round(t2 * 100) / 100);
}

export function isCriticalDecoherence(coherenceTimeMs: number): boolean {
  return coherenceTimeMs < 10.0;
}
