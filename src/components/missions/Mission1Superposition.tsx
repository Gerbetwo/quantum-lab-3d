'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  Scan,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  Info,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Layers,
  Activity,
  Check,
} from 'lucide-react';
import { playButtonClick, playChimeSuccess, playLaserScan, playQuantumCollapse } from '@/lib/sound';
import { saveCompletedMission, updateStoredMetrics } from '@/lib/cookies';

interface Props {
  onComplete: () => void;
}

export default function Mission1Superposition({ onComplete }: Props) {
  // Slide index: 0 = Bit Clásico, 1 = Qubit y Superposición, 2 = Esfera 3D, 3 = Medición y Colapso, 4 = Reto Final
  const [slide, setSlide] = useState<number>(0);
  const totalSlides = 5;

  // Slide 0: Classic Bit state
  const [classicBit, setClassicBit] = useState<0 | 1>(0);

  // Slide 2 & 3: 3D Bloch Lab states
  const containerRef = useRef<HTMLDivElement>(null);
  const [theta, setTheta] = useState(Math.PI / 2);
  const [isSuperposition, setIsSuperposition] = useState(true);
  const [collapsedState, setCollapsedState] = useState<number | null>(null);
  const [hasMeasured, setHasMeasured] = useState(false);

  // Slide 4: Quiz
  const [userChoice, setUserChoice] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Three.js scene refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const vectorArrowRef = useRef<THREE.ArrowHelper | null>(null);
  const shockwaveRef = useRef<THREE.Mesh | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Navigation handlers
  const goToNextSlide = useCallback(() => {
    playButtonClick();
    setSlide((prev) => Math.min(prev + 1, totalSlides - 1));
  }, [totalSlides]);

  const goToPrevSlide = useCallback(() => {
    playButtonClick();
    setSlide((prev) => Math.max(prev - 1, 0));
  }, []);

  // Keyboard navigation (Arrow keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && slide < totalSlides - 1) {
        goToNextSlide();
      } else if (e.key === 'ArrowLeft' && slide > 0) {
        goToPrevSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slide, totalSlides, goToNextSlide, goToPrevSlide]);

  // Three.js initialization when on Slide 2 (Esfera 3D) or Slide 3 (Medición)
  useEffect(() => {
    if ((slide !== 2 && slide !== 3) || !containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 480;
    const height = 360;

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
      opacity: 0.35,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    // Poles (|0> North, |1> South)
    const poleGeo = new THREE.SphereGeometry(0.06, 16, 16);
    const pole0 = new THREE.Mesh(poleGeo, new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
    pole0.position.set(0, 1, 0);
    scene.add(pole0);

    const pole1 = new THREE.Mesh(poleGeo, new THREE.MeshBasicMaterial({ color: 0x10b981 }));
    pole1.position.set(0, -1, 0);
    scene.add(pole1);

    // State Vector
    const dir = new THREE.Vector3(Math.sin(theta), Math.cos(theta), 0).normalize();
    const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0, 0), 1, 0x00f0ff, 0.22, 0.12);
    vectorArrowRef.current = arrow;
    scene.add(arrow);

    // Shockwave
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
      new THREE.PointsMaterial({ color: 0x00f0ff, size: 0.03, transparent: true, opacity: 0.35 })
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
  }, [slide]);

  // Update vector arrow when theta or collapse state changes
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

  // Measurement action
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
    setHasMeasured(true);

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

  const handleChoice = (choice: string) => {
    setUserChoice(choice);
    setShowFeedback(true);
    if (choice === 'collapse') {
      playChimeSuccess();
      saveCompletedMission(0);
    } else {
      playButtonClick();
    }
  };

  return (
    <div className="flex flex-col justify-between min-h-[640px] w-full max-w-5xl mx-auto py-2">
      {/* ========================================================================= */}
      {/* TOP SLIDE STEPPER INDICATOR                                               */}
      {/* ========================================================================= */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan px-2.5 py-1 rounded bg-cyan/10 border border-cyan/30">
            Tarea 1
          </span>
          <span className="text-xs font-mono text-slate-400">
            Diapositiva {slide + 1} de {totalSlides}
          </span>
        </div>

        {/* Stepper Dots */}
        <div className="flex items-center gap-2">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              onClick={() => {
                playButtonClick();
                setSlide(i);
              }}
              className={`h-2 rounded-full transition-all ${
                slide === i ? 'w-8 bg-cyan' : i < slide ? 'w-3 bg-emerald-500' : 'w-2 bg-slate-800'
              }`}
              title={`Ir a diapositiva ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SLIDE 0: EL BIT CLÁSICO (GRANDE Y ENFOCADO)                               */}
      {/* ========================================================================= */}
      {slide === 0 && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-8 py-4 animate-in fade-in zoom-in-95 duration-300">
          <div>
            <div className="text-sm font-mono text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
              <Layers className="w-4 h-4 text-cyan" /> Fundamento Clásico
            </div>
            <h2 className="text-3xl sm:text-5xl font-orbitron font-bold text-white tracking-wide">
              El Bit Clásico
            </h2>
            <p className="text-base sm:text-lg text-slate-300 mt-4 max-w-2xl mx-auto leading-relaxed">
              En toda la informática tradicional, la información es binaria y rígida: un bit solo puede existir en uno de dos estados posibles, <strong className="text-white">estrictamente 0 o estrictamente 1</strong>.
            </p>
          </div>

          {/* Huge Interactive Classical Switch */}
          <div className="bg-slate-900/90 border border-slate-700 rounded-3xl p-8 sm:p-10 w-full max-w-md shadow-2xl flex flex-col items-center gap-6">
            <button
              onClick={() => {
                playButtonClick();
                setClassicBit((prev) => (prev === 0 ? 1 : 0));
              }}
              className="flex items-center gap-4 px-8 py-4 rounded-2xl bg-slate-950 hover:bg-slate-800 border-2 border-slate-700 hover:border-cyan text-white font-mono text-lg transition-all active:scale-95 shadow-lg"
            >
              {classicBit === 1 ? (
                <ToggleRight className="w-10 h-10 text-cyan" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-slate-500" />
              )}
              <span className="font-sans font-semibold">Tocar Interruptor</span>
            </button>

            <div className="text-5xl sm:text-6xl font-orbitron font-bold text-white tracking-wider">
              VALOR: <span className="text-cyan">{classicBit}</span>
            </div>

            <div className="text-sm font-mono text-slate-400 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
              {classicBit === 0 ? 'Estado: 0 (Apagado / Desactivado)' : 'Estado: 1 (Encendido / Activado)'}
            </div>

            <p className="text-xs text-slate-400 leading-normal">
              No existe ningún punto intermedio. Nunca puede ser 0 y 1 al mismo tiempo.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SLIDE 1: EL QUBIT Y LA SUPERPOSICIÓN (GRANDE Y ENFOCADO)                  */}
      {/* ========================================================================= */}
      {slide === 1 && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-8 py-4 animate-in fade-in zoom-in-95 duration-300">
          <div>
            <div className="text-sm font-mono text-cyan uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan" /> Fundamento Cuántico
            </div>
            <h2 className="text-3xl sm:text-5xl font-orbitron font-bold text-white tracking-wide">
              El Qubit Cuántico
            </h2>
            <p className="text-base sm:text-lg text-slate-300 mt-4 max-w-2xl mx-auto leading-relaxed">
              A diferencia del bit clásico, la unidad básica de información cuántica puede existir en una <strong className="text-cyan">combinación o superposición de los estados 0 y 1 simultáneamente</strong>.
            </p>
          </div>

          {/* Big Quantum Representation Card */}
          <div className="bg-slate-900/90 border border-cyan/40 rounded-3xl p-8 sm:p-10 w-full max-w-lg shadow-2xl shadow-cyan/10 flex flex-col items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-cyan/10 border-2 border-cyan flex items-center justify-center text-cyan shadow-xl shadow-cyan/30 animate-pulse">
              <Sparkles className="w-12 h-12" />
            </div>

            <div className="text-2xl sm:text-3xl font-orbitron font-bold text-purple-300">
              |0⟩ y |1⟩ al mismo tiempo
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 text-left text-sm text-slate-300 leading-relaxed">
              <strong className="text-white block mb-1.5 font-sans font-semibold text-base">
                La analogía cotidiana: La moneda girando en el aire
              </strong>
              Imagina una moneda apoyada en una mesa: es cara o cruz (un bit clásico rígido). Pero si la lanzas y gira en el aire... ¿qué es? Representa ambas caras simultáneamente (superposición) hasta que alguien la atrapa y la mide.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SLIDE 2: LA ESFERA DE BLOCH (MANIPULACIÓN 3D ESPACIOSA)                   */}
      {/* ========================================================================= */}
      {slide === 2 && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-6 py-2 animate-in fade-in zoom-in-95 duration-300">
          <div>
            <div className="text-sm font-mono text-cyan uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
              <Activity className="w-4 h-4 text-cyan" /> Espacio de Hilbert
            </div>
            <h2 className="text-2xl sm:text-4xl font-orbitron font-bold text-white tracking-wide">
              La Esfera de Bloch 3D
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-xl mx-auto leading-relaxed">
              En física cuántica, los estados de un qubit se representan como un vector tridimensional sobre una esfera.
            </p>
          </div>

          {/* Generous 3D Canvas Box */}
          <div className="w-full max-w-2xl bg-[#080d1a] border border-slate-800 rounded-2xl p-4 flex flex-col items-center relative shadow-2xl">
            <div ref={containerRef} className="w-full cursor-grab active:cursor-grabbing" />

            {/* Slider */}
            <div className="w-full max-w-md mt-4 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-2">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>Polo Norte |0⟩</span>
                <span className="text-cyan font-bold">Ecuador (Superposición 50/50)</span>
                <span>Polo Sur |1⟩</span>
              </div>
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
                className="w-full accent-cyan cursor-pointer"
              />
            </div>

            <p className="text-xs font-mono text-slate-400 mt-2">
              Mueve el deslizador para ver cómo el vector de estado recorre la esfera entre |0⟩ y |1⟩.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SLIDE 3: LA MEDICIÓN Y EL COLAPSO (ACCIÓN OBSERVABLE)                     */}
      {/* ========================================================================= */}
      {slide === 3 && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-6 py-2 animate-in fade-in zoom-in-95 duration-300">
          <div>
            <div className="text-sm font-mono text-cyan uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
              <Scan className="w-4 h-4 text-cyan" /> El Momento Decisivo
            </div>
            <h2 className="text-2xl sm:text-4xl font-orbitron font-bold text-white tracking-wide">
              El Colapso de la Medición
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mt-2 max-w-xl mx-auto leading-relaxed">
              ¿Qué ocurre cuando intentamos observar o medir un qubit que se encuentra en superposición?
            </p>
          </div>

          {/* 3D Canvas Box + Big Action Button */}
          <div className="w-full max-w-2xl bg-[#080d1a] border border-slate-800 rounded-2xl p-4 flex flex-col items-center relative shadow-2xl">
            <div ref={containerRef} className="w-full cursor-grab active:cursor-grabbing" />

            <div className="w-full max-w-md mt-4 flex flex-col gap-3">
              <div className="flex gap-3">
                <button
                  onClick={handleMeasure}
                  className="flex-1 py-4 px-6 rounded-xl bg-cyan text-slate-950 font-orbitron font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-cyan/90 transition-all shadow-lg shadow-cyan/20 active:scale-95"
                >
                  <Scan className="w-5 h-5" /> Disparar Detector de Medida
                </button>
                <button
                  onClick={handleReset}
                  className="py-4 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center justify-center transition-all border border-slate-700"
                  title="Reiniciar superposición"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>

              {/* Instant Observable Result */}
              {hasMeasured && (
                <div className="bg-emerald-950/40 border border-emerald-500/60 rounded-xl p-4 text-sm text-emerald-200 text-left animate-in fade-in">
                  <div className="font-bold flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Colapso definitivo a |{collapsedState}⟩
                  </div>
                  La superposición ha desaparecido por completo. La aguja se fijó en un único polo clásico.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SLIDE 4: RETO DE COMPRENSIÓN (DEDUCCIÓN FINAL)                            */}
      {/* ========================================================================= */}
      {slide === 4 && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-6 py-2 animate-in fade-in zoom-in-95 duration-300">
          <div>
            <div className="text-sm font-mono text-cyan uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
              <HelpCircle className="w-4 h-4 text-cyan" /> Comprobación Final
            </div>
            <h2 className="text-2xl sm:text-4xl font-orbitron font-bold text-white tracking-wide">
              Reto de Comprensión
            </h2>
            <p className="text-base sm:text-lg text-slate-200 mt-3 font-semibold max-w-xl mx-auto">
              ¿Qué ocurre cuando se mide un qubit que está en superposición?
            </p>
          </div>

          <div className="w-full max-w-xl flex flex-col gap-3.5">
            <button
              onClick={() => handleChoice('duplicate')}
              className={`p-5 rounded-2xl border text-left text-sm leading-normal transition-all ${
                userChoice === 'duplicate'
                  ? 'bg-rose-950/40 border-rose-500/80 text-rose-200'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              A) Se duplica en dos qubits independientes
            </button>
            <button
              onClick={() => handleChoice('collapse')}
              className={`p-5 rounded-2xl border text-left text-sm leading-normal transition-all ${
                userChoice === 'collapse'
                  ? 'bg-emerald-950/40 border-emerald-500/80 text-emerald-200 font-semibold'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              B) Colapsa a uno de los estados posibles (0 o 1)
            </button>
            <button
              onClick={() => handleChoice('infinite')}
              className={`p-5 rounded-2xl border text-left text-sm leading-normal transition-all ${
                userChoice === 'infinite'
                  ? 'bg-rose-950/40 border-rose-500/80 text-rose-200'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              C) Permanece en superposición indefinidamente
            </button>
          </div>

          {showFeedback && (
            <div
              className={`w-full max-w-xl p-4 rounded-xl text-sm flex items-center justify-between gap-4 text-left ${
                userChoice === 'collapse'
                  ? 'bg-emerald-950/30 border border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/30 border border-rose-500/40 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {userChoice === 'collapse' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <Info className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <span>
                  {userChoice === 'collapse'
                    ? '¡Correcto! La medición rompe la superposición y fuerza el colapso a un único valor clásico.'
                    : 'Pista: En el laboratorio viste que al disparar el detector, la aguja no se quedó en el medio ni se dividió: colapsó a un polo.'}
                </span>
              </div>

              {userChoice === 'collapse' && (
                <button
                  onClick={onComplete}
                  className="py-2.5 px-5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-orbitron font-bold text-xs uppercase tracking-wider flex items-center gap-2 shrink-0 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
                >
                  Pasar a Tarea 2 <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* BOTTOM SLIDE NAVIGATION (GRAND & CLEAN)                                   */}
      {/* ========================================================================= */}
      <div className="flex justify-between items-center border-t border-slate-800 pt-5 mt-6">
        <button
          onClick={goToPrevSlide}
          disabled={slide === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-all font-mono text-xs uppercase"
        >
          <ArrowLeft className="w-4 h-4" /> Anterior
        </button>

        <span className="text-xs font-mono text-slate-500 hidden sm:inline">
          Tip: Puedes usar las flechas del teclado (← / →) para avanzar
        </span>

        {slide < totalSlides - 1 && (
          <button
            onClick={goToNextSlide}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan text-slate-950 hover:bg-cyan/90 transition-all font-orbitron font-bold text-xs uppercase tracking-wider shadow-md shadow-cyan/20 active:scale-95"
          >
            Siguiente <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {slide === totalSlides - 1 && userChoice !== 'collapse' && (
          <span className="text-xs font-mono text-slate-400">
            Responde la pregunta arriba para avanzar
          </span>
        )}
      </div>
    </div>
  );
}
