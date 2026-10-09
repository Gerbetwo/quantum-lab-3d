/**
 * Dominio Cuántico: Entrelazamiento (Bell States)
 * Modelo puro, sin dependencias de UI ni Three.js.
 */

export interface EntanglementState {
  aliceOutcome: 0 | 1 | null;
  bobOutcome: 0 | 1 | null;
  correlated: boolean;
  explanation: string;
}

export function measureEntangledQubit(
  forcedOutcome?: 0 | 1,
  random: () => number = Math.random
): EntanglementState {
  const outcome = forcedOutcome ?? (random() < 0.5 ? 0 : 1);
  return {
    aliceOutcome: outcome,
    bobOutcome: outcome, // Correlación perfecta del estado Bell |Φ+⟩
    correlated: true,
    explanation:
      "Al medir el qubit de Alice, colapsa instantáneamente. Debido al entrelazamiento (|Φ+⟩), el qubit de Bob adopta el mismo valor de forma correlacionada, sin que esto transmita información útil más allá de la velocidad de la luz (no-señalización)."
  };
}
