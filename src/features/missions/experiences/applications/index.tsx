import React, { useState } from 'react';
import { MythsApplicationsStep } from './steps/MythsApplicationsStep';
import { MolecularComparisonStep } from './steps/MolecularComparisonStep';
import { ShorDemoStep } from './steps/ShorDemoStep';

interface ApplicationsExperienceProps {
  onMissionComplete?: () => void;
}

export const ApplicationsExperience: React.FC<ApplicationsExperienceProps> = ({ onMissionComplete }) => {
  const [activeStepId, setActiveStepId] = useState<string>('myths-applications');
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [_exploredApplications, setExploredApplications] = useState<string[]>([]);
  const [knowledgeCheckPassed, setKnowledgeCheckPassed] = useState<boolean>(false);

  const handleStepComplete = (stepId: string) => {
    setCompletedSteps(prev => {
      const next = { ...prev, [stepId]: true };
      checkAllComplete(next, knowledgeCheckPassed);
      return next;
    });
  };

  const handleExploreApplication = (appId: string) => {
    setExploredApplications(prev => {
      if (!prev.includes(appId)) {
        return [...prev, appId];
      }
      return prev;
    });
  };

  const handleKnowledgeCheckComplete = () => {
    setKnowledgeCheckPassed(true);
    const next = { ...completedSteps, 'knowledge-check': true };
    setCompletedSteps(next);
    checkAllComplete(next, true);
  };

  const checkAllComplete = (currentCompleted: Record<string, boolean>, quizPassed: boolean) => {
    if (
      currentCompleted['myths-applications'] &&
      currentCompleted['molecular-comparison'] &&
      currentCompleted['shor-demo'] &&
      quizPassed
    ) {
      if (onMissionComplete) onMissionComplete();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-background text-foreground rounded-2xl shadow-2xl border border-border">
      <div className="mb-8 border-b border-border pb-4">
        <span className="text-xs uppercase tracking-widest text-accent font-semibold">Mission 4 Experience</span>
        <h2 className="text-2xl font-bold mt-1">Real-World Quantum Applications</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Explore quantum myths vs realities, molecular simulation comparisons, Shor&apos;s algorithm demonstration, and canonical knowledge validation.
        </p>

        {/* Step Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-6">
          {[
            { id: 'myths-applications', label: '1. Myths & Realities' },
            { id: 'molecular-comparison', label: '2. Molecular Simulation' },
            { id: 'shor-demo', label: "3. Shor&apos;s Algorithm" },
            { id: 'knowledge-check', label: '4. Knowledge Check' },
          ].map((step) => (
            <button
              key={step.id}
              type="button"
              onClick={() => setActiveStepId(step.id)}
              className={`px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${activeStepId === step.id ? 'bg-primary text-primary-foreground text-white' : 'bg-background text-muted-foreground hover:bg-card'}`}
              aria-current={activeStepId === step.id ? 'step' : undefined}
            >
              {step.label} {completedSteps[step.id] ? '✓' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Active Step Renderer */}
      <div className="transition-all duration-300">
        {activeStepId === 'myths-applications' && (
          <MythsApplicationsStep onComplete={() => handleStepComplete('myths-applications')} />
        )}
        {activeStepId === 'molecular-comparison' && (
          <MolecularComparisonStep onComplete={() => handleStepComplete('molecular-comparison')} />
        )}
        {activeStepId === 'shor-demo' && (
          <ShorDemoStep
            onComplete={() => handleStepComplete('shor-demo')}
            onExploreApplication={handleExploreApplication}
          />
        )}
        {activeStepId === 'knowledge-check' && (
          <div className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border" role="region" aria-label="Knowledge Check">
            <h3 className="text-xl font-bold mb-3">Canonical Quiz: Real-World Applications</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Verify your understanding of quantum algorithmic advantages, molecular simulation capabilities, and cryptographic scope.
            </p>
            <div className="bg-card p-5 rounded-lg mb-6 border border-border">
              <p className="text-sm font-medium mb-3">Which problem domain benefits most fundamentally from quantum algorithmic simulation?</p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleKnowledgeCheckComplete}
                  className="w-full text-left p-3 rounded bg-muted hover:bg-slate-600 text-sm transition-colors"
                >
                  Simulating molecular quantum states and chemical bond interactions.
                </button>
                <button
                  type="button"
                  onClick={handleKnowledgeCheckComplete}
                  className="w-full text-left p-3 rounded bg-muted hover:bg-slate-600 text-sm transition-colors"
                >
                  Accelerating everyday operating system file searches. (Incorrect)
                </button>
              </div>
            </div>
            <div className="text-xs text-muted-foreground" aria-live="polite">
              {knowledgeCheckPassed ? '✓ Knowledge check successfully completed!' : 'Select the correct answer above.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationsExperience;
