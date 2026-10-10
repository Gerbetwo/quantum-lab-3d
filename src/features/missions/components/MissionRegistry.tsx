'use client';

import React from 'react';
import { MissionShell } from './MissionShell';
import { KnowledgeCheck } from './KnowledgeCheck';
import { getMissionById, isMissionId, MissionId } from '@/features/missions/config/missions';
import { useGuidedMission } from '@/features/missions/hooks/useGuidedMission';

export interface MissionRegistryProps {
  missionId?: string;
  [key: string]: unknown;
}

export function MissionRegistry({ missionId = 'superposition', ...props }: MissionRegistryProps) {
  const canonicalId: MissionId = isMissionId(missionId) ? missionId : 'superposition';
  const mission = getMissionById(canonicalId);
  const guided = useGuidedMission(canonicalId);

  const isQuizStep = guided.currentStep?.id === 'knowledge-check';
  const isContinueDisabled = !guided.isUnlocked || (isQuizStep && !guided.quizPassed);

  return (
    <MissionShell
      mission={mission}
      currentStep={guided.currentStep}
      currentStepIndex={guided.currentStepIndex}
      totalSteps={guided.totalSteps}
      progress={guided.progress}
      isCompleted={guided.isCompleted}
      isContinueDisabled={isContinueDisabled}
      onPrevious={guided.previousStep}
      onContinue={guided.nextStep}
      {...props}
    >
      {isQuizStep && mission?.quiz && (
        <KnowledgeCheck
          quiz={mission.quiz}
          selectedOptionId={(guided.interactionState.selectedOptionId as string) || null}
          onSelectOption={(id) => guided.updateInteraction({ selectedOptionId: id })}
          onPass={guided.passQuiz}
        />
      )}
    </MissionShell>
  );
}

export default MissionRegistry;