'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ArrowLeft, ArrowRight, CheckCircle2, HelpCircle, Zap } from 'lucide-react';
import clsx from 'clsx';
import { playButtonClick, playChimeSuccess, playLaserScan } from '@/shared/lib/sound';
import { saveCompletedMission, updateStoredMetrics } from '@/features/session/lib/cookies';
import { useMissionTitle } from '@/features/missions/hooks/useMissionTitle';
import {
  X_GATE, Z_GATE, H_GATE, I_GATE,
  applyGate,  evaluateCircuit, stateToBlochAngles, stateLabel,
  type StateVector, type GateMatrix,
} from '@/core/quantum/gates';
import { useThreeScene } from '@/features/quantum-3d/hooks/useThreeScene';
import { createOrbitControls } from '@/features/quantum-3d/hooks/useOrbitControls';
import { prefersReducedMotion, cached } from '@/features/quantum-3d/lib/createScene';

interface Props {
  onComplete: () => void;
  onBack: () => void;
}

type GateKey = 'X' | 'Z' | 'H' | 'I';

const KET0: StateVector = [{ re: 1, im: 0 }, { re: 0, im: 0 }];
const GATES: Record<GateKey, GateMatrix> = { X: X_GATE, Z: Z_GATE, H: H_GATE, I: I_GATE };
const CYCLE: GateKey[] = ['I', 'X', 'Z', 'H'];

const STEP_TITLES = [
  'Manipulando el Qubit',
  'Aplica Compuertas en Vivo',
  'Tres Compuertas en Secuencia',
  'De Superposición a Bell',
  'Comprobación',
] as const;

