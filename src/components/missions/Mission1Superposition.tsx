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
  Compass,
  Gauge,
  Atom,
} from 'lucide-react';
import { playButtonClick, playChimeSuccess, playLaserScan, playQuantumCollapse } from '@/lib/sound';
import { saveCompletedMission, updateStoredMetrics } from '@/lib/cookies';

interface Props {
  onComplete: () => void;
}

// Helper to create high-resolution text sprites for 3D labels
function createTextSprite(text: string, color: string = '#00f0ff', fontSize: number = 48) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.font = `bold ${fontSize}px "Orbitron", sans-serif, system-ui`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillText(text, 128, 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(0.9, 0.45, 1);
  return sprite;
}

export default function Mission1Superposition({ onComplete }: Props) {
  // Step index: 0 to 4 (5 steps total)
  const [step, setStep] = useState<number>(0);
  const totalSteps = 5;

  // Step 0: Classic Bit state
  const [classicBit, setClassicBit] = useState<0 | 1>(0);

  // Step 2 & 3: 3D Bloch Sphere states
  const containerRef = useRef<HTMLDivElement>(null);
  const [theta, setTheta] = useState(Math.PI / 2); // Angle from North pole (0 to PI)
  const [isSuperposition, setIsSuperposition] = useState(true);
  const [collapsedState, setCollapsedState] = useState<number | null>(null);
  const [hasMeasured, setHasMeasured] = useState(false);

  // Real-time probabilities
  const prob0 = isSuperposition
    ? Math.round(Math.cos(theta / 2) ** 2 * 100)
    : collapsedState === 0
    ? 100
    : 0;
  const prob1 = 100 - prob0;

  // Step 4: Quiz
  const [userChoice, setUserChoice] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Three.js scene refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const sphereGroupRef = useRef<THREE.Group | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const vectorArrowRef = useRef<THREE.ArrowHelper | null>(null);
  const shockwaveRef = useRef<THREE.Mesh | null>(null);
  const pole0MeshRef = useRef<THREE.Mesh | null>(null);
  const pole1MeshRef = useRef<THREE.Mesh | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Navigation handlers
  const goToNextStep = useCallback(() => {
    playButtonClick();
    setStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);

  const goToPrevStep = useCallback(() => {
    playButtonClick();
    setStep((prev) => Math.max(prev - 1, 0));
  }, []);

  // Keyboard navigation (Arrow keys)
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

  // Three.js initialization when on Step 2 (Esfera 3D) or Step 3 (Medición)
  useEffect(() => {
    if ((step !== 2 && step !== 3) || !containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 540;
    const height = 380;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.9, 3.4);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Group holding the entire sphere system for mouse drag orbit
    const sphereGroup = new THREE.Group();
    sphereGroupRef.current = sphereGroup;
    scene.add(sphereGroup);

    // 1. Wireframe Bloch Sphere
    const sphereGeo = new THREE.SphereGeometry(1, 32, 24);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphereGroup.add(sphere);

    // 2. Equator Ring (Superposition plane)
    const ringGeo = new THREE.RingGeometry(0.98, 1.02, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    sphereGroup.add(ring);

    // 3. Central Axis Line (connecting North and South poles)
    const axisGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 1.1, 0),
      new THREE.Vector3(0, -1.1, 0),
    ]);
    const axisMat = new THREE.LineDashedMaterial({
      color: 0x64748b,
      dashSize: 0.05,
      gapSize: 0.03,
      transparent: true,
      opacity: 0.6,
    });
    const axisLine = new THREE.Line(axisGeo, axisMat);
    axisLine.computeLineDistances();
    sphereGroup.add(axisLine);

    // 4. North Pole Mesh (|0⟩)
    const pole0Geo = new THREE.SphereGeometry(0.08, 16, 16);
    const pole0 = new THREE.Mesh(
      pole0Geo,
      new THREE.MeshBasicMaterial({ color: 0x00f0ff })
    );
    pole0.position.set(0, 1, 0);
    pole0MeshRef.current = pole0;
    sphereGroup.add(pole0);

    // 3D Sprite Label for North Pole: |0⟩
    const sprite0 = createTextSprite('|0⟩ Norte', '#00f0ff', 44);
    sprite0.position.set(0.65, 1.08, 0);
    sphereGroup.add(sprite0);

    // 5. South Pole Mesh (|1⟩)
    const pole1Geo = new THREE.SphereGeometry(0.08, 16, 16);
    const pole1 = new THREE.Mesh(
      pole1Geo,
      new THREE.MeshBasicMaterial({ color: 0x10b981 })
    );
    pole1.position.set(0, -1, 0);
    pole1MeshRef.current = pole1;
    sphereGroup.add(pole1);

    // 3D Sprite Label for South Pole: |1⟩
    const sprite1 = createTextSprite('|1⟩ Sur', '#10b981', 44);
    sprite1.position.set(0.65, -1.08, 0);
    sphereGroup.add(sprite1);

    // 3D Sprite Label for Equator: |+⟩
    const spritePlus = createTextSprite('|+⟩ Ecuador', '#c084fc', 38);
    spritePlus.position.set(1.4, 0, 0);
    sphereGroup.add(spritePlus);

    // 6. State Vector Arrow (|ψ⟩)
    const dir = new THREE.Vector3(Math.sin(theta), Math.cos(theta), 0).normalize();
    const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0, 0), 1, 0x38bdf8, 0.24, 0.14);
    vectorArrowRef.current = arrow;
    sphereGroup.add(arrow);

    // 7. Shockwave Ring (for measurement pulse)
    const shockGeo = new THREE.RingGeometry(0.1, 0.22, 32);
    const shockMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const shock = new THREE.Mesh(shockGeo, shockMat);
    shock.rotation.x = Math.PI / 2;
    shockwaveRef.current = shock;
    sphereGroup.add(shock);

    // 8. Ambient Quantum Particles
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(60 * 3);
    for (let i = 0; i < 60 * 3; i += 3) {
      pPos[i] = (Math.random() - 0.5) * 3.5;
      pPos[i + 1] = (Math.random() - 0.5) * 3.5;
      pPos[i + 2] = (Math.random() - 0.5) * 3.5;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const particles = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({ color: 0x00f0ff, size: 0.035, transparent: true, opacity: 0.4 })
    );
    scene.add(particles);

    // Mouse drag interaction to rotate the 3D sphere freely
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };

    const handlePointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging || !sphereGroupRef.current) return;
      const dx = e.clientX - prevMousePos.x;
      const dy = e.clientY - prevMousePos.y;
      sphereGroupRef.current.rotation.y += dx * 0.007;
      sphereGroupRef.current.rotation.x += dy * 0.007;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    container.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // Animation Loop
    let shockScale = 0;
    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);

      // Subtle auto-rotation when not dragging
      if (!isDragging && sphereGroup) {
        sphereGroup.rotation.y += 0.002;
      }
      particles.rotation.y -= 0.0008;

      // Expand shockwave upon measurement
      if (shockMat.opacity > 0) {
        shockScale += 0.09;
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
      container.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('resize', handleResize);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      renderer.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      pGeo.dispose();
    };
  }, [step]);

  // Update vector arrow and pole scales when theta or collapsedState changes
  useEffect(() => {
    if (!vectorArrowRef.current) return;
    let targetTheta = theta;
    if (!isSuperposition && collapsedState !== null) {
      targetTheta = collapsedState === 0 ? 0.001 : Math.PI - 0.001;
    }
    const newDir = new THREE.Vector3(Math.sin(targetTheta), Math.cos(targetTheta), 0).normalize();
    vectorArrowRef.current.setDirection(newDir);

    const arrowColor = isSuperposition ? 0x00f0ff : collapsedState === 0 ? 0x00f0ff : 0x10b981;
    vectorArrowRef.current.setColor(arrowColor);

    // Dynamically scale the poles to show which one is currently selected/collapsed
    if (pole0MeshRef.current) {
      pole0MeshRef.current.scale.setScalar(
        collapsedState === 0 ? 2.2 : isSuperposition && theta < Math.PI / 4 ? 1.4 : 1.0
      );
    }
    if (pole1MeshRef.current) {
      pole1MeshRef.current.scale.setScalar(
        collapsedState === 1 ? 2.2 : isSuperposition && theta > (3 * Math.PI) / 4 ? 1.4 : 1.0
      );
    }
  }, [theta, isSuperposition, collapsedState]);

  // Quick Posture Presets (North, Equator, South)
  const setPreset = (targetTheta: number) => {
    playButtonClick();
    setIsSuperposition(true);
    setCollapsedState(null);
    setTheta(targetTheta);
  };

  // Measurement action
  const handleMeasure = () => {
    playLaserScan();
    setTimeout(() => playQuantumCollapse(), 160);

    if (shockwaveRef.current) {
      shockwaveRef.current.scale.set(0.1, 0.1, 0.1);
      (shockwaveRef.current.material as THREE.MeshBasicMaterial).opacity = 0.95;
    }

    const currentProb0 = Math.cos(theta / 2) ** 2;
    const outcome = Math.random() < currentProb0 ? 0 : 1;

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
    setTheta(Math.PI / 2); // Return to 50/50 superposition
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
    <div className="flex flex-col justify-between min-h-[660px] w-full max-w-5xl mx-auto py-2">
      {/* ========================================================================= */}
      {/* TOP STEPPER PROGRESS BAR (NO SE MENCIONA LA PALABRA DIAPOSITIVA)          */}
      {/* ========================================================================= */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan px-2.5 py-1 rounded-md bg-cyan/10 border border-cyan/30">
            Tarea 1
          </span>
          <span className="text-xs font-mono text-slate-400">
            Paso {step + 1} de {totalSteps}
          </span>
        </div>

        {/* Stepper Dots */}
        <div className="flex items-center gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <button
              key={i}
              onClick={() => {
                playButtonClick();
                setStep(i);
              }}
              className={`h-2 rounded-full transition-all ${
                step === i ? 'w-8 bg-cyan shadow-sm shadow-cyan/50' : i < step ? 'w-3 bg-emerald-500' : 'w-2 bg-slate-800'
              }`}
              title={`Ir al paso ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PASO 1: EL BIT CLÁSICO (FUNDAMENTO BINARIO)                               */}
      {/* ========================================================================= */}
      {step === 0 && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-8 py-4 animate-in fade-in zoom-in-95 duration-300">
          <div>
            <div className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
              <Layers className="w-4 h-4 text-cyan" /> Fundamento Clásico
            </div>
            <h2 className="text-3xl sm:text-5xl font-orbitron font-bold text-white tracking-wide">
              El Bit Clásico
            </h2>
            <p className="text-base sm:text-lg text-slate-300 mt-4 max-w-2xl mx-auto leading-relaxed">
              En tu ordenador o teléfono, la información es binaria y rígida: un bit solo puede existir en uno de dos estados posibles, <strong className="text-white">estrictamente 0 o estrictamente 1</strong>.
            </p>
          </div>

          {/* Huge Interactive Classical Switch */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-3xl p-8 sm:p-10 w-full max-w-md shadow-2xl flex flex-col items-center gap-6">
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
              {classicBit === 0 ? 'Estado: 0 (Apagado / Bajo Voltaje)' : 'Estado: 1 (Encendido / Alto Voltaje)'}
            </div>

            <p className="text-xs text-slate-400 leading-normal">
              No existe ningún punto intermedio. Un bit clásico jamás puede ser 0 y 1 al mismo tiempo.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASO 2: EL QUBIT, LA LÍNEA Y LA NOTACIÓN DIRAC (|0⟩ y |1⟩)                */}
      {/* ========================================================================= */}
      {step === 1 && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-8 py-4 animate-in fade-in zoom-in-95 duration-300">
          <div>
            <div className="text-xs font-mono text-cyan uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan" /> Fundamento Cuántico
            </div>
            <h2 className="text-3xl sm:text-5xl font-orbitron font-bold text-white tracking-wide">
              El Qubit y su Notación
            </h2>
            <p className="text-base sm:text-lg text-slate-300 mt-4 max-w-2xl mx-auto leading-relaxed">
              En computación cuántica, la unidad básica es el <strong className="text-cyan">qubit</strong>. A diferencia del bit clásico, no se limita a ser solo 0 o 1.
            </p>
          </div>

          {/* Interactive Pedagogical Cards: Dirac Notation & Vector Line */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl text-left">
            {/* Card 1: Notación |0⟩ y |1⟩ */}
            <div className="bg-slate-900/90 border border-cyan/40 rounded-3xl p-6 sm:p-8 flex flex-col gap-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan/10 border border-cyan/40 flex items-center justify-center text-cyan">
                  <Atom className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-orbitron font-bold text-white">
                    ¿Por qué se escribe |0⟩ y |1⟩?
                  </h3>
                  <span className="text-xs font-mono text-cyan">Notación Ket (Dirac)</span>
                </div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                En física no se usa un número ordinario, sino que se encierra entre una barra vertical y un ángulo: <strong className="text-white font-mono">|0⟩</strong> y <strong className="text-white font-mono">|1⟩</strong>.
              </p>
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-400">
                Esto indica que son <strong className="text-cyan">estados cuánticos base</strong> (como dos polos opuestos), y no simples dígitos numéricos.
              </div>
            </div>

            {/* Card 2: La Línea / Vector de Estado */}
            <div className="bg-slate-900/90 border border-purple-500/40 rounded-3xl p-6 sm:p-8 flex flex-col gap-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/40 flex items-center justify-center text-purple-400">
                  <Compass className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-orbitron font-bold text-white">
                    ¿Qué representa la línea o aguja?
                  </h3>
                  <span className="text-xs font-mono text-purple-400">Vector de Estado |ψ⟩</span>
                </div>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                El estado del qubit se representa como una <strong className="text-white">flecha o vector tridimensional</strong> que nace del centro.
              </p>
              <ul className="text-xs text-slate-300 space-y-1.5 bg-slate-950 border border-slate-800 rounded-xl p-3.5">
                <li>• Si apunta al <strong className="text-cyan">Polo Norte</strong>: es 100% el estado <strong className="font-mono">|0⟩</strong>.</li>
                <li>• Si apunta al <strong className="text-emerald-400">Polo Sur</strong>: es 100% el estado <strong className="font-mono">|1⟩</strong>.</li>
                <li>• Si apunta al <strong className="text-purple-400">Ecuador o inclinada</strong>: está en <strong className="text-white">superposición simultánea</strong>.</li>
              </ul>
            </div>
          </div>

          {/* Coin Analogy */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 sm:p-5 max-w-3xl text-sm text-slate-300 text-left flex items-start gap-4">
            <Sparkles className="w-6 h-6 text-cyan shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-sans mb-1">
                La analogía de la moneda en el aire:
              </strong>
              Una moneda sobre la mesa es cara o cruz (un bit clásico). Pero cuando la lanzas y gira en el aire, es ambas caras a la vez hasta que cae. Eso es la superposición cuántica.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASO 3: LA ESFERA DE BLOCH 3D (INTERACTIVA CON PRESETS Y PROBABILIDADES)   */}
      {/* ========================================================================= */}
      {step === 2 && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-5 py-2 animate-in fade-in zoom-in-95 duration-300">
          <div>
            <div className="text-xs font-mono text-cyan uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
              <Activity className="w-4 h-4 text-cyan" /> Laboratorio 3D
            </div>
            <h2 className="text-2xl sm:text-4xl font-orbitron font-bold text-white tracking-wide">
              La Esfera de Bloch
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl mx-auto leading-relaxed">
              Mueve la aguja o arrastra con el ratón sobre la esfera para girarla en 3D. Observa cómo cambian las probabilidades en tiempo real.
            </p>
          </div>

          {/* Generous 3D Canvas Box */}
          <div className="w-full max-w-2xl bg-[#060a14] border border-slate-800 rounded-3xl p-4 flex flex-col items-center relative shadow-2xl">
            {/* Top Pole Badge */}
            <div className="absolute top-3 left-4 right-4 flex justify-between items-center z-10 pointer-events-none">
              <span className="px-3 py-1 rounded-full bg-cyan/20 border border-cyan/50 text-cyan font-mono text-xs font-bold tracking-wider">
                POLO NORTE: |0⟩
              </span>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">
                Arrastra para girar la esfera 360°
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 font-mono text-xs font-bold tracking-wider">
                POLO SUR: |1⟩
              </span>
            </div>

            <div
              ref={containerRef}
              className="w-full cursor-grab active:cursor-grabbing touch-none select-none my-2"
              title="Arrastra con el ratón para rotar la esfera en 3D"
            />

            {/* Quick Posture Buttons (North, Equator 50/50, South) */}
            <div className="w-full max-w-lg grid grid-cols-3 gap-2 mt-2">
              <button
                onClick={() => setPreset(0.001)}
                className={`py-2 px-3 rounded-xl border text-xs font-orbitron font-semibold transition-all ${
                  theta < 0.2
                    ? 'bg-cyan text-slate-950 border-cyan font-bold shadow-md shadow-cyan/30'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-cyan/50'
                }`}
              >
                Polo Norte |0⟩
              </button>
              <button
                onClick={() => setPreset(Math.PI / 2)}
                className={`py-2 px-3 rounded-xl border text-xs font-orbitron font-semibold transition-all ${
                  Math.abs(theta - Math.PI / 2) < 0.1
                    ? 'bg-purple-600 text-white border-purple-400 font-bold shadow-md shadow-purple-600/30'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-purple-500/50'
                }`}
              >
                Ecuador |+⟩ (50/50)
              </button>
              <button
                onClick={() => setPreset(Math.PI - 0.001)}
                className={`py-2 px-3 rounded-xl border text-xs font-orbitron font-semibold transition-all ${
                  theta > Math.PI - 0.2
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-md shadow-emerald-500/30'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-emerald-500/50'
                }`}
              >
                Polo Sur |1⟩
              </button>
            </div>

            {/* Real-time Angle Slider & Probability Gauges */}
            <div className="w-full max-w-lg mt-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                <span>Inclinación de la aguja:</span>
                <span className="text-white font-bold">
                  {theta < 0.2
                    ? '100% Polo Norte |0⟩'
                    : theta > Math.PI - 0.2
                    ? '100% Polo Sur |1⟩'
                    : 'Superposición Cuántica'}
                </span>
              </div>

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

              {/* Dynamic Live Probability Gauges */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                {/* Gauge 0 */}
                <div className="flex flex-col gap-1 text-left">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-cyan font-bold">P(|0⟩):</span>
                    <span className="text-white font-bold">{prob0}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-cyan transition-all duration-150"
                      style={{ width: `${prob0}%` }}
                    />
                  </div>
                </div>

                {/* Gauge 1 */}
                <div className="flex flex-col gap-1 text-left">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-emerald-400 font-bold">P(|1⟩):</span>
                    <span className="text-white font-bold">{prob1}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-150"
                      style={{ width: `${prob1}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASO 4: EL COLAPSO DE LA MEDICIÓN (ACCIÓN OBSERVABLE Y DEFINITIVA)         */}
      {/* ========================================================================= */}
      {step === 3 && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-5 py-2 animate-in fade-in zoom-in-95 duration-300">
          <div>
            <div className="text-xs font-mono text-cyan uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
              <Scan className="w-4 h-4 text-cyan" /> El Momento Decisivo
            </div>
            <h2 className="text-2xl sm:text-4xl font-orbitron font-bold text-white tracking-wide">
              El Colapso de la Medición
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl mx-auto leading-relaxed">
              Mientras no se mida, la aguja está en el ecuador (ambos estados simultáneos). Dispara el detector para observar cómo el universo cuántico toma una decisión.
            </p>
          </div>

          {/* 3D Canvas Box + Big Action Controls */}
          <div className="w-full max-w-2xl bg-[#060a14] border border-slate-800 rounded-3xl p-4 flex flex-col items-center relative shadow-2xl">
            {/* Top Pole Badge */}
            <div className="absolute top-3 left-4 right-4 flex justify-between items-center z-10 pointer-events-none">
              <span className={`px-3 py-1 rounded-full font-mono text-xs font-bold transition-all ${
                collapsedState === 0
                  ? 'bg-cyan text-slate-950 ring-4 ring-cyan/40 scale-110 shadow-lg shadow-cyan/50'
                  : 'bg-cyan/20 border border-cyan/50 text-cyan'
              }`}>
                POLO NORTE: |0⟩
              </span>
              <span className="text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">
                {isSuperposition ? 'Estado: En Superposición 50/50' : `Estado: ¡Colapsado a |${collapsedState}⟩!`}
              </span>
              <span className={`px-3 py-1 rounded-full font-mono text-xs font-bold transition-all ${
                collapsedState === 1
                  ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/40 scale-110 shadow-lg shadow-emerald-500/50'
                  : 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
              }`}>
                POLO SUR: |1⟩
              </span>
            </div>

            <div
              ref={containerRef}
              className="w-full cursor-grab active:cursor-grabbing touch-none select-none my-2"
              title="Arrastra con el ratón para rotar la esfera en 3D"
            />

            <div className="w-full max-w-lg mt-3 flex flex-col gap-3">
              <div className="flex gap-3">
                <button
                  onClick={handleMeasure}
                  className="flex-1 py-4 px-6 rounded-2xl bg-cyan text-slate-950 font-orbitron font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-cyan/90 transition-all shadow-xl shadow-cyan/20 active:scale-95"
                >
                  <Scan className="w-5 h-5" /> Disparar Detector de Medición
                </button>
                <button
                  onClick={handleResetSuperposition}
                  className="py-4 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center justify-center gap-1.5 transition-all border border-slate-700"
                  title="Restaurar superposición y probar de nuevo"
                >
                  <RotateCcw className="w-4 h-4" /> Probar de nuevo
                </button>
              </div>

              {/* Instant Observable Result Card */}
              {hasMeasured && collapsedState !== null && (
                <div className={`p-4 rounded-2xl border text-sm text-left animate-in fade-in zoom-in-95 duration-200 ${
                  collapsedState === 0
                    ? 'bg-cyan/10 border-cyan/50 text-cyan'
                    : 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                }`}>
                  <div className="font-bold font-orbitron flex items-center gap-2 mb-1.5 text-base">
                    <CheckCircle2 className="w-5 h-5" />
                    ¡Colapso Observado en el Polo |{collapsedState}⟩!
                  </div>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                    Al observar el qubit, forzaste a la aguja a fijarse en un único polo físico. La superposición de cara y cruz desapareció instantáneamente. La probabilidad pasó de ser 50% / 50% a <strong className="text-white">100% de certeza en |{collapsedState}⟩</strong>.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASO 5: RETO DE COMPRENSIÓN (PREGUNTA DEDUCTIVA Y VALIDACIÓN FINAL)         */}
      {/* ========================================================================= */}
      {step === 4 && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-6 py-2 animate-in fade-in zoom-in-95 duration-300">
          <div>
            <div className="text-xs font-mono text-cyan uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
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
                  ? 'bg-emerald-950/40 border-emerald-500/80 text-emerald-200 font-semibold shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              B) Colapsa a uno de los estados posibles (|0⟩ o |1⟩)
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
              className={`w-full max-w-xl p-4 rounded-2xl text-sm flex items-center justify-between gap-4 text-left ${
                userChoice === 'collapse'
                  ? 'bg-emerald-950/30 border border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/30 border border-rose-500/40 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {userChoice === 'collapse' ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                ) : (
                  <Info className="w-6 h-6 text-rose-400 shrink-0" />
                )}
                <span>
                  {userChoice === 'collapse'
                    ? '¡Exacto! La medición rompe la superposición y fuerza el colapso hacia uno de los polos base (|0⟩ o |1⟩).'
                    : 'Pista: En el laboratorio 3D viste que al medir con el láser, la aguja no se quedó en el medio ni se dividió: saltó y se fijó en un único polo.'}
                </span>
              </div>

              {userChoice === 'collapse' && (
                <button
                  onClick={onComplete}
                  className="py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-orbitron font-bold text-xs uppercase tracking-wider flex items-center gap-2 shrink-0 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
                >
                  Pasar a Tarea 2 <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* BOTTOM STEP NAVIGATION (NO DICE DIAPOSITIVA)                              */}
      {/* ========================================================================= */}
      <div className="flex justify-between items-center border-t border-slate-800 pt-5 mt-6">
        <button
          onClick={goToPrevStep}
          disabled={step === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-all font-mono text-xs uppercase"
        >
          <ArrowLeft className="w-4 h-4" /> Paso Anterior
        </button>

        <span className="text-xs font-mono text-slate-500 hidden sm:inline">
          Tip: Puedes usar las flechas del teclado (← / →) para avanzar entre pasos
        </span>

        {step < totalSteps - 1 && (
          <button
            onClick={goToNextStep}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan text-slate-950 hover:bg-cyan/90 transition-all font-orbitron font-bold text-xs uppercase tracking-wider shadow-md shadow-cyan/20 active:scale-95"
          >
            Siguiente Paso <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {step === totalSteps - 1 && userChoice !== 'collapse' && (
          <span className="text-xs font-mono text-slate-400">
            Responde la pregunta arriba para continuar
          </span>
        )}
      </div>
    </div>
  );
}
