'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  KeyRound,
  Award,
} from 'lucide-react';
import { playButtonClick, playChimeSuccess, playLaserScan } from '@/lib/sound';
import { saveCompletedMission, updateStoredMetrics } from '@/lib/cookies';
import { formatShorResult, updateExploredApplications } from '@/domain/quantum/applications';
import { useThreeScene } from '@/hooks/useThreeScene';

interface Props {
  onFinishAll: () => void;
  onBack: () => void;
}

export default function Mission4Applications({ onFinishAll, onBack }: Props) {
  const [step, setStep] = useState<number>(0);
  const totalSteps = 4;

  const [inspectedMyth, setInspectedMyth] = useState<string>('gaming');
  const [isCracking, setIsCracking] = useState<boolean>(false);
  const [crackSpeed, setCrackSpeed] = useState<string>('En espera');

  const [userChoice, setUserChoice] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const goToNextStep = useCallback(() => {
    playButtonClick();
    setStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);

  const goToPrevStep = useCallback(() => {
    playButtonClick();
    setStep((prev) => Math.max(prev - 1, 0));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && step < totalSteps - 1) {
        goToNextStep();
      } else if (e.key === 'ArrowLeft' && step > 0) {
        goToPrevStep();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, totalSteps, goToNextStep, goToPrevStep]);

  useThreeScene(containerRef, {
    width: 600,
    height: 360,
    recreateOn: step === 1 ? 'm4-visible' : 'm4-hidden',
  });

  const handleSimulateShor = () => {
    playLaserScan();
    setIsCracking(true);
    setCrackSpeed('Procesando estados cuánticos en superposición...');

    setTimeout(() => {
      playChimeSuccess();
      setIsCracking(false);
      setCrackSpeed(formatShorResult(0.42));
      updateStoredMetrics((prev) => ({
        ...prev,
        actions: {
          ...prev.actions,
          applicationsExplored: updateExploredApplications(
            prev.actions.applicationsExplored,
            ['molecular_simulation', 'cryptography_shor']
          ),
        },
      }));
    }, 1200);
  };

  const handleQuizChoice = (choice: string) => {
    setUserChoice(choice);
    setShowFeedback(true);
    if (choice === 'molecules_crypto') {
      playChimeSuccess();
      saveCompletedMission(3);
    } else {
      playButtonClick();
    }
  };

  return (
    <div className="w-full flex-1 max-w-5xl mx-auto flex flex-col justify-between py-2 text-slate-100 min-h-[640px]">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30">
            Tarea 4
          </span>
          <span className="text-xs font-mono text-slate-400">
            Paso {step + 1} de {totalSteps}
          </span>
        </div>

        <div role="tablist" aria-label="Pasos de la misión" className="flex items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <button
              key={i}
              onClick={() => {
                playButtonClick();
                setStep(i);
              }}
              className={`h-2 rounded-full transition-all ${
                step === i
                  ? 'w-8 bg-emerald-500 shadow-sm shadow-emerald-500/50'
                  : i < step
                  ? 'w-3 bg-cyan'
                  : 'w-2 bg-slate-800 hover:bg-slate-700'
              }`}
              role="tab"
              aria-label={`Ir al paso ${i + 1}`}
              aria-selected={step === i}
            />
          ))}
        </div>
      </div>

      {step === 0 && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-7 py-4">
          <h2 className="text-3xl sm:text-5xl font-orbitron font-bold text-white tracking-wide">
            Para qué NO sirve un Computador Cuántico
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-3xl text-left">
            <div
              onClick={() => {
                playButtonClick();
                setInspectedMyth('gaming');
              }}
              className="p-6 rounded-3xl border cursor-pointer bg-slate-950/60 border-slate-800"
            >
              <h3 className="font-orbitron font-bold text-white text-base">Videojuegos, Navegar o YouTube</h3>
              {inspectedMyth === 'gaming' && (
                <span className="text-xs font-mono text-rose-400 font-bold block mt-2">
                  Uso Inadecuado
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-4 py-2">
          <div className="w-full max-w-2xl p-4 rounded-3xl bg-[#060a14] border border-slate-800/90 shadow-2xl relative flex flex-col items-center">
            <div ref={containerRef} role="img" aria-label="Modelo molecular" className="w-full" />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-6 py-4">
          <div className="p-8 rounded-3xl bg-slate-950/80 border border-slate-800 backdrop-blur-md shadow-2xl flex flex-col items-center gap-5 w-full max-w-xl">
            <button
              onClick={handleSimulateShor}
              disabled={isCracking}
              className="py-4 px-8 rounded-2xl bg-emerald-500 text-slate-950 font-orbitron font-bold text-xs uppercase"
            >
              <KeyRound className="w-4 h-4 inline mr-2" /> Probar Algoritmo de Shor Cuántico
            </button>

            <div data-testid="shor-status" className="text-emerald-400 font-bold font-mono text-xs">
              {crackSpeed}
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-6 py-4">
          <div className="w-full max-w-xl flex flex-col gap-3.5">
            <button
              onClick={() => handleQuizChoice('molecules_crypto')}
              className="p-5 rounded-2xl border text-left text-sm bg-slate-950/80 border-slate-800 text-slate-300"
            >
              B) Simular moléculas complejas y factorizar números primos para criptografía
            </button>
          </div>

          {showFeedback && userChoice === 'molecules_crypto' && (
            <div className="w-full max-w-xl p-4 rounded-2xl text-sm flex items-center justify-between gap-4 text-left bg-emerald-950/30 border border-emerald-500/40 text-emerald-200">
              <span>Excelente deducción! La computación cuántica no sustituye tareas ordinarias.</span>
              <button
                onClick={onFinishAll}
                className="py-3 px-6 rounded-xl bg-emerald-500 text-slate-950 font-orbitron font-bold text-xs uppercase flex items-center gap-2 shrink-0"
              >
                <Award className="w-4 h-4" /> Finalizar Laboratorio
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between items-center border-t border-slate-800 pt-4 mt-4">
        <button
          onClick={step === 0 ? onBack : goToPrevStep}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-800 text-slate-400 font-mono text-xs uppercase"
        >
          <ArrowLeft className="w-4 h-4" /> {step === 0 ? 'Volver a Tarea 3' : 'Paso Anterior'}
        </button>

        {step < totalSteps - 1 && (
          <button
            onClick={goToNextStep}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-orbitron font-bold text-xs uppercase"
          >
            Siguiente Paso <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
