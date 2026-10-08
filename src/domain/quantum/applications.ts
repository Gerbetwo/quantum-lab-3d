import { factorizeShorN15, ShorStepResult } from './shor';

export { factorizeShorN15 };
export type { ShorStepResult };

export function updateExploredApplications(
  currentExplored: string[],
  appId: string
): string[] {
  if (currentExplored.includes(appId)) return currentExplored;
  return [...currentExplored, appId];
}
