'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Layers,
  Activity,
  Compass,
  Atom,
  Coins,
  Scan,
} from 'lucide-react';
import {
  playButtonClick,
  playChimeSuccess,
  playLaserScan,
  playQuantumCollapse,
} from '@/lib/sound';
import { saveCompletedMission, updateStoredMetrics } from '@/lib/cookies';
import { useMissionTitle } from '@/hooks/useMissionTitle';
import { calculateBlochProbabilities } from '@/domain/quantum/bloch';
import { measureQubit } from '@/domain/quantum/measurement';
import { useThreeScene } from '@/hooks/useThreeScene';

interface Props {
  onComplete: () => void;
}

// Cache de Texturas/Materiales de Sprites para evitar fugas de memoria VRAM
const spriteMaterialCache = new Map<string, THREE.SpriteMaterial>();

function _createTextSprite(text: string, color = '#ffffff', fontSize = 28): THREE.Sprite {
  const cacheKey = `${text}_${color}_${fontSize}`;
  let material = spriteMaterialCache.get(cacheKey);

  if (!material) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = color;
      ctx.font = `Bold ${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 128, 64);
    }
    const texture = new THREE.CanvasTexture(canvas);
    material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    spriteMaterialCache.set(cacheKey, material);
  }

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.8, 0.9, 1);
  return sprite;
}

const STEP_TITLES = [
  'El Bit Clásico',
  'El Qubit y su Notación',
  'La Esfera de Bloch',
  'El Colapso de la Medición',
  'Reto de Comprensión',
] as const;

export default function Mission1Superposition({ onComplete }: Props) {
  const [step, setStep] = useState<number>(0);
  const totalSteps = 5;

  const [classicBit, setClassicBit] = useState<0 | 1>(0);
  const [isCoinSpinning, setIsCoinSpinning] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const [theta, setTheta] = useState(Math.PI / 2);
  const [isSuperposition, setIsSuperposition] = useState(true);
  const [collapsedState, setCollapsedState] = useState<number | null>(null);
  const [hasMeasured, setHasMeasured] = useState(false);

  const [userChoice, setUserChoice] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const { alpha: _alpha, beta: _beta, prob0: domainProb0 } = calculateBlochProbabilities(theta);
  const prob0 = isSuperposition ? domainProb0 : collapsedState === 0 ? 100 : 0;
  const _prob1 = 100 - prob0;

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
    height: 400,
    recreateOn: step === 2 || step === 3 ? 'm1-visible' : 'm1-hidden',
    onSetup: (handle) => {
      const sphereGroup = new THREE.Group();
      handle.add(sphereGroup);

      const sphereGeo = new THREE.SphereGeometry(1, 32, 24);
      const sphereMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true, transparent: true, opacity: 0.18 });
      sphereGroup.add(new THREE.Mesh(sphereGeo, sphereMat));
    },
  });

  const handleMeasure = () => {
    playLaserScan();
    setTimeout(() => playQuantumCollapse(), 150);

    const outcome = measureQubit(theta);

    setIsSuperposition(false);
    setCollapsedState(outcome);
    setHasMeasured(true);

    updateStoredMetrics((prev) => ({
      ...prev,
      actions: {
        ...prev.actions,
        superpositionMeasurements: prev.actions.superpositionMeasurements + 1,
      },
    }));
  };

  const handleResetSuperposition = () => {
    playButtonClick();
    setIsSuperposition(true);
    setCollapsedState(null);
    setTheta(Math.PI / 2);
  };

  const handleQuizChoice = (choice: string) => {
    setUserChoice(choice);
    setShowFeedback(true);
    if (choice === 'collapse') {
      playChimeSuccess();
      saveCompletedMission(0);
    } else {
      playButtonClick();
    }
  };

  useMissionTitle(STEP_TITLES[step] ?? '');

  return (
    <div className="w-full flex-1 mx-auto flex flex-col justify-between py-2 text-slate-100 min-h-[640px]">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan px-2.5 py-1 rounded-md bg-cyan/10 border border-cyan/30">
            Tarea 1
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
                  ? 'w-8 bg-cyan shadow-sm shadow-cyan/50'
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
          <div>
            <div className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
              <Layers className="w-4 h-4 text-cyan" /> Fundamento Clásico
            </div>
            <p className="text-base sm:text-lg text-slate-300 mt-3 max-w-xl mx-auto leading-relaxed">
              En la informática tradicional, un bit solo puede existir en uno de dos estados posibles, <strong className="text-white">estrictamente 0 o estrictamente 1</strong>.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-950/80 border border-slate-800 backdrop-blur-md shadow-2xl flex flex-col items-center gap-6 w-full max-w-md">
            <button
              onClick={() => {
                playButtonClick();
                setClassicBit((prev) => (prev === 0 ? 1 : 0));
              }}
              className="w-full py-5 px-6 rounded-2xl bg-slate-900 border-2 border-slate-700 hover:border-cyan text-white font-mono text-lg transition-all flex items-center justify-between active:scale-95 shadow-xl group"
            >
              <div className="flex items-center gap-3">
                {classicBit === 1 ? (
                  <ToggleRight className="w-10 h-10 text-cyan" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-slate-500" />
                )}
                <span className="font-sans font-semibold text-base">Tocar Interruptor</span>
              </div>
              <span className={`text-xs font-mono px-2.5 py-1 rounded ${
                classicBit === 1 ? 'bg-cyan/20 text-cyan border border-cyan/40 font-bold' : 'bg-slate-800 text-slate-400'
              }`}>
                {classicBit === 1 ? '5V (ALTO)' : '0V (BAJO)'}
              </span>
            </button>

            <div className="text-5xl sm:text-6xl font-orbitron font-bold text-white tracking-wider">
              VALOR: <span data-testid="classic-bit-value" className="text-cyan">{classicBit}</span>
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-7 py-4">
          <div>
            <div className="text-xs font-mono text-cyan uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan" /> Fundamento Cuántico
            </div>
            <h2 className="text-3xl sm:text-5xl font-orbitron font-bold text-white tracking-wide">
              El Qubit y su Notación
            </h2>
            <p className="text-base sm:text-lg text-slate-300 mt-2 max-w-xl mx-auto leading-relaxed">
              La unidad cuántica no es un simple dígito binario. Puede existir en una <strong className="text-cyan">superposición</strong> de ambos estados a la vez.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-3xl text-left">
            <div className="p-6 rounded-3xl bg-slate-950/80 border border-cyan/40 backdrop-blur-md shadow-xl flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan/10 border border-cyan/40 flex items-center justify-center text-cyan">
                  <Atom className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-orbitron font-bold text-white text-sm">¿Por qué se escribe |0⟩ y |1⟩?</h3>
                  <span className="text-[11px] font-mono text-cyan">Notación Ket (Dirac)</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                El número se encierra entre una barra y un ángulo para indicar que no es un dígito matemático, sino un <strong className="text-white">estado físico fundamental</strong>.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-950/80 border border-purple-500/40 backdrop-blur-md shadow-xl flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/40 flex items-center justify-center text-purple-400">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-orbitron font-bold text-white text-sm">¿Qué representa la aguja?</h3>
                  <span className="text-[11px] font-mono text-purple-400">Vector de Estado |ψ⟩</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                La flecha que nace del centro indica la probabilidad actual. Si está inclinada hacia el medio, el qubit tiene probabilidad simultánea de dar 0 y 1.
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-slate-800 w-full max-w-3xl flex items-center justify-between gap-4 text-left">
            <div className="flex items-start gap-3">
              <Coins className={`w-6 h-6 shrink-0 mt-0.5 ${isCoinSpinning ? 'text-cyan animate-spin' : 'text-slate-400'}`} />
              <div className="text-xs sm:text-sm text-slate-300">
                <strong className="text-white block font-sans mb-0.5">La analogía de la moneda:</strong>
                Una moneda en reposo es cara o cruz (bit clásico). Mientras gira en el aire, contiene ambas caras a la vez hasta que cae en la mano.
              </div>
            </div>
            <button
              onClick={() => {
                playButtonClick();
                setIsCoinSpinning(!isCoinSpinning);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-cyan hover:bg-slate-850 shrink-0"
            >
              {isCoinSpinning ? 'Atrapar Moneda' : 'Lanzar al Aire'}
            </button>
          </div>
        </div>
      )}

      {(step === 2 || step === 3) && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-4 py-2">
          <div>
            <h2 className="text-2xl sm:text-4xl font-orbitron font-bold text-white tracking-wide">
              {step === 2 ? 'La Esfera de Bloch' : 'El Colapso de la Medición'}
            </h2>
            <div className="text-xs font-mono text-cyan uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
              {step === 2 && <Activity className="w-4 h-4 text-cyan" />}
              {step === 3 && <Scan className="w-4 h-4 text-cyan" />}
              {step === 2 ? 'Espacio de Estados' : 'El Momento Decisivo'}
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl mx-auto leading-relaxed">
              {step === 2
                ? 'Arrastra con el ratón sobre la esfera para girarla 360°. Ajusta el deslizador para ver cómo la aguja cambia las probabilidades en vivo.'
                : 'Mientras no se mida, la aguja permanece en superposición. Dispara el detector para observar cómo la observación destruye la superposición.'}
            </p>
          </div>

          <div className="w-full max-w-2xl p-4 rounded-3xl bg-[#060a14] border border-slate-800/90 shadow-2xl relative flex flex-col items-center">
            <div ref={containerRef} role="img" aria-label="Esfera de Bloch interactiva" className="w-full" />

            {step === 2 && (
              <div className="w-full max-w-lg mt-2 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
                <input
                  type="range"
                  min="0.001"
                  max={Math.PI - 0.001}
                  step="0.01"
                  value={theta}
                  onChange={(e) => {
                    setTheta(parseFloat(e.target.value));
                    setIsSuperposition(true);
                    setCollapsedState(null);
                  }}
                  className="w-full accent-cyan cursor-pointer"
                />
              </div>
            )}

            {step === 3 && (
              <div className="w-full max-w-md mt-2 flex flex-col gap-3">
                <div className="flex gap-3">
                  <button
                    onClick={handleMeasure}
                    className="flex-1 py-4 px-6 rounded-2xl bg-cyan text-slate-950 font-orbitron font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-cyan/90 transition-all shadow-xl shadow-cyan/25 active:scale-95"
                  >
                    Disparar Detector Láser
                  </button>
                  <button
                    onClick={handleResetSuperposition}
                    className="py-4 px-5 rounded-2xl bg-slate-900 text-slate-300 text-xs font-mono flex items-center justify-center gap-1.5 border border-slate-800"
                  >
                    <RotateCcw className="w-4 h-4" /> Probar de nuevo
                  </button>
                </div>

                {hasMeasured && collapsedState !== null && (
                  <div data-testid="collapse-result" className="p-4 rounded-2xl border text-sm text-left bg-cyan/10 border-cyan/50 text-cyan">
                    <div className="font-bold font-orbitron flex items-center gap-2 mb-1 text-base">
                      <CheckCircle2 className="w-5 h-5" />
                      ¡Colapso Observado en el Polo |{collapsedState}⟩!
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-6 py-4">
          <div>
            <h2 className="text-2xl sm:text-4xl font-orbitron font-bold text-white tracking-wide">
              Reto de Comprensión
            </h2>
            <div className="text-xs font-mono text-cyan uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
              <HelpCircle className="w-4 h-4 text-cyan" /> Comprobación Final
            </div>
            <p className="text-base sm:text-lg text-slate-200 mt-2 font-semibold max-w-xl mx-auto">
              ¿Qué ocurre cuando se mide un qubit que está en superposición?
            </p>
          </div>

          <div className="w-full max-w-xl flex flex-col gap-3.5">
            <button
              onClick={() => handleQuizChoice('collapse')}
              className="p-5 rounded-2xl border text-left text-sm leading-normal bg-slate-950/80 border-slate-800 text-slate-300"
            >
              B) Colapsa forzosamente a uno de los dos estados posibles (|0⟩ o |1⟩)
            </button>
          </div>

          {showFeedback && userChoice === 'collapse' && (
            <div className="w-full max-w-xl p-4 rounded-2xl text-sm flex items-center justify-between gap-4 text-left bg-emerald-950/30 border border-emerald-500/40 text-emerald-200">
              <span>¡Correcto! La medición destruye la superposición forzando el colapso.</span>
              <button
                onClick={onComplete}
                className="py-2.5 px-5 rounded-xl bg-emerald-500 text-slate-950 font-orbitron font-bold text-xs uppercase flex items-center gap-2 shrink-0"
              >
                Pasar a Tarea 2 <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between items-center border-t border-slate-800 pt-4 mt-4">
        <button
          onClick={goToPrevStep}
          disabled={step === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-800 text-slate-400 disabled:opacity-30 font-mono text-xs uppercase"
        >
          <ArrowLeft className="w-4 h-4" /> Anterior
        </button>

        {step < totalSteps - 1 && (
          <button
            onClick={goToNextStep}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan text-slate-950 font-orbitron font-bold text-xs uppercase"
          >
            Siguiente Paso <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
