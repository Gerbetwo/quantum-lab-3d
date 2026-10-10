import React, { useState } from 'react';
import { GroverOverviewStep } from './steps/GroverOverviewStep';
import { SearchCostStep } from './steps/SearchCostStep';
import { SingleGroverIterationStep } from './steps/SingleGroverIterationStep';
import { FullGroverRunStep } from './steps/FullGroverRunStep';

interface GroverExperienceProps {
  onMissionComplete?: () => void;
}

export const GroverExperience: React.FC<GroverExperienceProps> = ({ onMissionComplete }) => {
  const [activeStepId, setActiveStepId] = useState<string>('grover-overview');
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
      currentCompleted['grover-overview'] &&
      currentCompleted['search-cost'] &&
      currentCompleted['single-iteration'] &&
      currentCompleted['full-run'] &&
      quizPassed
    ) {
      if (onMissionComplete) onMissionComplete();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-950 text-slate-100 rounded-2xl shadow-2xl border border-slate-800">
      <div className="mb-8 border-b border-slate-800 pb-4">
        <span className="text-xs uppercase tracking-widest text-cyan-400 font-semibold">Mission 6 Experience</span>
        <h2 className="text-2xl font-bold mt-1">Grover's Search & Amplitude Amplification</h2>
        <p className="text-sm text-slate-400 mt-1">
          Explore search query costs, single iteration distribution shifts, full algorithm execution, and canonical knowledge validation.
        </p>

        {/* Step Navigation Tabs (Wiring all M6 step IDs and knowledge check) */}
        <div className="flex flex-wrap gap-2 mt-6">
          {[
            { id: 'grover-overview', label: '1. Overview' },
            { id: 'search-cost', label: '2. Search Cost' },
            { id: 'single-iteration', label: '3. Single Iteration' },
            { id: 'full-run', label: '4. Full Grover Run' },
            { id: 'knowledge-check', label: '5. Knowledge Check' },
          ].map((step) => (
            <button
              key={step.id}
              type="button"
              onClick={() => setActiveStepId(step.id)}
              className={`px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-colors ${activeStepId === step.id ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
              aria-current={activeStepId === step.id ? 'step' : undefined}
            >
              {step.label} {completedSteps[step.id] ? '✓' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Active Step Renderer */}
      <div className="transition-all duration-300">
        {activeStepId === 'grover-overview' && (
          <GroverOverviewStep onComplete={() => handleStepComplete('grover-overview')} />
        )}
        {activeStepId === 'search-cost' && (
          <SearchCostStep onComplete={() => handleStepComplete('search-cost')} />
        )}
        {activeStepId === 'single-iteration' && (
          <SingleGroverIterationStep onComplete={() => handleStepComplete('single-iteration')} />
        )}
        {activeStepId === 'full-run' && (
          <FullGroverRunStep onComplete={() => handleStepComplete('full-run')} />
        )}
        {activeStepId === 'knowledge-check' && (
          <div className="p-6 bg-slate-900 rounded-xl text-slate-100 shadow-lg border border-slate-800" role="region" aria-label="Knowledge Check">
            <h3 className="text-xl font-bold mb-3">Canonical Quiz: Grover's Search</h3>
            <p className="text-sm text-slate-300 mb-6">
              Verify your understanding of quadratic speedup, oracle marking, amplitude amplification, and query complexity.
            </p>
            <div className="bg-slate-800 p-5 rounded-lg mb-6 border border-slate-700">
              <p className="text-sm font-medium mb-3">What type of speedup does Grover's algorithm provide over classical unstructured search?</p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleKnowledgeCheckComplete}
                  className="w-full text-left p-3 rounded bg-slate-700 hover:bg-slate-600 text-sm transition-colors"
                >
                  Quadratic speedup (proportional to the square root of N).
                </button>
                <button
                  type="button"
                  onClick={handleKnowledgeCheckComplete}
                  className="w-full text-left p-3 rounded bg-slate-700 hover:bg-slate-600 text-sm transition-colors"
                >
                  Universal exponential speedup for all computational problems. (Incorrect)
                </button>
              </div>
            </div>
            <div className="text-xs text-slate-400" aria-live="polite">
              {knowledgeCheckPassed ? '✓ Knowledge check successfully completed!' : 'Select the correct answer above.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroverExperience;
