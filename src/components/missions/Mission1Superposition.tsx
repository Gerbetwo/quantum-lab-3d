import React, { useState } from 'react';
import { calculateBlochProbabilities } from '../../domain/quantum/bloch';
import { SceneStage } from '../learning/SceneStage';
import { BlochSphereScene } from '../scenes/BlochSphereScene';

interface Mission1Props {
  onComplete?: () => void;
}

export function Mission1Superposition({ onComplete }: Mission1Props) {
  const [step, setStep] = useState<number>(0);
  const [theta, setTheta] = useState<number>(Math.PI / 4);
  const [collapsedState, setCollapsedState] = useState<0 | 1 | null>(null);
  const [quizSelected, setQuizSelected] = useState<boolean>(false);
  const [quizValidated, setQuizValidated] = useState<boolean>(false);

  const { prob0, prob1 } = calculateBlochProbabilities(theta);

  const handleMeasure = () => {
    const outcome = Math.random() < prob0 / 100 ? 0 : 1;
    setCollapsedState(outcome);
  };

  const handleNextStep = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleValidateQuiz = () => {
    if (quizSelected) {
      setQuizValidated(true);
      if (onComplete) {
        onComplete();
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 max-w-6xl mx-auto text-slate-100">
      <div className="flex flex-col gap-6">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <h2 className="text-xl font-bold text-cyan-400 mb-2">Misión 1: Superposición Cuántica</h2>

          {step === 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-200">1. Qubit vs Bit Clásico</h3>
              <p className="text-sm text-slate-300">
                A diferencia de un bit tradicional que solo puede ser 0 o 1, un qubit puede coexistir en una combinación lineal de ambos estados (superposición).
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-200">2. Ángulo θ y Probabilidades</h3>
              <p className="text-sm text-slate-300">
                Ajusta el ángulo θ para modificar el estado del qubit en la Esfera de Bloch y observa cómo cambian las probabilidades.
              </p>

              <div>
                <label htmlFor="theta-slider" className="block text-xs font-semibold text-slate-400 mb-1">
                  Ángulo Theta (θ): {(theta / Math.PI).toFixed(2)}π rad ({((theta * 180) / Math.PI).toFixed(0)}°)
                </label>
                <input
                  id="theta-slider"
                  type="range"
                  min={0}
                  max={Math.PI}
                  step={0.01}
                  value={theta}
                  onChange={(e) => {
                    setTheta(parseFloat(e.target.value));
                    setCollapsedState(null);
                  }}
                  className="w-full accent-cyan-400 bg-slate-800 rounded-lg h-2 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <div>
                  <span className="text-xs text-slate-400 block">Probabilidad |0⟩</span>
                  <span className="text-lg font-bold text-cyan-300">{prob0}%</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">Probabilidad |1⟩</span>
                  <span className="text-lg font-bold text-pink-400">{prob1}%</span>
                </div>
              </div>

              <button
                onClick={handleMeasure}
                className="w-full py-2 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl shadow transition-all"
              >
                🎯 Disparar Medición
              </button>

              {collapsedState !== null && (
                <div className="p-2 bg-cyan-950/40 border border-cyan-800/60 rounded-xl text-center">
                  <span className="text-xs text-cyan-300">Resultado del colapso: |{collapsedState}⟩</span>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-200">3. Análisis del Colapso</h3>
              <p className="text-sm text-slate-300">
                Al medir el qubit, este colapsa de su estado de superposición a uno de los estados base computacionales.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-200">4. Evaluación de Superposición</h3>
              <p className="text-sm text-slate-300">Selecciona la afirmación correcta sobre la medición cuántica:</p>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded bg-slate-800/50 border border-slate-700">
                  <input
                    type="radio"
                    name="quiz"
                    aria-label="Colapsa determinísticamente"
                    checked={quizSelected}
                    onChange={() => setQuizSelected(true)}
                    className="accent-cyan-400"
                  />
                  Colapsa determinísticamente a uno de los estados base.
                </label>
              </div>
              <button
                onClick={handleValidateQuiz}
                className="mt-3 py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow transition-all"
              >
                Validar Respuesta
              </button>
              {quizValidated && (
                <div className="mt-2 text-emerald-400 font-bold text-sm">
                  ✅ ¡Correcto! Has completado la misión.
                </div>
              )}
            </div>
          )}

          <div className="mt-6 flex justify-between items-center pt-4 border-t border-slate-800">
            <span className="text-xs text-slate-400">Paso {step + 1} de 4</span>
            <button
              onClick={handleNextStep}
              className="py-2 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl shadow-lg transition-all"
            >
              Siguiente →
            </button>
          </div>
        </div>
      </div>

      <div>
        <SceneStage label="Visualizador 3D — Esfera de Bloch" description="Representación geométrica en coordenadas de estado puro.">
          <BlochSphereScene theta={collapsedState === 0 ? 0 : collapsedState === 1 ? Math.PI : theta} />
        </SceneStage>
      </div>
    </div>
  );
}

export default Mission1Superposition;
