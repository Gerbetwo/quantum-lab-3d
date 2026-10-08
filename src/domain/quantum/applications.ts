/**
 * QuantumLab 3D - Domain: Applications
 */

export interface ShorFactorResult {
  p: number;
  q: number;
  totalTimeMs: number;
}

export function formatShorResult(timeSeconds: number): string {
  return `Algoritmo de Shor completado en ${timeSeconds} segundos`;
}

export function updateExploredApplications(
  current: string[],
  incoming: string[],
): string[] {
  return Array.from(new Set([...current, ...incoming]));
}
