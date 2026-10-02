"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import {
  Scan,
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
  Check,
  Zap,
} from "lucide-react";
import {
  playButtonClick,
  playChimeSuccess,
  playLaserScan,
  playQuantumCollapse,
} from "@/lib/sound";
import { saveCompletedMission, updateStoredMetrics } from "@/lib/cookies";

interface Props {
  onComplete: () => void;
}

// 3D Text Sprite Creator for Three.js
function createTextSprite(
  text: string,
  color: string = "#00f0ff",
  fontSize: number = 44,
) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.font = `bold ${fontSize}px "Orbitron", sans-serif, system-ui`;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;
    ctx.fillText(text, 128, 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  const spriteMat = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.scale.set(0.9, 0.45, 1);
  return sprite;
}

export default function Mission1Superposition({ onComplete }: Props) {
  // Step index: 0 = Bit Clásico, 1 = Qubit y Dirac, 2 = Esfera 3D, 3 = Medición y Colapso, 4 = Reto Final
  const [step, setStep] = useState<number>(0);
  const totalSteps = 5;

  // Step 0: Classical Bit
  const [classicBit, setClassicBit] = useState<0 | 1>(0);

  // Step 1: Coin Analogy
  const [isCoinSpinning, setIsCoinSpinning] = useState(true);

  // Step 2 & 3: 3D Bloch Lab
  const containerRef = useRef<HTMLDivElement>(null);
  const [theta, setTheta] = useState(Math.PI / 2); // Initial: Equator (Superposition 50/50)
  const [isSuperposition, setIsSuperposition] = useState(true);
  const [collapsedState, setCollapsedState] = useState<number | null>(null);
  const [hasMeasured, setHasMeasured] = useState(false);

  // Step 4: Quiz
  const [userChoice, setUserChoice] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const sphereGroupRef = useRef<THREE.Group | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const vectorArrowRef = useRef<THREE.ArrowHelper | null>(null);
  const shockwaveRef = useRef<THREE.Mesh | null>(null);
  const pole0MeshRef = useRef<THREE.Mesh | null>(null);
  const pole1MeshRef = useRef<THREE.Mesh | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Live Probabilities
  const alpha = Math.cos(theta / 2);
  const beta = Math.sin(theta / 2);
  const prob0 = isSuperposition
    ? Math.round(alpha ** 2 * 100)
    : collapsedState === 0
      ? 100
      : 0;
  const prob1 = 100 - prob0;

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
      if (e.key === "ArrowRight" && step < totalSteps - 1) {
        goToNextStep();
      } else if (e.key === "ArrowLeft" && step > 0) {
        goToPrevStep();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, totalSteps, goToNextStep, goToPrevStep]);

  // Three.js Scene Setup (Mounts on Step 2 and Step 3)
  useEffect(() => {
    if ((step !== 2 && step !== 3) || !containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 600;
    const height = 400;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.9, 3.4);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    container.innerHTML = "";
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

    // Equator Ring
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

    // Dashed Axis
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
    const pole0 = new THREE.Mesh(
      pole0Geo,
      new THREE.MeshBasicMaterial({ color: 0x00f0ff }),
    );
    pole0.position.set(0, 1, 0);
    pole0MeshRef.current = pole0;
    sphereGroup.add(pole0);

    const sprite0 = createTextSprite("|0⟩ Norte", "#00f0ff", 44);
    sprite0.position.set(0.65, 1.1, 0);
    sphereGroup.add(sprite0);

    // South Pole (|1⟩)
    const pole1Geo = new THREE.SphereGeometry(0.08, 16, 16);
    const pole1 = new THREE.Mesh(
      pole1Geo,
      new THREE.MeshBasicMaterial({ color: 0x10b981 }),
    );
    pole1.position.set(0, -1, 0);
    pole1MeshRef.current = pole1;
    sphereGroup.add(pole1);

    const sprite1 = createTextSprite("|1⟩ Sur", "#10b981", 44);
    sprite1.position.set(0.65, -1.1, 0);
    sphereGroup.add(sprite1);

    // Equator Sprite
    const spritePlus = createTextSprite("|+⟩ 50/50", "#c084fc", 38);
    spritePlus.position.set(1.4, 0, 0);
    sphereGroup.add(spritePlus);

    // State Vector (|ψ⟩)
    const dir = new THREE.Vector3(
      Math.sin(theta),
      Math.cos(theta),
      0,
    ).normalize();
    const arrow = new THREE.ArrowHelper(
      dir,
      new THREE.Vector3(0, 0, 0),
      1,
      0x00f0ff,
      0.24,
      0.14,
    );
    vectorArrowRef.current = arrow;
    sphereGroup.add(arrow);

    // Shockwave
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

    // Quantum Particles
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(60 * 3);
    for (let i = 0; i < 60 * 3; i += 3) {
      pPos[i] = (Math.random() - 0.5) * 3.5;
      pPos[i + 1] = (Math.random() - 0.5) * 3.5;
      pPos[i + 2] = (Math.random() - 0.5) * 3.5;
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const particles = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({
        color: 0x00f0ff,
        size: 0.035,
        transparent: true,
        opacity: 0.35,
      }),
    );
    scene.add(particles);

    // Free Mouse Drag Orbit Rotation
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

    container.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

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
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(w, height);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      container.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("resize", handleResize);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      renderer.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      pGeo.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Update Vector Arrow & Pole Highlights when theta or collapse state changes
  useEffect(() => {
    if (!vectorArrowRef.current) return;
    let targetTheta = theta;
    if (!isSuperposition && collapsedState !== null) {
      targetTheta = collapsedState === 0 ? 0.001 : Math.PI - 0.001;
    }
    const newDir = new THREE.Vector3(
      Math.sin(targetTheta),
      Math.cos(targetTheta),
      0,
    ).normalize();
    vectorArrowRef.current.setDirection(newDir);

    const arrowColor = isSuperposition
      ? 0x00f0ff
      : collapsedState === 0
        ? 0x00f0ff
        : 0x10b981;
    vectorArrowRef.current.setColor(arrowColor);

    if (pole0MeshRef.current) {
      pole0MeshRef.current.scale.setScalar(
        collapsedState === 0
          ? 2.2
          : isSuperposition && theta < Math.PI / 4
            ? 1.4
            : 1.0,
      );
    }
    if (pole1MeshRef.current) {
      pole1MeshRef.current.scale.setScalar(
        collapsedState === 1
          ? 2.2
          : isSuperposition && theta > (3 * Math.PI) / 4
            ? 1.4
            : 1.0,
      );
    }
  }, [theta, isSuperposition, collapsedState]);

  // Preset Handlers
  const handleSetPreset = (targetTheta: number) => {
    playButtonClick();
    setIsSuperposition(true);
    setCollapsedState(null);
    setTheta(targetTheta);
  };

  // Measurement Action
  const handleMeasure = () => {
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
    if (choice === "collapse") {
      playChimeSuccess();
      saveCompletedMission(0);
    } else {
      playButtonClick();
    }
  };

  return (
    <div className="w-full flex-1 max-w-5xl mx-auto flex flex-col justify-between py-2 text-slate-100 min-h-[640px]">
      {/* ========================================================================= */}
      {/* TOP CLEAN PROGRESS HEADER                                                 */}
      {/* ========================================================================= */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan px-2.5 py-1 rounded-md bg-cyan/10 border border-cyan/30">
            Tarea 1
          </span>
          <span className="text-xs font-mono text-slate-400">
            Paso {step + 1} de {totalSteps}
          </span>
        </div>

        {/* Progress Pills */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <button
              key={i}
              onClick={() => {
                playButtonClick();
                setStep(i);
              }}
              className={`h-2 rounded-full transition-all ${
                step === i
                  ? "w-8 bg-cyan shadow-sm shadow-cyan/50"
                  : i < step
                    ? "w-3 bg-emerald-500"
                    : "w-2 bg-slate-800 hover:bg-slate-700"
              }`}
              title={`Ir al paso ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PASO 1: EL BIT CLÁSICO (ÚNICO FOCO: INTERRUPTOR BINARIO TÁCTIL)           */}
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
            <p className="text-base sm:text-lg text-slate-300 mt-3 max-w-xl mx-auto leading-relaxed">
              En la informática tradicional, un bit solo puede existir en uno de
              dos estados posibles,{" "}
              <strong className="text-white">
                estrictamente 0 o estrictamente 1
              </strong>
              .
            </p>
          </div>

          {/* Interactive Mechanical Switch Widget */}
          <div className="p-8 sm:p-10 rounded-3xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-md shadow-2xl flex flex-col items-center gap-6 w-full max-w-md">
            <button
              onClick={() => {
                playButtonClick();
                setClassicBit((prev) => (prev === 0 ? 1 : 0));
              }}
              className="w-full py-5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-850 border-2 border-slate-700 hover:border-cyan text-white font-mono text-lg transition-all flex items-center justify-between active:scale-95 shadow-xl group"
            >
              <div className="flex items-center gap-3">
                {classicBit === 1 ? (
                  <ToggleRight className="w-10 h-10 text-cyan" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-slate-500 group-hover:text-slate-300" />
                )}
                <span className="font-sans font-semibold text-base">
                  Tocar Interruptor
                </span>
              </div>
              <span
                className={`text-xs font-mono px-2.5 py-1 rounded ${
                  classicBit === 1
                    ? "bg-cyan/20 text-cyan border border-cyan/40 font-bold"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {classicBit === 1 ? "5V (ALTO)" : "0V (BAJO)"}
              </span>
            </button>

            <div className="text-5xl sm:text-6xl font-orbitron font-bold text-white tracking-wider">
              VALOR: <span className="text-cyan">{classicBit}</span>
            </div>

            <p className="text-xs text-slate-400 leading-normal max-w-xs">
              No existe ningún estado intermedio. Un bit clásico jamás puede ser
              0 y 1 al mismo tiempo.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASO 2: EL QUBIT Y LA NOTACIÓN DIRAC (ÚNICO FOCO: KET Y VECTOR)           */}
      {/* ========================================================================= */}
      {step === 1 && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-7 py-4 animate-in fade-in zoom-in-95 duration-300">
          <div>
            <div className="text-xs font-mono text-cyan uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan" /> Fundamento Cuántico
            </div>
            <h2 className="text-3xl sm:text-5xl font-orbitron font-bold text-white tracking-wide">
              El Qubit y su Notación
            </h2>
            <p className="text-base sm:text-lg text-slate-300 mt-2 max-w-xl mx-auto leading-relaxed">
              La unidad cuántica no es un simple dígito binario. Puede existir
              en una <strong className="text-cyan">superposición</strong> de
              ambos estados a la vez.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full max-w-3xl text-left">
            {/* Notación Ket Card */}
            <div className="p-6 rounded-3xl bg-slate-950/80 border border-cyan/40 backdrop-blur-md shadow-xl flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan/10 border border-cyan/40 flex items-center justify-center text-cyan">
                  <Atom className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-orbitron font-bold text-white text-sm">
                    ¿Por qué se escribe |0⟩ y |1⟩?
                  </h3>
                  <span className="text-[11px] font-mono text-cyan">
                    Notación Ket (Dirac)
                  </span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                El número se encierra entre una barra y un ángulo para indicar
                que no es un dígito matemático, sino un{" "}
                <strong className="text-white">
                  estado físico fundamental
                </strong>{" "}
                (como el Polo Norte o Sur).
              </p>
            </div>

            {/* Vector Card */}
            <div className="p-6 rounded-3xl bg-slate-950/80 border border-purple-500/40 backdrop-blur-md shadow-xl flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/40 flex items-center justify-center text-purple-400">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-orbitron font-bold text-white text-sm">
                    ¿Qué representa la aguja?
                  </h3>
                  <span className="text-[11px] font-mono text-purple-400">
                    Vector de Estado |ψ⟩
                  </span>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                La flecha que nace del centro indica la probabilidad actual. Si
                está inclinada hacia el medio, el qubit tiene probabilidad
                simultánea de dar 0 y 1.
              </p>
            </div>
          </div>

          {/* Interactive Coin Analogy */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-slate-800 w-full max-w-3xl flex items-center justify-between gap-4 text-left">
            <div className="flex items-start gap-3">
              <Coins
                className={`w-6 h-6 shrink-0 mt-0.5 ${isCoinSpinning ? "text-cyan animate-spin" : "text-slate-400"}`}
              />
              <div className="text-xs sm:text-sm text-slate-300">
                <strong className="text-white block font-sans mb-0.5">
                  La analogía de la moneda:
                </strong>
                Una moneda en reposo es cara o cruz (bit clásico). Mientras gira
                en el aire, contiene ambas caras a la vez (superposición
                cuántica) hasta que cae en la mano.
              </div>
            </div>
            <button
              onClick={() => {
                playButtonClick();
                setIsCoinSpinning(!isCoinSpinning);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-cyan hover:bg-slate-850 shrink-0"
            >
              {isCoinSpinning ? "Atrapar Moneda" : "Lanzar al Aire"}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASO 3: LA ESFERA DE BLOCH 3D (ÚNICO FOCO: MANIPULACIÓN 3D Y PROBABILIDAD) */}
      {/* ========================================================================= */}
      {step === 2 && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-4 py-2 animate-in fade-in zoom-in-95 duration-300">
          <div>
            <div className="text-xs font-mono text-cyan uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
              <Activity className="w-4 h-4 text-cyan" /> Espacio de Estados
            </div>
            <h2 className="text-2xl sm:text-4xl font-orbitron font-bold text-white tracking-wide">
              La Esfera de Bloch
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl mx-auto leading-relaxed">
              Arrastra con el ratón sobre la esfera para girarla 360°. Ajusta el
              deslizador para ver cómo la aguja cambia las probabilidades en
              vivo.
            </p>
          </div>

          {/* 3D Canvas Box */}
          <div className="w-full max-w-2xl p-4 rounded-3xl bg-[#060a14] border border-slate-800/90 shadow-2xl relative flex flex-col items-center">
            {/* Top Pole Indicators Bar */}
            <div className="w-full flex justify-between items-center z-10 px-2 py-1">
              <button
                onClick={() => handleSetPreset(0.001)}
                className={`px-3 py-1 rounded-full font-mono text-xs font-bold transition-all border ${
                  theta < 0.2
                    ? "bg-cyan text-slate-950 border-cyan ring-4 ring-cyan/30 shadow-md shadow-cyan/40 scale-105"
                    : "bg-cyan/15 text-cyan border-cyan/40 hover:bg-cyan/25"
                }`}
              >
                POLO NORTE: |0⟩
              </button>

              <button
                onClick={() => handleSetPreset(Math.PI / 2)}
                className={`px-3 py-1 rounded-full font-mono text-xs font-bold transition-all border ${
                  Math.abs(theta - Math.PI / 2) < 0.1
                    ? "bg-purple-600 text-white border-purple-400 ring-4 ring-purple-500/30 shadow-md shadow-purple-600/40 scale-105"
                    : "bg-purple-500/15 text-purple-300 border-purple-500/40 hover:bg-purple-500/25"
                }`}
              >
                ECUADOR: |+⟩ 50/50
              </button>

              <button
                onClick={() => handleSetPreset(Math.PI - 0.001)}
                className={`px-3 py-1 rounded-full font-mono text-xs font-bold transition-all border ${
                  theta > Math.PI - 0.2
                    ? "bg-emerald-500 text-slate-950 border-emerald-400 ring-4 ring-emerald-500/30 shadow-md shadow-emerald-500/40 scale-105"
                    : "bg-emerald-500/15 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/25"
                }`}
              >
                POLO SUR: |1⟩
              </button>
            </div>

            {/* Canvas */}
            <div
              ref={containerRef}
              className="w-full cursor-grab active:cursor-grabbing touch-none select-none my-1"
              title="Arrastra con el ratón para rotar en 3D"
            />

            {/* Slider & Real-time Probabilities */}
            <div className="w-full max-w-lg mt-2 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                <span>Inclinación de la aguja:</span>
                <span className="font-orbitron font-bold text-white text-xs">
                  |ψ⟩ = <span className="text-cyan">{alpha.toFixed(2)}</span>|0⟩
                  + <span className="text-emerald-400">{beta.toFixed(2)}</span>
                  |1⟩
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

              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800/80">
                <div className="flex flex-col gap-1 text-left">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-cyan font-bold">P(|0⟩):</span>
                    <span className="text-white font-bold">{prob0}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-cyan transition-all duration-100"
                      style={{ width: `${prob0}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1 text-left">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-emerald-400 font-bold">P(|1⟩):</span>
                    <span className="text-white font-bold">{prob1}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-100"
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
      {/* PASO 4: EL COLAPSO DE LA MEDICIÓN (ÚNICO FOCO: ACCIÓN LÁSER Y COLAPSO)    */}
      {/* ========================================================================= */}
      {step === 3 && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-4 py-2 animate-in fade-in zoom-in-95 duration-300">
          <div>
            <div className="text-xs font-mono text-cyan uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
              <Scan className="w-4 h-4 text-cyan" /> El Momento Decisivo
            </div>
            <h2 className="text-2xl sm:text-4xl font-orbitron font-bold text-white tracking-wide">
              El Colapso de la Medición
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl mx-auto leading-relaxed">
              Mientras no se mida, la aguja permanece en superposición. Dispara
              el detector para observar cómo la observación destruye la
              superposición.
            </p>
          </div>

          {/* 3D Canvas Box + Big Focused Action Button */}
          <div className="w-full max-w-2xl p-4 rounded-3xl bg-[#060a14] border border-slate-800/90 shadow-2xl relative flex flex-col items-center">
            {/* Canvas */}
            <div
              ref={containerRef}
              className="w-full cursor-grab active:cursor-grabbing touch-none select-none my-1"
              title="Arrastra con el ratón para rotar en 3D"
            />

            <div className="w-full max-w-md mt-2 flex flex-col gap-3">
              <div className="flex gap-3">
                <button
                  onClick={handleMeasure}
                  className="flex-1 py-4 px-6 rounded-2xl bg-cyan text-slate-950 font-orbitron font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-cyan/90 transition-all shadow-xl shadow-cyan/25 active:scale-95"
                >
                  <Zap className="w-5 h-5" /> Disparar Detector Láser
                </button>
                <button
                  onClick={handleResetSuperposition}
                  className="py-4 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono flex items-center justify-center gap-1.5 transition-all border border-slate-800"
                  title="Restaurar superposición y probar de nuevo"
                >
                  <RotateCcw className="w-4 h-4" /> Probar de nuevo
                </button>
              </div>

              {/* Observable Result Card */}
              {hasMeasured && collapsedState !== null && (
                <div
                  className={`p-4 rounded-2xl border text-sm text-left animate-in fade-in zoom-in-95 duration-200 ${
                    collapsedState === 0
                      ? "bg-cyan/10 border-cyan/50 text-cyan"
                      : "bg-emerald-950/40 border-emerald-500/60 text-emerald-200"
                  }`}
                >
                  <div className="font-bold font-orbitron flex items-center gap-2 mb-1 text-base">
                    <CheckCircle2 className="w-5 h-5" />
                    ¡Colapso Observado en el Polo |{collapsedState}⟩!
                  </div>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                    Al interactuar con el qubit, la aguja fue forzada a fijarse
                    en un único polo. La superposición desapareció: pasó de
                    50/50 a{" "}
                    <strong className="text-white">
                      100% de certeza clásica en |{collapsedState}⟩
                    </strong>
                    .
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASO 5: RETO DE COMPRENSIÓN (ÚNICO FOCO: PREGUNTA DIRECTA Y VALIDACIÓN)   */}
      {/* ========================================================================= */}
      {step === 4 && (
        <div className="flex-1 flex flex-col justify-center items-center text-center gap-6 py-4 animate-in fade-in zoom-in-95 duration-300">
          <div>
            <div className="text-xs font-mono text-cyan uppercase tracking-widest mb-1 flex items-center justify-center gap-2">
              <HelpCircle className="w-4 h-4 text-cyan" /> Comprobación Final
            </div>
            <h2 className="text-2xl sm:text-4xl font-orbitron font-bold text-white tracking-wide">
              Reto de Comprensión
            </h2>
            <p className="text-base sm:text-lg text-slate-200 mt-2 font-semibold max-w-xl mx-auto">
              ¿Qué ocurre cuando se mide un qubit que está en superposición?
            </p>
          </div>

          <div className="w-full max-w-xl flex flex-col gap-3.5">
            <button
              onClick={() => handleQuizChoice("duplicate")}
              className={`p-5 rounded-2xl border text-left text-sm leading-normal transition-all ${
                userChoice === "duplicate"
                  ? "bg-rose-950/40 border-rose-500 text-rose-200"
                  : "bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700"
              }`}
            >
              A) Se duplica en dos qubits independientes
            </button>
            <button
              onClick={() => handleQuizChoice("collapse")}
              className={`p-5 rounded-2xl border text-left text-sm leading-normal transition-all ${
                userChoice === "collapse"
                  ? "bg-emerald-950/60 border-emerald-500 text-emerald-200 font-semibold shadow-xl shadow-emerald-500/20 ring-2 ring-emerald-500/40"
                  : "bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700"
              }`}
            >
              B) Colapsa forzosamente a uno de los dos estados posibles (|0⟩ o
              |1⟩)
            </button>
            <button
              onClick={() => handleQuizChoice("infinite")}
              className={`p-5 rounded-2xl border text-left text-sm leading-normal transition-all ${
                userChoice === "infinite"
                  ? "bg-rose-950/40 border-rose-500 text-rose-200"
                  : "bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700"
              }`}
            >
              C) Permanece en superposición indefinidamente
            </button>
          </div>

          {showFeedback && (
            <div
              className={`w-full max-w-xl p-4 rounded-2xl text-sm flex items-center justify-between gap-4 text-left ${
                userChoice === "collapse"
                  ? "bg-emerald-950/30 border border-emerald-500/40 text-emerald-200"
                  : "bg-rose-950/30 border border-rose-500/40 text-rose-200"
              }`}
            >
              <div className="flex items-center gap-3">
                {userChoice === "collapse" ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                ) : (
                  <HelpCircle className="w-6 h-6 text-rose-400 shrink-0" />
                )}
                <span>
                  {userChoice === "collapse"
                    ? "¡Correcto! La medición destruye la superposición forzando el colapso hacia uno de los polos base (|0⟩ o |1⟩)."
                    : "Pista: En el laboratorio viste que al disparar el detector, la aguja no se quedó en el medio ni se dividió: saltó a un único polo."}
                </span>
              </div>

              {userChoice === "collapse" && (
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
      {/* BOTTOM NAVIGATION                                                         */}
      {/* ========================================================================= */}
      <div className="flex justify-between items-center border-t border-slate-800 pt-4 mt-4">
        <button
          onClick={goToPrevStep}
          disabled={step === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-all font-mono text-xs uppercase"
        >
          <ArrowLeft className="w-4 h-4" /> Anterior
        </button>

        <span className="text-xs font-mono text-slate-500 hidden sm:inline">
          Tip: Usa las flechas del teclado (← / →) para avanzar entre pasos
        </span>

        {step < totalSteps - 1 && (
          <button
            onClick={goToNextStep}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyan text-slate-950 hover:bg-cyan/90 transition-all font-orbitron font-bold text-xs uppercase tracking-wider shadow-md shadow-cyan/20 active:scale-95"
          >
            Siguiente Paso <ArrowRight className="w-4 h-4" />
          </button>
        )}

        {step === totalSteps - 1 && userChoice !== "collapse" && (
          <span className="text-xs font-mono text-slate-400">
            Responde la pregunta arriba para continuar
          </span>
        )}
      </div>
    </div>
  );
}
