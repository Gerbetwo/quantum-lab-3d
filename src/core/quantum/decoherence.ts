export function calculateCoherenceTime(temperatureKelvin: number): number {
  if (temperatureKelvin <= 0) return 1000;
  const t2 = Math.max(1, 500 / (temperatureKelvin + 0.1));
  return parseFloat(t2.toFixed(2));
}

export function isCriticalDecoherence(coherenceTime: number, threshold: number = 20): boolean {
  return coherenceTime < threshold;
}

export function applyDecoherenceToState(state: Array<{ re: number; im: number }>, factor: number): Array<{ re: number; im: number }> {
  const clampedFactor = Math.max(0, Math.min(1, factor));
  return state.map(amp => ({
    re: amp.re * clampedFactor,
    im: amp.im * clampedFactor,
  }));
}
