'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { MissionShell } from './MissionShell';
import { KnowledgeCheck } from './KnowledgeCheck';
import { getMissionById, isMissionId, MissionId } from '@/features/missions/config/missions';
import { useGuidedMission } from '@/features/missions/hooks/useGuidedMission';

// Accessible loading and error states for heavy 3D/mission modules
const MissionLoader = () => (
  <div className="flex items-center justify-center p-12 text-zinc-400" role="status" aria-live="polite">
    <span className="animate-pulse">Loading quantum module...</span>
  </div>
);

// Dynamic imports mapping to exact project experience directory paths
const SuperpositionExperience = dynamic(() => import('@/features/missions/experiences/superposition'), {
  loading: () => <MissionLoader />,
  ssr: false,
});

const EntanglementExperience = dynamic(() => import('@/features/missions/experiences/entanglement'), {
  loading: () => <MissionLoader />,
  ssr: false,
});

const ErrorCorrectionExperience = dynamic(() => import('@/features/missions/experiences/error-correction'), {
  loading: () => <MissionLoader />,
  ssr: false,
});

const GatesExperience = dynamic(() => import('@/features/missions/experiences/gates'), {
  loading: () => <MissionLoader />,
  ssr: false,
});

const DecoherenceExperience = dynamic(() => import('@/features/missions/experiences/decoherence'), {
  loading: () => <MissionLoader />,
  ssr: false,
});

const GroverExperience = dynamic(() => import('@/features/missions/experiences/grover'), {
  loading: () => <MissionLoader />,
  ssr: false,
});

const ApplicationsExperience = dynamic(() => import('@/features/missions/experiences/applications'), {
  loading: () => <MissionLoader />,
  ssr: false,
});

// Fully typed map ensuring all seven MissionId values are mapped to their experience modules
const missionExperienceMap: Record<MissionId, React.ComponentType<any>> = {
  superposition: SuperpositionExperience,
  entanglement: EntanglementExperience,
  'error-correction': ErrorCorrectionExperience,
  gates: GatesExperience,
  decoherence: DecoherenceExperience,
  grover: GroverExperience,
  applications: ApplicationsExperience,
};

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

  // If the mission is locked, render an accessible prerequisite notice with a link
  if (!guided.isUnlocked) {
    const prereqId = Array.isArray(mission?.prerequisites) 
      ? mission.prerequisites[0] 
      : (mission?.prerequisites as unknown as string);
    const prereqMission = prereqId && isMissionId(prereqId) ? getMissionById(prereqId) : null;

    return (
      <MissionShell
        mission={mission}
        currentStep={guided.currentStep}
        currentStepIndex={guided.currentStepIndex}
        totalSteps={guided.totalSteps}
        progress={guided.progress}
        isCompleted={guided.isCompleted}
        isContinueDisabled={true}
        onPrevious={guided.previousStep}
        onContinue={guided.nextStep}
        {...props}
      >
        <div 
          className="flex flex-col items-center justify-center p-8 text-center bg-zinc-900/50 rounded-xl border border-zinc-800"
          role="region"
          aria-label="Mission Locked"
        >
          <h2 className="text-xl font-semibold text-zinc-100 mb-2">Mission Locked</h2>
          <p className="text-zinc-400 mb-6 max-w-md">
            You must complete the prerequisite mission{' '}
            <span className="font-medium text-cyan-400">{prereqMission?.title || prereqId || 'prior mission'}</span>{' '}
            before accessing this quantum module.
          </p>
          {prereqId && (
            <Link
              href={`/missions/${prereqId}`}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              Go to Prerequisite Mission
            </Link>
          )}
        </div>
      </MissionShell>
    );
  }

  const MissionComponent = missionExperienceMap[canonicalId] || SuperpositionExperience;

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
      {isQuizStep && mission?.quiz ? (
        <KnowledgeCheck
          quiz={mission.quiz}
          selectedOptionId={(guided.interactionState.selectedOptionId as string) || null}
          onSelectOption={(id) => guided.updateInteraction({ selectedOptionId: id })}
          onPass={guided.passQuiz}
        />
      ) : (
        <MissionComponent currentStep={guided.currentStep} guided={guided} />
      )}
    </MissionShell>
  );
}

export default MissionRegistry;