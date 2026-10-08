import React, { useState } from 'react';
import { MissionShell } from '@/components/learning/MissionShell';
import { KnowledgeCheck } from '@/components/learning/KnowledgeCheck';
import {
  createInitialMissionState,
  canNavigateToStep,
  advanceStep,
  previousStep,
  completeQuiz,
} from '@/domain/learning/missionMachine';
import { calculateBlochProbabilities } from '@/domain/quantum/bloch';
import { measureQubit } from '@/domain/quantum/measurement';

interface Mission1Props {
  onComplete: () => void;
  onBack?: () => void;
}

export const Mission1Superposition: React.FC<Mission1Props> = ({ onComplete, onBack }) => {
  const [progress, setProgress] = useState(createInitialMissionState());
  const [theta, setTheta] = useState(Math.PI / 2);
  const [measuredState, setMeasuredState] = useState<0 | 1 | null>(null);
  const [hasMeasured, setHasMeasured] = useState(false);

  const { prob0, prob1 } = calculateBlochProbabilities(theta);

  const handleMeasure = () => {
    const outcome = measureQubit(theta);
    setMeasuredState(outcome);
    setHasMeasured(true);
  };

  const stepReqs = { 1: hasMeasured };

  const handleStepChange = (targetStep: number) => {
    if (canNavigateToStep(targetStep, 4, progress, stepReqs)) {
      setProgress((prev) => ({ ...prev, currentStep: targetStep }));
    }
  };

  const handleNext = () => {
    setProgress((prev) => advanceStep(prev.currentStep, 4, prev, stepReqs));
  };

  const handlePrev = () => {
    if (progress.currentStep === 0 && onBack) {
      onBack();
    } else {
      setProgress((prev) => previousStep(prev.currentStep, prev));
    }
  };

  const handleQuizPass = () => {
    setProgress((prev) => completeQuiz(prev));
    onComplete();
  };

  return (
    <MissionShell
      title="Misión 1: Superposición y Colapso"
      description="Explora cómo un qubit se encuentra simultáneamente en combinación de estados hasta que es medido."
      currentStep={progress.currentStep}
      totalSteps={4}
      maxUnlockedStep={progress.maxUnlockedStep}
      state={progress.state}
      onStepChange={handleStepChange}
      onNext={handleNext}
      onPrev={handlePrev}
      onBack={onBack}
      isNextDisabled={progress.currentStep === 1 && !hasMeasured}
      helpMessage={progress.currentStep === 1 && !hasMeasured ? 'Ejecuta la medición para desbloquear el paso siguiente.' : null}
      assessmentNode={
        <KnowledgeCheck
          question="¿Qué sucede con el estado cuántico cuando realizas una medición?"
          options={[
            { id: 'a', text: 'Permanece en superposición indefinidamente.' },
            { id: 'b', text: 'Colapsa determinísticamente a un estado clásico |0⟩ o |1⟩.', explanation: 'La medición fuerza al qubit a colapsar según sus amplitudes.' },
            { id: 'c', text: 'Se destruye la información sin dejar resultado.' },
          ]}
          correctOptionId="b"
          onPass={handleQuizPass}
        />
      }
    >
      {progress.currentStep === 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-cyan-300">1. Qubit vs Bit Clásico</h2>
          <p className="text-slate-300">Un bit clásico vale 0 o 1. Un qubit en superposición combina ambos estados con amplitudes probabilísticas.</p>
        </div>
      )}

      {progress.currentStep === 1 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-cyan-300">2. Ángulo θ y Probabilidades</h2>
          <div className="flex flex-col gap-2">
            <label htmlFor="theta-range" className="text-sm font-medium">Ángulo θ: {(theta * (180 / Math.PI)).toFixed(0)}°</label>
            <input
              id="theta-range"
              type="range"
              min={0}
              max={Math.PI}
              step={0.05}
              value={theta}
              onChange={(e) => setTheta(parseFloat(e.target.value))}
              aria-label="Ajustar ángulo Theta"
              className="w-full accent-cyan-400"
            />
          </div>
          <div className="flex gap-6 mt-2 text-sm">
            <div>P(|0⟩): <span className="font-bold text-cyan-400">{prob0}%</span></div>
            <div>P(|1⟩): <span className="font-bold text-cyan-400">{prob1}%</span></div>
          </div>
          <button
            type="button"
            onClick={handleMeasure}
            className="mt-4 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg cursor-pointer"
          >
            🎯 Disparar Medición
          </button>
          {measuredState !== null && (
            <p className="mt-2 text-sm text-emerald-400 font-bold">
              Resultado del colapso: |{measuredState}⟩
            </p>
          )}
        </div>
      )}

      {progress.currentStep === 2 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-cyan-300">3. Análisis del Colapso</h2>
          <p className="text-slate-300">Una vez medido, las probabilidades originales desaparecen y el estado se fija.</p>
        </div>
      )}

      {progress.currentStep === 3 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-cyan-300">4. Evaluación de Superposición</h2>
          <p className="text-slate-300">Responde el cuestionario a continuación para finalizar la misión.</p>
        </div>
      )}
    </MissionShell>
  );
};

export default Mission1Superposition;
