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

/**
 * Evaluates thermal phase decay and purity reduction over time.
 * Purity: γ(T, t) = e^(-t / T₂(T)).
 * Bloch vector radius: r(T) = max(0, min(1, γ)).
 */
export function applyPhaseDecay(
  initialTheta: number,
  initialPhi: number,
  elapsedTimeMs: number,
  t2Us: number
): { theta: number; phi: number; purity: number; r: number } {
  const t2Ms = t2Us / 1000;
  const decayFactor = t2Ms > 0 ? Math.exp(-elapsedTimeMs / t2Ms) : 0;
  const purity = Math.max(0, Math.min(1, decayFactor));
  const r = purity;

  return {
    theta: initialTheta,
    phi: initialPhi,
    purity,
    r,
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

/**
 * Vector length governed by state purity: L = 1.2 * purity.
 * Monotonically shrinks as temperature rises (15 mK -> 300 mK) and expands back as temperature cools.
 */
export function calculateVectorLength(purity: number): number {
  const clampedPurity = Math.max(0, Math.min(1, purity));
  return Number((1.2 * clampedPurity).toFixed(4));
}

/**
 * Computes a temperature-proportional pseudo-stochastic angular jitter (dTheta, dPhi).
 * Fully stabilizes to zero jitter at base cryostat temperature (15 mK),
 * and scales up smoothly to ~0.05 rad at 300 mK.
 */
export function calculateThermalJitter(
  tempInMilliKelvin: number,
  timeMs: number,
  noiseIntensity: number = 1.0
): { dTheta: number; dPhi: number } {
  if (tempInMilliKelvin <= CRYO_MIN_MK) {
    return { dTheta: 0, dPhi: 0 };
  }
  const clampedTemp = Math.min(CRYO_MAX_MK, tempInMilliKelvin);
  const normT = (clampedTemp - CRYO_MIN_MK) / (CRYO_MAX_MK - CRYO_MIN_MK);
  const amplitude = normT * 0.05 * Math.max(0, noiseIntensity);
  const tSec = timeMs * 0.001;
  const dTheta = Math.sin(tSec * 14.5) * Math.cos(tSec * 9.2) * amplitude;
  const dPhi = Math.cos(tSec * 16.3) * Math.sin(tSec * 11.1) * amplitude;
  return { dTheta, dPhi };
}

