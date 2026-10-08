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

interface Mission2Props {
  onComplete: () => void;
  onBack?: () => void;
  __testRandom?: () => number;
}

export const Mission2Entanglement: React.FC<Mission2Props> = ({ onComplete, onBack, __testRandom }) => {
  const [progress, setProgress] = useState(createInitialMissionState());
  const [aliceMeasured, setAliceMeasured] = useState(false);
  const [sharedState, setSharedState] = useState<0 | 1 | null>(null);

  const handleAliceMeasure = () => {
    const rng = __testRandom ? __testRandom() : Math.random();
    const outcome = rng < 0.5 ? 0 : 1;
    setSharedState(outcome);
    setAliceMeasured(true);
  };

  const stepReqs = { 1: aliceMeasured };

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
      title="Misión 2: Entrelazamiento y Pares de Bell"
      description="Demuestra la correlación no local entre qubits entrelazados a larga distancia."
      currentStep={progress.currentStep}
      totalSteps={4}
      maxUnlockedStep={progress.maxUnlockedStep}
      state={progress.state}
      onStepChange={handleStepChange}
      onNext={handleNext}
      onPrev={handlePrev}
      onBack={onBack}
      isNextDisabled={progress.currentStep === 1 && !aliceMeasured}
      helpMessage={progress.currentStep === 1 && !aliceMeasured ? 'Mide el qubit de Alice para observar el resultado instantáneo en Bob.' : null}
      assessmentNode={
        <KnowledgeCheck
          question="Si Alice mide |1⟩ en su qubit entrelazado en el estado Bell |Φ+⟩, ¿qué obtendrá Bob instantáneamente?"
          options={[
            { id: 'a', text: 'Un resultado aleatorio independiente.' },
            { id: 'b', text: '|1⟩ con 100% de correlación instantánea.', explanation: 'En el estado Bell, las mediciones están fuertemente correlacionadas.' },
            { id: 'c', text: 'Siempre |0⟩.' },
          ]}
          correctOptionId="b"
          onPass={handleQuizPass}
        />
      }
    >
      {progress.currentStep === 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-cyan-300">1. El Par de Bell</h2>
          <p className="text-slate-300">Dos qubits entrelazados no poseen estados individuales independientes.</p>
        </div>
      )}

      {progress.currentStep === 1 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-cyan-300">2. Estación Alice (Tierra)</h2>
          <button
            type="button"
            onClick={handleAliceMeasure}
            className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg cursor-pointer w-fit"
          >
            📡 Medir Qubit de Alice
          </button>
          {aliceMeasured && (
            <div className="p-3 bg-cyan-950/60 border border-cyan-500/40 rounded-lg text-sm text-cyan-200">
              Alice midió: <span className="font-bold">|{sharedState}⟩</span>. Bob en Andrómeda ha recibido instantáneamente el correlato.
            </div>
          )}
        </div>
      )}

      {progress.currentStep === 2 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-cyan-300">3. Estación Bob (Andrómeda)</h2>
          <p className="text-slate-300">
            Resultado de Bob: <span className="font-bold text-cyan-400">|{sharedState}⟩</span>.
          </p>
        </div>
      )}

      {progress.currentStep === 3 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-cyan-300">4. Evaluación de Entrelazamiento</h2>
          <p className="text-slate-300">Completa el cuestionario para finalizar la misión.</p>
        </div>
      )}
    </MissionShell>
  );
};

export default Mission2Entanglement;
