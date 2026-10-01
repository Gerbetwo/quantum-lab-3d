'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Scan,
  RotateCcw,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Info,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { playButtonClick, playChimeSuccess, playLaserScan, playQuantumCollapse } from '@/lib/sound';
import { saveCompletedMission, updateStoredMetrics } from '@/lib/cookies';

interface Props {
  onComplete: () => void;
}

export default function Mission1Superposition({ onComplete }: Props) {
  // Step navigation: 'intro' (interactive bit vs qubit) -> 'lab' (3D bloch sphere) -> 'quiz' (deduction)
  const [subStep, setSubStep] = useState<'intro' | 'lab' | 'quiz'>('intro');

  // Interactive Classical Bit state in intro
  const [classicBit, setClassicBit] = useState<0 | 1>(0);

  // 3D Lab states
  const containerRef = useRef<HTMLDivElement>(null);
  const [theta, setTheta] = useState(Math.PI / 2);
  const [isSuperposition, setIsSuperposition] = useState(true);
  const [collapsedState, setCollapsedState] = useState<number | null>(null);
  const [hasMeasuredAtLeastOnce, setHasMeasuredAtLeastOnce] = useState(false);
  const [measureCount, setMeasureCount] = useState(0);

  // Quiz state
  const [userDeduction, setUserDeduction] = useState<string | null>(null);
  const [showDeductionFeedback, setShowDeductionFeedback] = useState(false);

  // Three.js scene refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const vectorArrowRef = useRef<THREE.ArrowHelper | null>(null);
  const shockwaveRef = useRef<THREE.Mesh | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Initialize Three.js scene when entering the lab
  useEffect(() => {
    if (subStep !== 'lab' || !containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 360;
    const height = 300;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 3.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Bloch Sphere
    const sphereGeo = new THREE.SphereGeometry(1, 32, 24);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphere);

    // Equator Ring
    const ringGeo = new THREE.RingGeometry(0.98, 1.02, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    // Poles
    const poleGeo = new THREE.SphereGeometry(0.06, 16, 16);
    const pole0 = new THREE.Mesh(poleGeo, new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
    pole0.position.set(0, 1, 0);
    scene.add(pole0);

    const pole1 = new THREE.Mesh(poleGeo, new THREE.MeshBasicMaterial({ color: 0x10b981 }));
    pole1.position.set(0, -1, 0);
    scene.add(pole1);

    // State Vector
    const dir = new THREE.Vector3(Math.sin(theta), Math.cos(theta), 0).normalize();
    const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0, 0), 1, 0x00f0ff, 0.2, 0.1);
    vectorArrowRef.current = arrow;
    scene.add(arrow);

    // Shockwave Ring
    const shockGeo = new THREE.RingGeometry(0.1, 0.2, 32);
    const shockMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const shock = new THREE.Mesh(shockGeo, shockMat);
    shock.rotation.x = Math.PI / 2;
    shockwaveRef.current = shock;
    scene.add(shock);

    // Particles
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
      new THREE.PointsMaterial({ color: 0x00f0ff, size: 0.03, transparent: true, opacity: 0.3 })
    );
    scene.add(particles);

    let shockScale = 0;
    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);
      sphere.rotation.y += 0.003;
      particles.rotation.y -= 0.001;

      if (shockMat.opacity > 0) {
        shockScale += 0.08;
        shock.scale.set(shockScale, shockScale, shockScale);
        shockMat.opacity -= 0.035;
      }
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!container || !rendererRef.current) return;
      const w = container.clientWidth;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      renderer.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
    };
  }, [subStep]);

  useEffect(() => {
    if (!vectorArrowRef.current) return;
    let targetTheta = theta;
    if (!isSuperposition && collapsedState !== null) {
      targetTheta = collapsedState === 0 ? 0.01 : Math.PI - 0.01;
    }
    const newDir = new THREE.Vector3(Math.sin(targetTheta), Math.cos(targetTheta), 0).normalize();
    vectorArrowRef.current.setDirection(newDir);
    vectorArrowRef.current.setColor(
      isSuperposition ? 0x00f0ff : collapsedState === 0 ? 0x00f0ff : 0x10b981
    );
  }, [theta, isSuperposition, collapsedState]);

  const handleMeasure = () => {
    playLaserScan();
    setTimeout(() => playQuantumCollapse(), 150);

    if (shockwaveRef.current) {
      shockwaveRef.current.scale.set(0.1, 0.1, 0.1);
      (shockwaveRef.current.material as THREE.MeshBasicMaterial).opacity = 0.9;
    }

    const prob0 = Math.cos(theta / 2) ** 2;
    const outcome = Math.random() < prob0 ? 0 : 1;

    setIsSuperposition(false);
    setCollapsedState(outcome);
    setHasMeasuredAtLeastOnce(true);
    setMeasureCount((prev) => prev + 1);

    updateStoredMetrics((prev) => ({
      ...prev,
      actions: {
        ...prev.actions,
        superpositionMeasurements: prev.actions.superpositionMeasurements + 1,
      },
    }));
  };

  const handleReset = () => {
    playButtonClick();
    setIsSuperposition(true);
    setCollapsedState(null);
  };

  const handleDeductionSelect = (choice: string) => {
    setUserDeduction(choice);
    setShowDeductionFeedback(true);
    if (choice === 'collapse') {
      playChimeSuccess();
      saveCompletedMission(0);
    } else {
      playButtonClick();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ========================================================================= */}
      {/* SUB-PASO 1: INTRODUCCIÓN INTERACTIVA (BIT CLÁSICO VS. QUBIT)              */}
      {/* ========================================================================= */}
      {subStep === 'intro' && (
        <div className="flex flex-col gap-8 py-2 animate-in fade-in duration-300">
          <div>
            <div className="text-cyan font-mono text-xs uppercase tracking-wider mb-1">
              Tarea 1 • Introducción Conceptual
            </div>
            <h2 className="text-2xl sm:text-3xl font-orbitron font-bold text-white">
              ¿Qué es un Qubit y qué es la Superposición?
            </h2>
            <p className="text-base text-slate-300 mt-2 max-w-3xl leading-relaxed">
              En la informática cotidiana usamos <strong>bits</strong>. En la computación cuántica usamos <strong>qubits</strong>. Interactúa con el siguiente ejemplo interactivo para ver la diferencia fundamental:
            </p>
          </div>

          {/* Interactive Side-by-Side Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Classic Bit */}
            <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 flex flex-col justify-between gap-6">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Computación Clásica
                </span>
                <h3 className="text-lg font-bold text-white mt-1">El Bit Clásico</h3>
                <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                  Solo puede existir en uno de dos estados posibles: estrictamente <strong>0</strong> o estrictamente <strong>1</strong>.
                </p>
              </div>

              {/* Interactive Toggle */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center gap-3 text-center">
                <button
                  onClick={() => {
                    playButtonClick();
                    setClassicBit((prev) => (prev === 0 ? 1 : 0));
                  }}
                  className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-mono text-sm transition-all"
                >
                  {classicBit === 1 ? (
                    <ToggleRight className="w-7 h-7 text-cyan" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-slate-500" />
                  )}
                  <span>Pulsar interruptor</span>
                </button>

                <div className="text-2xl font-orbitron font-bold text-white">
                  Valor actual: <span className="text-cyan">{classicBit}</span>
                </div>
                <div className="text-xs font-mono text-slate-400">
                  {classicBit === 0 ? 'Estado: 0 (Apagado)' : 'Estado: 1 (Encendido)'}
                </div>
              </div>

              <div className="text-xs text-slate-400 font-mono">
                Rígido: Nunca puede ser una combinación de ambos a la vez.
              </div>
            </div>

            {/* Right: Quantum Qubit */}
            <div className="bg-slate-900 border border-cyan/40 rounded-2xl p-6 flex flex-col justify-between gap-6 shadow-lg shadow-cyan/5">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-cyan">
                  Computación Cuántica
                </span>
                <h3 className="text-lg font-bold text-white mt-1">El Qubit (Bit Cuántico)</h3>
                <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                  Es la unidad básica cuántica. Puede existir en una combinación o <strong className="text-cyan">superposición de los estados 0 y 1 al mismo tiempo</strong>.
                </p>
              </div>

              {/* Dynamic Qubit Representation */}
              <div className="bg-slate-950 border border-cyan/30 rounded-xl p-5 flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-14 h-14 rounded-full bg-cyan/10 border-2 border-cyan/60 flex items-center justify-center text-cyan shadow-lg shadow-cyan/20 animate-pulse">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="text-lg font-orbitron font-bold text-purple-300">
                  |0⟩ y |1⟩ simultáneamente
                </div>
                <div className="text-xs font-mono text-slate-400">
                  Analogía: Como una moneda girando en el aire antes de caer
                </div>
              </div>

              <div className="text-xs text-cyan font-mono">
                Flexible: Contiene ambos estados hasta el momento de ser medido.
              </div>
            </div>
          </div>

          {/* Action to proceed to Lab */}
          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              onClick={() => {
                playButtonClick();
                setSubStep('lab');
              }}
              className="py-3.5 px-6 rounded-xl bg-cyan hover:bg-cyan/90 text-slate-950 font-orbitron font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-cyan/20 active:scale-95"
            >
              Abrir Laboratorio 3D y Medir el Qubit <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-PASO 2: LABORATORIO 3D CON GUÍA PASO A PASO                            */}
      {/* ========================================================================= */}
      {subStep === 'lab' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
          <div className="border-b border-slate-800 pb-3 flex justify-between items-start">
            <div>
              <div className="text-cyan font-mono text-xs uppercase tracking-wider">
                Tarea 1 • Laboratorio 3D
              </div>
              <h2 className="text-xl sm:text-2xl font-orbitron font-bold text-white mt-1">
                La Esfera de Bloch y el Colapso de Onda
              </h2>
            </div>
            <button
              onClick={() => {
                playButtonClick();
                setSubStep('intro');
              }}
              className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1.5 py-1 px-2.5 rounded hover:bg-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Volver a la explicación
            </button>
          </div>

          {/* Main 3D Stage + Numbered Step Guide */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* 3D Viewport */}
            <div className="lg:col-span-7 bg-[#080d1a] border border-slate-800 rounded-xl p-4 flex flex-col items-center relative">
              <div className="w-full flex justify-between items-center text-xs font-mono text-slate-400 border-b border-slate-800/80 pb-2 mb-2">
                <span>Esfera de Bloch 3D</span>
                <span>Mediciones: <strong className="text-cyan">{measureCount}</strong></span>
              </div>

              <div ref={containerRef} className="w-full cursor-grab active:cursor-grabbing" />

              {/* Status Banner */}
              <div className="w-full mt-3 bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Estado:</span>
                  {isSuperposition ? (
                    <span className="text-purple-300 font-bold bg-purple-950/60 border border-purple-500/40 px-2 py-0.5 rounded">
                      Superposición (|0⟩ y |1⟩)
                    </span>
                  ) : (
                    <span className="text-emerald-300 font-bold bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded">
                      Colapsado a |{collapsedState}⟩
                    </span>
                  )}
                </div>
                <div className="text-slate-400">
                  |0⟩: {Math.round(Math.cos(theta / 2) ** 2 * 100)}% | |1⟩:{' '}
                  {Math.round(Math.sin(theta / 2) ** 2 * 100)}%
                </div>
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Instrucciones del Experimento
                </div>

                {/* Step 1 */}
                <div className="border-l-2 border-cyan pl-3 flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-white font-mono">Paso 1: Ajusta el ángulo</span>
                  <p className="text-xs text-slate-400">
                    Mueve el deslizador al centro para poner el qubit en superposición 50/50.
                  </p>
                  <input
                    type="range"
                    min="0.01"
                    max={Math.PI - 0.01}
                    step="0.01"
                    value={theta}
                    onChange={(e) => {
                      setTheta(parseFloat(e.target.value));
                      setIsSuperposition(true);
                      setCollapsedState(null);
                    }}
                    className="w-full accent-cyan cursor-pointer mt-1"
                  />
                </div>

                {/* Step 2 */}
                <div className="border-l-2 border-purple-500 pl-3 flex flex-col gap-2">
                  <span className="text-xs font-bold text-white font-mono">Paso 2: Realiza la medición</span>
                  <p className="text-xs text-slate-400">
                    Pulsa el botón para disparar el detector y observa el comportamiento de la aguja.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleMeasure}
                      className="flex-1 py-3 px-4 rounded-lg bg-cyan text-slate-950 font-orbitron font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-cyan/90 transition-all shadow-md shadow-cyan/20 active:scale-95"
                    >
                      <Scan className="w-4 h-4" /> Medir Qubit
                    </button>
                    <button
                      onClick={handleReset}
                      className="py-3 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center justify-center transition-all border border-slate-700"
                      title="Reiniciar a superposición"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* What happens readout */}
                {hasMeasuredAtLeastOnce && (
                  <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-lg p-3 text-xs text-emerald-200 animate-in fade-in">
                    <strong>Resultado observado:</strong> Al medir, el vector se detuvo en seco y colapsó a un único polo (|{collapsedState}⟩). La superposición desapareció.
                  </div>
                )}
              </div>

              {/* Button to proceed to Quiz */}
              {hasMeasuredAtLeastOnce && (
                <button
                  onClick={() => {
                    playButtonClick();
                    setSubStep('quiz');
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan to-emerald-400 text-slate-950 font-orbitron font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan/20 active:scale-95"
                >
                  Continuar al Reto de Comprensión <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-PASO 3: RETO DE COMPRENSIÓN (DEDUCCIÓN FINAL)                          */}
      {/* ========================================================================= */}
      {subStep === 'quiz' && (
        <div className="flex flex-col gap-6 py-2 animate-in fade-in duration-300">
          <div className="border-b border-slate-800 pb-3 flex justify-between items-start">
            <div>
              <div className="text-cyan font-mono text-xs uppercase tracking-wider">
                Tarea 1 • Reto de Comprensión
              </div>
              <h2 className="text-xl sm:text-2xl font-orbitron font-bold text-white mt-1">
                Comprueba tu Deducción
              </h2>
            </div>
            <button
              onClick={() => {
                playButtonClick();
                setSubStep('lab');
              }}
              className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1.5 py-1 px-2.5 rounded hover:bg-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Volver al laboratorio 3D
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-3xl">
            <div className="text-base font-semibold text-slate-100 mb-4 flex items-center gap-2.5">
              <HelpCircle className="w-5 h-5 text-cyan shrink-0" />
              ¿Qué ocurre cuando se mide un qubit que está en superposición?
            </div>

            <div className="grid grid-cols-1 gap-3.5">
              <button
                onClick={() => handleDeductionSelect('duplicate')}
                className={`p-4 rounded-xl border text-left text-sm leading-normal transition-all ${
                  userDeduction === 'duplicate'
                    ? 'bg-rose-950/40 border-rose-500/80 text-rose-200'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                A) Se duplica en dos qubits independientes
              </button>
              <button
                onClick={() => handleDeductionSelect('collapse')}
                className={`p-4 rounded-xl border text-left text-sm leading-normal transition-all ${
                  userDeduction === 'collapse'
                    ? 'bg-emerald-950/40 border-emerald-500/80 text-emerald-200 font-medium'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                B) Colapsa a uno de los estados posibles (0 o 1)
              </button>
              <button
                onClick={() => handleDeductionSelect('infinite')}
                className={`p-4 rounded-xl border text-left text-sm leading-normal transition-all ${
                  userDeduction === 'infinite'
                    ? 'bg-rose-950/40 border-rose-500/80 text-rose-200'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                C) Permanece en superposición indefinidamente
              </button>
            </div>

            {showDeductionFeedback && (
              <div
                className={`mt-6 p-4 rounded-xl text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  userDeduction === 'collapse'
                    ? 'bg-emerald-950/30 border border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/30 border border-rose-500/40 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {userDeduction === 'collapse' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <Info className="w-5 h-5 text-rose-400 shrink-0" />
                  )}
                  <span>
                    {userDeduction === 'collapse'
                      ? '¡Correcto! Al interactuar con el aparato de medición, el estado cuántico colapsa a uno de los valores posibles.'
                      : 'Pista: En el laboratorio 3D viste que al medir, la aguja no se quedó en el medio ni se dividió: cayó a uno de los polos.'}
                  </span>
                </div>

                {userDeduction === 'collapse' && (
                  <button
                    onClick={onComplete}
                    className="py-2.5 px-5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-orbitron font-bold text-xs uppercase tracking-wider flex items-center gap-2 shrink-0 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
                  >
                    Pasar a la Tarea 2 <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
