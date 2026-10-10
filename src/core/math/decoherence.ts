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

export interface DecoherencePerturbation {
  deltaTheta: number;
  deltaPhi: number;
  vectorLength: number;
}

export function calculateDecoherencePerturbation(
  theta: number,
  phi: number,
  tempK: number,
  t2Ms: number
): DecoherencePerturbation {
  const noiseScale = Math.min(0.25, (tempK * 0.02) / Math.max(1, t2Ms * 0.05));
  const deltaTheta = (Math.random() - 0.5) * noiseScale;
  const deltaPhi = (Math.random() - 0.5) * noiseScale;

  const decayFactor = Math.exp(-tempK / (t2Ms * 0.1 + 1));
  const vectorLength = Math.max(0.15, Math.min(1.0, decayFactor));

  return { deltaTheta, deltaPhi, vectorLength };
}
