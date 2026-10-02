'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  Radio,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Globe,
  Satellite,
  HelpCircle,
  Share2,
  Zap,
  Sparkles,
  Link as LinkIcon,
  RotateCcw,
} from 'lucide-react';
import {
  playButtonClick,
  playChimeSuccess,
  playLaserScan,
  playQuantumCollapse,
} from '@/lib/sound';
import { saveCompletedMission, updateStoredMetrics } from '@/lib/cookies';
import { correlateEntangledMeasurement } from '@/domain/quantum/entanglement';
import { measureQubit } from '@/domain/quantum/measurement';
import { useThreeScene } from '@/hooks/useThreeScene';
import { prefersReducedMotion, cached } from '@/lib/three/createScene';
import { createOrbitControls } from '@/hooks/useOrbitControls';

interface Props {
  onComplete: () => void;
  onBack: () => void;
  /** Test-only RNG override. Not for production use. */
  __testRandom?: () => number;
}

export default function Mission2Entanglement({ onComplete, onBack, __testRandom }: Props) {
  const [step, setStep] = useState<number>(0);
  const totalSteps = 5;

  const [aliceIndependentVal, setAliceIndependentVal] = useState<number>(0);
  const [bobIndependentVal, setBobIndependentVal] = useState<number>(0);

  const [isEntangled, setIsEntangled] = useState<boolean>(false);
  const [distanceKm, setDistanceKm] = useState<number>(384400);

  const [aliceMeasured, setAliceMeasured] = useState<number | null>(null);
  const [bobMeasured, setBobMeasured] = useState<number | null>(null);
  const [hasTriggeredMeasurement, setHasTriggeredMeasurement] = useState<boolean>(false);

  const [userChoice, setUserChoice] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const aliceMeshRef = useRef<THREE.Mesh | null>(null);
  const bobMeshRef = useRef<THREE.Mesh | null>(null);
  const beamLineRef = useRef<THREE.Line | null>(null);
  const animFrameId = useRef<number | null>(null);

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
    viewportRelative: true,
    aspect: 16 / 10,
    cameraPos: [0, 0.5, 4.8],
    cameraLookAt: [0, 0, 0],
    recreateOn: step >= 1 && step <= 3 ? 'm2-visible' : 'm2-hidden',
    onSetup: (handle) => {
      const stationGeo = cached('m2:station', () => new THREE.IcosahedronGeometry(0.38, 1));
      const aliceMesh = new THREE.Mesh(
        stationGeo,
        new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true })
      );
      aliceMesh.position.set(-1.8, 0, 0);
      aliceMeshRef.current = aliceMesh;
      handle.add(aliceMesh);

      const bobMesh = new THREE.Mesh(
        stationGeo,
        new THREE.MeshBasicMaterial({ color: 0x10b981, wireframe: true })
      );
      bobMesh.position.set(1.8, 0, 0);
      bobMeshRef.current = bobMesh;
      handle.add(bobMesh);

      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-1.8, 0, 0),
        new THREE.Vector3(1.8, 0, 0),
      ]);
      const lineMat = new THREE.LineDashedMaterial({
        color: 0xa855f7,
        dashSize: 0.12,
        gapSize: 0.06,
        transparent: true,
        opacity: step >= 1 ? 0.8 : 0.1,
      });
      const beam = new THREE.Line(lineGeo, lineMat);
      beam.computeLineDistances();
      beamLineRef.current = beam;
      handle.add(beam);

      const starGeo = new THREE.BufferGeometry();
      const starPos = new Float32Array(80 * 3);
      for (let i = 0; i < 80 * 3; i += 3) {
        starPos[i] = (Math.random() - 0.5) * 8;
        starPos[i + 1] = (Math.random() - 0.5) * 5;
        starPos[i + 2] = (Math.random() - 0.5) * 4;
      }
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
      const stars = new THREE.Points(
        starGeo,
        new THREE.PointsMaterial({ color: 0xffffff, size: 0.025, transparent: true, opacity: 0.4 })
      );
      handle.add(stars);

      const controls = createOrbitControls(handle.camera, handle.renderer.domElement, {
        enablePan: false,
        enableZoom: true,
        enableRotate: true,
        minDistance: 2.5,
        maxDistance: 10.0,
        autoRotate: !prefersReducedMotion(),
        autoRotateSpeed: 0.3,
        enableDamping: true,
        dampingFactor: 0.12,
        target: [0, 0, 0],
      });

      const reduced = prefersReducedMotion();
      handle.onFrame((_t, dt) => {
        controls.update(dt);
        if (!reduced) {
          aliceMesh.rotation.y += 0.01;
          aliceMesh.rotation.x += 0.005;
          bobMesh.rotation.y -= 0.01;
          bobMesh.rotation.x -= 0.005;
          lineMat.opacity = 0.5 + Math.sin(Date.now() * 0.005) * 0.35;
        }
      });

      return () => {
        controls.dispose();
        aliceMeshRef.current = null;
        bobMeshRef.current = null;
        beamLineRef.current = null;
      };
    },
  });

  useEffect(() => {
    if (step !== 2 || !aliceMeshRef.current || !bobMeshRef.current || !beamLineRef.current) return;
    const factor = (distanceKm / 400000) * 0.5 + 1.4;
    aliceMeshRef.current.position.x = -factor;
    bobMeshRef.current.position.x = factor;

    const points = [new THREE.Vector3(-factor, 0, 0), new THREE.Vector3(factor, 0, 0)];
    beamLineRef.current.geometry.setFromPoints(points);
    beamLineRef.current.computeLineDistances();
  }, [distanceKm, step]);

  const handleGenerateEntanglement = () => {
    playLaserScan();
    setTimeout(() => playChimeSuccess(), 200);
    setIsEntangled(true);
    updateStoredMetrics((prev) => ({
      ...prev,
      actions: {
        ...prev.actions,
        entanglementMeasurements: prev.actions.entanglementMeasurements + 1,
      },
    }));
  };

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

  const handleResetMeasurement = () => {
    playButtonClick();
    setAliceMeasured(null);
    setBobMeasured(null);
    setHasTriggeredMeasurement(false);
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
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-8 py-4 animate-in fade-in zoom-in-95 duration-300">
          <div>
            <div className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
              <Share2 className="w-4 h-4 text-purple-400" /> Ausencia de Enlace
            </div>
            <h2 className="text-3xl sm:text-5xl font-orbitron font-bold text-white tracking-wide">
              Dos Qubits Independientes
            </h2>
            <p className="text-base sm:text-lg text-slate-300 mt-3 max-w-xl mx-auto leading-relaxed">
              En condiciones normales, dos partículas u ordenadores cuánticos en lugares distintos son <strong className="text-white">totalmente independientes</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
            <div className="p-6 rounded-3xl bg-slate-950/80 border border-cyan/40 backdrop-blur-md shadow-xl flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 text-cyan font-orbitron font-bold text-sm">
                <Globe className="w-4 h-4" /> Qubit de Alice (Tierra)
              </div>
              <div className="text-4xl font-orbitron font-bold text-white">
                |{aliceIndependentVal}⟩
              </div>
              <button
                onClick={() => {
                  playButtonClick();
                  setAliceIndependentVal((prev) => (prev === 0 ? 1 : 0));
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan/15 hover:bg-cyan/25 border border-cyan/40 text-cyan text-xs font-mono font-semibold transition-all active:scale-95"
              >
                Conmutar Alice (0 ↔ 1)
              </button>
            </div>

            <div className="p-6 rounded-3xl bg-slate-950/80 border border-emerald-500/40 backdrop-blur-md shadow-xl flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 text-emerald-400 font-orbitron font-bold text-sm">
                <Satellite className="w-4 h-4" /> Qubit de Bob (Luna)
              </div>
              <div className="text-4xl font-orbitron font-bold text-white">
                |{bobIndependentVal}⟩
              </div>
              <button
                onClick={() => {
                  playButtonClick();
                  setBobIndependentVal((prev) => (prev === 0 ? 1 : 0));
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-semibold transition-all active:scale-95"
              >
                Conmutar Bob (0 ↔ 1)
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-400 max-w-md">
            Nota que cambiar el estado de Alice no produce ningún efecto en Bob. No existe ninguna conexión cuántica... todavía.
          </p>
        </div>
      )}

      {(step === 1 || step === 2 || step === 3) && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-5 py-2 animate-in fade-in zoom-in-95 duration-300">
          <div>
            <div className="text-xs font-mono text-purple-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
              {step === 1 && <Sparkles className="w-4 h-4 text-purple-400" />}
              {step === 2 && <Radio className="w-4 h-4 text-purple-400" />}
              {step === 3 && <Zap className="w-4 h-4 text-purple-400" />}
              {step === 1 && 'Correlación Cuántica'}
              {step === 2 && 'No-Localidad'}
              {step === 3 && 'Colapso Correlacionado'}
            </div>
            <h2 className="text-2xl sm:text-4xl font-orbitron font-bold text-white tracking-wide">
              {step === 1 && 'Creación del Par de Bell'}
              {step === 2 && 'Separación a Distancia'}
              {step === 3 && 'Medición Instantánea'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl mx-auto leading-relaxed">
              {step === 1 && 'Al hacer interactuar dos qubits en el laboratorio, sus estados se entrelazan formando una única función de onda compartida.'}
              {step === 2 && '¿Qué ocurre si separamos a Alice y Bob a cientos de miles de kilómetros de distancia?'}
              {step === 3 && 'Alice mide su qubit. Observa cómo el resultado determina en el acto el estado de Bob, sin retardo de tiempo.'}
            </p>
          </div>

          <div className="w-full max-w-2xl p-4 rounded-3xl bg-[#060a14] border border-slate-800/90 shadow-2xl relative flex flex-col items-center">
            <div ref={containerRef}
              role="img"
              aria-label="Estaciones Alice y Bob entrelazadas en el espacio" className="w-full" />

            {step === 1 && (
              <div className="w-full max-w-md mt-2 flex flex-col gap-3">
                <button
                  onClick={handleGenerateEntanglement}
                  className={`w-full py-3.5 px-6 rounded-2xl font-orbitron font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95 ${
                    isEntangled
                      ? 'bg-purple-600 text-white shadow-purple-600/30 ring-2 ring-purple-400'
                      : 'bg-cyan text-slate-950 shadow-cyan/25 hover:bg-cyan/90'
                  }`}
                >
                  <LinkIcon className="w-4 h-4" />
                  {isEntangled ? '¡Enlace Cuántico Activo (|00⟩ + |11⟩)!' : 'Generar Entrelazamiento Láser'}
                </button>

                {isEntangled && (
                  <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-500/50 text-purple-200 text-xs text-left animate-in fade-in">
                    <strong className="block text-white mb-1">Estado de Bell creado:</strong>
                    Ambos qubits han dejado de tener identidades separadas. Ahora describen un único sistema cuántico indivisible.
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="w-full max-w-lg mt-2 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400">Distancia entre Alice y Bob:</span>
                  <span className="text-purple-400 font-bold">{distanceKm.toLocaleString()} km</span>
                </div>

                <input
                  type="range"
                  min="1000"
                  max="400000"
                  step="1000"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(parseInt(e.target.value))}
                  className="w-full accent-purple-500 cursor-pointer"
                />

                <p className="text-xs text-slate-300 text-left leading-normal border-t border-slate-800/80 pt-2">
                  A pesar de la separación física en el espacio, la correlación cuántica <strong className="text-white">no se atenúa ni se desgasta</strong> por la distancia.
                </p>
              </div>
            )}

            {step === 3 && (
              <div className="w-full max-w-md mt-2 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-cyan/10 border border-cyan/40 text-center">
                    <div className="text-[10px] font-mono text-slate-400">Alice (Tierra)</div>
                    <div data-testid="alice-state" className="text-2xl font-orbitron font-bold text-cyan mt-1">
                      {aliceMeasured !== null ? `|${aliceMeasured}⟩` : 'Superposición'}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-center">
                    <div className="text-[10px] font-mono text-slate-400">Bob (Luna)</div>
                    <div data-testid="bob-state" className="text-2xl font-orbitron font-bold text-emerald-400 mt-1">
                      {bobMeasured !== null ? `|${bobMeasured}⟩` : 'Superposición'}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <button
                    onClick={handleMeasureAlice}
                    className="flex-1 py-3.5 px-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-orbitron font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-600/30 active:scale-95"
                  >
                    <Zap className="w-4 h-4" /> Medir en Laboratorio de Alice
                  </button>
                  <button
                    onClick={handleResetMeasurement}
                    className="py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-xs flex items-center justify-center transition-all border border-slate-800"
                    title="Reiniciar y medir de nuevo"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>

                {hasTriggeredMeasurement && (
                  <div data-testid="correlation-result" className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-200 text-xs text-left animate-in fade-in">
                    <div className="font-bold flex items-center gap-1.5 mb-1 text-sm font-orbitron">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ¡Correlación Perfecta Instantánea!
                    </div>
                    Cuando Alice midió y obtuvo <strong className="text-white font-mono">|{aliceMeasured}⟩</strong>, el qubit de Bob colapsó simultáneamente en <strong className="text-white font-mono">|{bobMeasured}⟩</strong> a pesar de estar a miles de kilómetros.
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
            <div className="text-xs font-mono text-purple-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
              <HelpCircle className="w-4 h-4 text-purple-400" /> Comprobación Final
            </div>
            <h2 className="text-2xl sm:text-4xl font-orbitron font-bold text-white tracking-wide">
              Reto de Comprensión
            </h2>
            <p className="text-base sm:text-lg text-slate-200 mt-2 font-semibold max-w-xl mx-auto">
              Si Alice y Bob tienen un par entrelazado y Alice mide su qubit obteniendo |1⟩, ¿qué resultado medirá Bob de forma instantánea?
            </p>
          </div>

          <div className="w-full max-w-xl flex flex-col gap-3.5">
            <button
              onClick={() => handleQuizChoice('random')}
              className={`p-5 rounded-2xl border text-left text-sm leading-normal transition-all ${
                userChoice === 'random'
                  ? 'bg-rose-950/40 border-rose-500 text-rose-200'
                  : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              A) Un valor completamente aleatorio e independiente de Alice
            </button>
            <button
              onClick={() => handleQuizChoice('instant_same')}
              className={`p-5 rounded-2xl border text-left text-sm leading-normal transition-all ${
                userChoice === 'instant_same'
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-semibold shadow-xl shadow-emerald-500/20 ring-2 ring-emerald-500/40'
                  : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              B) Instantáneamente el estado correlacionado (|1⟩), sin retardo de tiempo
            </button>
            <button
              onClick={() => handleQuizChoice('wait_signal')}
              className={`p-5 rounded-2xl border text-left text-sm leading-normal transition-all ${
                userChoice === 'wait_signal'
                  ? 'bg-rose-950/40 border-rose-500 text-rose-200'
                  : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              C) No se sabe hasta que una señal de radio viaje de Alice a Bob
            </button>
          </div>

          {showFeedback && (
            <div
              className={`w-full max-w-xl p-4 rounded-2xl text-sm flex items-center justify-between gap-4 text-left ${
                userChoice === 'instant_same'
                  ? 'bg-emerald-950/30 border border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/30 border border-rose-500/40 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {userChoice === 'instant_same' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                ) : (
                  <HelpCircle className="w-6 h-6 text-rose-400 shrink-0" />
                )}
                <span>
                  {userChoice === 'instant_same'
                    ? '¡Correcto! En un estado entrelazado, la medición de un qubit fija el estado del otro de forma inmediata y no local.'
                    : 'Pista: En el experimento 3D observaste que cuando Alice midió su qubit, el de Bob cambió en el mismo instante exacto.'}
                </span>
              </div>

              {userChoice === 'instant_same' && (
                <button
                  onClick={onComplete}
                  className="py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-orbitron font-bold text-xs uppercase tracking-wider flex items-center gap-2 shrink-0 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
                >
                  Pasar a Tarea 3 <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between items-center border-t border-slate-800 pt-4 mt-4">
        <button
          onClick={step === 0 ? onBack : goToPrevStep}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 transition-all font-mono text-xs uppercase"
        >
          <ArrowLeft className="w-4 h-4" /> {step === 0 ? 'Volver a Tarea 1' : 'Paso Anterior'}
        </button>

        <span className="text-xs font-mono text-slate-500 hidden sm:inline">
          Tip: Usa las flechas del teclado (← / →) para avanzar entre pasos
        </span>

        {step < totalSteps - 1 && (
          <button
            onClick={goToNextStep}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 text-white hover:bg-purple-500 transition-all font-orbitron font-bold text-xs uppercase tracking-wider shadow-md shadow-purple-600/20 active:scale-95"
          >
            Siguiente Paso <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {step === totalSteps - 1 && userChoice !== 'instant_same' && (
          <span className="text-xs font-mono text-slate-400">
            Responde la pregunta arriba para continuar
          </span>
        )}
      </div>
    </div>
  );
}