export default function Mission5Gates({ onComplete, onBack }: Props) {
  const totalSteps = 5;
  const [step, setStep] = useState<number>(0);
  const [state, setState] = useState<StateVector>(KET0);
  const [circuit, setCircuit] = useState<GateKey[]>(['I', 'I', 'I']);
  const [circuitResult, setCircuitResult] = useState<StateVector | null>(null);
  const [bellPrepared, setBellPrepared] = useState(false);
  const [userChoice, setUserChoice] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<THREE.ArrowHelper | null>(null);
  const targetThetaRef = useRef(0);
  const currentThetaRef = useRef(0);

  const goNext = useCallback(() => { playButtonClick(); setStep((s) => Math.min(s + 1, totalSteps - 1)); }, []);
  const goPrev = useCallback(() => { playButtonClick(); setStep((s) => Math.max(s - 1, 0)); }, []);
  const goTo = useCallback((n: number) => { playButtonClick(); setStep(n); }, []);

  useThreeScene(containerRef, {
    width: 600,
    height: 360,
    viewportRelative: true,
    aspect: 16 / 10,
    cameraPos: [0, 0.8, 3.2],
    cameraLookAt: [0, 0, 0],
    recreateOn: step >= 1 && step <= 3 ? 'm5-visible' : 'm5-hidden',
    onSetup: (handle) => {
      const sphereGeo = cached('m5:sphere', () => new THREE.SphereGeometry(1, 32, 24));
      const sphereMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff, wireframe: true, transparent: true, opacity: 0.16,
      });
      handle.add(new THREE.Mesh(sphereGeo, sphereMat));

      const axisGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 1.15, 0), new THREE.Vector3(0, -1.15, 0),
      ]);
      const axisMat = new THREE.LineDashedMaterial({
        color: 0x64748b, dashSize: 0.05, gapSize: 0.03, transparent: true, opacity: 0.6,
      });
      const axis = new THREE.Line(axisGeo, axisMat);
      axis.computeLineDistances();
      handle.add(axis);

      const arrow = new THREE.ArrowHelper(
        new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 1, 0x00f0ff, 0.22, 0.12
      );
      arrowRef.current = arrow;
      handle.add(arrow);

      const pGeo = new THREE.BufferGeometry();
      const pPos = new Float32Array(50 * 3);
      for (let i = 0; i < 50 * 3; i += 3) {
        pPos[i] = (Math.random() - 0.5) * 3;
        pPos[i + 1] = (Math.random() - 0.5) * 3;
        pPos[i + 2] = (Math.random() - 0.5) * 3;
      }
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
      const particles = new THREE.Points(
        pGeo,
        new THREE.PointsMaterial({ color: 0xa855f7, size: 0.025, transparent: true, opacity: 0.3 })
      );
      handle.add(particles);

      const controls = createOrbitControls(handle.camera, handle.renderer.domElement, {
        enablePan: false, enableZoom: true, enableRotate: true,
        minDistance: 2.0, maxDistance: 8.0,
        autoRotate: !prefersReducedMotion(), autoRotateSpeed: 0.3,
        enableDamping: true, dampingFactor: 0.12, target: [0, 0, 0],
      });

      const reduced = prefersReducedMotion();
      handle.onFrame((_t, dt) => {
        controls.update(dt);
        if (!reduced) particles.rotation.y -= 0.0006;
        currentThetaRef.current += (targetThetaRef.current - currentThetaRef.current) * 0.18;
        const theta = currentThetaRef.current;
        arrow.setDirection(new THREE.Vector3(Math.sin(theta), Math.cos(theta), 0).normalize());
      });

      return () => {
        controls.dispose();
        arrowRef.current = null;
      };
    },
  });

  useEffect(() => {
    const { theta } = stateToBlochAngles(state);
    targetThetaRef.current = theta;
  }, [state]);

  const applyGateByKey = (key: 'X' | 'Z' | 'H') => {
    playLaserScan();
    setState(applyGate(state, GATES[key]));
    updateStoredMetrics((prev) => ({
      ...prev,
      actions: {
        ...prev.actions,
        applicationsExplored: Array.from(new Set([...prev.actions.applicationsExplored, 'gate_' + key.toLowerCase()])),
      },
    }));
  };

  const cycleSlot = (i: number) => {
    playButtonClick();
    setCircuit((prev) => {
      const next = [...prev];
      next[i] = CYCLE[(CYCLE.indexOf(next[i]) + 1) % CYCLE.length];
      return next;
    });
    setCircuitResult(null);
  };

  const runCircuit = () => {
    playLaserScan();
    const gates = circuit.map((g) => GATES[g]);
    const result = evaluateCircuit(gates, KET0);
    setCircuitResult(result);
    setState(result);
  };

  const prepareBell = () => {
    playLaserScan();
    setTimeout(() => playChimeSuccess(), 150);
    setBellPrepared(true);
  };

  const handleQuizChoice = (choice: string) => {
    setUserChoice(choice);
    setShowFeedback(true);
    if (choice === 'plus_state') {
      playChimeSuccess();
      saveCompletedMission(4);
    } else {
      playButtonClick();
    }
  };

  const renderGateBadge = (g: GateKey) =>
    g === 'I' ? '—' : g;

  useMissionTitle(STEP_TITLES[step] ?? '');

  return (
    <div className="w-full flex-1 mx-auto flex flex-col justify-between py-2 text-slate-100 min-h-[640px]">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-pink-400 px-2.5 py-1 rounded-md bg-pink-500/10 border border-pink-500/30">
            Tarea 5
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
                step === i ? 'w-8 bg-pink-500 shadow-sm shadow-pink-500/50'
                  : i < step ? 'w-3 bg-emerald-500'
                  : 'w-2 bg-slate-800 hover:bg-slate-700'
              )}
            />
          ))}
        </div>
      </div>

      {step === 0 && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-7 py-4 animate-in fade-in zoom-in-95 duration-300">
          <div data-testid="mission5-intro">
            <div className="text-xs font-mono text-pink-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
              <Zap className="w-4 h-4 text-pink-400" /> Compuertas Cuanticas
            </div>
            <p className="text-base sm:text-lg text-slate-300 mt-3 max-w-xl mx-auto leading-relaxed">
              Una <strong className="text-pink-400">compuerta cuantica</strong> es una operacion que transforma el estado de un qubit. A diferencia de la logica clasica, admite rotaciones continuas y crea superposiciones.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full  text-left">
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-pink-500/40">
              <div className="font-orbitron font-bold text-pink-400 text-lg mb-1">X</div>
              <div className="text-xs text-slate-400 mb-2">Bit-flip</div>
              <p className="text-xs text-slate-300">Equivale al NOT clasico. Intercambia |0&#10217; y |1&#10217;.</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-purple-500/40">
              <div className="font-orbitron font-bold text-purple-400 text-lg mb-1">Z</div>
              <div className="text-xs text-slate-400 mb-2">Phase-flip</div>
              <p className="text-xs text-slate-300">Invierte la fase de |1&#10217;. Invisible en mediciones directas.</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-cyan/40">
              <div className="font-orbitron font-bold text-cyan text-lg mb-1">H</div>
              <div className="text-xs text-slate-400 mb-2">Hadamard</div>
              <p className="text-xs text-slate-300">Crea superposicion perfecta 50/50 desde un estado base.</p>
            </div>
          </div>
        </div>
      )}

      {(step === 1 || step === 2 || step === 3) && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-4 py-2 animate-in fade-in zoom-in-95 duration-300">
          <div>
            <div className="text-xs font-mono text-pink-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
              {step === 1 && <><Zap className="w-4 h-4 text-pink-400" /> Playground de Compuertas</>}
              {step === 2 && <><ArrowRight className="w-4 h-4 text-pink-400" /> Constructor de Circuito</>}
              {step === 3 && <><CheckCircle2 className="w-4 h-4 text-pink-400" /> Entrelazamiento via CNOT</>}
            </div>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl mx-auto leading-relaxed">
              {step === 1 && 'Presiona X, Z o H. La flecha de la esfera de Bloch se actualiza al estado resultante.'}
              {step === 2 && 'Haz click en cada slot para rotar la compuerta. Ejecuta para ver el estado final.'}
              {step === 3 && 'Aplica H a |0&#10217; y luego CNOT. El resultado es un par entrelazado de Bell.'}
            </p>
          </div>

          <div className="w-full  p-4 rounded-3xl bg-[#060a14] border border-slate-800/90 shadow-2xl flex flex-col items-center">
            <div
              ref={containerRef}
              role="img"
              aria-label="Esfera de Bloch interactiva"
              className="w-full cursor-grab active:cursor-grabbing touch-none select-none my-1"
            />

            {step === 1 && (
              <div className="w-full max-w-lg mt-2 flex flex-col gap-3">
                <div className="flex gap-3">
                  <button
                    onClick={() => applyGateByKey('X')}
                    className="flex-1 py-3 rounded-xl bg-pink-500 text-slate-950 font-orbitron font-bold text-sm hover:bg-pink-400 transition-all shadow-md shadow-pink-500/20 active:scale-95"
                  >
                    X (bit-flip)
                  </button>
                  <button
                    onClick={() => applyGateByKey('Z')}
                    className="flex-1 py-3 rounded-xl bg-purple-600 text-white font-orbitron font-bold text-sm hover:bg-purple-500 transition-all shadow-md shadow-purple-600/20 active:scale-95"
                  >
                    Z (phase-flip)
                  </button>
                  <button
                    onClick={() => applyGateByKey('H')}
                    className="flex-1 py-3 rounded-xl bg-cyan text-slate-950 font-orbitron font-bold text-sm hover:bg-cyan/90 transition-all shadow-md shadow-cyan/20 active:scale-95"
                  >
                    H (Hadamard)
                  </button>
                </div>
                <div
                  data-testid="gate-state-display"
                  className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-300 text-left flex items-center justify-between"
                >
                  <span>Estado actual:</span>
                  <span className="text-pink-400 font-bold text-sm">{stateLabel(state)}</span>
                </div>
                <button
                  onClick={() => { playButtonClick(); setState(KET0); targetThetaRef.current = 0; currentThetaRef.current = 0; }}
                  className="text-xs font-mono text-slate-400 hover:text-white self-end"
                >
                  Reiniciar a |0&#10217;
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="w-full max-w-lg mt-2 flex flex-col gap-3">
                <div className="grid grid-cols-3 gap-3">
                  {circuit.map((g, i) => (
                    <button
                      key={i}
                      onClick={() => cycleSlot(i)}
                      data-testid={'circuit-slot-' + i}
                      aria-label={'Slot ' + (i + 1) + ', compuerta ' + renderGateBadge(g)}
                      className={clsx(
                        'py-4 rounded-2xl border-2 font-orbitron font-bold text-xl transition-all',
                        g === 'I' ? 'bg-slate-950 border-slate-800 text-slate-500'
                          : g === 'X' ? 'bg-pink-500/15 border-pink-500/60 text-pink-300'
                          : g === 'Z' ? 'bg-purple-500/15 border-purple-500/60 text-purple-300'
                          : 'bg-cyan/15 border-cyan/60 text-cyan'
                      )}
                    >
                      {renderGateBadge(g)}
                    </button>
                  ))}
                </div>
                <button
                  onClick={runCircuit}
                  className="w-full py-3 rounded-2xl bg-pink-500 text-slate-950 font-orbitron font-bold text-sm uppercase tracking-wider hover:bg-pink-400 transition-all shadow-md shadow-pink-500/20 active:scale-95"
                >
                  Ejecutar circuito
                </button>
                {circuitResult && (
                  <div
                    data-testid="circuit-result"
                    className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-200 text-xs font-mono text-left"
                  >
                    <strong className="text-white block mb-1">Resultado:</strong>
                    {stateLabel(circuitResult)}
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="w-full max-w-md mt-2 flex flex-col gap-3">
                <button
                  onClick={prepareBell}
                  className={clsx(
                    'w-full py-3.5 rounded-2xl font-orbitron font-bold text-xs uppercase tracking-wider transition-all shadow-xl active:scale-95',
                    bellPrepared
                      ? 'bg-pink-500 text-slate-950 ring-2 ring-pink-400'
                      : 'bg-cyan text-slate-950 hover:bg-cyan/90'
                  )}
                >
                  {bellPrepared ? 'Par de Bell Preparado' : 'Preparar Bell (H + CNOT)'}
                </button>
                {bellPrepared && (
                  <div
                    data-testid="bell-state"
                    className="p-3 rounded-2xl bg-pink-950/40 border border-pink-500/50 text-pink-200 text-xs text-left"
                  >
                    <strong className="text-white block mb-1">Estado de Bell:</strong>
                    (|00&#10217; + |11&#10217;) / sqrt(2). Alice y Bob siempre coinciden.
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
            <div className="text-xs font-mono text-pink-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
              <HelpCircle className="w-4 h-4 text-pink-400" /> Reto Final
            </div>
            <p className="text-base sm:text-lg text-slate-200 mt-2 font-semibold max-w-xl mx-auto">
              Aplicas una compuerta H a un qubit en estado |0&#10217;. Cual es el estado resultante?
            </p>
          </div>

          <div className="w-full max-w-xl flex flex-col gap-3.5">
            <button
              onClick={() => handleQuizChoice('still_zero')}
              className={clsx(
                'p-5 rounded-2xl border text-left text-sm transition-all',
                userChoice === 'still_zero' ? 'bg-rose-950/40 border-rose-500 text-rose-200'
                  : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
              )}
            >
              A) Permanece en |0&#10217; porque H es la identidad
            </button>
            <button
              onClick={() => handleQuizChoice('plus_state')}
              className={clsx(
                'p-5 rounded-2xl border text-left text-sm transition-all',
                userChoice === 'plus_state' ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-semibold shadow-xl shadow-emerald-500/20 ring-2 ring-emerald-500/40'
                  : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
              )}
            >
              B) Queda en |+&#10217; = (|0&#10217; + |1&#10217;)/sqrt(2), superposicion perfecta
            </button>
            <button
              onClick={() => handleQuizChoice('collapse')}
              className={clsx(
                'p-5 rounded-2xl border text-left text-sm transition-all',
                userChoice === 'collapse' ? 'bg-rose-950/40 border-rose-500 text-rose-200'
                  : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
              )}
            >
              C) Colapsa instantaneamente al estado |1&#10217;
            </button>
          </div>

          {showFeedback && (
            <div
              className={clsx(
                'w-full max-w-xl p-4 rounded-2xl text-sm flex items-center justify-between gap-4 text-left',
                userChoice === 'plus_state' ? 'bg-emerald-950/30 border border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/30 border border-rose-500/40 text-rose-200'
              )}
            >
              <div className="flex items-center gap-3">
                {userChoice === 'plus_state' ? <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" /> : <HelpCircle className="w-6 h-6 text-rose-400 shrink-0" />}
                <span>
                  {userChoice === 'plus_state'
                    ? 'Correcto! H sobre |0> genera superposicion equiprobable |+>. Es la puerta estandar para inicializar un algoritmo cuantico.'
                    : 'Pista: H es una rotacion de 90 grados en la esfera de Bloch. Aplicala al polo norte y observa donde cae la flecha.'}
                </span>
              </div>
              {userChoice === 'plus_state' && (
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
          <ArrowLeft className="w-4 h-4" /> {step === 0 ? 'Volver a Tarea 4' : 'Paso Anterior'}
        </button>
        {step < totalSteps - 1 && (
          <button
            onClick={goNext}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-pink-500 text-slate-950 hover:bg-pink-400 transition-all font-orbitron font-bold text-xs uppercase tracking-wider shadow-md shadow-pink-500/20 active:scale-95"
          >
            Siguiente Paso <ArrowRight className="w-4 h-4" />
          </button>
        )}
        {step === totalSteps - 1 && userChoice !== 'plus_state' && (
          <span className="text-xs font-mono text-slate-400">Responde arriba para finalizar</span>
        )}
      </div>
    </div>
  );
}
