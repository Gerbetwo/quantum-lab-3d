import type { MissionId } from '../config/missions';
import type { MissionProgress } from '../domain/missionMachine';

export type { MissionProgress };

export interface StepDefinition {
  id: string;
  title: string;
  instruction: string;
}

export type MissionStep = StepDefinition;

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

export interface MissionDefinition {
  id: MissionId;
  title: string;
  subtitle: string;
  description: string;
  learningObjective: string;
  requiresQuiz: boolean;
  order: number;
  icon?: string;
  sceneType?: 'bloch' | 'cryostat' | 'entanglement' | 'shor';
  prerequisites: MissionId[];
  steps: StepDefinition[];
  quiz?: QuizDefinition;
}

export type MissionConfig = MissionDefinition;

export interface MissionExperienceProps<TState extends Record<string, unknown> = Record<string, unknown>> {
  missionId: MissionId;
  activeStepId: string;
  state: TState;
  onUpdateState: (newState: TState | ((prev: TState) => TState)) => void;
  onCompleteStep: (stepId?: string) => void;
  onAction: (actionName: string, payload?: unknown) => void;
}

export type MissionStepProps<TState extends Record<string, unknown> = Record<string, unknown>> = MissionExperienceProps<TState>;
