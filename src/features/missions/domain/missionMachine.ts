export type MissionState = 'not_started' | 'in_progress' | 'assessment' | 'completed';

export interface MissionProgress {
  state: MissionState;
  currentStep: number;
  maxUnlockedStep: number;
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

export function canNavigateToStep(
  targetStep: number,
  totalSteps: number,
  progress: MissionProgress,
  stepRequirements: Record<number, boolean> = {}
): boolean {
  if (targetStep < 0 || targetStep >= totalSteps) return false;
  if (progress.state === 'completed') return true;
  if (targetStep <= progress.maxUnlockedStep) return true;

  if (targetStep === progress.currentStep + 1) {
    const reqCompleted = stepRequirements[progress.currentStep] ?? true;
    return reqCompleted;
  }
  return false;
}

export function advanceStep(
  currentStep: number,
  totalSteps: number,
  progress: MissionProgress,
  stepRequirements: Record<number, boolean> = {}
): MissionProgress {
  const nextStep = currentStep + 1;
  if (nextStep >= totalSteps) {
    return {
      ...progress,
      state: progress.quizPassed ? 'completed' : 'assessment',
      currentStep: totalSteps - 1,
    };
  }

  const isAllowed = canNavigateToStep(nextStep, totalSteps, progress, stepRequirements);
  if (!isAllowed) return progress;

  const newMax = Math.max(progress.maxUnlockedStep, nextStep);
  const newCompleted = Array.from(new Set([...progress.completedSteps, currentStep]));

  return {
    ...progress,
    state: progress.state === 'not_started' ? 'in_progress' : progress.state,
    currentStep: nextStep,
    maxUnlockedStep: newMax,
    completedSteps: newCompleted,
  };
}

export function previousStep(currentStep: number, progress: MissionProgress): MissionProgress {
  if (currentStep <= 0) return progress;
  return {
    ...progress,
    currentStep: currentStep - 1,
  };
}

export function completeQuiz(progress: MissionProgress): MissionProgress {
  return {
    ...progress,
    quizPassed: true,
    state: 'completed',
  };
}
