'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, ArrowRight, CheckCircle2, HelpCircle, Shield } from 'lucide-react';
import clsx from 'clsx';
import { playButtonClick, playChimeSuccess, playLaserScan } from '@/lib/sound';
import { saveCompletedMission, updateStoredMetrics } from '@/lib/cookies';
import { useMissionTitle } from '@/hooks/useMissionTitle';
import {
  bitFlipEncode, injectBitFlip, detectBitFlipSyndrome, bitFlipDecode,
   type BitTriple,
} from '@/domain/quantum/errorCorrection';
import { useThreeScene } from '@/hooks/useThreeScene';
import { createOrbitControls } from '@/hooks/useOrbitControls';
import { prefersReducedMotion, cached } from '@/lib/three/createScene';

interface Props {
  onComplete: () => void;
  onBack: () => void;
}

const STEP_TITLES = [
  'Corrección de Errores',
  '_Bit-Flip en Acción',
  'Phase-Flip en Acción',
  'El Decodificador',
  'Comprobación',
] as const;

export default function Mission7ErrorCorrection({ onComplete, onBack }: Props) {
  const totalSteps = 5;
  const [step, setStep] = useState(0);
  const [encoded, setEncoded] = useState<BitTriple>(() => bitFlipEncode(0));
  const [syndrome, setSyndrome] = useState<{ syndrome: number; errorIndex: number } | null>(null);
  const [phaseIndex, setPhaseIndex] = useState<0 | 1 | 2 | -1>(-1);
  const [userChoice, setUserChoice] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const sphereRefs = useRef<(THREE.Mesh | null)[]>([null, null, null]);
  const bitsRef = useRef<BitTriple>(encoded);
  const syndromeRef = useRef<typeof syndrome>(null);
  const phaseRef = useRef<typeof phaseIndex>(-1);
  const dirtyRef = useRef(true);

  useEffect(() => {
    bitsRef.current = encoded;
    syndromeRef.current = syndrome;
    phaseRef.current = phaseIndex;
    dirtyRef.current = true;
  }, [encoded, syndrome, phaseIndex]);

  const goNext = useCallback(() => { playButtonClick(); setStep((s) => Math.min(s + 1, totalSteps - 1)); }, []);
  const goPrev = useCallback(() => { playButtonClick(); setStep((s) => Math.max(s - 1, 0)); }, []);
  const goTo = useCallback((n: number) => { playButtonClick(); setStep(n); }, []);

  useThreeScene(containerRef, {
    width: 600,
    height: 360,
    viewportRelative: true,
    aspect: 16 / 10,
    cameraPos: [0, 0.5, 4.5],
    cameraLookAt: [0, 0, 0],
    recreateOn: step >= 1 && step <= 3 ? 'm7-visible' : 'm7-hidden',
    onSetup: (handle) => {
      const sphereGeo = cached('m7:sphere', () => new THREE.SphereGeometry(0.42, 24, 18));
      const positions: [number, number, number][] = [
        [-1.2, 0, 0], [0, 0, 0], [1.2, 0, 0],
      ];
      positions.forEach((pos, idx) => {
        const mat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true });
        const mesh = new THREE.Mesh(sphereGeo, mat);
        mesh.position.set(pos[0], pos[1], pos[2]);
        sphereRefs.current[idx] = mesh;
        handle.add(mesh);
      });

      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-1.2, 0, 0),
        new THREE.Vector3(1.2, 0, 0),
      ]);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x64748b, transparent: true, opacity: 0.5 });
      handle.add(new THREE.Line(lineGeo, lineMat));

      const controls = createOrbitControls(handle.camera, handle.renderer.domElement, {
        enablePan: false,
        enableZoom: true,
        enableRotate: true,
        minDistance: 2.5,
        maxDistance: 8.0,
        autoRotate: !prefersReducedMotion(),
        autoRotateSpeed: 0.3,
        enableDamping: true,
        dampingFactor: 0.12,
        target: [0, 0, 0],
      });

      handle.onFrame((_t, dt) => {
        controls.update(dt);
        if (!dirtyRef.current) return;
        const bits = bitsRef.current;
        const sy = syndromeRef.current;
        const pi = phaseRef.current;
        sphereRefs.current.forEach((mesh, idx) => {
          if (!mesh) return;
          const mat = mesh.material as THREE.MeshBasicMaterial;
          if (sy && sy.errorIndex === idx) mat.color.setHex(0xfbbf24);
          else if (pi === idx) mat.color.setHex(0xa855f7);
          else if (bits[idx] === 1) mat.color.setHex(0xf43f5e);
          else mat.color.setHex(0x00f0ff);
        });
        dirtyRef.current = false;
      });

      return () => {
        controls.dispose();
        sphereRefs.current = [null, null, null];
      };
    },
  });

  const flipBit = (idx: 0 | 1 | 2) => {
    playLaserScan();
    setEncoded((prev) => injectBitFlip(prev, idx));
    setSyndrome(null);
  };

  const decode = () => {
    playChimeSuccess();
    const r = detectBitFlipSyndrome(encoded);
    setSyndrome({ syndrome: r.syndrome, errorIndex: r.errorIndex });
    updateStoredMetrics((prev) => ({
      ...prev,
      actions: {
        ...prev.actions,
        applicationsExplored: Array.from(new Set([...prev.actions.applicationsExplored, 'error_correction'])),
      },
    }));
  };

  const resetDemo = () => {
    playButtonClick();
    setEncoded(bitFlipEncode(0));
    setSyndrome(null);
    setPhaseIndex(-1);
  };

  const handleQuizChoice = (choice: string) => {
    setUserChoice(choice);
    setShowFeedback(true);
    if (choice === 'redundancy') {
      playChimeSuccess();
      saveCompletedMission(6);
    } else {
      playButtonClick();
    }
  };

  const decodedBit = bitFlipDecode(encoded);

  useMissionTitle(STEP_TITLES[step] ?? '');

  return (
    <div className="w-full flex-1 mx-auto flex flex-col justify-between py-2 text-slate-100 min-h-[640px]">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-orange-400 px-2.5 py-1 rounded-md bg-orange-500/10 border border-orange-500/30">
            Tarea 7
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
                step === i ? 'w-8 bg-orange-400 shadow-sm shadow-orange-400/50'
                  : i < step ? 'w-3 bg-emerald-500'
                  : 'w-2 bg-slate-800 hover:bg-slate-700'
              )}
            />
          ))}
        </div>
      </div>

      {step === 0 && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-7 py-4 animate-in fade-in zoom-in-95 duration-300">
          <div data-testid="mission7-intro">
            <div className="text-xs font-mono text-orange-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
              <Shield className="w-4 h-4 text-orange-400" /> Protegiendo la Informacion
            </div>
            <p className="text-base sm:text-lg text-slate-300 mt-3 max-w-xl mx-auto leading-relaxed">
              Los qubits son fragiles: cualquier ruido puede corromper su informacion.
              El codigo de repeticion de 3 qubits triplica el dato y corrige errores individuales por votacion mayoritaria.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full  text-left">
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-orange-500/40">
              <div className="font-orbitron font-bold text-orange-400 text-lg mb-1">Redundancia</div>
              <p className="text-xs text-slate-300">En lugar de 1 qubit, usamos 3. Si uno falla, los otros dos dan la respuesta.</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-cyan/40">
              <div className="font-orbitron font-bold text-cyan text-lg mb-1">Sindrome</div>
              <p className="text-xs text-slate-300">Comparando los 3 qubits detectamos CUAL se corrompio sin destruir el estado logico.</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-purple-500/40">
              <div className="font-orbitron font-bold text-purple-400 text-lg mb-1">Limite</div>
              <p className="text-xs text-slate-300">Un doble error ya no es corregible: el codigo cree que el error esta en el bit sano.</p>
            </div>
          </div>
        </div>
      )}

      {(step === 1 || step === 2 || step === 3) && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-4 py-2 animate-in fade-in zoom-in-95 duration-300">
          <div>
            <div className="text-xs font-mono text-orange-400 uppercase tracking-widest mb-1">
              {step === 1 && 'Codigo de Repeticion - Errores de _Bit'}
              {step === 2 && 'Errores de Fase (Z)'}
              {step === 3 && 'Decodificacion por Sindrome'}
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl mx-auto leading-relaxed">
              {step === 1 && 'Haz click en cualquier qubit para invertirlo. Luego presiona Decodificar para ver cual fue corregido.'}
              {step === 2 && 'Un error de fase no cambia los valores 0/1, pero altera la fase cuantica. Es invisible en la base computacional.'}
              {step === 3 && 'El sindrome es un numero entero que identifica CUAL de los 3 qubits se corrompio.'}
            </p>
          </div>

          <div className="w-full p-4 rounded-3xl bg-[#060a14] border border-slate-800/90 shadow-2xl flex flex-col items-center">
            <div
              ref={containerRef}
              role="img"
              aria-label="Tres qubits del codigo de repeticion"
              className="w-full cursor-grab active:cursor-grabbing touch-none select-none my-1"
            />

            {step === 1 && (
              <div className="w-full max-w-lg mt-2 flex flex-col gap-3">
                <div className="grid grid-cols-3 gap-2">
                  {([0, 1, 2] as const).map((idx) => (
                    <button
                      key={idx}
                      onClick={() => flipBit(idx)}
                      data-testid={'flip-qubit-' + idx}
                      className="py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-mono border border-slate-800"
                    >
                      Flip qubit {idx + 1}
                    </button>
                  ))}
                </div>
                <div
                  data-testid="bit-pattern"
                  className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-300 flex items-center justify-between"
                >
                  <span>Patron actual:</span>
                  <span className="text-orange-400 font-bold">[{encoded.join(', ')}]</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={decode}
                    className="flex-1 py-3 rounded-2xl bg-orange-400 text-slate-950 font-orbitron font-bold text-xs uppercase tracking-wider hover:bg-orange-300 transition-all shadow-md shadow-orange-400/20"
                  >
                    Decodificar sindrome
                  </button>
                  <button
                    onClick={resetDemo}
                    className="py-3 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono border border-slate-800"
                  >
                    Reiniciar
                  </button>
                </div>
                {syndrome && (
                  <div
                    data-testid="syndrome-display"
                    className={clsx(
                      'p-3 rounded-2xl border text-xs font-mono text-left',
                      syndrome.syndrome === 0
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                        : 'bg-orange-950/40 border-orange-500/50 text-orange-200'
                    )}
                  >
                    <div className="font-bold text-white mb-1">
                      Sindrome: {syndrome.syndrome}
                    </div>
                    {syndrome.syndrome === 0
                      ? 'Sin error detectado. Los 3 qubits coinciden.'
                      : 'Error en qubit ' + (syndrome.errorIndex + 1) + '. Corregido a [' + bitFlipEncode(decodedBit).join(', ') + '].'}
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="w-full max-w-lg mt-2 flex flex-col gap-3">
                <div className="grid grid-cols-3 gap-2">
                  {([0, 1, 2] as const).map((idx) => (
                    <button
                      key={idx}
                      onClick={() => { playLaserScan(); setPhaseIndex(idx); }}
                      data-testid={'phase-qubit-' + idx}
                      className={clsx(
                        'py-3 rounded-2xl text-xs font-mono border',
                        phaseIndex === idx
                          ? 'bg-purple-500/20 border-purple-500/60 text-purple-200'
                          : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
                      )}
                    >
                      Fase del qubit {idx + 1}
                    </button>
                  ))}
                </div>
                <div
                  data-testid="phase-display"
                  className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-300 text-left"
                >
                  {phaseIndex === -1
                    ? 'Ninguna fase invertida.'
                    : 'Fase del qubit ' + (phaseIndex + 1) + ' fue invertida por Z.'}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  El codigo de repeticion no detecta este error: los valores 0/1 son identicos. Se necesita un codigo de fase adicional (Hadamard + repeticion).
                </p>
              </div>
            )}

            {step === 3 && (
              <div className="w-full max-w-lg mt-2 flex flex-col gap-3">
                <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                    <div className="text-slate-500">Sindrome 1</div>
                    <div className="text-orange-400 font-bold mt-1">Error en q0</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                    <div className="text-slate-500">Sindrome 2</div>
                    <div className="text-orange-400 font-bold mt-1">Error en q1</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                    <div className="text-slate-500">Sindrome 3</div>
                    <div className="text-orange-400 font-bold mt-1">Error en q2</div>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed text-left">
                  El sindrome es una <strong className="text-white">biyeccion</strong> entre el indice del qubit erroneo y un numero entero.
                  El decodificador consulta la tabla y aplica la correccion correspondiente.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-6 py-4 animate-in fade-in zoom-in-95 duration-300">
          <div>
            <div className="text-xs font-mono text-orange-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
              <HelpCircle className="w-4 h-4 text-orange-400" /> Reto Final
            </div>
            <p className="text-base sm:text-lg text-slate-200 mt-2 font-semibold max-w-xl mx-auto">
              Por que el codigo de repeticion de 3 qubits puede corregir un error de bit?
            </p>
          </div>

          <div className="w-full max-w-xl flex flex-col gap-3.5">
            <button
              onClick={() => handleQuizChoice('energy')}
              className={clsx(
                'p-5 rounded-2xl border text-left text-sm transition-all',
                userChoice === 'energy' ? 'bg-rose-950/40 border-rose-500 text-rose-200'
                  : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
              )}
            >
              A) Cada qubit almacena mas energia para resistir el ruido
            </button>
            <button
              onClick={() => handleQuizChoice('redundancy')}
              className={clsx(
                'p-5 rounded-2xl border text-left text-sm transition-all',
                userChoice === 'redundancy' ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-semibold shadow-xl shadow-emerald-500/20 ring-2 ring-emerald-500/40'
                  : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
              )}
            >
              B) La informacion se distribuye en 3 copias y la votacion mayoritaria recupera el valor original
            </button>
            <button
              onClick={() => handleQuizChoice('quantum_parallel')}
              className={clsx(
                'p-5 rounded-2xl border text-left text-sm transition-all',
                userChoice === 'quantum_parallel' ? 'bg-rose-950/40 border-rose-500 text-rose-200'
                  : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
              )}
            >
              C) Los qubits operan en paralelo y promedian su estado cuantico
            </button>
          </div>

          {showFeedback && (
            <div
              className={clsx(
                'w-full max-w-xl p-4 rounded-2xl text-sm flex items-center justify-between gap-4 text-left',
                userChoice === 'redundancy' ? 'bg-emerald-950/30 border border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/30 border border-rose-500/40 text-rose-200'
              )}
            >
              <div className="flex items-center gap-3">
                {userChoice === 'redundancy' ? <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" /> : <HelpCircle className="w-6 h-6 text-rose-400 shrink-0" />}
                <span>
                  {userChoice === 'redundancy'
                    ? 'Correcto. Tres copias permiten que dos voten por el valor correcto aunque una se corrompa.'
                    : 'Pista: en el simulador viste que el patron [1,1,0] se decodifica al valor 1 por mayoria, ignorando el qubit corrupto.'}
                </span>
              </div>
              {userChoice === 'redundancy' && (
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
          <ArrowLeft className="w-4 h-4" /> {step === 0 ? 'Volver a Tarea 6' : 'Paso Anterior'}
        </button>
        {step < totalSteps - 1 && (
          <button
            onClick={goNext}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-400 text-slate-950 hover:bg-orange-300 transition-all font-orbitron font-bold text-xs uppercase tracking-wider shadow-md shadow-orange-400/20 active:scale-95"
          >
            Siguiente Paso <ArrowRight className="w-4 h-4" />
          </button>
        )}
        {step === totalSteps - 1 && userChoice !== 'redundancy' && (
          <span className="text-xs font-mono text-slate-400">Responde arriba para finalizar</span>
        )}
      </div>
    </div>
  );
}
