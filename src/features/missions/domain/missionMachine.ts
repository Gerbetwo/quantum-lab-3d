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
  // Already-unlocked steps (including backwards navigation) are always reachable.
  if (targetStep <= progress.maxUnlockedStep) return true;
  // The next sequential step is unlockable when the current requirement is met.
  if (targetStep === progress.maxUnlockedStep + 1) {
    return stepRequirements[progress.maxUnlockedStep] ?? true;
  }
  return false;
}

/**
 * Advance from `currentStep` toward the next step.
 *
 * @param currentStep     The step the learner is on right now.
 * @param totalSteps      Total number of steps in the mission.
 * @param progress        Current progress snapshot (never mutated).
 * @param stepRequirements Per-step completion gate map (index → satisfied?).
 * @param requiresQuiz    When true, the final step transition moves to
 *                        `'assessment'` state and waits for `completeQuiz`.
 *                        When false (default), reaching the end of steps
 *                        immediately transitions to `'completed'`.
 *
 * Invariants upheld:
 * - `maxUnlockedStep` never decreases.
 * - `completedSteps` is append-only and deduplicated.
 * - A step that is not yet allowed returns the original `progress` unchanged
 *   (idempotent / no side-effects on locked steps).
 * - Calling `advanceStep` when already at the last step is idempotent.
 */
export function advanceStep(
  currentStep: number,
  totalSteps: number,
  progress: MissionProgress,
  stepRequirements: Record<number, boolean> = {},
  requiresQuiz = true,
): MissionProgress {
  // Guard: already completed — nothing to do.
  if (progress.state === 'completed') return progress;

  const nextStep = currentStep + 1;

  // At or past the last step: resolve to assessment or completed.
  if (nextStep >= totalSteps) {
    // Record the final step as completed before resolving mission state.
    const completedSteps = Array.from(new Set([...progress.completedSteps, currentStep]));
    const finalState: MissionState = requiresQuiz && !progress.quizPassed
      ? 'assessment'
      : 'completed';
    return {
      ...progress,
      state: finalState,
      currentStep: totalSteps - 1,
      maxUnlockedStep: Math.max(progress.maxUnlockedStep, totalSteps - 1),
      completedSteps,
    };
  }

  // Check gate for the next step.
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

/**
 * Navigate backwards to the previous step.
 * Progress (maxUnlockedStep, completedSteps) is never erased.
 */
export function previousStep(
  currentStep: number,
  progress: MissionProgress,
): MissionProgress {
  if (currentStep <= 0) return progress;
  return {
    ...progress,
    currentStep: currentStep - 1,
  };
}

/**
 * Navigate directly to any already-unlocked step.
 * Silently returns unchanged progress when the target is locked.
 */
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

/**
 * Record a passed quiz and mark the mission completed.
 * Idempotent if the quiz was already passed.
 */
export function completeQuiz(progress: MissionProgress): MissionProgress {
  if (progress.quizPassed && progress.state === 'completed') return progress;
  return {
    ...progress,
    quizPassed: true,
    state: 'completed',
  };
}

/**
 * Returns true when the mission is fully finished
 * (all steps visited and, if applicable, the quiz passed).
 */
export function isMissionComplete(progress: MissionProgress): boolean {
  return progress.state === 'completed';
}
