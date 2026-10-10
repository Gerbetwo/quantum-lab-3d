import type { MissionId } from '../config/missions';

/* ================================================================== */
/* 1. Mission phases                                                   */
/* ================================================================== */

export type MissionPhase =
  | 'BRIEFING'
  | 'PREDICTION'
  | 'MANIPULATION'
  | 'MEASUREMENT'
  | 'VERIFICATION'
  | 'SUCCESS';

/** Ordered list of phases — useful for steppers and progress bars. */
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

/* ================================================================== */
/* 2. Step-level progress & navigation FSM                             */
/*    (previously `domain/missionMachine`)                             */
/* ================================================================== */

/** Lifecycle of a single mission session. */
export type MissionState = 'not_started' | 'in_progress' | 'assessment' | 'completed';

/**
 * Serialisable progress record for one mission.
 * All indices are 0-based positions into the mission's `steps` array.
 */
export interface MissionProgress {
  state: MissionState;
  /** Index of the currently visible step. */
  currentStep: number;
  /** Highest step index the learner has unlocked (never decreases). */
  maxUnlockedStep: number;
  /** Indices of steps whose completion requirement has been satisfied. */
  completedSteps: number[];
  quizPassed: boolean;
}

export function createInitialMissionState(): MissionProgress {
  return {
    state: 'not_started',
    currentStep: 0,
    maxUnlockedStep: 0,
    completedSteps: [],
    quizPassed: false,
  };
}

/**
 * Returns true when the learner may navigate to `targetStep`.
 *
 * Rules:
 * - Out-of-range indices are always denied.
 * - Previously unlocked steps (≤ maxUnlockedStep) are always allowed.
 * - The immediately next step is allowed only when the current step's
 *   requirement is satisfied (`stepRequirements[current]`, defaulting to true).
 * - Skipping multiple steps at once is never allowed.
 */
export function canNavigateToStep(
  targetStep: number,
  totalSteps: number,
  progress: MissionProgress,
  stepRequirements: Record<number, boolean> = {},
): boolean {
  if (targetStep < 0 || targetStep >= totalSteps) return false;
  if (targetStep <= progress.maxUnlockedStep) return true;
  if (targetStep === progress.maxUnlockedStep + 1) {
    return stepRequirements[progress.maxUnlockedStep] ?? true;
  }
  return false;
}

/**
 * Advance from `currentStep` toward the next step.
 *
 * Invariants upheld:
 * - `maxUnlockedStep` never decreases.
 * - `completedSteps` is append-only and deduplicated.
 * - Locked steps return the original `progress` unchanged (idempotent).
 * - Calling `advanceStep` at the last step is idempotent.
 */
export function advanceStep(
  currentStep: number,
  totalSteps: number,
  progress: MissionProgress,
  stepRequirements: Record<number, boolean> = {},
  requiresQuiz = true,
): MissionProgress {
  if (progress.state === 'completed') return progress;

  const nextStep = currentStep + 1;

  if (nextStep >= totalSteps) {
    const completedSteps = Array.from(new Set([...progress.completedSteps, currentStep]));
    const finalState: MissionState =
      requiresQuiz && !progress.quizPassed ? 'assessment' : 'completed';
    return {
      ...progress,
      state: finalState,
      currentStep: totalSteps - 1,
      maxUnlockedStep: Math.max(progress.maxUnlockedStep, totalSteps - 1),
      completedSteps,
    };
  }

  const isAllowed = canNavigateToStep(nextStep, totalSteps, progress, stepRequirements);
  if (!isAllowed) return progress;

  const newMax = Math.max(progress.maxUnlockedStep, nextStep);
  const completedSteps = Array.from(new Set([...progress.completedSteps, currentStep]));

  return {
    ...progress,
    state: progress.state === 'not_started' ? 'in_progress' : progress.state,
    currentStep: nextStep,
    maxUnlockedStep: newMax,
    completedSteps,
  };
}

/** Navigate backwards one step. Progress is never erased. */
export function previousStep(
  currentStep: number,
  progress: MissionProgress,
): MissionProgress {
  if (currentStep <= 0) return progress;
  return { ...progress, currentStep: currentStep - 1 };
}

/** Navigate directly to any already-unlocked step. */
export function navigateToStep(
  targetStep: number,
  totalSteps: number,
  progress: MissionProgress,
  stepRequirements: Record<number, boolean> = {},
): MissionProgress {
  if (!canNavigateToStep(targetStep, totalSteps, progress, stepRequirements)) {
    return progress;
  }
  return { ...progress, currentStep: targetStep };
}

/** Record a passed quiz and mark the mission completed. Idempotent. */
export function completeQuiz(progress: MissionProgress): MissionProgress {
  if (progress.quizPassed && progress.state === 'completed') return progress;
  return { ...progress, quizPassed: true, state: 'completed' };
}

