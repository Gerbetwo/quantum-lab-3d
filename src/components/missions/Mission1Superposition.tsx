'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  Scan,
  RotateCcw,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Layers,
  Activity,
  Compass,
  Zap,
  Check,
  Flame,
  BarChart3,
  Lightbulb,
  Atom,
} from 'lucide-react';
import {
  playButtonClick,
  playChimeSuccess,
  playLaserScan,
  playQuantumCollapse,
} from '@/lib/sound';
import { saveCompletedMission, updateStoredMetrics } from '@/lib/cookies';

interface Props {
  onComplete: () => void;
}

// High-resolution 3D text sprite creator
function createTextSprite(text: string, color: string = '#00f0ff', fontSize: number = 44) {
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
  // Classical Bit State
  const [classicBit, setClassicBit] = useState<0 | 1>(0);
  const [hasToggledClassic, setHasToggledClassic] = useState(false);

  // Quantum State (Angle theta from North pole 0 to PI)
  const [theta, setTheta] = useState(Math.PI / 2); // Initial: Equator (Superposition 50/50)
  const [isSuperposition, setIsSuperposition] = useState(true);
  const [collapsedState, setCollapsedState] = useState<number | null>(null);
  const [hasCalibratedSuperposition, setHasCalibratedSuperposition] = useState(false);

  // Empirical Measurement Stats
  const [totalShots, setTotalShots] = useState(0);
  const [counts0, setCounts0] = useState(0);
  const [counts1, setCounts1] = useState(0);
  const [isMeasuringBurst, setIsMeasuringBurst] = useState(false);

  // Discovery Checklist Progress
  const [quizUnlocked, setQuizUnlocked] = useState(false);
  const [userChoice, setUserChoice] = useState<string | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Mathematical Wavefunction Amplitudes
  const alpha = Math.cos(theta / 2);
  const beta = Math.sin(theta / 2);
  const prob0 = isSuperposition ? Math.round(alpha ** 2 * 100) : collapsedState === 0 ? 100 : 0;
  const prob1 = 100 - prob0;

  // Three.js Scene References
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const sphereGroupRef = useRef<THREE.Group | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const vectorArrowRef = useRef<THREE.ArrowHelper | null>(null);
  const shockwaveRef = useRef<THREE.Mesh | null>(null);
  const pole0MeshRef = useRef<THREE.Mesh | null>(null);
  const pole1MeshRef = useRef<THREE.Mesh | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Initialize Three.js 3D Quantum Lab
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const height = Math.max(380, Math.min(container.clientHeight || 440, 500));

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.8, 3.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Group for free 3D rotation
    const sphereGroup = new THREE.Group();
    sphereGroupRef.current = sphereGroup;
    scene.add(sphereGroup);

    // Wireframe Bloch Sphere
    const sphereGeo = new THREE.SphereGeometry(1, 32, 24);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphereGroup.add(sphere);

    // Equator Ring (Superposition circle)
    const ringGeo = new THREE.RingGeometry(0.98, 1.02, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.55,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    sphereGroup.add(ring);

    // Axis line connecting poles
    const axisGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 1.15, 0),
      new THREE.Vector3(0, -1.15, 0),
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

    // North Pole (|0⟩)
    const pole0Geo = new THREE.SphereGeometry(0.08, 16, 16);
    const pole0 = new THREE.Mesh(pole0Geo, new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
    pole0.position.set(0, 1, 0);
    pole0MeshRef.current = pole0;
    sphereGroup.add(pole0);

    const sprite0 = createTextSprite('|0⟩ Norte', '#00f0ff', 44);
    sprite0.position.set(0.65, 1.1, 0);
    sphereGroup.add(sprite0);

    // South Pole (|1⟩)
    const pole1Geo = new THREE.SphereGeometry(0.08, 16, 16);
    const pole1 = new THREE.Mesh(pole1Geo, new THREE.MeshBasicMaterial({ color: 0x10b981 }));
    pole1.position.set(0, -1, 0);
    pole1MeshRef.current = pole1;
    sphereGroup.add(pole1);

    const sprite1 = createTextSprite('|1⟩ Sur', '#10b981', 44);
    sprite1.position.set(0.65, -1.1, 0);
    sphereGroup.add(sprite1);

    // Equator Label
    const spritePlus = createTextSprite('|+⟩ 50/50', '#c084fc', 38);
    spritePlus.position.set(1.4, 0, 0);
    sphereGroup.add(spritePlus);

    // State Vector Arrow (|ψ⟩)
    const dir = new THREE.Vector3(Math.sin(theta), Math.cos(theta), 0).normalize();
    const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0, 0), 1, 0x00f0ff, 0.24, 0.14);
    vectorArrowRef.current = arrow;
    sphereGroup.add(arrow);

    // Shockwave Ring
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

    // Ambient Particles
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(70 * 3);
    for (let i = 0; i < 70 * 3; i += 3) {
      pPos[i] = (Math.random() - 0.5) * 4;
      pPos[i + 1] = (Math.random() - 0.5) * 4;
      pPos[i + 2] = (Math.random() - 0.5) * 4;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const particles = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({ color: 0x00f0ff, size: 0.035, transparent: true, opacity: 0.35 })
    );
    scene.add(particles);

    // Interactive Drag to Rotate 3D Camera Orbit
    let isDragging = false;
    let prevPointer = { x: 0, y: 0 };

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevPointer = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging || !sphereGroupRef.current) return;
      const dx = e.clientX - prevPointer.x;
      const dy = e.clientY - prevPointer.y;
      sphereGroupRef.current.rotation.y += dx * 0.007;
      sphereGroupRef.current.rotation.x += dy * 0.007;
      prevPointer = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Animation Loop
    let shockScale = 0;
    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);

      if (!isDragging && sphereGroup) {
        sphereGroup.rotation.y += 0.0018;
      }
      particles.rotation.y -= 0.0006;

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
      const h = Math.max(380, Math.min(container.clientHeight || 440, 500));
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', handleResize);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      renderer.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      pGeo.dispose();
    };
  }, []);

  // Update Vector Arrow & Pole Highlights when theta or collapse state changes
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

  // Unlock Quiz once user performs at least 3 measurements and toggles classic bit
  useEffect(() => {
    if (totalShots >= 3 && hasToggledClassic) {
      setQuizUnlocked(true);
    }
  }, [totalShots, hasToggledClassic]);

  // Set Preset Angles
  const handleSetPreset = (targetTheta: number) => {
    playButtonClick();
    setIsSuperposition(true);
    setCollapsedState(null);
    setTheta(targetTheta);
    if (Math.abs(targetTheta - Math.PI / 2) < 0.1) {
      setHasCalibratedSuperposition(true);
      playChimeSuccess();
    }
  };

  // Perform Single Laser Measurement
  const executeSingleMeasure = () => {
    playLaserScan();
    setTimeout(() => playQuantumCollapse(), 150);

    if (shockwaveRef.current) {
      shockwaveRef.current.scale.set(0.1, 0.1, 0.1);
      (shockwaveRef.current.material as THREE.MeshBasicMaterial).opacity = 0.95;
    }

    const currentProb0 = Math.cos(theta / 2) ** 2;
    const outcome = Math.random() < currentProb0 ? 0 : 1;

    setIsSuperposition(false);
    setCollapsedState(outcome);

    setTotalShots((prev) => prev + 1);
    if (outcome === 0) {
      setCounts0((prev) => prev + 1);
    } else {
      setCounts1((prev) => prev + 1);
    }

    updateStoredMetrics((prev) => ({
      ...prev,
      actions: {
        ...prev.actions,
        superpositionMeasurements: prev.actions.superpositionMeasurements + 1,
      },
    }));
  };

  // Burst Laser Measurement (10 rapid shots)
  const executeBurstMeasure = () => {
    if (isMeasuringBurst) return;
    setIsMeasuringBurst(true);
    let count = 0;
    const interval = setInterval(() => {
      executeSingleMeasure();
      count++;
      if (count >= 10) {
        clearInterval(interval);
        setIsMeasuringBurst(false);
      }
    }, 180);
  };

  // Restore Superposition
  const handleRestoreSuperposition = () => {
    playButtonClick();
    setIsSuperposition(true);
    setCollapsedState(null);
    setTheta(Math.PI / 2);
  };

  // Quiz Answer Handler
  const handleQuizChoice = (choice: string) => {
    setUserChoice(choice);
    if (choice === 'collapse') {
      playChimeSuccess();
      setQuizCompleted(true);
      saveCompletedMission(0);
    } else {
      playButtonClick();
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col gap-4 py-1 text-slate-100">
      {/* ========================================================================= */}
      {/* TOP FLUID BANNER: DISCOVERY OBJECTIVE                                     */}
      {/* ========================================================================= */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan/10 border border-cyan/40 flex items-center justify-center text-cyan shadow-sm shadow-cyan/20">
            <Atom className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-orbitron font-bold text-white flex items-center gap-2">
              Tarea 1: Laboratorio de Superposición Cuántica
            </h1>
            <p className="text-xs text-slate-400">
              Manipula la aguja de Dirac, compara con el bit clásico y observa el colapso al disparar el detector láser.
            </p>
          </div>
        </div>

        {/* Live Empirical Counter Pills */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-cyan" />
            <span className="text-slate-400">Mediciones:</span>
            <span className="font-bold text-white">{totalShots}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-1.5">
            <span className="text-cyan font-bold">|0⟩: {counts0}</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-bold">|1⟩: {counts1}</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN SPATIAL WORKBENCH (FULL WIDTH, NO RIGID BOXES)                       */}
      {/* ========================================================================= */}
      <div className="w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* ======================================================================= */}
        {/* LEFT COLUMN: CLASSICAL BIT LAB & OBJECTIVES (3 COLS)                     */}
        {/* ======================================================================= */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Classical Bit Circuit Sandbox */}
          <div className="rounded-3xl bg-slate-950/70 border border-slate-800/80 p-5 backdrop-blur-md flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan" /> Bit Clásico
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${classicBit === 1 ? 'bg-cyan/20 text-cyan border border-cyan/40' : 'bg-slate-900 text-slate-500'}`}>
                {classicBit === 1 ? '5V (ALTO)' : '0V (BAJO)'}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              La computación clásica depende de interruptores físicos rígidos: solo existe en <strong className="text-white">0 o 1</strong>, sin estados continuos.
            </p>

            {/* Interactive Mechanical Switch */}
            <button
              onClick={() => {
                playButtonClick();
                setClassicBit((prev) => (prev === 0 ? 1 : 0));
                setHasToggledClassic(true);
              }}
              className="w-full py-4 px-5 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-700 hover:border-cyan transition-all flex items-center justify-between group active:scale-95 shadow-md"
            >
              <div className="flex items-center gap-3">
                {classicBit === 1 ? (
                  <ToggleRight className="w-8 h-8 text-cyan" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-500 group-hover:text-slate-300" />
                )}
                <div className="text-left">
                  <div className="text-xs font-sans text-slate-400">Tocar Interruptor</div>
                  <div className="text-sm font-orbitron font-bold text-white">
                    {classicBit === 0 ? 'Estado: 0 (Corte)' : 'Estado: 1 (Corriente)'}
                  </div>
                </div>
              </div>
              <div
                className={`w-3.5 h-3.5 rounded-full transition-all ${
                  classicBit === 1
                    ? 'bg-cyan shadow-lg shadow-cyan animate-pulse'
                    : 'bg-slate-800'
                }`}
              />
            </button>
          </div>

          {/* Discovery Goals Checklist */}
          <div className="rounded-3xl bg-slate-950/70 border border-slate-800/80 p-5 backdrop-blur-md flex-1 flex flex-col gap-3 shadow-xl">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan" /> Misión del Investigador
            </span>

            <ul className="space-y-2.5 text-xs">
              <li className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all ${
                hasToggledClassic ? 'bg-cyan/10 border-cyan/40 text-cyan font-semibold' : 'bg-slate-900/40 border-slate-800/60 text-slate-400'
              }`}>
                {hasToggledClassic ? <Check className="w-4 h-4 text-cyan shrink-0 mt-0.5" /> : <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0 mt-0.5" />}
                <span>1. Conmutar el bit clásico a 0 y 1</span>
              </li>

              <li className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all ${
                hasCalibratedSuperposition ? 'bg-cyan/10 border-cyan/40 text-cyan font-semibold' : 'bg-slate-900/40 border-slate-800/60 text-slate-400'
              }`}>
                {hasCalibratedSuperposition ? <Check className="w-4 h-4 text-cyan shrink-0 mt-0.5" /> : <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0 mt-0.5" />}
                <span>2. Poner el qubit en superposición 50/50</span>
              </li>

              <li className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all ${
                totalShots >= 3 ? 'bg-cyan/10 border-cyan/40 text-cyan font-semibold' : 'bg-slate-900/40 border-slate-800/60 text-slate-400'
              }`}>
                {totalShots >= 3 ? <Check className="w-4 h-4 text-cyan shrink-0 mt-0.5" /> : <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0 mt-0.5" />}
                <span>3. Disparar al menos 3 mediciones láser ({totalShots}/3)</span>
              </li>

              <li className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all ${
                quizCompleted ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300 font-semibold' : 'bg-slate-900/40 border-slate-800/60 text-slate-400'
              }`}>
                {quizCompleted ? <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0 mt-0.5" />}
                <span>4. Resolver el reto de comprensión final</span>
              </li>
            </ul>

            <div className="mt-auto bg-slate-900/60 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400 flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-cyan shrink-0 mt-0.5" />
              <span>Gira la esfera 360° con el ratón para inspeccionar el vector desde cualquier perspectiva.</span>
            </div>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* CENTER COLUMN: 3D BLOCH CORE & DIRAC FORMULA HUD (6 COLS)                */}
        {/* ======================================================================= */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          {/* Main 3D Bloch Canvas Box */}
          <div className="rounded-3xl bg-[#050814]/90 border border-slate-800/80 p-4 backdrop-blur-xl relative flex flex-col items-center shadow-2xl overflow-hidden min-h-[440px]">
            {/* Top Pole Indicators Bar */}
            <div className="w-full flex justify-between items-center z-10 px-2 py-1">
              <button
                onClick={() => handleSetPreset(0.001)}
                className={`px-3 py-1.5 rounded-full font-mono text-xs font-bold transition-all border ${
                  theta < 0.2
                    ? 'bg-cyan text-slate-950 border-cyan ring-4 ring-cyan/30 shadow-lg shadow-cyan/40 scale-105'
                    : 'bg-cyan/15 text-cyan border-cyan/40 hover:bg-cyan/25'
                }`}
              >
                POLO NORTE: |0⟩
              </button>

              <button
                onClick={() => handleSetPreset(Math.PI / 2)}
                className={`px-3 py-1.5 rounded-full font-mono text-xs font-bold transition-all border ${
                  Math.abs(theta - Math.PI / 2) < 0.1
                    ? 'bg-purple-600 text-white border-purple-400 ring-4 ring-purple-500/30 shadow-lg shadow-purple-600/40 scale-105'
                    : 'bg-purple-500/15 text-purple-300 border-purple-500/40 hover:bg-purple-500/25'
                }`}
              >
                ECUADOR: |+⟩ 50/50
              </button>

              <button
                onClick={() => handleSetPreset(Math.PI - 0.001)}
                className={`px-3 py-1.5 rounded-full font-mono text-xs font-bold transition-all border ${
                  theta > Math.PI - 0.2
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 ring-4 ring-emerald-500/30 shadow-lg shadow-emerald-500/40 scale-105'
                    : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/25'
                }`}
              >
                POLO SUR: |1⟩
              </button>
            </div>

            {/* 3D Canvas */}
            <div
              ref={containerRef}
              className="w-full flex-1 cursor-grab active:cursor-grabbing touch-none select-none my-1"
              title="Arrastra con el ratón para rotar en 3D"
            />

            {/* Live Dirac State Vector HUD */}
            <div className="w-full bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3.5 backdrop-blur-md flex flex-col gap-2">
              <div className="flex flex-wrap items-center justify-between text-xs font-mono">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-cyan" /> Función de Onda (Notación Ket):
                </span>
                <span className="font-orbitron font-bold text-white text-sm">
                  |ψ⟩ = <span className="text-cyan">{alpha.toFixed(2)}</span>|0⟩ + <span className="text-emerald-400">{beta.toFixed(2)}</span>|1⟩
                </span>
              </div>

              {/* Slider for continuous state manipulation */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-cyan">|0⟩</span>
                <input
                  type="range"
                  min="0.001"
                  max={Math.PI - 0.001}
                  step="0.01"
                  value={theta}
                  onChange={(e) => {
                    const newTheta = parseFloat(e.target.value);
                    setTheta(newTheta);
                    setIsSuperposition(true);
                    setCollapsedState(null);
                    if (Math.abs(newTheta - Math.PI / 2) < 0.1) {
                      setHasCalibratedSuperposition(true);
                    }
                  }}
                  className="w-full accent-cyan cursor-pointer h-2 bg-slate-900 rounded-lg"
                />
                <span className="text-[11px] font-mono text-emerald-400">|1⟩</span>
              </div>

              {/* Live Theoretical Probabilities */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-cyan font-semibold">P(|0⟩) = |α|²:</span>
                    <span className="text-white font-bold">{prob0}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan transition-all duration-100" style={{ width: `${prob0}%` }} />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-emerald-400 font-semibold">P(|1⟩) = |β|²:</span>
                    <span className="text-white font-bold">{prob1}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-100" style={{ width: `${prob1}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* RIGHT COLUMN: LASER MEASUREMENT GUN & STATISTICS (3 COLS)                */}
        {/* ======================================================================= */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Laser Gun Measurement Chamber */}
          <div className="rounded-3xl bg-slate-950/70 border border-slate-800/80 p-5 backdrop-blur-md flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Scan className="w-3.5 h-3.5 text-cyan" /> Detector Láser
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                isSuperposition ? 'bg-purple-900/40 text-purple-300 border border-purple-500/40' : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/60'
              }`}>
                {isSuperposition ? 'EN SUPERPOSICIÓN' : `¡COLAPSADO A |${collapsedState}⟩!`}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Al medir, el observador destruye la superposición forzando a la aguja a fijarse en uno de los dos polos.
            </p>

            {/* Laser Action Buttons */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={executeSingleMeasure}
                className="w-full py-3.5 px-4 rounded-2xl bg-cyan text-slate-950 font-orbitron font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-cyan/90 transition-all shadow-lg shadow-cyan/20 active:scale-95"
              >
                <Zap className="w-4 h-4" /> Disparar Láser (x1)
              </button>

              <button
                onClick={executeBurstMeasure}
                disabled={isMeasuringBurst}
                className="w-full py-3 px-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-orbitron font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-600/20 active:scale-95 disabled:opacity-50"
              >
                <Flame className="w-4 h-4" /> {isMeasuringBurst ? 'Midiendo ráfaga...' : 'Ráfaga Cuántica (x10)'}
              </button>

              <button
                onClick={handleRestoreSuperposition}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-xs flex items-center justify-center gap-2 transition-all border border-slate-800 hover:border-slate-700"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Restaurar Superposición
              </button>
            </div>

            {/* Instant Collapse Feedback */}
            {!isSuperposition && collapsedState !== null && (
              <div className={`p-3 rounded-xl border text-xs text-left animate-in fade-in duration-200 ${
                collapsedState === 0
                  ? 'bg-cyan/10 border-cyan/50 text-cyan'
                  : 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
              }`}>
                <div className="font-bold flex items-center gap-1.5 mb-1 font-orbitron">
                  <CheckCircle2 className="w-4 h-4" /> Colapso Observable a |{collapsedState}⟩
                </div>
                La aguja se fijó irreversiblemente. Ahora el estado es 100% clásico hasta que prepares un nuevo qubit.
              </div>
            )}
          </div>

          {/* Real-time Empirical Stats Histogram */}
          <div className="rounded-3xl bg-slate-950/70 border border-slate-800/80 p-5 backdrop-blur-md flex-1 flex flex-col gap-3 shadow-xl">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-cyan" /> Resultados Empíricos
            </span>

            <div className="space-y-3 my-auto">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-cyan font-bold">Polo |0⟩ Norte:</span>
                <span className="text-white font-bold">
                  {counts0} tiros ({totalShots > 0 ? Math.round((counts0 / totalShots) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-cyan transition-all duration-200"
                  style={{ width: `${totalShots > 0 ? (counts0 / totalShots) * 100 : 0}%` }}
                />
              </div>

              <div className="flex justify-between text-xs font-mono">
                <span className="text-emerald-400 font-bold">Polo |1⟩ Sur:</span>
                <span className="text-white font-bold">
                  {counts1} tiros ({totalShots > 0 ? Math.round((counts1 / totalShots) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-emerald-500 transition-all duration-200"
                  style={{ width: `${totalShots > 0 ? (counts1 / totalShots) * 100 : 0}%` }}
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-normal">
              A mayor número de disparos, la estadística empírica converge exactamente con las probabilidades teóricas de la aguja.
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM SECTION: DEDUCTION VERIFICATION RETO (UNLOCKED BY ACTIONS)          */}
      {/* ========================================================================= */}
      {quizUnlocked && (
        <div className="w-full p-5 sm:p-6 rounded-3xl bg-slate-950/90 border border-cyan/40 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-5 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="max-w-xl text-left">
            <div className="text-xs font-mono text-cyan uppercase tracking-widest flex items-center gap-1.5 mb-1">
              <HelpCircle className="w-4 h-4 text-cyan" /> Reto de Comprensión
            </div>
            <h3 className="text-base sm:text-lg font-orbitron font-bold text-white">
              ¿Qué le sucede físicamente a un qubit en superposición cuando es medido por un detector?
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Comprueba lo que observaste en la esfera al disparar el láser para desbloquear la Tarea 2.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto shrink-0">
            <button
              onClick={() => handleQuizChoice('duplicate')}
              className={`px-4 py-3 rounded-xl border text-xs transition-all ${
                userChoice === 'duplicate'
                  ? 'bg-rose-950/40 border-rose-500 text-rose-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              A) Se duplica en dos copias
            </button>
            <button
              onClick={() => handleQuizChoice('collapse')}
              className={`px-4 py-3 rounded-xl border text-xs font-semibold transition-all ${
                userChoice === 'collapse'
                  ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/40 shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              B) Colapsa a uno de los dos polos (|0⟩ o |1⟩)
            </button>
            <button
              onClick={() => handleQuizChoice('infinite')}
              className={`px-4 py-3 rounded-xl border text-xs transition-all ${
                userChoice === 'infinite'
                  ? 'bg-rose-950/40 border-rose-500 text-rose-300'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              C) Permanece en superposición
            </button>

            {quizCompleted && (
              <button
                onClick={onComplete}
                className="py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-orbitron font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-500/30 active:scale-95 shrink-0"
              >
                Avanzar a Tarea 2 <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
