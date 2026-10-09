'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, ArrowRight, CheckCircle2, HelpCircle, Search, Zap } from 'lucide-react';
import clsx from 'clsx';
import { playButtonClick, playChimeSuccess, playLaserScan } from '@/shared/lib/sound';
import { saveCompletedMission, updateStoredMetrics } from '@/features/session/lib/cookies';
import { useMissionTitle } from '@/features/missions/hooks/useMissionTitle';
import {
  groverIterations,
  classicalExpectedTrials,
  uniformAmplitudes,
  simulateGroverStep,
  measureAmplitude,
} from '@/core/quantum/grover';
import { useThreeScene } from '@/features/quantum-3d/hooks/useThreeScene';
import { createOrbitControls } from '@/features/quantum-3d/hooks/useOrbitControls';
import { prefersReducedMotion, cached } from '@/features/quantum-3d/lib/createScene';

interface Props {
  onComplete: () => void;
  onBack: () => void;
}

const STEP_TITLES = [
  'Algoritmo de Grover',
  'Clásico vs Cuántico',
  'Iteración Única (N=4)',
  'Escalando el Algoritmo',
  'Comprobación',
] as const;

export default function Mission6Grover({ onComplete, onBack }: Props) {
  const totalSteps = 5;
  const [step, setStep] = useState(0);
  const [N, setN] = useState(4);
  const [markedIndex, setMarkedIndex] = useState(() => Math.floor(Math.random() * 4));
  const [amplitudes, setAmplitudes] = useState<number[]>(() => uniformAmplitudes(4));
  const [iterations, setIterations] = useState(0);
  const [measurement, setMeasurement] = useState<number | null>(null);
  const [userChoice, setUserChoice] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const ampsRef = useRef<number[]>(amplitudes);
  const markedRef = useRef(markedIndex);
  const nRef = useRef(N);
  const dirtyRef = useRef(true);
  const barsRef = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    ampsRef.current = amplitudes;
    markedRef.current = markedIndex;
    nRef.current = N;
    dirtyRef.current = true;
  }, [amplitudes, markedIndex, N]);

  useEffect(() => {
    setAmplitudes(uniformAmplitudes(N));
    setMarkedIndex(Math.floor(Math.random() * N));
    setIterations(0);
    setMeasurement(null);
  }, [N]);

  const goNext = useCallback(() => { playButtonClick(); setStep((s) => Math.min(s + 1, totalSteps - 1)); }, []);
  const goPrev = useCallback(() => { playButtonClick(); setStep((s) => Math.max(s - 1, 0)); }, []);
  const goTo = useCallback((n: number) => { playButtonClick(); setStep(n); }, []);

  useThreeScene(containerRef, {
    width: 600,
    height: 360,
    viewportRelative: true,
    aspect: 16 / 10,
    cameraPos: [0, 1.6, 5.2],
    cameraLookAt: [0, 0.9, 0],
    recreateOn: step >= 1 && step <= 3 ? 'm6-visible' : 'm6-hidden',
    onSetup: (handle) => {
      const barsGroup = new THREE.Group();
      const geo = cached('m6:bar', () => new THREE.BoxGeometry(0.18, 1, 0.18));
      const bars: THREE.Mesh[] = [];
      for (let i = 0; i < 16; i++) {
        const mat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.85 });
        const bar = new THREE.Mesh(geo, mat);
        bar.position.x = (i - 7.5) * 0.28;
        bar.position.y = 0;
        bars.push(bar);
        barsGroup.add(bar);
      }
      barsRef.current = bars;
      handle.add(barsGroup);

      const gridGeo = cached('m6:grid', () => new THREE.BoxGeometry(5, 0.02, 1.2));
      const gridMat = new THREE.MeshBasicMaterial({ color: 0x334155, wireframe: true });
      handle.add(new THREE.Mesh(gridGeo, gridMat));

      const controls = createOrbitControls(handle.camera, handle.renderer.domElement, {
        enablePan: false,
        enableZoom: true,
        enableRotate: true,
        minDistance: 3.5,
        maxDistance: 12.0,
        autoRotate: !prefersReducedMotion(),
        autoRotateSpeed: 0.3,
        enableDamping: true,
        dampingFactor: 0.12,
        target: [0, 0.9, 0],
      });

      handle.onFrame((_t, dt) => {
        controls.update(dt);
        if (!dirtyRef.current) return;
        const amps = ampsRef.current;
        const marked = markedRef.current;
        const n = nRef.current;
        const maxAmp = Math.max(0.01, ...amps.map(Math.abs));
        for (let i = 0; i < 16; i++) {
          const bar = bars[i];
          if (!bar) continue;
          if (i >= n) { bar.visible = false; continue; }
          bar.visible = true;
          const amp = amps[i] ?? 0;
          const h = Math.max(0.05, (Math.abs(amp) / maxAmp) * 2.0);
          bar.scale.y = h;
          bar.position.y = h / 2;
          const mat = bar.material as THREE.MeshBasicMaterial;
          mat.color.setHex(amp < 0 ? 0xa855f7 : i === marked ? 0xf43f5e : 0x00f0ff);
        }
        dirtyRef.current = false;
      });

      return () => {
        controls.dispose();
        barsRef.current = [];
      };
    },
  });

  const runOneIteration = () => {
    playLaserScan();
    setAmplitudes((a) => simulateGroverStep(a, markedIndex));
    setIterations((i) => i + 1);
    updateStoredMetrics((prev) => ({
      ...prev,
      actions: {
        ...prev.actions,
        applicationsExplored: Array.from(new Set([...prev.actions.applicationsExplored, 'grover'])),
      },
    }));
  };

  const runFullAlgorithm = () => {
    playLaserScan();
    const target = groverIterations(N);
    let amps = uniformAmplitudes(N);
    for (let i = 0; i < target; i++) amps = simulateGroverStep(amps, markedIndex);
    setAmplitudes(amps);
    setIterations(target);
  };

  const doMeasurement = () => {
    playChimeSuccess();
    setMeasurement(measureAmplitude(amplitudes));
  };

  const reset = () => {
    playButtonClick();
    setAmplitudes(uniformAmplitudes(N));
    setIterations(0);
    setMeasurement(null);
  };

  const handleQuizChoice = (choice: string) => {
    setUserChoice(choice);
    setShowFeedback(true);
    if (choice === 'amplitude_amplification') {
      playChimeSuccess();
      saveCompletedMission(5);
    } else {
      playButtonClick();
    }
  };

  const optimalIterations = groverIterations(N);
  const classicalCost = classicalExpectedTrials(N);

  useMissionTitle(STEP_TITLES[step] ?? '');

  return (
    <div className="w-full flex-1 mx-auto flex flex-col justify-between py-2 text-slate-100 min-h-[640px]">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-teal-400 px-2.5 py-1 rounded-md bg-teal-500/10 border border-teal-500/30">
            Tarea 6
          </span>
          <span className="text-xs font-mono text-slate-400">Paso {step + 1} de {totalSteps}</span>
        </div>
        <div role="tablist" aria-label="Pasos de la mision" className="flex items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              role="tab"
              aria-label={'Ir al paso ' + (i + 1)}
              aria-selected={step === i}
              className={clsx(
                'h-2 rounded-full transition-all',
                step === i ? 'w-8 bg-teal-400 shadow-sm shadow-teal-400/50'
                  : i < step ? 'w-3 bg-emerald-500'
                  : 'w-2 bg-slate-800 hover:bg-slate-700'
              )}
            />
          ))}
        </div>
      </div>

      {step === 0 && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-7 py-4 animate-in fade-in zoom-in-95 duration-300">
          <div data-testid="mission6-intro">
            <div className="text-xs font-mono text-teal-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
              <Search className="w-4 h-4 text-teal-400" /> Busqueda Cuantica
            </div>
            <p className="text-base sm:text-lg text-slate-300 mt-3 max-w-xl mx-auto leading-relaxed">
              Buscar en una lista desordenada de N items requiere hasta N intentos clasicos.
              Grover lo logra en aproximadamente sqrt(N) iteraciones cuanticas.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full  text-left">
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-teal-500/40">
              <div className="font-orbitron font-bold text-teal-400 text-lg mb-1">Oracle</div>
              <p className="text-xs text-slate-300">Marca internamente el elemento buscado sin revelarlo.</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-cyan/40">
              <div className="font-orbitron font-bold text-cyan text-lg mb-1">Diffusion</div>
              <p className="text-xs text-slate-300">Refleja las amplitudes alrededor de su media, amplificando el marcado.</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-purple-500/40">
              <div className="font-orbitron font-bold text-purple-400 text-lg mb-1">sqrt(N)</div>
              <p className="text-xs text-slate-300">Convergencia cuadratica: para 1 millon de items, solo ~1000 iteraciones.</p>
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-6 py-4 animate-in fade-in zoom-in-95 duration-300">
          <div>
            <div className="text-xs font-mono text-teal-400 uppercase tracking-widest mb-2">Comparacion de Costos</div>
          </div>
          <div className="w-full  grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="text-xs font-mono text-slate-400 mb-1">Supercomputador Clasico</div>
              <div className="text-3xl font-orbitron font-bold text-rose-400">N / 2</div>
              <div data-testid="grover-classical-cost" className="text-sm text-slate-300 mt-2">
                Para N={N}: {classicalCost} intentos promedio
              </div>
            </div>
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-teal-500/40">
              <div className="text-xs font-mono text-teal-400 mb-1">Algoritmo de Grover</div>
              <div className="text-3xl font-orbitron font-bold text-teal-400">sqrt(N)</div>
              <div className="text-sm text-slate-300 mt-2">
                Para N={N}: {optimalIterations} iteraciones
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Para N={N}, Grover requiere {optimalIterations} iteraciones mientras un clasico necesita {classicalCost}. Ventaja cuadratica.
          </p>
        </div>
      )}

      {(step === 2 || step === 3) && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-4 py-2 animate-in fade-in zoom-in-95 duration-300">
          <div>
            <div className="text-xs font-mono text-teal-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
              {step === 2 ? <><Zap className="w-4 h-4 text-teal-400" /> Amplificacion de Amplitud</> : <><Search className="w-4 h-4 text-teal-400" /> Algoritmo Completo</>}
            </div>
          </div>
          <div className="w-full  p-4 rounded-3xl bg-[#060a14] border border-slate-800/90 shadow-2xl flex flex-col items-center">
            <div
              ref={containerRef}
              role="img"
              aria-label="Barras de amplitud cuantica interactivas"
              className="w-full cursor-grab active:cursor-grabbing touch-none select-none my-1"
            />
            {step === 2 && (
              <div className="w-full max-w-lg mt-2 flex flex-col gap-3">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs font-mono">
                  <span className="text-slate-400">Iteraciones ejecutadas:</span>
                  <span data-testid="grover-iterations" className="text-teal-400 font-bold text-sm">{iterations}</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={runOneIteration}
                    className="flex-1 py-3 rounded-2xl bg-teal-400 text-slate-950 font-orbitron font-bold text-xs uppercase tracking-wider hover:bg-teal-300 transition-all shadow-md shadow-teal-400/20"
                  >
                    Ejecutar una iteracion
                  </button>
                  <button
                    onClick={reset}
                    className="py-3 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono border border-slate-800"
                  >
                    Reiniciar
                  </button>
                </div>
              </div>
            )}
            {step === 3 && (
              <div className="w-full max-w-lg mt-2 flex flex-col gap-3">
                <div className="flex gap-2">
                  {[4, 8, 16].map((n) => (
                    <button
                      key={n}
                      onClick={() => { playButtonClick(); setN(n); }}
                      className={clsx(
                        'flex-1 py-2 rounded-xl text-xs font-orbitron font-bold border',
                        N === n ? 'bg-teal-400 text-slate-950 border-teal-400'
                          : 'bg-slate-900 text-slate-300 border-slate-800'
                      )}
                    >
                      N = {n}
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs font-mono">
                  <span className="text-slate-400">Iteraciones ejecutadas:</span>
                  <span data-testid="grover-iterations" className="text-teal-400 font-bold text-sm">
                    {iterations} / {optimalIterations}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={runFullAlgorithm}
                    className="flex-1 py-3 rounded-2xl bg-teal-400 text-slate-950 font-orbitron font-bold text-xs uppercase tracking-wider hover:bg-teal-300 transition-all shadow-md shadow-teal-400/20"
                  >
                    Ejecutar algoritmo completo
                  </button>
                  <button
                    onClick={doMeasurement}
                    className="py-3 px-5 rounded-2xl bg-purple-600 text-white font-orbitron font-bold text-xs uppercase tracking-wider hover:bg-purple-500 transition-all"
                  >
                    Medir
                  </button>
                  <button
                    onClick={reset}
                    className="py-3 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono border border-slate-800"
                  >
                    Reiniciar
                  </button>
                </div>
                {measurement !== null && (
                  <div
                    data-testid="grover-measurement"
                    className="p-3 rounded-2xl bg-teal-950/40 border border-teal-500/50 text-teal-200 text-xs text-left"
                  >
                    <strong className="text-white block mb-1">Indice medido: {measurement}</strong>
                    {measurement === markedIndex
                      ? 'Acierto: Grover encontro el elemento marcado.'
                      : 'Fallo: ajusta el numero de iteraciones para mayor precision.'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-6 py-4 animate-in fade-in zoom-in-95 duration-300">
          <div>
            <div className="text-xs font-mono text-teal-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
              <HelpCircle className="w-4 h-4 text-teal-400" /> Reto Final
            </div>
            <p className="text-base sm:text-lg text-slate-200 mt-2 font-semibold max-w-xl mx-auto">
              Por que funciona el algoritmo de Grover?
            </p>
          </div>
          <div className="w-full max-w-xl flex flex-col gap-3.5">
            <button
              onClick={() => handleQuizChoice('brute_force')}
              className={clsx(
                'p-5 rounded-2xl border text-left text-sm transition-all',
                userChoice === 'brute_force' ? 'bg-rose-950/40 border-rose-500 text-rose-200'
                  : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
              )}
            >
              A) Prueba todas las entradas una por una a velocidad cuantica
            </button>
            <button
              onClick={() => handleQuizChoice('amplitude_amplification')}
              className={clsx(
                'p-5 rounded-2xl border text-left text-sm transition-all',
                userChoice === 'amplitude_amplification' ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-semibold shadow-xl shadow-emerald-500/20 ring-2 ring-emerald-500/40'
                  : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
              )}
            >
              B) El oracle y la difusion amplifican la amplitud del elemento marcado
            </button>
            <button
              onClick={() => handleQuizChoice('parallel')}
              className={clsx(
                'p-5 rounded-2xl border text-left text-sm transition-all',
                userChoice === 'parallel' ? 'bg-rose-950/40 border-rose-500 text-rose-200'
                  : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
              )}
            >
              C) Ejecuta N busquedas en paralelo dentro del mismo qubit
            </button>
          </div>
          {showFeedback && (
            <div
              className={clsx(
                'w-full max-w-xl p-4 rounded-2xl text-sm flex items-center justify-between gap-4 text-left',
                userChoice === 'amplitude_amplification' ? 'bg-emerald-950/30 border border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/30 border border-rose-500/40 text-rose-200'
              )}
            >
              <div className="flex items-center gap-3">
                {userChoice === 'amplitude_amplification' ? <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" /> : <HelpCircle className="w-6 h-6 text-rose-400 shrink-0" />}
                <span>
                  {userChoice === 'amplitude_amplification'
                    ? 'Correcto. Cada iteracion amplifica la amplitud del elemento marcado hasta que domina y se puede medir con alta confianza.'
                    : 'Pista: en el simulador las barras se redistribuyen. El elemento marcado gana amplitud progresivamente.'}
                </span>
              </div>
              {userChoice === 'amplitude_amplification' && (
                <button
                  onClick={onComplete}
                  className="py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-orbitron font-bold text-xs uppercase tracking-wider flex items-center gap-2 shrink-0 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
                >
                  Finalizar Entrenamiento <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between items-center border-t border-slate-800 pt-4 mt-4">
        <button
          onClick={step === 0 ? onBack : goPrev}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition-all font-mono text-xs uppercase"
        >
          <ArrowLeft className="w-4 h-4" /> {step === 0 ? 'Volver a Tarea 5' : 'Paso Anterior'}
        </button>
        {step < totalSteps - 1 && (
          <button
            onClick={goNext}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-400 text-slate-950 hover:bg-teal-300 transition-all font-orbitron font-bold text-xs uppercase tracking-wider shadow-md shadow-teal-400/20 active:scale-95"
          >
            Siguiente Paso <ArrowRight className="w-4 h-4" />
          </button>
        )}
        {step === totalSteps - 1 && userChoice !== 'amplitude_amplification' && (
          <span className="text-xs font-mono text-slate-400">Responde arriba para finalizar</span>
        )}
      </div>
    </div>
  );
}