/** True when the mission is fully finished. */
export function isMissionComplete(progress: MissionProgress): boolean {
  return progress.state === 'completed';
}

/* ================================================================== */
/* 3. Phase-driven runtime state                                       */
/* ================================================================== */

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

/* ================================================================== */
/* 4. Phase FSM transitions & verification                             */
/*    (previously `domain/missionFsm`)                                 */
/* ================================================================== */

/** All valid target state transitions for each phase in the mission FSM. */
export const VALID_TRANSITIONS: Record<MissionPhase, MissionPhase[]> = {
  BRIEFING: ['PREDICTION'],
  PREDICTION: ['MANIPULATION'],
  MANIPULATION: ['MEASUREMENT'],
  MEASUREMENT: ['VERIFICATION'],
  VERIFICATION: ['SUCCESS', 'MANIPULATION'],
  SUCCESS: ['BRIEFING'],
};

/**
 * Determines whether a phase transition from currentState to nextPhase is
 * allowed based on FSM rules and required state conditions.
 */
export function canTransition(
  currentState: MissionProgressState,
  nextPhase: MissionPhase,
): boolean {
  const allowedNextPhases = VALID_TRANSITIONS[currentState.currentPhase];
  if (!allowedNextPhases || !allowedNextPhases.includes(nextPhase)) {
    return false;
  }

  switch (currentState.currentPhase) {
    case 'PREDICTION':
      if (nextPhase === 'MANIPULATION') {
        return currentState.userPredictionProb0 !== null;
      }
      break;

    case 'MANIPULATION':
      if (nextPhase === 'MEASUREMENT') {
        return currentState.appliedGatesHistory.length > 0;
      }
      break;

    case 'VERIFICATION':
      if (nextPhase === 'SUCCESS') {
        return currentState.isVerified;
      }
      if (nextPhase === 'MANIPULATION') {
        return !currentState.isVerified;
      }
      break;

    default:
      break;
  }

  return true;
}

/**
 * Transitions the mission progress state to the next phase.
 * Throws an error if the requested transition is invalid.
 */
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

/**
 * Verifies whether the actual quantum state coordinates match the target
 * coordinates within a specified tolerance threshold.
 */
export function verifyState(
  actualTheta: number,
  actualPhi: number,
  targetTheta: number,
  targetPhi: number,
  tolerance: number = 0.05,
): boolean {
  const thetaDiff = Math.abs(actualTheta - targetTheta);

  // At the poles (theta = 0 or theta = PI), phi is degenerate and omitted.
  const isAtPole =
    Math.abs(targetTheta) <= tolerance ||
    Math.abs(targetTheta - Math.PI) <= tolerance;

  if (isAtPole) {
    return thetaDiff <= tolerance;
  }

  const normPhiActual = ((actualPhi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const normPhiTarget = ((targetPhi % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const rawPhiDiff = Math.abs(normPhiActual - normPhiTarget);
  const phiDiff = Math.min(rawPhiDiff, 2 * Math.PI - rawPhiDiff);

  return thetaDiff <= tolerance && phiDiff <= tolerance;
}

/* ================================================================== */
/* 5. Step definition                                                  */
/* ================================================================== */

export interface MissionStep {
  id: string;
  /** Phase this step belongs to — drives the phase machine. */
  phase: MissionPhase;
  title: string;
  /** Long-form copy used by the phase-driven flow. */
  description: string;
  /**
   * @deprecated Legacy copy field kept so existing missions/UI that read
   * `step.instruction` keep compiling. Prefer `description`.
   */
  instruction?: string;

  /* --- Quantum targets for this step --- */
  /** Target polar angle θ (radians). */
  targetTheta: number;
  /** Target azimuthal angle φ (radians). */
  targetPhi: number;
  /** Gate ids the user is allowed to apply during MANIPULATION. */
  allowedGates: string[];
  /** Probability of measuring |0⟩ if the step target is reached. */
  expectedProbability0: number;
}

/** Backwards-compatible alias for the original step shape. */
export type StepDefinition = MissionStep;

/* ================================================================== */
/* 6. Quiz                                                             */
/* ================================================================== */

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

/* ================================================================== */
/* 7. Mission definition                                               */
/* ================================================================== */

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

/* ================================================================== */
/* 8. Component contracts                                              */
/* ================================================================== */

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

/* ================================================================== */
/* 9. Convenience helpers                                              */
/* ================================================================== */

export const getStepPhase = (step: MissionStep): MissionPhase => step.phase;

export const isGateAllowed = (step: MissionStep, gateId: string): boolean =>
  step.allowedGates.includes(gateId);

export const findStepIndexById = (
  steps: readonly MissionStep[],
  stepId: string,
): number => steps.findIndex((step) => step.id === stepId);