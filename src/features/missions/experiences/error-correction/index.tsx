import React, { useState } from 'react';
import { ErrorCorrectionOverviewStep } from './steps/ErrorCorrectionOverviewStep';
import { BitFlipCorrectionStep } from './steps/BitFlipCorrectionStep';
import { PhaseFlipStep } from './steps/PhaseFlipStep';
import { SyndromeMajorityStep } from './steps/SyndromeMajorityStep';

interface ErrorCorrectionExperienceProps {
  onMissionComplete?: () => void;
}

export const ErrorCorrectionExperience: React.FC<ErrorCorrectionExperienceProps> = ({ onMissionComplete }) => {
  const [activeStepId, setActiveStepId] = useState<string>('error-correction-overview');
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [knowledgeCheckPassed, setKnowledgeCheckPassed] = useState<boolean>(false);

  const handleStepComplete = (stepId: string) => {
    setCompletedSteps(prev => {
      const next = { ...prev, [stepId]: true };
      checkAllComplete(next, knowledgeCheckPassed);
      return next;
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
      currentCompleted['error-correction-overview'] &&
      currentCompleted['bit-flip-correction'] &&
      currentCompleted['phase-flip'] &&
      currentCompleted['syndrome-majority'] &&
      quizPassed
    ) {
      if (onMissionComplete) onMissionComplete();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-background text-foreground rounded-2xl shadow-2xl border border-border">
      <div className="mb-8 border-b border-border pb-4">
        <span className="text-xs uppercase tracking-widest text-accent font-semibold">Mission Experience</span>
        <h2 className="text-2xl font-bold mt-1">Quantum Error Correction</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Explore error correction overview, bit-flip correction, quantum phase flips, syndrome measurement, and canonical knowledge validation.
        </p>

        {/* Step Navigation Tabs (Wiring all M7 steps + Knowledge Check) */}
        <div className="flex flex-wrap gap-2 mt-6">
          {[
            { id: 'error-correction-overview', label: '1. Overview' },
            { id: 'bit-flip-correction', label: '2. Bit-Flip Correction' },
            { id: 'phase-flip', label: '3. Phase Flip' },
            { id: 'syndrome-majority', label: '4. Syndrome & Majority' },
            { id: 'knowledge-check', label: '5. Knowledge Check' },
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
        {activeStepId === 'error-correction-overview' && (
          <ErrorCorrectionOverviewStep onComplete={() => handleStepComplete('error-correction-overview')} />
        )}
        {activeStepId === 'bit-flip-correction' && (
          <BitFlipCorrectionStep onComplete={() => handleStepComplete('bit-flip-correction')} />
        )}
        {activeStepId === 'phase-flip' && (
          <PhaseFlipStep onComplete={() => handleStepComplete('phase-flip')} />
        )}
        {activeStepId === 'syndrome-majority' && (
          <SyndromeMajorityStep onComplete={() => handleStepComplete('syndrome-majority')} />
        )}
        {activeStepId === 'knowledge-check' && (
          <div className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border" role="region" aria-label="Knowledge Check">
            <h3 className="text-xl font-bold mb-3">Canonical Quiz: Quantum Error Correction</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Verify your understanding of repetition codes, syndrome measurements, phase errors, and single-error limitations.
            </p>
            <div className="bg-card p-5 rounded-lg mb-6 border border-border">
              <p className="text-sm font-medium mb-3">What is the primary limitation of the basic three-bit repetition code demonstrated in this mission?</p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleKnowledgeCheckComplete}
                  className="w-full text-left p-3 rounded bg-muted hover:bg-slate-600 text-sm transition-colors"
                >
                  It corrects only isolated single bit-flips and does not protect against phase errors or multiple simultaneous errors.
                </button>
                <button
                  type="button"
                  onClick={handleKnowledgeCheckComplete}
                  className="w-full text-left p-3 rounded bg-muted hover:bg-slate-600 text-sm transition-colors"
                >
                  It corrects all arbitrary multi-qubit phase and bit-flip errors simultaneously. (Incorrect)
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

export default ErrorCorrectionExperience;
