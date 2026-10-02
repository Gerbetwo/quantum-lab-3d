'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  ThermometerSnowflake,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  Shield,
  Zap,
} from 'lucide-react';
import {
  playButtonClick,
  playChimeSuccess,
  playDecoherenceAlert,
  playLaserScan,
} from '@/lib/sound';
import { saveCompletedMission, updateStoredMetrics } from '@/lib/cookies';
import { calculateCoherenceTime, isCriticalDecoherence } from '@/domain/quantum/decoherence';
import { useThreeScene } from '@/hooks/useThreeScene';
import { prefersReducedMotion, cached } from '@/lib/three/createScene';
import { createOrbitControls } from '@/hooks/useOrbitControls';

interface Props {
  onComplete: () => void;
  onBack: () => void;
}

export default function Mission3Decoherence({ onComplete, onBack }: Props) {
  const [step, setStep] = useState<number>(0);
  const totalSteps = 4;

  const [photonHits, setPhotonHits] = useState<number>(0);

  const [temperatureMilliKelvin, setTemperatureMilliKelvin] = useState<number>(15);
  // Extracted domain rule calls
  const isCritical = isCriticalDecoherence(temperatureMilliKelvin);
  const coherenceTimeUs = calculateCoherenceTime(temperatureMilliKelvin);

  const [isCryoShieldActive, setIsCryoShieldActive] = useState<boolean>(false);

  const [userChoice, setUserChoice] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const coreMeshRef = useRef<THREE.Mesh | null>(null);
  const chandelierGroupRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const particleVelocitiesRef = useRef<Float32Array | null>(null);
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

  const temperatureRef = useRef(temperatureMilliKelvin);
  useEffect(() => {
    temperatureRef.current = temperatureMilliKelvin;
  }, [temperatureMilliKelvin]);

  useThreeScene(containerRef, {
    width: 600,
    height: 360,
    viewportRelative: true,
    aspect: 16 / 10,
    cameraPos: [0, 0.2, 4.2],
    cameraLookAt: [0, 0, 0],
    recreateOn: step === 1 || step === 2 ? 'm3-visible' : 'm3-hidden',
    onSetup: (handle) => {
      const chandelier = new THREE.Group();
      chandelierGroupRef.current = chandelier;

      const ringRadii = [1.3, 0.95, 0.65];
      const ringHeights = [0.9, 0.45, 0.0];
      ringRadii.forEach((r, idx) => {
        const ringGeo = cached('m3:torus:' + r, () => new THREE.TorusGeometry(r, 0.025, 16, 48));
        const ringMesh = new THREE.Mesh(
          ringGeo,
          new THREE.MeshBasicMaterial({ color: 0xf59e0b, wireframe: true })
        );
        ringMesh.rotation.x = Math.PI / 2;
        ringMesh.position.y = ringHeights[idx];
        chandelier.add(ringMesh);
      });
      handle.add(chandelier);

      const coreGeo = cached('m3:core', () => new THREE.BoxGeometry(0.55, 0.3, 0.55));
      const coreMesh = new THREE.Mesh(
        coreGeo,
        new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true })
      );
      coreMesh.position.y = -0.4;
      coreMeshRef.current = coreMesh;
      handle.add(coreMesh);

      const pCount = 90;
      const pGeo = new THREE.BufferGeometry();
      const pPos = new Float32Array(pCount * 3);
      const pVel = new Float32Array(pCount * 3);
      for (let i = 0; i < pCount * 3; i += 3) {
        pPos[i] = (Math.random() - 0.5) * 3.5;
        pPos[i + 1] = (Math.random() - 0.5) * 2.5;
        pPos[i + 2] = (Math.random() - 0.5) * 2.5;
        pVel[i] = (Math.random() - 0.5) * 0.01;
        pVel[i + 1] = (Math.random() - 0.5) * 0.01;
        pVel[i + 2] = (Math.random() - 0.5) * 0.01;
      }
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
      particleVelocitiesRef.current = pVel;

      const particles = new THREE.Points(
        pGeo,
        new THREE.PointsMaterial({
          color: 0x00f0ff,
          size: 0.04,
          transparent: true,
          opacity: 0.65,
        })
      );
      particlesRef.current = particles;
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
        if (!reduced) chandelier.rotation.y += 0.004;

        const currentTemp = temperatureRef.current;
        if (coreMeshRef.current) {
          if (currentTemp > 1200) {
            coreMeshRef.current.position.x = (Math.random() - 0.5) * 0.05;
            coreMeshRef.current.position.z = (Math.random() - 0.5) * 0.05;
            (coreMeshRef.current.material as THREE.MeshBasicMaterial).color.setHex(0xf43f5e);
          } else {
            coreMeshRef.current.position.x = 0;
            coreMeshRef.current.position.z = 0;
            (coreMeshRef.current.material as THREE.MeshBasicMaterial).color.setHex(0x00f0ff);
          }
        }

        if (particlesRef.current && particleVelocitiesRef.current) {
          const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
          const vels = particleVelocitiesRef.current;
          const speedMultiplier = Math.max(0.2, currentTemp / 300);
          for (let i = 0; i < positions.length; i += 3) {
            positions[i] += vels[i] * speedMultiplier;
            positions[i + 1] += vels[i + 1] * speedMultiplier;
            positions[i + 2] += vels[i + 2] * speedMultiplier;
            if (Math.abs(positions[i]) > 2) positions[i] *= -0.9;
            if (Math.abs(positions[i + 1]) > 1.5) positions[i + 1] *= -0.9;
            if (Math.abs(positions[i + 2]) > 1.5) positions[i + 2] *= -0.9;
          }
          particlesRef.current.geometry.attributes.position.needsUpdate = true;
        }
      });

      return () => {
        controls.dispose();
        chandelierGroupRef.current = null;
        coreMeshRef.current = null;
        particlesRef.current = null;
        particleVelocitiesRef.current = null;
      };
    },
  });

  const handleSimulatePhotonHit = () => {
    playDecoherenceAlert();
    setPhotonHits((prev) => prev + 1);
  };

  const handleTemperatureChange = (val: number) => {
    setTemperatureMilliKelvin(val);
    if (val > 1200) {
      playDecoherenceAlert();
    }
    updateStoredMetrics((prev) => ({
      ...prev,
      actions: {
        ...prev.actions,
        decoherenceTested: true,
      },
    }));
  };

  const handleToggleCryoShield = () => {
    playLaserScan();
    setTimeout(() => playChimeSuccess(), 250);
    setIsCryoShieldActive(true);
    setTemperatureMilliKelvin(15);
  };

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

  return (
    <div className="w-full flex-1 max-w-5xl mx-auto flex flex-col justify-between py-2 text-slate-100 min-h-[640px]">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30">
            Tarea 3
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
                  ? 'w-8 bg-amber-400 shadow-sm shadow-amber-400/50'
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
            <div className="text-xs font-mono text-amber-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" /> El Mayor Enemigo Cuántico
            </div>
            <h2 className="text-3xl sm:text-5xl font-orbitron font-bold text-white tracking-wide">
              La Fragilidad Cuántica
            </h2>
            <p className="text-base sm:text-lg text-slate-300 mt-3 max-w-xl mx-auto leading-relaxed">
              Un qubit en superposición es extremadamente delicado. Cualquier partícula de calor, vibración o radiación ambiental provoca <strong className="text-amber-400">decoherencia</strong>, destruyendo el cálculo.
            </p>
          </div>

          <div className="p-8 sm:p-10 rounded-3xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-md shadow-2xl flex flex-col items-center gap-6 w-full max-w-md">
            <button
              onClick={handleSimulatePhotonHit}
              className="w-full py-4 px-6 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 border-2 border-amber-500/40 hover:border-amber-400 text-amber-300 font-mono text-base transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl group"
            >
              <Zap className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Disparar Fotón Térmico Parásito</span>
            </button>

            <div className="text-2xl font-orbitron font-bold text-white">
              Perturbaciones: <span data-testid="photon-counter" aria-live="polite" className="text-rose-400">{photonHits}</span>
            </div>

            {photonHits > 0 && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-200 text-xs text-left animate-in fade-in">
                ¡Alerta! Cada impacto perturba la fase cuántica del qubit, convirtiendo un cálculo exacto en ruido aleatorio.
              </div>
            )}

            <p className="text-xs text-slate-400 leading-normal max-w-xs">
              Para evitar esto, los procesadores cuánticos deben aislarse al vacío absoluto y enfriarse a temperaturas extremas.
            </p>
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
            <h2 className="text-2xl sm:text-4xl font-orbitron font-bold text-white tracking-wide">
              {step === 1 && 'Simulador Térmico Criogénico'}
              {step === 2 && 'El Refrigerador de Dilución'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl mx-auto leading-relaxed">
              {step === 1 && 'Mueve el deslizador térmico. Observa cómo al subir la temperatura, el calor bombardea el procesador y destruye el tiempo de coherencia.'}
              {step === 2 && 'Ese icónico &quot;candelabro dorado&quot; contiene etapas concéntricas de enfriamiento criogénico con isótopos de helio al vacío absoluto.'}
            </p>
          </div>

          <div className="w-full max-w-2xl p-4 rounded-3xl bg-[#060a14] border border-slate-800/90 shadow-2xl relative flex flex-col items-center">
            <div ref={containerRef}
              role="img"
              aria-label="Refrigerador criogénico de dilución interactivo" className="w-full" />

            {step === 1 && (
              <div className="w-full max-w-lg mt-2 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-400">Temperatura del Procesador:</span>
                  <span className={`font-bold text-sm ${isCritical ? 'text-rose-400 animate-pulse' : 'text-cyan'}`}>
                    {temperatureMilliKelvin >= 1000
                      ? `${(temperatureMilliKelvin / 1000).toFixed(1)} K (${Math.round((temperatureMilliKelvin / 1000) - 273.15)}°C)`
                      : `${temperatureMilliKelvin} mK (0.015 K)`}
                  </span>
                </div>

                <input
                  type="range"
                  min="15"
                  max="5000"
                  step="25"
                  value={temperatureMilliKelvin}
                  onChange={(e) => handleTemperatureChange(parseInt(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-left">
                    <div className="text-[10px] font-mono text-slate-400">Tiempo de Coherencia T₂:</div>
                    <div data-testid="coherence-time" className={`text-base font-orbitron font-bold mt-0.5 ${coherenceTimeUs < 10 ? 'text-rose-400' : 'text-cyan'}`}>
                      {coherenceTimeUs} μs
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-left">
                    <div className="text-[10px] font-mono text-slate-400">Estado Cuántico:</div>
                    <div className={`text-xs font-orbitron font-bold mt-1 ${isCritical ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {isCritical ? 'Decoherencia Crítica' : 'Coherente y Estable'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="w-full max-w-md mt-2 flex flex-col gap-3">
                <button
                  onClick={handleToggleCryoShield}
                  className={`w-full py-3.5 px-6 rounded-2xl font-orbitron font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl active:scale-95 ${
                    isCryoShieldActive
                      ? 'bg-cyan text-slate-950 shadow-cyan/30 ring-2 ring-cyan/40'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25'
                  }`}
                >
                  <ThermometerSnowflake className="w-4 h-4" />
                  {isCryoShieldActive ? '¡Enfriamiento Cuántico a 15 mK Activo!' : 'Activar Bombas Criogénicas de Dilución'}
                </button>

                {isCryoShieldActive && (
                  <div data-testid="cryo-active-banner" className="p-3.5 rounded-2xl bg-cyan/10 border border-cyan/40 text-cyan text-xs text-left animate-in fade-in">
                    <div className="font-bold flex items-center gap-1.5 mb-1 text-sm font-orbitron text-white">
                      <CheckCircle2 className="w-4 h-4 text-cyan" />
                      Temperatura: 15 mK (-273.135 °C)
                    </div>
                    Las vibraciones térmicas se han detenido casi por completo. El chip superconductor puede operar con cálculos cuánticos de alta fidelidad.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-6 py-4 animate-in fade-in zoom-in-95 duration-300">
          <div>
            <div className="text-xs font-mono text-amber-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-400" /> Comprobación Final
            </div>
            <h2 className="text-2xl sm:text-4xl font-orbitron font-bold text-white tracking-wide">
              Reto de Comprensión
            </h2>
            <p className="text-base sm:text-lg text-slate-200 mt-2 font-semibold max-w-xl mx-auto">
              ¿Por qué los computadores cuánticos basados en superconductores deben operar a temperaturas cercanas al cero absoluto?
            </p>
          </div>

          <div className="w-full max-w-xl flex flex-col gap-3.5">
            <button
              onClick={() => handleQuizChoice('faster_electricity')}
              className={`p-5 rounded-2xl border text-left text-sm leading-normal transition-all ${
                userChoice === 'faster_electricity'
                  ? 'bg-rose-950/40 border-rose-500 text-rose-200'
                  : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              A) Para que la electricidad viaje más rápido por los cables del procesador
            </button>
            <button
              onClick={() => handleQuizChoice('vibrations_noise')}
              className={`p-5 rounded-2xl border text-left text-sm leading-normal transition-all ${
                userChoice === 'vibrations_noise'
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-semibold shadow-xl shadow-emerald-500/20 ring-2 ring-emerald-500/40'
                  : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              B) Para eliminar el calor y las vibraciones atómicas que causan decoherencia
            </button>
            <button
              onClick={() => handleQuizChoice('software_heat')}
              className={`p-5 rounded-2xl border text-left text-sm leading-normal transition-all ${
                userChoice === 'software_heat'
                  ? 'bg-rose-950/40 border-rose-500 text-rose-200'
                  : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              C) Porque el software cuántico genera demasiado calor al procesar algoritmos
            </button>
          </div>

          {showFeedback && (
            <div
              className={`w-full max-w-xl p-4 rounded-2xl text-sm flex items-center justify-between gap-4 text-left ${
                userChoice === 'vibrations_noise'
                  ? 'bg-emerald-950/30 border border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/30 border border-rose-500/40 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {userChoice === 'vibrations_noise' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                ) : (
                  <HelpCircle className="w-6 h-6 text-rose-400 shrink-0" />
                )}
                <span>
                  {userChoice === 'vibrations_noise'
                    ? '¡Exacto! El calor ambiente introduce ruido térmico y fotones que destruyen la superposición cuántica casi instantáneamente.'
                    : 'Pista: En el simulador viste que al subir la temperatura, el ruido térmico hizo caer en picado el tiempo de coherencia.'}
                </span>
              </div>

              {userChoice === 'vibrations_noise' && (
                <button
                  onClick={onComplete}
                  className="py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-orbitron font-bold text-xs uppercase tracking-wider flex items-center gap-2 shrink-0 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
                >
                  Pasar a Tarea 4 <ArrowRight className="w-4 h-4" />
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
          <ArrowLeft className="w-4 h-4" /> {step === 0 ? 'Volver a Tarea 2' : 'Paso Anterior'}
        </button>

        <span className="text-xs font-mono text-slate-500 hidden sm:inline">
          Tip: Usa las flechas del teclado (← / →) para avanzar entre pasos
        </span>

        {step < totalSteps - 1 && (
          <button
            onClick={goToNextStep}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-400 text-slate-950 hover:bg-amber-300 transition-all font-orbitron font-bold text-xs uppercase tracking-wider shadow-md shadow-amber-400/20 active:scale-95"
          >
            Siguiente Paso <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {step === totalSteps - 1 && userChoice !== 'vibrations_noise' && (
          <span className="text-xs font-mono text-slate-400">
            Responde la pregunta arriba para continuar
          </span>
        )}
      </div>
    </div>
  );
}
