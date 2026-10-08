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
import { factorizeShorN15 } from '@/domain/quantum/shor';

interface Mission4Props {
  onFinishAll?: () => void;
  onComplete?: () => void;
  onBack?: () => void;
}

export const Mission4Applications: React.FC<Mission4Props> = ({ onFinishAll, onComplete, onBack }) => {
  const [progress, setProgress] = useState(createInitialMissionState());
  const [selectedBase, setSelectedBase] = useState(7);

  const shorResult = factorizeShorN15(selectedBase);

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
    if (onFinishAll) onFinishAll();
    if (onComplete) onComplete();
  };

  return (
    <MissionShell
      title="Misión 4: Algoritmos Cuánticos y Factorización"
      description="Demostración didáctica del algoritmo de Shor para N = 15 con bases verificables."
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
          question="¿Cuál es la ventaja esencial del algoritmo de Shor frente a los algoritmos clásicos de factorización?"
          options={[
            { id: 'a', text: 'Reduce la complejidad de factorización a tiempo polinomial mediante la estimación de fase cuántica.', explanation: 'Shor aprovecha la superposición para hallar el período exponencialmente más rápido.' },
            { id: 'b', text: 'Prueba todos los factores uno a uno en paralelo.' },
            { id: 'c', text: 'Elimina la necesidad de utilizar números primos.' },
          ]}
          correctOptionId="a"
          onPass={handleQuizPass}
        />
      }
    >
      {progress.currentStep === 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-cyan-300">1. Introducción a la Factorización Cuántica</h2>
          <p className="text-slate-300">El algoritmo de Shor transforma el problema de factorización en un problema de búsqueda de período modular.</p>
        </div>
      )}

      {progress.currentStep === 1 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-cyan-300">2. Demostración Didáctica de Factorización (N = 15)</h2>
          <div className="flex items-center gap-3">
            <label htmlFor="base-select" className="text-sm font-medium">Seleccionar Base a:</label>
            <select
              id="base-select"
              value={selectedBase}
              onChange={(e) => setSelectedBase(parseInt(e.target.value, 10))}
              aria-label="Seleccionar base coprima con 15"
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-cyan-300 text-sm font-mono"
            >
              {[2, 7, 8, 11, 13].map((b) => (
                <option key={b} value={b}>a = {b}</option>
              ))}
            </select>
          </div>

          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col gap-2 text-sm font-mono mt-2">
            <div data-testid="shor-summary">N = 15 | Base a = {shorResult.base}</div>
            <div>Período hallado (r): <span className="text-cyan-400">{shorResult.period ?? 'N/A'}</span></div>
            <div>Secuencia a^x mod 15: [{shorResult.modularSequence.map((s) => s.val).join(', ')}]</div>
            {shorResult.factors && (
              <div className="text-emerald-400 font-bold mt-1">
                Factores: {shorResult.factors[0]} × {shorResult.factors[1]} = 15
              </div>
            )}
            <p className="text-xs text-slate-400 font-sans mt-2 border-t border-slate-800 pt-2">
              {shorResult.explanation}
            </p>
          </div>
          <p className="text-xs text-slate-500 italic">
            * Nota didáctica: Esta demostración evalúa los pasos matemáticos del algoritmo de Shor para N = 15 de manera didáctica comprobable. No simula falsas ejecuciones sobre RSA-2048.
          </p>
        </div>
      )}

      {progress.currentStep === 2 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-cyan-300">3. Búsqueda de Período y QFT</h2>
          <p className="text-slate-300">En un computador cuántico real, la Transformada de Fourier Cuántica (QFT) encuentra el período r en paralelo.</p>
        </div>
      )}

      {progress.currentStep === 3 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-cyan-300">4. Evaluación de Shor y Aplicaciones</h2>
          <p className="text-slate-300">Responde el cuestionario para finalizar la misión.</p>
        </div>
      )}
    </MissionShell>
  );
};

export default Mission4Applications;
