'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  CheckCircle2,
  HelpCircle,
  FlaskConical,
  ShieldCheck,
  Award,
  ArrowRight,
  ArrowLeft,
  XCircle,
  Cpu,
  Lock,
  KeyRound,
} from 'lucide-react';
import { playButtonClick, playChimeSuccess, playLaserScan } from '@/lib/sound';
import { saveCompletedMission, updateStoredMetrics } from '@/lib/cookies';
import { formatShorResult, updateExploredApplications } from '@/domain/quantum/applications';
import { useThreeScene } from '@/hooks/useThreeScene';
import { prefersReducedMotion, cached } from '@/lib/three/createScene';
import { createOrbitControls } from '@/hooks/useOrbitControls';

interface Props {
  onFinishAll: () => void;
  onBack: () => void;
}

export default function Mission4Applications({ onFinishAll, onBack }: Props) {
  const [step, setStep] = useState<number>(0);
  const totalSteps = 4;

  const [inspectedMyth, setInspectedMyth] = useState<string>('gaming');
  const [simulationMode, setSimulationMode] = useState<'classical' | 'quantum'>('quantum');

  const [isCracking, setIsCracking] = useState<boolean>(false);
  const [crackSpeed, setCrackSpeed] = useState<string>('En espera');

  const [userChoice, setUserChoice] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const moleculeGroupRef = useRef<THREE.Group | null>(null);
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
    cameraPos: [0, 0, 3.8],
    cameraLookAt: [0, 0, 0],
    recreateOn: step === 1 ? 'm4-visible' : 'm4-hidden',
    onSetup: (handle) => {
      const moleculeGroup = new THREE.Group();
      moleculeGroupRef.current = moleculeGroup;
      handle.add(moleculeGroup);

      const atomGeo = cached('m4:atom', () => new THREE.SphereGeometry(0.2, 16, 16));
      const atomMatCyan = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true });
      const atomMatPurple = new THREE.MeshBasicMaterial({ color: 0xa855f7, wireframe: true });
      const atomMatGreen = new THREE.MeshBasicMaterial({ color: 0x10b981, wireframe: true });

      const atomPositions: Array<[number, number, number]> = [
        [0, 0, 0],
        [0.8, 0.6, 0.1],
        [-0.8, 0.5, -0.1],
        [0.1, -0.9, 0.4],
        [-0.6, -0.7, -0.5],
        [0.9, -0.4, 0.6],
      ];
      const materials = [atomMatCyan, atomMatPurple, atomMatGreen, atomMatCyan, atomMatPurple, atomMatGreen];
      atomPositions.forEach((pos, idx) => {
        const atom = new THREE.Mesh(atomGeo, materials[idx]);
        atom.position.set(pos[0], pos[1], pos[2]);
        moleculeGroup.add(atom);
      });

      const bondGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.8, 0.6, 0.1),
        new THREE.Vector3(0, 0, 0), new THREE.Vector3(-0.8, 0.5, -0.1),
        new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.1, -0.9, 0.4),
        new THREE.Vector3(0.1, -0.9, 0.4), new THREE.Vector3(-0.6, -0.7, -0.5),
        new THREE.Vector3(0.8, 0.6, 0.1), new THREE.Vector3(0.9, -0.4, 0.6),
      ]);
      const bondMat = new THREE.LineBasicMaterial({ color: 0x64748b, transparent: true, opacity: 0.7 });
      moleculeGroup.add(new THREE.LineSegments(bondGeo, bondMat));

      const pGeo = new THREE.BufferGeometry();
      const pPos = new Float32Array(50 * 3);
      for (let i = 0; i < 50 * 3; i += 3) {
        pPos[i] = (Math.random() - 0.5) * 4;
        pPos[i + 1] = (Math.random() - 0.5) * 3;
        pPos[i + 2] = (Math.random() - 0.5) * 3;
      }
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
      const particles = new THREE.Points(
        pGeo,
        new THREE.PointsMaterial({ color: 0x00f0ff, size: 0.025, transparent: true, opacity: 0.3 })
      );
      handle.add(particles);

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

      const reduced = prefersReducedMotion();
      handle.onFrame((_t, dt) => {
        controls.update(dt);
        if (!reduced) {
          moleculeGroup.rotation.y += 0.008;
          moleculeGroup.rotation.x += 0.003;
        }
      });

      return () => {
        controls.dispose();
        moleculeGroupRef.current = null;
      };
    },
  });

  const handleSimulateShor = () => {
    playLaserScan();
    setIsCracking(true);
    setCrackSpeed('Procesando estados cuánticos en superposición...');

    setTimeout(() => {
      playChimeSuccess();
      setIsCracking(false);
      // Extracted domain rule calls
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
    <div className="w-full flex-1 mx-auto flex flex-col justify-between py-2 text-slate-100 min-h-[640px]">
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
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-7 py-4 animate-in fade-in zoom-in-95 duration-300">
          <div>
            <div className="text-xs font-mono text-emerald-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" /> Desmitificando la Tecnología
            </div>
            <h2 className="text-3xl sm:text-5xl font-orbitron font-bold text-white tracking-wide">
              ¿Para qué NO sirve un Computador Cuántico?
            </h2>
            <p className="text-base sm:text-lg text-slate-300 mt-3 max-w-xl mx-auto leading-relaxed">
              Existe la creencia popular de que un procesador cuántico es simplemente &quot;un ordenador normal pero mil veces más rápido&quot;. <strong className="text-rose-400">Esto es falso</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-3xl text-left">
            <div
              onClick={() => {
                playButtonClick();
                setInspectedMyth('gaming');
              }}
              className={`p-6 rounded-3xl border cursor-pointer transition-all shadow-xl flex flex-col gap-3 ${
                inspectedMyth === 'gaming'
                  ? 'bg-rose-950/30 border-rose-500/60 ring-2 ring-rose-500/30'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-rose-400 font-bold flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" /> Mito Frecuente
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                  Uso Inadecuado
                </span>
              </div>
              <h3 className="font-orbitron font-bold text-white text-base">Videojuegos, Navegar o YouTube</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Un computador cuántico funcionaría <strong className="text-white">mucho peor y más lento</strong> que tu smartphone ejecutando tareas cotidianas, porque no está diseñado para cálculos secuenciales estándar.
              </p>
            </div>

            <div
              onClick={() => {
                playButtonClick();
                setInspectedMyth('science');
              }}
              className={`p-6 rounded-3xl border cursor-pointer transition-all shadow-xl flex flex-col gap-3 ${
                inspectedMyth === 'science'
                  ? 'bg-emerald-950/30 border-emerald-500/60 ring-2 ring-emerald-500/30'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Verdadera Ventaja
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Ventaja Exponencial
                </span>
              </div>
              <h3 className="font-orbitron font-bold text-white text-base">Problemas Combinatorios Masivos</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Su verdadero poder radica en problemas donde la cantidad de combinaciones es tan gigantesca que a un supercomputador clásico le tomaría la <strong className="text-white">edad del universo</strong> resolverlos.
              </p>
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-4 py-2 animate-in fade-in zoom-in-95 duration-300">
          <div>
            <div className="text-xs font-mono text-emerald-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
              <FlaskConical className="w-4 h-4 text-emerald-400" /> El Santo Grial
            </div>
            <h2 className="text-2xl sm:text-4xl font-orbitron font-bold text-white tracking-wide">
              Simulación Molecular y Química
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl mx-auto leading-relaxed">
              La naturaleza no es clásica: está hecha de partículas cuánticas. Para modelar un medicamento o catalizador, necesitas un ordenador que hable el mismo lenguaje.
            </p>
          </div>

          <div className="w-full max-w-2xl p-4 rounded-3xl bg-[#060a14] border border-slate-800/90 shadow-2xl relative flex flex-col items-center">
            <div ref={containerRef}
              role="img"
              aria-label="Modelo molecular interactivo para simulación cuántica" className="w-full" />

            <div className="w-full max-w-lg mt-2 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    playButtonClick();
                    setSimulationMode('classical');
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-orbitron font-semibold transition-all ${
                    simulationMode === 'classical'
                      ? 'bg-rose-950/50 border-rose-500 text-rose-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  Supercomputador Clásico
                </button>
                <button
                  onClick={() => {
                    playButtonClick();
                    setSimulationMode('quantum');
                  }}
                  className={`py-2 px-3 rounded-xl border text-xs font-orbitron font-semibold transition-all ${
                    simulationMode === 'quantum'
                      ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/40'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  Procesador Cuántico
                </button>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-left">
                {simulationMode === 'classical' ? (
                  <p className="text-rose-300">
                    <strong className="block text-white mb-1">Enfoque Clásico:</strong>
                    Para calcular todas las interacciones electrónicas exactas de una molécula como la fijasa del nitrógeno, se requeriría más memoria que todos los átomos del universo observable. Tiempo estimado: <strong className="text-white">+10.000 años</strong>.
                  </p>
                ) : (
                  <p className="text-emerald-300">
                    <strong className="block text-white mb-1">Enfoque Cuántico:</strong>
                    Cada enlace y orbital electrónico de la molécula se mapea directamente a un qubit. El computador cuántico simula la física cuántica de forma natural y paralela. Tiempo estimado: <strong className="text-white">Minutos</strong>.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-6 py-4 animate-in fade-in zoom-in-95 duration-300">
          <div>
            <div className="text-xs font-mono text-emerald-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Seguridad Informática
            </div>
            <h2 className="text-2xl sm:text-4xl font-orbitron font-bold text-white tracking-wide">
              Criptografía y Algoritmo de Shor
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl mx-auto leading-relaxed">
              Toda la seguridad de internet (banca, contraseñas, comercio electrónico RSA) depende de que es casi imposible factorizar números primos gigantes.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-950/80 border border-slate-800/90 backdrop-blur-md shadow-2xl flex flex-col items-center gap-5 w-full max-w-xl">
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-2 text-slate-300">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Clave RSA-2048 (617 dígitos)</span>
              </div>
            </div>

            <button
              onClick={handleSimulateShor}
              disabled={isCracking}
              className="py-4 px-8 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-orbitron font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-500/25 active:scale-95 disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              {isCracking ? 'Ejecutando Algoritmo de Shor...' : 'Probar Algoritmo de Shor Cuántico'}
            </button>

            <div className="w-full p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-left flex flex-col gap-2 font-mono">
              <div className="text-slate-400 flex justify-between">
                <span>Supercomputador Clásico:</span>
                <span className="text-rose-400">~300 billones de años</span>
              </div>
              <div className="text-slate-400 flex justify-between border-t border-slate-800/80 pt-1.5">
                <span>Computador Cuántico (Shor):</span>
                <span data-testid="shor-status" className="text-emerald-400 font-bold">{crackSpeed}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-normal max-w-md">
              El algoritmo de Shor utiliza la superposición y la transformada de Fourier cuántica para encontrar el periodo del número primo de un solo golpe. Por eso el mundo ya migra a la criptografía post-cuántica.
            </p>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-6 py-4 animate-in fade-in zoom-in-95 duration-300">
          <div>
            <div className="text-xs font-mono text-emerald-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-400" /> Evaluación Final
            </div>
            <h2 className="text-2xl sm:text-4xl font-orbitron font-bold text-white tracking-wide">
              Reto de Comprensión
            </h2>
            <p className="text-base sm:text-lg text-slate-200 mt-2 font-semibold max-w-xl mx-auto">
              ¿En cuál de estos campos ofrece la computación cuántica una verdadera ventaja exponencial frente a los computadores clásicos?
            </p>
          </div>

          <div className="w-full max-w-xl flex flex-col gap-3.5">
            <button
              onClick={() => handleQuizChoice('gaming_fps')}
              className={`p-5 rounded-2xl border text-left text-sm leading-normal transition-all ${
                userChoice === 'gaming_fps'
                  ? 'bg-rose-950/40 border-rose-500 text-rose-200'
                  : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              A) Ejecutar videojuegos con mayores tasas de cuadros por segundo (FPS)
            </button>
            <button
              onClick={() => handleQuizChoice('molecules_crypto')}
              className={`p-5 rounded-2xl border text-left text-sm leading-normal transition-all ${
                userChoice === 'molecules_crypto'
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-semibold shadow-xl shadow-emerald-500/20 ring-2 ring-emerald-500/40'
                  : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              B) Simular moléculas complejas y factorizar números primos para criptografía
            </button>
            <button
              onClick={() => handleQuizChoice('storage_photos')}
              className={`p-5 rounded-2xl border text-left text-sm leading-normal transition-all ${
                userChoice === 'storage_photos'
                  ? 'bg-rose-950/40 border-rose-500 text-rose-200'
                  : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              C) Almacenar terabytes de fotos y videos de forma más barata
            </button>
          </div>

          {showFeedback && (
            <div
              className={`w-full max-w-xl p-4 rounded-2xl text-sm flex items-center justify-between gap-4 text-left ${
                userChoice === 'molecules_crypto'
                  ? 'bg-emerald-950/30 border border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/30 border border-rose-500/40 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {userChoice === 'molecules_crypto' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                ) : (
                  <HelpCircle className="w-6 h-6 text-rose-400 shrink-0" />
                )}
                <span>
                  {userChoice === 'molecules_crypto'
                    ? '¡Excelente deducción! La computación cuántica no sustituye las tareas ordinarias, sino que resuelve problemas de simulación atómica y álgebra masiva intratables para la física clásica.'
                    : 'Pista: Recuerda que un computador cuántico no es para mejorar juegos ni guardar archivos, sino para simular la propia física cuántica o resolver factorización masiva.'}
                </span>
              </div>

              {userChoice === 'molecules_crypto' && (
                <button
                  onClick={onFinishAll}
                  className="py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-orbitron font-bold text-xs uppercase tracking-wider flex items-center gap-2 shrink-0 transition-all shadow-xl shadow-emerald-500/30 active:scale-95"
                >
                  <Award className="w-4 h-4" /> Finalizar Laboratorio
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
          <ArrowLeft className="w-4 h-4" /> {step === 0 ? 'Volver a Tarea 3' : 'Paso Anterior'}
        </button>

        <span className="text-xs font-mono text-slate-500 hidden sm:inline">
          Tip: Usa las flechas del teclado (← / →) para avanzar entre pasos
        </span>

        {step < totalSteps - 1 && (
          <button
            onClick={goToNextStep}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 transition-all font-orbitron font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-500/20 active:scale-95"
          >
            Siguiente Paso <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {step === totalSteps - 1 && userChoice !== 'molecules_crypto' && (
          <span className="text-xs font-mono text-slate-400">
            Responde la pregunta arriba para finalizar
          </span>
        )}
      </div>
    </div>
  );
}
