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
import {
  calculateCoherenceTime,
  milliKelvinToKelvin,
} from '@/domain/quantum/decoherence';

interface Mission3Props {
  onComplete: () => void;
  onBack?: () => void;
}

export const Mission3Decoherence: React.FC<Mission3Props> = ({ onComplete, onBack }) => {
  const [progress, setProgress] = useState(createInitialMissionState());
  const [tempMK, setTempMK] = useState(15);

  const tempK = milliKelvinToKelvin(tempMK);
  const t2Time = calculateCoherenceTime(tempMK);

  const handleStepChange = (targetStep: number) => {
    if (canNavigateToStep(targetStep, 4, progress)) {
      setProgress((prev) => ({ ...prev, currentStep: targetStep }));
    }
  };

  const handleNext = () => {
    setProgress((prev) => advanceStep(prev.currentStep, 4, prev));
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
      title="Misión 3: Decoherencia y Entorno Criogénico"
      description="Observa el impacto del ruido térmico y la temperatura sobre el tiempo de coherencia T₂."
      currentStep={progress.currentStep}
      totalSteps={4}
      maxUnlockedStep={progress.maxUnlockedStep}
      state={progress.state}
      onStepChange={handleStepChange}
      onNext={handleNext}
      onPrev={handlePrev}
      onBack={onBack}
      assessmentNode={
        <KnowledgeCheck
          question="¿Por qué los computadores cuánticos de qubits superconductores operan a temperaturas cercanas a 0 K (miliKelvin)?"
          options={[
            { id: 'a', text: 'Para acelerar los pulsos de microondas.' },
            { id: 'b', text: 'Para minimizar las excitaciones térmicas que destruyen la coherencia cuántica (T₂).', explanation: 'El calor ambiental destruye rápidamente los estados de superposición.' },
            { id: 'c', text: 'No tiene impacto físico, solo previene sobrecalentamiento de cables.' },
          ]}
          correctOptionId="b"
          onPass={handleQuizPass}
        />
      }
    >
      {progress.currentStep === 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-cyan-300">1. Fragilidad del Estado Cuántico</h2>
          <p className="text-slate-300">La interacción con fotones térmicos destruye la fase del qubit en un proceso llamado decoherencia.</p>
        </div>
      )}

      {progress.currentStep === 1 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-cyan-300">2. Control del Criostato de Dilución</h2>
          <div className="flex flex-col gap-2">
            <label htmlFor="temp-range" className="text-sm font-medium">
              Temperatura: <span className="text-cyan-400 font-bold">{tempK} K</span> ({tempMK} mK)
            </label>
            <input
              id="temp-range"
              type="range"
              min={15}
              max={300000}
              step={100}
              value={tempMK}
              onChange={(e) => setTempMK(parseInt(e.target.value, 10))}
              aria-label="Temperatura del criostato en miliKelvin"
              className="w-full accent-cyan-400"
            />
          </div>
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg mt-2">
            Tiempo de Coherencia T₂ calculado: <span className="font-bold text-cyan-400">{t2Time} µs</span>
          </div>
        </div>
      )}

      {progress.currentStep === 2 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-cyan-300">3. Aislamiento Físico</h2>
          <p className="text-slate-300">A temperaturas ambiente (300 K), el tiempo de coherencia T₂ decae a fracciones despreciables.</p>
        </div>
      )}

      {progress.currentStep === 3 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-cyan-300">4. Evaluación de Decoherencia</h2>
          <p className="text-slate-300">Responde el cuestionario para finalizar la misión.</p>
        </div>
      )}
    </MissionShell>
  );
};

export default Mission3Decoherence;
