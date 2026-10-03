/**
 * QuantumLab 3D - Domain: Applications
 */

export function formatShorResult(timeSeconds: number): string {
  return "Shor: Clave RSA factorizada en " + timeSeconds + " segundos";
}

export function updateExploredApplications(
  current: string[],
  incoming: string[]
): string[] {
  const set = new Set<string>([...current, ...incoming]);
  return Array.from(set);
}
