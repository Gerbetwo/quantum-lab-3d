'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  
  Zap,
  AlertTriangle,
  ThermometerSnowflake,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { playButtonClick, playChimeSuccess, playDecoherenceAlert, playLaserScan } from '@/lib/sound';
import { saveCompletedMission } from '@/lib/cookies';
import { useMissionTitle } from '@/hooks/useMissionTitle';
import { calculateCoherenceTime, isCriticalDecoherence } from '@/domain/quantum/decoherence';
import { useThreeScene } from '@/hooks/useThreeScene';

interface Props {
  onComplete: () => void;
  onBack: () => void;
}

const STEP_TITLES = [
  'La Fragilidad Cuántica',
  'Simulador Térmico Criogénico',
  'El Refrigerador de Dilución',
  'Reto de Comprensión',
] as const;

export default function Mission3Decoherence({ onComplete, onBack }: Props) {
  const [step, setStep] = useState<number>(0);
  const totalSteps = 4;
  const [photonHits, setPhotonHits] = useState<number>(0);
  const [temperatureMilliKelvin, setTemperatureMilliKelvin] = useState<number>(15);
  const isCritical = isCriticalDecoherence(temperatureMilliKelvin);
  const coherenceTimeUs = calculateCoherenceTime(temperatureMilliKelvin);
  const [isCryoShieldActive, setIsCryoShieldActive] = useState<boolean>(false);
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
      if (e.key === 'ArrowRight' && step < totalSteps - 1) goToNextStep();
      else if (e.key === 'ArrowLeft' && step > 0) goToPrevStep();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, totalSteps, goToNextStep, goToPrevStep]);

  useThreeScene(containerRef, {
    width: 600,
    height: 360,
    recreateOn: step === 1 || step === 2 ? 'm3-visible' : 'm3-hidden',
  });

  const handleQuizChoice = (choice: string) => {
    setUserChoice(choice);
    setShowFeedback(true);
    if (choice === 'vibrations_noise') {
      playChimeSuccess();
      saveCompletedMission(2);
    } else {
      playButtonClick();
    }
  };

  useMissionTitle(STEP_TITLES[step] ?? '');

  return (
    <div className="w-full flex-1 mx-auto flex flex-col justify-between py-2 text-slate-100 min-h-[640px]">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30">Tarea 3</span>
          <span className="text-xs font-mono text-slate-400">Paso {step + 1} de {totalSteps}</span>
        </div>
        <div role="tablist" aria-label="Pasos de la misión" className="flex items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <button key={i} onClick={() => { playButtonClick(); setStep(i); }} className={`h-2 rounded-full transition-all ${step === i ? 'w-8 bg-amber-400 shadow-sm shadow-amber-400/50' : i < step ? 'w-3 bg-emerald-500' : 'w-2 bg-slate-800 hover:bg-slate-700'}`} role="tab" aria-label={`Ir al paso ${i + 1}`} aria-selected={step === i} />
          ))}
        </div>
      </div>

      {step === 0 && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-8 py-4 animate-in fade-in zoom-in-95 duration-300">
          <div>
            <h2 className="text-3xl sm:text-5xl font-orbitron font-bold text-white tracking-wide">La Fragilidad Cuántica</h2>
            <div className="text-xs font-mono text-amber-400 uppercase tracking-widest mt-2 flex items-center justify-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-400" /> El Mayor Enemigo Cuántico</div>
            <p className="text-base sm:text-lg text-slate-300 mt-3 max-w-xl mx-auto leading-relaxed">Un qubit en superposición es extremadamente delicado. Cualquier partícula de calor, vibración o radiación ambiental provoca <strong className="text-amber-400">decoherencia</strong>, destruyendo el cálculo.</p>
          </div>
          <div className="p-8 rounded-3xl bg-slate-950/80 border border-slate-800 backdrop-blur-md shadow-2xl flex flex-col items-center gap-6 w-full max-w-md">
            <button onClick={() => { playDecoherenceAlert(); setPhotonHits((prev) => prev + 1); }} className="w-full py-4 px-6 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-300 font-mono text-base"><Zap className="w-6 h-6 inline mr-2 text-amber-400" /> Disparar Fotón Térmico Parásito</button>
            <div className="text-2xl font-orbitron font-bold text-white">Perturbaciones: <span data-testid="photon-counter" className="text-rose-400">{photonHits}</span></div>
          </div>
        </div>
      )}

      {(step === 1 || step === 2) && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-4 py-2 animate-in fade-in zoom-in-95 duration-300">
          <div>
            <div className="text-xs font-mono text-amber-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
              {step === 1 && <ThermometerSnowflake className="w-4 h-4 text-amber-400" />}
              {step === 2 && <Shield className="w-4 h-4 text-amber-400" />}
              {step === 1 && 'Temperatura vs Estabilidad'}
              {step === 2 && 'Aislamiento Extremo'}
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl mx-auto leading-relaxed">
              {step === 1 && 'Mueve el deslizador térmico. Observa cómo al subir la temperatura, el calor bombardea el procesador y destruye el tiempo de coherencia.'}
              {step === 2 && 'Ese icónico &quot;candelabro dorado&quot; contiene etapas concéntricas de enfriamiento criogénico con isótopos de helio al vacío absoluto.'}
            </p>
          </div>
          <div className="w-full max-w-2xl p-4 rounded-3xl bg-[#060a14] border border-slate-800/90 shadow-2xl relative flex flex-col items-center">
            <div ref={containerRef} role="img" aria-label="Refrigerador criogénico" className="w-full" />
            {step === 1 && (
              <div className="w-full max-w-lg mt-2 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
                <input type="range" min="15" max="5000" step="25" value={temperatureMilliKelvin} onChange={(e) => { const val = parseInt(e.target.value); setTemperatureMilliKelvin(val); if (val > 1200) playDecoherenceAlert(); }} className="w-full accent-amber-400 cursor-pointer" />
                <div className="text-xs font-orbitron font-bold">{isCritical ? 'Decoherencia Crítica' : 'Coherente y Estable'}</div>
                <div data-testid="coherence-time">{coherenceTimeUs} μs</div>
              </div>
            )}
            {step === 2 && (
              <div className="w-full max-w-md mt-2 flex flex-col gap-3">
                <button onClick={() => { playLaserScan(); setTimeout(() => playChimeSuccess(), 250); setIsCryoShieldActive(true); setTemperatureMilliKelvin(15); }} className="w-full py-3.5 px-6 rounded-2xl bg-amber-500 text-slate-950 font-orbitron font-bold text-xs uppercase">Activar Bombas Criogénicas</button>
                {isCryoShieldActive && <div data-testid="cryo-active-banner" className="p-3.5 rounded-2xl bg-cyan/10 border border-cyan/40 text-cyan text-xs">Temperatura: 15 mK</div>}
              </div>
            )}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-6 py-4 animate-in fade-in zoom-in-95 duration-300">
          <div>
            <div className="text-xs font-mono text-amber-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-2"><HelpCircle className="w-4 h-4 text-amber-400" /> Comprobación Final</div>
            <p className="text-base sm:text-lg text-slate-200 mt-2 font-semibold max-w-xl mx-auto">¿Por qué los computadores cuánticos basados en superconductores deben operar a temperaturas cercanas al cero absoluto?</p>
          </div>
          <div className="w-full max-w-xl flex flex-col gap-3.5">
            <button onClick={() => handleQuizChoice('vibrations_noise')} className="p-5 rounded-2xl border text-left text-sm bg-slate-950/80 border-slate-800 text-slate-300">B) Para eliminar el calor y las vibraciones atómicas que causan decoherencia</button>
          </div>
          {showFeedback && userChoice === 'vibrations_noise' && (
            <div className="w-full max-w-xl p-4 rounded-2xl text-sm flex items-center justify-between gap-4 text-left bg-emerald-950/30 border border-emerald-500/40 text-emerald-200">
              <span>Exacto! El calor ambiente introduce ruido.</span>
              <button onClick={onComplete} className="py-2.5 px-5 rounded-xl bg-emerald-500 text-slate-950 font-orbitron font-bold text-xs uppercase">Pasar a Tarea 4 <ArrowRight className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between items-center border-t border-slate-800 pt-4 mt-4">
        <button onClick={step === 0 ? onBack : goToPrevStep} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-800 text-slate-400 font-mono text-xs uppercase"><ArrowLeft className="w-4 h-4" /> {step === 0 ? 'Volver a Tarea 2' : 'Paso Anterior'}</button>
        {step < totalSteps - 1 && <button onClick={goToNextStep} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-orbitron font-bold text-xs uppercase">Siguiente Paso <ArrowRight className="w-4 h-4" /></button>}
      </div>
    </div>
  );
}
