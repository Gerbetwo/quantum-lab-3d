'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { playButtonClick, playChimeSuccess, playLaserScan, playQuantumCollapse } from '@/lib/sound';
import { saveCompletedMission, updateStoredMetrics } from '@/lib/cookies';
import { correlateEntangledMeasurement } from '@/domain/quantum/entanglement';
import { measureQubit } from '@/domain/quantum/measurement';
import { useThreeScene } from '@/hooks/useThreeScene';

interface Props {
  onComplete: () => void;
  onBack: () => void;
  __testRandom?: () => number;
}

export default function Mission2Entanglement({ onComplete, onBack, __testRandom }: Props) {
  const [step, setStep] = useState<number>(0);
  const totalSteps = 5;

  const [aliceIndependentVal, setAliceIndependentVal] = useState<number>(0);
  const [bobIndependentVal, setBobIndependentVal] = useState<number>(0);

  const [aliceMeasured, setAliceMeasured] = useState<number | null>(null);
  const [bobMeasured, setBobMeasured] = useState<number | null>(null);
  const [hasTriggeredMeasurement, setHasTriggeredMeasurement] = useState<boolean>(false);

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
    recreateOn: step >= 1 && step <= 3 ? 'm2-visible' : 'm2-hidden',
  });

  const handleMeasureAlice = () => {
    playLaserScan();
    setTimeout(() => playQuantumCollapse(), 150);

    const rng = __testRandom ?? Math.random;
    const outcome = measureQubit(Math.PI / 2, rng);
    const correlated = correlateEntangledMeasurement(outcome);

    setAliceMeasured(correlated.alice);
    setBobMeasured(correlated.bob);
    setHasTriggeredMeasurement(true);

    updateStoredMetrics((prev) => ({
      ...prev,
      actions: {
        ...prev.actions,
        entanglementMeasurements: prev.actions.entanglementMeasurements + 1,
      },
    }));
  };

  const handleQuizChoice = (choice: string) => {
    setUserChoice(choice);
    setShowFeedback(true);
    if (choice === 'instant_same') {
      playChimeSuccess();
      saveCompletedMission(1);
    } else {
      playButtonClick();
    }
  };

  return (
    <div className="w-full flex-1 max-w-5xl mx-auto flex flex-col justify-between py-2 text-slate-100 min-h-[640px]">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400 px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/30">
            Tarea 2
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
                  ? 'w-8 bg-purple-500 shadow-sm shadow-purple-500/50'
                  : i < step
                  ? 'w-3 bg-emerald-500'
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
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-8 py-4">
          <h2 className="text-3xl sm:text-5xl font-orbitron font-bold text-white tracking-wide">
            Dos Qubits Independientes
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
            <div className="p-6 rounded-3xl bg-slate-950/80 border border-cyan/40 backdrop-blur-md shadow-xl flex flex-col items-center gap-4">
              <div className="text-4xl font-orbitron font-bold text-white">
                |{aliceIndependentVal}⟩
              </div>
              <button
                onClick={() => {
                  playButtonClick();
                  setAliceIndependentVal((prev) => (prev === 0 ? 1 : 0));
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan/15 border border-cyan/40 text-cyan text-xs font-mono font-semibold"
              >
                Conmutar Alice (0 ↔ 1)
              </button>
            </div>

            <div className="p-6 rounded-3xl bg-slate-950/80 border border-emerald-500/40 backdrop-blur-md shadow-xl flex flex-col items-center gap-4">
              <div className="text-4xl font-orbitron font-bold text-white">
                |{bobIndependentVal}⟩
              </div>
              <button
                onClick={() => {
                  playButtonClick();
                  setBobIndependentVal((prev) => (prev === 0 ? 1 : 0));
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-semibold"
              >
                Conmutar Bob (0 ↔ 1)
              </button>
            </div>
          </div>
        </div>
      )}

      {(step === 1 || step === 2 || step === 3) && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-5 py-2">
          <div className="w-full max-w-2xl p-4 rounded-3xl bg-[#060a14] border border-slate-800/90 shadow-2xl relative flex flex-col items-center">
            <div ref={containerRef} role="img" aria-label="Estaciones Alice y Bob entrelazadas" className="w-full" />

            {step === 3 && (
              <div className="w-full max-w-md mt-2 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-cyan/10 border border-cyan/40 text-center">
                    <div data-testid="alice-state" className="text-2xl font-orbitron font-bold text-cyan mt-1">
                      {aliceMeasured !== null ? `|${aliceMeasured}⟩` : 'Superposición'}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-center">
                    <div data-testid="bob-state" className="text-2xl font-orbitron font-bold text-emerald-400 mt-1">
                      {bobMeasured !== null ? `|${bobMeasured}⟩` : 'Superposición'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleMeasureAlice}
                  className="w-full py-3.5 px-4 rounded-2xl bg-purple-600 text-white font-orbitron font-bold text-xs uppercase"
                >
                  <Zap className="w-4 h-4 inline mr-2" /> Medir en Laboratorio de Alice
                </button>

                {hasTriggeredMeasurement && (
                  <div data-testid="correlation-result" className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-200 text-xs text-left">
                    ¡Correlación Perfecta Instantánea!
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-6 py-4">
          <div className="w-full max-w-xl flex flex-col gap-3.5">
            <button
              onClick={() => handleQuizChoice('instant_same')}
              className="p-5 rounded-2xl border text-left text-sm bg-slate-950/80 border-slate-800 text-slate-300"
            >
              B) Instantáneamente el estado correlacionado (|1⟩), sin retardo de tiempo
            </button>
          </div>

          {showFeedback && userChoice === 'instant_same' && (
            <div className="w-full max-w-xl p-4 rounded-2xl text-sm flex items-center justify-between gap-4 text-left bg-emerald-950/30 border border-emerald-500/40 text-emerald-200">
              <span>¡Correcto! En un estado entrelazado, la medición fija el estado.</span>
              <button
                onClick={onComplete}
                className="py-2.5 px-5 rounded-xl bg-emerald-500 text-slate-950 font-orbitron font-bold text-xs uppercase"
              >
                Pasar a Tarea 3 <ArrowRight className="w-4 h-4" />
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
          <ArrowLeft className="w-4 h-4" /> {step === 0 ? 'Volver a Tarea 1' : 'Paso Anterior'}
        </button>

        {step < totalSteps - 1 && (
          <button
            onClick={goToNextStep}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 text-white font-orbitron font-bold text-xs uppercase"
          >
            Siguiente Paso <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
