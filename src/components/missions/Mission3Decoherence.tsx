/**
 * Mission3Decoherence.tsx — Misión 3: Decoherencia y Entorno Criogénico
 */
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { calculateCoherenceTime } from '@/domain/quantum/decoherence';
import { createCryostatScene } from '@/lib/three/scenes/createCryostatScene';

interface Mission3Props {
  onComplete?: () => void;
  onBack?: () => void;
}

export default function Mission3Decoherence({ onComplete, onBack }: Mission3Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ReturnType<typeof createCryostatScene> | null>(null);
  const [temp, setTemp] = useState<number>(15);
  const [step, setStep] = useState(0);
  const [selectedQuiz, setSelectedQuiz] = useState<string>('');
  const [quizValidated, setQuizValidated] = useState(false);

  const t2 = calculateCoherenceTime(temp);

  useEffect(() => {
    if (containerRef.current) {
      sceneRef.current = createCryostatScene(containerRef.current, temp);
    }
    return () => {
      sceneRef.current?.dispose();
    };
  }, [temp]);

  const handleTempChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setTemp(val);
    sceneRef.current?.updateTemperature(val);
  };

  const validateQuiz = () => {
    if (selectedQuiz.includes('Para minimizar las excitaciones térmicas')) {
      setQuizValidated(true);
      if (onComplete) onComplete();
    }
  };

  return (
    <div className="flex flex-col items-center p-6 w-full max-w-4xl mx-auto text-white">
      <h2 className="text-2xl font-bold mb-4">Misión 3: Decoherencia y Entorno Criogénico</h2>

      {step === 1 && (
        <div className="w-full flex flex-col items-center">
          <h3 className="text-xl font-semibold mb-2">2. Control del Criostato de Dilución</h3>
          <div ref={containerRef} className="w-full h-80 bg-slate-900 rounded-xl overflow-hidden shadow-lg mb-6 border border-slate-700" role="img" aria-label="Escena 3D del Criostato y Qubit central" />
          <div className="w-full bg-slate-800 p-4 rounded-xl border border-slate-700 mb-4">
            <label className="block text-sm font-medium mb-2">Temperatura del Criostato: {temp} mK</label>
            <input
              type="range"
              min="15"
              max="300000"
              value={temp}
              onChange={handleTempChange}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>
          <p className="text-lg font-medium text-cyan-400">Tiempo de Coherencia T₂: {t2} µs</p>
        </div>
      )}

      {step === 3 && (
        <div className="w-full bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h3 className="text-lg font-bold mb-3">Cuestionario de Decoherencia</h3>
          <label className="block mb-2 cursor-pointer">
            <input
              type="radio"
              name="quiz"
              value="Para minimizar las excitaciones térmicas"
              onChange={(e) => setSelectedQuiz(e.target.value)}
              className="mr-2"
            />
            Para minimizar las excitaciones térmicas
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
