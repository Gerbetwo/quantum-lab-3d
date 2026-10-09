/**
 * Mission4Applications.tsx — Misión 4: Algoritmo de Shor (Demostración N=15)
 */
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { runShorDemo, ShorDemoResult } from '@/domain/quantum/applications';
import { createShorPeriodScene } from '@/lib/three/scenes/createShorPeriodScene';

interface Mission4Props {
  onFinishAll?: () => void;
  onBack?: () => void;
}

export default function Mission4Applications({ onFinishAll, onBack }: Mission4Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ReturnType<typeof createShorPeriodScene> | null>(null);
  const [base, setBase] = useState<number>(2);
  const [step, setStep] = useState(0);
  const [selectedQuiz, setSelectedQuiz] = useState<string>('');
  const [quizValidated, setQuizValidated] = useState(false);

  const result: ShorDemoResult = runShorDemo(base);

  useEffect(() => {
    if (containerRef.current) {
      sceneRef.current = createShorPeriodScene(containerRef.current, result.sequence);
    }
    return () => {
      sceneRef.current?.dispose();
    };
  }, [base, result.sequence]);

  const validateQuiz = () => {
    if (selectedQuiz.includes('Reduce la complejidad de factorización')) {
      setQuizValidated(true);
      if (onFinishAll) onFinishAll();
    }
  };

  return (
    <div className="flex flex-col items-center p-6 w-full max-w-4xl mx-auto text-white">
      <h2 className="text-2xl font-bold mb-4">Misión 4: Algoritmo de Shor (Demostración N = 15)</h2>

      {step === 1 && (
        <div className="w-full flex flex-col items-center">
          <h3 className="text-xl font-semibold mb-2">2. Demostración Didáctica de Factorización (N = 15)</h3>
          <div className="mb-4 w-full">
            <label htmlFor="base-select" className="block text-sm font-medium mb-1">Seleccionar base coprima con 15</label>
            <select
              id="base-select"
              aria-label="Seleccionar base coprima con 15"
              value={base}
              onChange={(e) => setBase(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 p-2 rounded-lg text-white"
            >
              {[2, 7, 8, 11, 13].map((b) => (
                <option key={b} value={b}>Base {b}</option>
              ))}
            </select>
          </div>
          <div ref={containerRef} className="w-full h-80 bg-slate-900 rounded-xl overflow-hidden shadow-lg mb-6 border border-slate-700" role="img" aria-label="Visualización 3D del período de Shor" />
          <div data-testid="shor-summary" className="text-sm text-cyan-300 mb-2">
            N = 15 | Base a = {base}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="w-full bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="text-lg font-bold mb-3">Cuestionario de Algoritmo de Shor</h3>
          <label className="block mb-2 cursor-pointer">
            <input
              type="radio"
              name="quiz"
              value="Reduce la complejidad de factorización"
              onChange={(e) => setSelectedQuiz(e.target.value)}
              className="mr-2"
            />
            Reduce la complejidad de factorización
          </label>
          <button onClick={validateQuiz} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-semibold mt-2">
            Validar Respuesta
          </button>
          {quizValidated && <p className="mt-3 text-emerald-400 font-bold">✅ ¡Correcto!</p>}
        </div>
      )}

      <div className="flex gap-4 mt-6">
        {step === 0 && onBack && (
          <button onClick={onBack} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg">
            ← Anterior
          </button>
        )}
        <button
          onClick={() => setStep(step + 1)}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg font-semibold"
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}
