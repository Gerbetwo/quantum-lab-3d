import React, { useState } from 'react';
import { ThermalPhotonStep } from './steps/ThermalPhotonStep';
import { TemperatureCoherenceStep } from './steps/TemperatureCoherenceStep';
import { RefrigeratorStep } from './steps/RefrigeratorStep';

interface DecoherenceExperienceProps {
  onMissionComplete?: () => void;
}

export const DecoherenceExperience: React.FC<DecoherenceExperienceProps> = ({ onMissionComplete }) => {
  const [activeStepId, setActiveStepId] = useState<string>('thermal-photon');
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
      currentCompleted['thermal-photon'] &&
      currentCompleted['temperature-coherence'] &&
      currentCompleted['refrigerator'] &&
      quizPassed
    ) {
      if (onMissionComplete) onMissionComplete();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-background text-foreground rounded-2xl shadow-2xl border border-border">
      <div className="mb-8 border-b border-border pb-4">
        <span className="text-xs uppercase tracking-widest text-accent font-semibold">Mission 3 Experience</span>
        <h2 className="text-2xl font-bold mt-1">Cryogenics & Thermal Decoherence</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Explore thermal photon bombardment, cryogenic temperature scaling, dilution refrigerator activation, and quantum decoherence validation.
        </p>

        {/* Step Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-6">
          {[
            { id: 'thermal-photon', label: '1. Thermal Photons' },
            { id: 'temperature-coherence', label: '2. Temperature & Coherence' },
            { id: 'refrigerator', label: '3. Dilution Refrigerator' },
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
        {activeStepId === 'thermal-photon' && (
          <ThermalPhotonStep onComplete={() => handleStepComplete('thermal-photon')} />
        )}
        {activeStepId === 'temperature-coherence' && (
          <TemperatureCoherenceStep onComplete={() => handleStepComplete('temperature-coherence')} />
        )}
        {activeStepId === 'refrigerator' && (
          <RefrigeratorStep onComplete={() => handleStepComplete('refrigerator')} />
        )}
        {activeStepId === 'knowledge-check' && (
          <div className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border" role="region" aria-label="Knowledge Check">
            <h3 className="text-xl font-bold mb-3">Canonical Quiz: Cryogenics & Decoherence</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Verify your understanding of thermal noise suppression, cryogenic cooling, and quantum coherence lifetimes.
            </p>
            <div className="bg-card p-5 rounded-lg mb-6 border border-border">
              <p className="text-sm font-medium mb-3">Why must superconducting quantum computers operate at millikelvin temperatures (approx. 15 mK)?</p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleKnowledgeCheckComplete}
                  className="w-full text-left p-3 rounded bg-muted hover:bg-slate-600 text-sm transition-colors"
                >
                  To suppress thermal photon excitation and maximize quantum coherence lifetimes.
                </button>
                <button
                  type="button"
                  onClick={handleKnowledgeCheckComplete}
                  className="w-full text-left p-3 rounded bg-muted hover:bg-slate-600 text-sm transition-colors"
                >
                  To accelerate clock speed and increase processor voltage. (Incorrect)
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

export default DecoherenceExperience;
