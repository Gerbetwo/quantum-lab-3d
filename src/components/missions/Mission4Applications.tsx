'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  KeyRound,
  Award,
  Cpu,
  FlaskConical,
  ShieldCheck,
  Lock,
  HelpCircle,
} from 'lucide-react';
import { playButtonClick, playChimeSuccess, playLaserScan } from '@/lib/sound';
import { saveCompletedMission, updateStoredMetrics } from '@/lib/cookies';
import { useMissionTitle } from '@/hooks/useMissionTitle';
import { formatShorResult, updateExploredApplications } from '@/domain/quantum/applications';
import { useThreeScene } from '@/hooks/useThreeScene';

interface Props {
  onFinishAll: () => void;
  onBack: () => void;
}

const STEP_TITLES = [
  '¿Para qué NO sirve un Computador Cuántico?',
  'Simulación Molecular y Química',
  'Criptografía y Algoritmo de Shor',
  'Reto de Comprensión',
] as const;

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
      if (e.key === 'ArrowRight' && step < totalSteps - 1) goToNextStep();
      else if (e.key === 'ArrowLeft' && step > 0) goToPrevStep();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, totalSteps, goToNextStep, goToPrevStep]);

  useThreeScene(containerRef, { width: 600, height: 360, recreateOn: step === 1 ? 'm4-visible' : 'm4-hidden' });

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
          applicationsExplored: updateExploredApplications(prev.actions.applicationsExplored, ['molecular_simulation', 'cryptography_shor']),
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

  useMissionTitle(STEP_TITLES[step] ?? '');

  return (
    <div className="w-full flex-1 mx-auto flex flex-col justify-between py-2 text-slate-100 min-h-[640px]">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30">Tarea 4</span>
          <span className="text-xs font-mono text-slate-400">Paso {step + 1} de {totalSteps}</span>
        </div>
        <div role="tablist" aria-label="Pasos de la misión" className="flex items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <button key={i} onClick={() => { playButtonClick(); setStep(i); }} className={`h-2 rounded-full transition-all ${step === i ? 'w-8 bg-emerald-500 shadow-sm shadow-emerald-500/50' : i < step ? 'w-3 bg-cyan' : 'w-2 bg-slate-800 hover:bg-slate-700'}`} role="tab" aria-label={`Ir al paso ${i + 1}`} aria-selected={step === i} />
          ))}
        </div>
      </div>

      {step === 0 && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-7 py-4 animate-in fade-in zoom-in-95 duration-300">
          <div>
            <h2 className="text-3xl sm:text-5xl font-orbitron font-bold text-white tracking-wide">Para qué NO sirve un Computador Cuántico</h2>
            <div className="text-xs font-mono text-emerald-400 uppercase tracking-widest mt-2 mb-2 flex items-center justify-center gap-2"><Cpu className="w-4 h-4 text-emerald-400" /> Desmitificando la Tecnología</div>
            <p className="text-base sm:text-lg text-slate-300 mt-3 max-w-xl mx-auto leading-relaxed">Existe la creencia popular de que un procesador cuántico es simplemente &quot;un ordenador normal pero mil veces más rápido&quot;. <strong className="text-rose-400">Esto es falso</strong>.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-3xl text-left">
            <div onClick={() => { playButtonClick(); setInspectedMyth('gaming'); }} className="p-6 rounded-3xl border cursor-pointer bg-slate-950/60 border-slate-800">
              <h3 className="font-orbitron font-bold text-white text-base">Videojuegos, Navegar o YouTube</h3>
              {inspectedMyth === 'gaming' && <span className="text-xs font-mono text-rose-400 font-bold block mt-2">Uso Inadecuado</span>}
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-4 py-2 animate-in fade-in zoom-in-95 duration-300">
          <div>
            <div className="text-xs font-mono text-emerald-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-2"><FlaskConical className="w-4 h-4 text-emerald-400" /> El Santo Grial</div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl mx-auto leading-relaxed">La naturaleza no es clásica: está hecha de partículas cuánticas. Para modelar un medicamento o catalizador, necesitas un ordenador que hable el mismo lenguaje.</p>
          </div>
          <div className="w-full max-w-2xl p-4 rounded-3xl bg-[#060a14] border border-slate-800/90 shadow-2xl relative flex flex-col items-center"><div ref={containerRef} role="img" aria-label="Modelo molecular" className="w-full" /></div>
        </div>
      )}

      {step === 2 && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-6 py-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="p-8 rounded-3xl bg-slate-950/80 border border-slate-800 backdrop-blur-md shadow-2xl flex flex-col items-center gap-5 w-full max-w-xl">
            <div>
              <div className="text-xs font-mono text-emerald-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Seguridad Informática</div>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl mx-auto leading-relaxed">Toda la seguridad de internet (banca, contraseñas, comercio electrónico RSA) depende de que es casi imposible factorizar números primos gigantes.</p>
            </div>
            <div className="p-8 rounded-3xl bg-slate-950/80 border border-slate-800/90 backdrop-blur-md shadow-2xl flex flex-col items-center gap-5 w-full max-w-xl">
              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-2 text-slate-300"><Lock className="w-4 h-4 text-amber-400" /><span>Clave RSA-2048 (617 dígitos)</span></div>
              </div>
              <button onClick={handleSimulateShor} disabled={isCracking} className="py-4 px-8 rounded-2xl bg-emerald-500 text-slate-950 font-orbitron font-bold text-xs uppercase"><KeyRound className="w-4 h-4 inline mr-2" /> Probar Algoritmo de Shor Cuántico</button>
              <div data-testid="shor-status" className="text-emerald-400 font-bold font-mono text-xs">{crackSpeed}</div>
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-6 py-4 animate-in fade-in zoom-in-95 duration-300">
          <div>
            <div className="text-xs font-mono text-emerald-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-2"><HelpCircle className="w-4 h-4 text-emerald-400" /> Evaluación Final</div>
            <p className="text-base sm:text-lg text-slate-200 mt-2 font-semibold max-w-xl mx-auto">¿En cuál de estos campos ofrece la computación cuántica una verdadera ventaja exponencial frente a los computadores clásicos?</p>
          </div>
          <div className="w-full max-w-xl flex flex-col gap-3.5"><button onClick={() => handleQuizChoice('molecules_crypto')} className="p-5 rounded-2xl border text-left text-sm bg-slate-950/80 border-slate-800 text-slate-300">B) Simular moléculas complejas y factorizar números primos para criptografía</button></div>
          {showFeedback && userChoice === 'molecules_crypto' && (
            <div className="w-full max-w-xl p-4 rounded-2xl text-sm flex items-center justify-between gap-4 text-left bg-emerald-950/30 border border-emerald-500/40 text-emerald-200">
              <span>Excelente deducción! La computación cuántica no sustituye tareas ordinarias.</span>
              <button onClick={onFinishAll} className="py-3 px-6 rounded-xl bg-emerald-500 text-slate-950 font-orbitron font-bold text-xs uppercase flex items-center gap-2 shrink-0"><Award className="w-4 h-4" /> Finalizar Laboratorio</button>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between items-center border-t border-slate-800 pt-4 mt-4">
        <button onClick={step === 0 ? onBack : goToPrevStep} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-800 text-slate-400 font-mono text-xs uppercase"><ArrowLeft className="w-4 h-4" /> {step === 0 ? 'Volver a Tarea 3' : 'Paso Anterior'}</button>
        {step < totalSteps - 1 && <button onClick={goToNextStep} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-orbitron font-bold text-xs uppercase">Siguiente Paso <ArrowRight className="w-4 h-4" /></button>}
      </div>
    </div>
  );
}
