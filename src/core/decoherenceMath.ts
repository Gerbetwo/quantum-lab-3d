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

/** Cryostat slider bounds used by the decoherence mission (mK). */
export const CRYO_MIN_MK = 15;
export const CRYO_MAX_MK = 300;
/** Observation window used to derive purity from T₂ in the decoherence mission (ms). */
export const DECOHERENCE_WINDOW_MS = 0.15;

/**
 * Physical purity after DECOHERENCE_WINDOW_MS at temperature T (honest T₂ model).
 */
export function purityAtTemperature(tMilliK: number, windowMs = DECOHERENCE_WINDOW_MS): number {
  return applyPhaseDecay(Math.PI / 2, 0, windowMs, calculateT2CoherenceTime(tMilliK)).purity;
}

/**
 * RENDER-ONLY visual collapse factor for the Bloch wireframe (NOT a physical quantity).
 * The physical purity curve rescaled onto the cryostat range:
 *   f(15 mK) = 1  (fully coherent sphere)   →   f(300 mK) = 0  (singularity, ρ = I/2)
 * Monotonically decreasing; clamped outside [CRYO_MIN_MK, CRYO_MAX_MK].
 */
export function thermalCollapseFactor(tMilliK: number): number {
  const t = Math.max(CRYO_MIN_MK, Math.min(CRYO_MAX_MK, tMilliK));
  const pMax = purityAtTemperature(CRYO_MIN_MK);
  const pMin = purityAtTemperature(CRYO_MAX_MK);
  if (pMax - pMin <= 1e-12) return t >= CRYO_MAX_MK ? 0 : 1;
  const f = (purityAtTemperature(t) - pMin) / (pMax - pMin);
  return Math.max(0, Math.min(1, f));
}
