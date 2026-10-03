export function formatShorResult(seconds: number): string {
  return `Shor: Clave RSA factorizada en ${seconds.toFixed(2)} segundos`;
}

export function updateExploredApplications(current: string[], additions: string[]): string[] {
  const set = new Set([...current, ...additions]);
  return Array.from(set);
}
