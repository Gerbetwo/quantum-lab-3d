// @ts-nocheck
/* eslint-disable */
// Archived from src/features/quantum-core/quantum-missions-core.ts

// Symbol: getCoreMissions
export function getCoreMissions(): MissionDefinition[] {
  return [...MISSIONS].sort((_a, _b) => _a.order - _b.order);
}

// Symbol: isMainJourneyComplete
export function isMainJourneyComplete(
  completed: string[] | Set<string> | Record<string, boolean>
): boolean {
  const coreIds = MISSIONS.map((_m) => _m.id);
  if (Array.isArray(completed)) {
    return coreIds.every((_id) => completed.includes(_id));
  }
  if (completed instanceof Set) {
    return coreIds.every((_id) => completed.has(_id));
  }
  if (completed && typeof completed === 'object') {
    return coreIds.every((_id) => Boolean(completed[_id as keyof typeof completed]));
  }
  return false;
}

// Symbol: navigateToStep
export function navigateToStep(
  targetStep: number,
  _totalSteps: number,
  progress: MissionProgress,
  _stepRequirements: Record<number, boolean> = {},
): MissionProgress {
  if (!canNavigateToStep(targetStep, _totalSteps, progress, _stepRequirements)) {
    return progress;
  }
  return { ...progress, currentStep: targetStep };
}

// Symbol: isMissionComplete
export function isMissionComplete(_progress: MissionProgress): boolean {
  return _progress.state === 'completed';
}

// Symbol: transitionPhase
export function transitionPhase(
  currentState: MissionProgressState,
  nextPhase: MissionPhase,
): MissionProgressState {
  if (!canTransition(currentState, nextPhase)) {
    throw new Error(
      `Invalid phase transition from '${currentState.currentPhase}' to '${nextPhase}'.`,
    );
  }

  return {
    ...currentState,
    currentPhase: nextPhase,
    errorState: null,
  };
}

// Symbol: verifyState
export function verifyState(
  _actualTheta: number,
  _actualPhi: number,
  targetTheta: number,
  _targetPhi: number,
  tolerance: number = 0.05,
): boolean {
  const thetaDiff = Math.abs(_actualTheta - targetTheta);

  const isAtPole =
    Math.abs(targetTheta) <= tolerance ||
    Math.abs(targetTheta - Math.PI) <= tolerance;

  if (isAtPole) {
    return thetaDiff <= tolerance;
  }

  const normPhiActual = ((_actualPhi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const normPhiTarget = ((_targetPhi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const rawPhiDiff = Math.abs(normPhiActual - normPhiTarget);
  const phiDiff = Math.min(rawPhiDiff, 2 * Math.PI - rawPhiDiff);

  return thetaDiff <= tolerance && phiDiff <= tolerance;
}

// Symbol: useMissionTitleState
export function useMissionTitleState(): string {
  return currentTitle;
}

// Symbol: useMissionTitle
export function useMissionTitle(title: string): void {
  setMissionTitle(title);
}

// Symbol: CORE_MISSION_IDS
export const CORE_MISSION_IDS: readonly MissionId[] = MISSIONS.map((_m) => _m.id);

// Symbol: missions
export const missions = MISSIONS;

// Symbol: isMissionPhase
export const isMissionPhase = (value: unknown): value is MissionPhase =>
  typeof value === 'string' && (MISSION_PHASES as readonly string[]).includes(value);

// Symbol: createInitialMissionProgressState
export const createInitialMissionProgressState = (
  _missionId: string | null = null,
): MissionProgressState => ({
  currentMissionId: _missionId,
  activeStepIndex: 0,
  currentPhase: 'BRIEFING',
  userPredictionProb0: null,
  appliedGatesHistory: [],
  isVerified: false,
  errorState: null,
});

// Symbol: Mission
export type Mission = MissionDefinition;

// Symbol: MissionConfig
export type MissionConfig = MissionDefinition;

// Symbol: MissionStepProps
export type MissionStepProps<
  TState extends Record<string, unknown> = Record<string, unknown>,
> = MissionExperienceProps<TState>;

// Symbol: getStepPhase
export const getStepPhase = (_step: MissionStep): MissionPhase => _step.phase;

// Symbol: isGateAllowed
export const isGateAllowed = (_step: MissionStep, _gateId: string): boolean =>
  _step.allowedGates.includes(_gateId);

// Symbol: findStepIndexById
export const findStepIndexById = (
  _steps: readonly MissionStep[],
  _stepId: string,
): number => _steps.findIndex((_step) => _step.id === _stepId);
