/**
 * Mission2Entanglement.tsx — Misión 2: Entrelazamiento Cuántico
 */
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { measureEntangledQubit, EntanglementState } from '@/domain/quantum/entanglement';
import { createEntanglementScene } from '@/lib/three/scenes/createEntanglementScene';

interface Mission2Props {
  onComplete?: () => void;
  onBack?: () => void;
  __testRandom?: () => number;
}

export default function Mission2Entanglement({ onComplete, onBack, __testRandom }: Mission2Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ReturnType<typeof createEntanglementScene> | null>(null);
  const [step, setStep] = useState(0);
  const [state, setState] = useState<EntanglementState>({
    aliceOutcome: null,
    bobOutcome: null,
    correlated: false,
    explanation: 'Pulsa "Medir Qubit de Alice" para observar el colapso y la correlación instantánea no-local.'
  });
  const [selectedQuiz, setSelectedQuiz] = useState<string>('');
  const [quizValidated, setQuizValidated] = useState(false);

  useEffect(() => {
    if (containerRef.current) {
      sceneRef.current = createEntanglementScene(containerRef.current);
    }
    return () => {
      sceneRef.current?.dispose();
    };
  }, []);

  const handleMeasure = () => {
    const forced = __testRandom ? (__testRandom() < 0.5 ? 0 : 1) : undefined;
    const res = measureEntangledQubit(forced, __testRandom);
    setState(res);
    sceneRef.current?.updateState(true, res.aliceOutcome);
  };

  const validateQuiz = () => {
    if (selectedQuiz.includes('100% de correlación instantánea')) {
      setQuizValidated(true);
      if (onComplete) onComplete();
    }
  };

  return (
    <div className="flex flex-col items-center p-6 w-full max-w-4xl mx-auto text-white">
      <h2 className="text-2xl font-bold mb-4">Misión 2: Entrelazamiento Cuántico (Par de Bell)</h2>
      
      {step === 0 && (
        <div className="w-full flex flex-col items-center">
          <p className="text-center mb-4 text-slate-300">Introducción al Entrelazamiento Cuántico y los Estados de Bell.</p>
        </div>
      )}

      {step === 1 && (
        <div className="w-full flex flex-col items-center">
          <h3 className="text-xl font-semibold mb-2">2. Estación Alice (Tierra)</h3>
          <div ref={containerRef} className="w-full h-80 bg-slate-900 rounded-xl overflow-hidden shadow-lg mb-6 border border-slate-700" role="img" aria-label="Escena 3D de Entrelazamiento de Alice y Bob" />
          <button onClick={handleMeasure} className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-semibold transition mb-4">
            📡 Medir Qubit de Alice
          </button>
          {state.aliceOutcome !== null && (
            <p className="text-md text-emerald-400 mb-2">Alice midió: {state.aliceOutcome}</p>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="w-full flex flex-col items-center">
          <h3 className="text-xl font-semibold mb-2">3. Estación Bob (Andrómeda)</h3>
          <p className="text-slate-300 mb-4">Bob observa la correlación instantánea del par entrelazado.</p>
        </div>
      )}

      {step === 3 && (
        <div className="w-full bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="text-lg font-bold mb-3">Cuestionario de Entrelazamiento</h3>
          <label className="block mb-2 cursor-pointer">
            <input
              type="radio"
              name="quiz"
              value="100% de correlación instantánea"
              onChange={(e) => setSelectedQuiz(e.target.value)}
              className="mr-2"
            />
            100% de correlación instantánea
          </label>
          <label className="block mb-4 cursor-pointer">
            <input
              type="radio"
              name="quiz"
              value="Independencia total"
              onChange={(e) => setSelectedQuiz(e.target.value)}
              className="mr-2"
            />
            Independencia total
          </label>
          <button onClick={validateQuiz} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-semibold">
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
