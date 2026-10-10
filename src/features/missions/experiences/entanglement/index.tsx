import React, { useState } from 'react';
import { IndependentQubitsStep } from './steps/IndependentQubitsStep';
import { PrepareBellStep } from './steps/PrepareBellStep';
import { SeparationStep } from './steps/SeparationStep';
import { CorrelatedMeasurementStep } from './steps/CorrelatedMeasurementStep';

interface EntanglementExperienceProps {
  onMissionComplete?: () => void;
}

export const EntanglementExperience: React.FC<EntanglementExperienceProps> = ({ onMissionComplete }) => {
  const [activeStepId, setActiveStepId] = useState<string>('independent-qubits');
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [bellPrepared, setBellPrepared] = useState<boolean>(false);
  const [entanglementMeasurementsCount, setEntanglementMeasurementsCount] = useState<number>(0);
  const [knowledgeCheckPassed, setKnowledgeCheckPassed] = useState<boolean>(false);

  const handleStepComplete = (stepId: string) => {
    setCompletedSteps(prev => {
      const next = { ...prev, [stepId]: true };
      checkAllComplete(next, knowledgeCheckPassed);
      return next;
    });
  };

  const handleBellPrepared = (state: { prepared: boolean }) => {
    if (state.prepared) {
      setBellPrepared(true);
      handleStepComplete('prepare-bell');
    }
  };

  const handleRecordMeasurement = () => {
    if (entanglementMeasurementsCount === 0) {
      setEntanglementMeasurementsCount(1);
    }
  };

  const handleKnowledgeCheckComplete = () => {
    setKnowledgeCheckPassed(true);
    const next = { ...completedSteps, 'knowledge-check': true };
    setCompletedSteps(next);
    checkAllComplete(next, true);
  };

  const checkAllComplete = (currentCompleted: Record<string, boolean>, quizPassed: boolean) => {
    if (
      currentCompleted['independent-qubits'] &&
      currentCompleted['prepare-bell'] &&
      currentCompleted['separation'] &&
      currentCompleted['correlated-measurement'] &&
      quizPassed
    ) {
      if (onMissionComplete) onMissionComplete();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-950 text-slate-100 rounded-2xl shadow-2xl border border-slate-800">
      <div className="mb-8 border-b border-slate-800 pb-4">
        <span className="text-xs uppercase tracking-widest text-cyan-400 font-semibold">Mission 2 Experience</span>
        <h2 className="text-2xl font-bold mt-1">Quantum Entanglement & Non-Locality</h2>
        <p className="text-sm text-slate-400 mt-1">
          Explore independent qubits, Bell pair preparation, spatial separation, correlated measurement, and canonical knowledge validation.
        </p>

        {/* Step Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-6">
          {[
            { id: 'independent-qubits', label: '1. Independent Qubits' },
            { id: 'prepare-bell', label: '2. Prepare Bell Pair' },
            { id: 'separation', label: '3. Spatial Separation' },
            { id: 'correlated-measurement', label: '4. Correlated Measurement' },
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
        {activeStepId === 'independent-qubits' && (
          <IndependentQubitsStep onComplete={() => handleStepComplete('independent-qubits')} />
        )}
        {activeStepId === 'prepare-bell' && (
          <PrepareBellStep onComplete={() => handleBellPrepared({ prepared: true })} />
        )}
        {activeStepId === 'separation' && (
          <SeparationStep onComplete={() => handleStepComplete('separation')} />
        )}
        {activeStepId === 'correlated-measurement' && (
          <CorrelatedMeasurementStep
            isBellPrepared={bellPrepared}
            onComplete={() => handleStepComplete('correlated-measurement')}
            onRecordMeasurement={handleRecordMeasurement}
          />
        )}
        {activeStepId === 'knowledge-check' && (
          <div className="p-6 bg-slate-900 rounded-xl text-slate-100 shadow-lg border border-slate-800" role="region" aria-label="Knowledge Check">
            <h3 className="text-xl font-bold mb-3">Canonical Quiz: Entanglement Validation</h3>
            <p className="text-sm text-slate-300 mb-6">
              Verify your understanding of non-locality, measurement correlations, and faster-than-light constraints.
            </p>
            <div className="bg-slate-800 p-5 rounded-lg mb-6 border border-slate-700">
              <p className="text-sm font-medium mb-3">Does measuring an entangled qubit allow sending messages faster than light?</p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleKnowledgeCheckComplete}
                  className="w-full text-left p-3 rounded bg-slate-700 hover:bg-slate-600 text-sm transition-colors"
                >
                  No. While outcomes are correlated, individual results are random and cannot transmit controlled signals.
                </button>
                <button
                  type="button"
                  onClick={handleKnowledgeCheckComplete}
                  className="w-full text-left p-3 rounded bg-slate-700 hover:bg-slate-600 text-sm transition-colors"
                >
                  Yes, instant correlation implies faster-than-light communication. (Incorrect)
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

export default EntanglementExperience;
