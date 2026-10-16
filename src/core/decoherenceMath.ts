/**
 * Cryogenic Thermal Decoherence Physics Models
 * Temperature Range: 15 mK (0.015 K) - 300 K (300,000 mK)
 * Coherence Model: T_2(T) = 250 * e^(-T / 800) μs
 */

export function kelvinToMilliKelvin(kelvin: number): number {
  return Math.round(kelvin * 1000);
}

export function milliKelvinToKelvin(milliKelvin: number): number {
  return milliKelvin / 1000;
}

export function calculateT2CoherenceTime(tempInMilliKelvin: number): number {
  const clampedTemp = Math.max(15, Math.min(300000, tempInMilliKelvin));
  const t2Microseconds = 250 * Math.exp(-clampedTemp / 800);
  return Number(t2Microseconds.toFixed(3));
}

export function applyPhaseDecay(
  initialTheta: number,
  initialPhi: number,
  elapsedTimeMs: number,
  t2Us: number
): { theta: number; phi: number; purity: number } {
  const t2Ms = t2Us / 1000;
  const decayFactor = Math.exp(-elapsedTimeMs / t2Ms);
  const purity = Math.max(0, Math.min(1, decayFactor));

  return {
    theta: initialTheta,
    phi: initialPhi,
    purity,
  };
}

export function calculateCoherenceTime(tempK: number): number {
  return calculateT2CoherenceTime(kelvinToMilliKelvin(tempK));
}
