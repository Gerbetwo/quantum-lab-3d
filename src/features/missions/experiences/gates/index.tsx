import React, { useState } from 'react';
import { GateOperationsStep } from './steps/GateOperationsStep';
import { TeachingCircuitStep } from './steps/TeachingCircuitStep';

interface GatesExperienceProps {
  onMissionComplete?: () => void;
}

export const GatesExperience: React.FC<GatesExperienceProps> = ({ onMissionComplete }) => {
  const [activeStepId, setActiveStepId] = useState<string>('gate-basics');
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
      currentCompleted['gate-basics'] &&
      currentCompleted['apply-gates'] &&
      currentCompleted['teaching-circuit'] &&
      quizPassed
    ) {
      if (onMissionComplete) onMissionComplete();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-background text-foreground rounded-2xl shadow-2xl border border-border">
      <div className="mb-8 border-b border-border pb-4">
        <span className="text-xs uppercase tracking-widest text-accent font-semibold">Mission Experience</span>
        <h2 className="text-2xl font-bold mt-1">Quantum Gates & Teaching Circuits</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Explore gate basics, interactive single-qubit gate operations, teaching circuits, and canonical knowledge validation.
        </p>

        {/* Step Navigation Tabs (Strictly 4 wired IDs: gate-basics, apply-gates, teaching-circuit, knowledge-check) */}
        <div className="flex flex-wrap gap-2 mt-6">
          {[
            { id: 'gate-basics', label: '1. Gate Basics' },
            { id: 'apply-gates', label: '2. Apply Gates' },
            { id: 'teaching-circuit', label: '3. Teaching Circuit' },
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
        {activeStepId === 'gate-basics' && (
          <GateOperationsStep stepId="gate-basics" onComplete={() => handleStepComplete('gate-basics')} />
        )}
        {activeStepId === 'apply-gates' && (
          <GateOperationsStep stepId="apply-gates" onComplete={() => handleStepComplete('apply-gates')} />
        )}
        {activeStepId === 'teaching-circuit' && (
          <TeachingCircuitStep onComplete={() => handleStepComplete('teaching-circuit')} />
        )}
        {activeStepId === 'knowledge-check' && (
          <div className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border" role="region" aria-label="Knowledge Check">
            <h3 className="text-xl font-bold mb-3">Canonical Quiz: Quantum Gates</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Verify your understanding of unitary gate reversibility, superposition creation, and circuit slot execution.
            </p>
            <div className="bg-card p-5 rounded-lg mb-6 border border-border">
              <p className="text-sm font-medium mb-3">What happens when you apply a Hadamard (H) gate to a qubit initialized in state |0⟩?</p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleKnowledgeCheckComplete}
                  className="w-full text-left p-3 rounded bg-muted hover:bg-slate-600 text-sm transition-colors"
                >
                  It creates an equal superposition state ((|0⟩ + |1⟩)/√2) with 50%/50% probabilities.
                </button>
                <button
                  type="button"
                  onClick={handleKnowledgeCheckComplete}
                  className="w-full text-left p-3 rounded bg-muted hover:bg-slate-600 text-sm transition-colors"
                >
                  It forces the qubit into a deterministic |1⟩ state. (Incorrect)
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

export default GatesExperience;
