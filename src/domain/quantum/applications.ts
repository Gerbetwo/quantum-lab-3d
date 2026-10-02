/**
 * Application Simulation & Deduplication Helpers
 */

export function formatShorResult(timeSeconds: number = 0.42): string {
  return `¡Clave RSA factorizada en ${timeSeconds} segundos! (Algoritmo de Shor)`;
}

export function updateExploredApplications(
  current: string[],
  newApps: string[]
): string[] {
  return Array.from(new Set([...current, ...newApps]));
}
