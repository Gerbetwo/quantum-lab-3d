import type { MissionId } from '../config/missions';
import type { MissionProgress } from '../domain/missionMachine';

export type { MissionProgress };

/* ------------------------------------------------------------------ */
/* Mission phases                                                      */
/* ------------------------------------------------------------------ */

export type MissionPhase =
  | 'BRIEFING'
  | 'PREDICTION'
  | 'MANIPULATION'
  | 'MEASUREMENT'
  | 'VERIFICATION'
  | 'SUCCESS';

/** Runtime list of phases, handy for steppers / progress bars. */
export const MISSION_PHASES: readonly MissionPhase[] = [
  'BRIEFING',
  'PREDICTION',
  'MANIPULATION',
  'MEASUREMENT',
  'VERIFICATION',
  'SUCCESS',
] as const;

export const isMissionPhase = (value: unknown): value is MissionPhase =>
  typeof value === 'string' && (MISSION_PHASES as readonly string[]).includes(value);

/* ------------------------------------------------------------------ */
/* Steps                                                               */
/* ------------------------------------------------------------------ */

export interface MissionStep {
  id: string;
  title: string;
  phase?: MissionPhase;
  description?: string;
  instruction?: string;

  /* --- Quantum targets for this step --- */
  targetTheta?: number;
  targetPhi?: number;
  allowedGates?: string[];
  expectedProbability0?: number;
}

/** Backwards-compatible alias for the original step shape. */
export type StepDefinition = MissionStep;

/* ------------------------------------------------------------------ */
/* Quiz                                                                */
/* ------------------------------------------------------------------ */

export interface QuizOptionDefinition {
  id: string;
  text: string;
  explanation?: string;
}

export interface QuizDefinition {
  id: string;
  question: string;
  options: QuizOptionDefinition[];
  correctOptionId: string;
  explanation?: string;
}

/* ------------------------------------------------------------------ */
/* Mission definition                                                  */
/* ------------------------------------------------------------------ */

export type MissionSceneType = 'bloch' | 'cryostat' | 'entanglement' | 'shor';

export interface MissionDefinition {
  id: MissionId;
  title: string;
  subtitle: string;
  description: string;
  learningObjective: string;
  requiresQuiz: boolean;
  order: number;
  icon?: string;
  sceneType?: MissionSceneType;
  prerequisites: MissionId[];
  steps: MissionStep[];
  quiz?: QuizDefinition;
}

export type Mission = MissionDefinition;
export type MissionConfig = MissionDefinition;

/* ------------------------------------------------------------------ */
/* Runtime progress state                                              */
/* ------------------------------------------------------------------ */

export interface MissionProgressState {
  currentMissionId: string | null;
  activeStepIndex: number;
  currentPhase: MissionPhase;
  userPredictionProb0: number | null;
  appliedGatesHistory: string[];
  isVerified: boolean;
  errorState: string | null;
}

export const createInitialMissionProgressState = (
  missionId: string | null = null,
): MissionProgressState => ({
  currentMissionId: missionId,
  activeStepIndex: 0,
  currentPhase: 'BRIEFING',
  userPredictionProb0: null,
  appliedGatesHistory: [],
  isVerified: false,
  errorState: null,
});

/* ------------------------------------------------------------------ */
/* Component contracts                                                 */
/* ------------------------------------------------------------------ */

export interface MissionExperienceProps<
  TState extends Record<string, unknown> = Record<string, unknown>,
> {
  missionId: MissionId;
  activeStepId: string;
  state: TState;
  onUpdateState: (newState: TState | ((prev: TState) => TState)) => void;
  onCompleteStep: (stepId?: string) => void;
  onAction: (actionName: string, payload?: unknown) => void;
}

export type MissionStepProps<
  TState extends Record<string, unknown> = Record<string, unknown>,
> = MissionExperienceProps<TState>;
/* ------------------------------------------------------------------ */
/* Optional helpers                                                    */
/* ------------------------------------------------------------------ */

export const getStepPhase = (step: MissionStep): MissionPhase => step.phase ?? 'BRIEFING';

export const isGateAllowed = (step: MissionStep, gateId: string): boolean =>
  step.allowedGates?.includes(gateId) ?? false;

export const findStepIndexById = (
  steps: readonly MissionStep[],
  stepId: string,
): number => steps.findIndex((step) => step.id === stepId);