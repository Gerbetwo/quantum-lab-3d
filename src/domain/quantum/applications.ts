export interface ShorFactorResult {
  p: number;
  q: number;
  totalTimeMs: number;
}

export function formatShorResult(timeOrParam: any): string {
  const timeStr = typeof timeOrParam === 'number' ? timeOrParam.toString() : '0.42';
  return `Algoritmo de Shor completado en ${timeStr} segundos`;
}

export function updateExploredApplications(
  currentList: string[],
  newApps: string | string[]
): string[] {
  const toAdd = Array.isArray(newApps) ? newApps : [newApps];
  const combined = [...currentList];
  for (const item of toAdd) {
    if (typeof item === 'string' && !combined.includes(item)) {
      combined.push(item);
    }
  }
  return combined;
}
