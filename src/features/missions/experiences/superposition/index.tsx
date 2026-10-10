import React, { useState } from 'react';
import { ClassicalBitStep } from './steps/ClassicalBitStep';
import { CoinAnalogyStep } from './steps/CoinAnalogyStep';
import { BlochStateStep } from './steps/BlochStateStep';
import { MeasurementStep } from './steps/MeasurementStep';

interface SuperpositionExperienceProps {
  onMissionComplete?: () => void;
}

export const SuperpositionExperience: React.FC<SuperpositionExperienceProps> = ({ onMissionComplete }) => {
  const [activeStepId, setActiveStepId] = useState<string>('classical-bit');
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [measurementsLog, setMeasurementsLog] = useState<( '|0⟩' | '|1⟩' )[]>([]);

  const handleStepComplete = (stepId: string) => {
    setCompletedSteps(prev => {
      const next = { ...prev, [stepId]: true };
      // Check if all 4 steps are complete
      if (
        next['classical-bit'] &&
        next['coin-analogy'] &&
        next['bloch-state'] &&
        next['measurement']
      ) {
        if (onMissionComplete) onMissionComplete();
      }
      return next;
    });
  };

  const handleRecordMeasurement = (result: '|0⟩' | '|1⟩') => {
    // Record superpositionMeasurements once per run
    if (measurementsLog.length === 0) {
      setMeasurementsLog([result]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-950 text-slate-100 rounded-2xl shadow-2xl border border-slate-800">
      <div className="mb-8 border-b border-slate-800 pb-4">
        <span className="text-xs uppercase tracking-widest text-cyan-400 font-semibold">Mission 1 Experience</span>
        <h2 className="text-2xl font-bold mt-1">Superposition & Wavefunction Collapse</h2>
        <p className="text-sm text-slate-400 mt-1">
          Explore classical vs quantum states, intuitive analogies, Bloch sphere geometry, and wavefunction collapse.
        </p>

        {/* Step Navigation Tabs / Indicator */}
        <div className="flex flex-wrap gap-2 mt-6">
          {[
            { id: 'classical-bit', label: '1. Classical Bit' },
            { id: 'coin-analogy', label: '2. Coin Analogy' },
            { id: 'bloch-state', label: '3. Bloch Sphere' },
            { id: 'measurement', label: '4. Measurement' },
          ].map((step) => (
            <button
              key={step.id}
              type="button"
              onClick={() => setActiveStepId(step.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeStepId === step.id ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
              aria-current={activeStepId === step.id ? 'step' : undefined}
            >
              {step.label} {completedSteps[step.id] ? '✓' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Active Step Renderer */}
      <div className="transition-all duration-300">
        {activeStepId === 'classical-bit' && (
          <ClassicalBitStep onComplete={() => handleStepComplete('classical-bit')} />
        )}
        {activeStepId === 'coin-analogy' && (
          <CoinAnalogyStep onComplete={() => handleStepComplete('coin-analogy')} />
        )}
        {activeStepId === 'bloch-state' && (
          <BlochStateStep onComplete={() => handleStepComplete('bloch-state')} />
        )}
        {activeStepId === 'measurement' && (
          <MeasurementStep 
            onComplete={() => handleStepComplete('measurement')} 
            onRecordMeasurement={handleRecordMeasurement}
          />
        )}
      </div>
    </div>
  );
};

export default SuperpositionExperience;
