'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Sparkles, Scan, RotateCcw, ArrowRight, CheckCircle2 } from 'lucide-react';
import { playButtonClick, playChimeSuccess, playLaserScan, playQuantumCollapse } from '@/lib/sound';
import { saveCompletedMission, updateStoredMetrics } from '@/lib/cookies';

interface Props {
  onComplete: () => void;
}

export default function Mission1Superposition({ onComplete }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [theta, setTheta] = useState(Math.PI / 2); // default 90 deg = equator (50/50 superposition)
  const [isSuperposition, setIsSuperposition] = useState(true);
  const [collapsedState, setCollapsedState] = useState<number | null>(null);
  const [measureCount, setMeasureCount] = useState(0);
  const [userDeduction, setUserDeduction] = useState<string | null>(null);
  const [showDeductionFeedback, setShowDeductionFeedback] = useState(false);

  // Three.js scene refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const vectorArrowRef = useRef<THREE.ArrowHelper | null>(null);
  const shockwaveRef = useRef<THREE.Mesh | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 360;
    const height = 300;

    // 1. Scene, Camera, Renderer
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

    // 2. Translucent Bloch Sphere
    const sphereGeo = new THREE.SphereGeometry(1, 32, 24);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphere);

    // 3. Equator Ring (Superposition Circle)
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

    // 4. Pole Markers (|0> North, |1> South)
    const poleGeo = new THREE.SphereGeometry(0.06, 16, 16);
    const poleMat0 = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const pole0 = new THREE.Mesh(poleGeo, poleMat0);
    pole0.position.set(0, 1, 0);
    scene.add(pole0);

    const poleMat1 = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    const pole1 = new THREE.Mesh(poleGeo, poleMat1);
    pole1.position.set(0, -1, 0);
    scene.add(pole1);

    // 5. State Vector Arrow
    const dir = new THREE.Vector3(Math.sin(theta), Math.cos(theta), 0).normalize();
    const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0, 0), 1, 0x00f0ff, 0.2, 0.1);
    vectorArrowRef.current = arrow;
    scene.add(arrow);

    // 6. Expanding Shockwave Mesh (for collapse)
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

    // 7. Ambient Particle Field
    const particleCount = 60;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      pPos[i] = (Math.random() - 0.5) * 3;
      pPos[i + 1] = (Math.random() - 0.5) * 3;
      pPos[i + 2] = (Math.random() - 0.5) * 3;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.035,
      transparent: true,
      opacity: 0.35,
    });
    const particles = new THREE.Points(pGeo, pMat);
    particlesRef.current = particles;
    scene.add(particles);

    // 8. Animation loop
    let shockScale = 0;
    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);

      // Slow orbital rotation of sphere
      sphere.rotation.y += 0.003;
      particles.rotation.y -= 0.001;

      // Animate shockwave if triggered
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
  }, []);

  // Update vector arrow when theta or collapse state changes
  useEffect(() => {
    if (!vectorArrowRef.current) return;
    let targetTheta = theta;
    if (!isSuperposition && collapsedState !== null) {
      targetTheta = collapsedState === 0 ? 0.01 : Math.PI - 0.01;
    }
    const newDir = new THREE.Vector3(Math.sin(targetTheta), Math.cos(targetTheta), 0).normalize();
    vectorArrowRef.current.setDirection(newDir);
    vectorArrowRef.current.setColor(isSuperposition ? 0x00f0ff : (collapsedState === 0 ? 0x00f0ff : 0x10b981));
  }, [theta, isSuperposition, collapsedState]);

  // Trigger measurement detector
  const handleMeasure = () => {
    playLaserScan();
    setTimeout(() => playQuantumCollapse(), 150);

    // Trigger visual shockwave
    if (shockwaveRef.current) {
      shockwaveRef.current.scale.set(0.1, 0.1, 0.1);
      (shockwaveRef.current.material as THREE.MeshBasicMaterial).opacity = 0.9;
    }

    // Probability rule: P(0) = cos^2(theta/2), P(1) = sin^2(theta/2)
    const prob0 = Math.cos(theta / 2) ** 2;
    const outcome = Math.random() < prob0 ? 0 : 1;

    setIsSuperposition(false);
    setCollapsedState(outcome);
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
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-cyan px-2 py-0.5 rounded bg-cyan/10 border border-cyan/30">
            Fase 01: Superposición
          </span>
          <h2 className="text-2xl font-bold font-orbitron text-white mt-1">
            El Misterio del Qubit y el Colapso
          </h2>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Mediciones realizadas: <span className="text-cyan font-bold">{measureCount}</span>
        </div>
      </div>

      {/* Main Grid: 3D Canvas + Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* 3D Viewport */}
        <div className="lg:col-span-7 bg-[#0b0f1d] border border-cyan/20 rounded-2xl p-4 flex flex-col items-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-3 left-4 text-xs font-mono text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan animate-ping" />
            ESFERA DE BLOCH 3D (ESPACIO DE HILBERT)
          </div>

          <div ref={containerRef} className="w-full cursor-grab active:cursor-grabbing" />

          {/* Holographic readout */}
          <div className="w-full mt-2 flex justify-between items-center bg-black/40 border border-slate-800 rounded-xl px-4 py-2 text-xs font-mono">
            <div>
              ESTADO:{' '}
              {isSuperposition ? (
                <span className="text-purple-400 font-bold animate-pulse">
                  SUPERPOSICIÓN (|0⟩ y |1⟩ simultáneos)
                </span>
              ) : (
                <span className="text-emerald-400 font-bold">
                  COLAPSO DEFINITIVO A |{collapsedState}⟩
                </span>
              )}
            </div>
            <div className="text-slate-400">
              P(|0⟩): {Math.round(Math.cos(theta / 2) ** 2 * 100)}% | P(|1⟩):{' '}
              {Math.round(Math.sin(theta / 2) ** 2 * 100)}%
            </div>
          </div>
        </div>

        {/* Controls & Discovery Panel */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
            <h3 className="text-sm font-rajdhani font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan" /> Manipulación Cuántica
            </h3>

            {/* Slider */}
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
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

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={handleMeasure}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan to-blue-600 text-black font-orbitron font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-cyan/25"
              >
                <Scan className="w-4 h-4" /> Disparar Detector
              </button>
              <button
                onClick={handleReset}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-orbitron text-xs flex items-center justify-center gap-1.5 transition-all"
                title="Reiniciar a Superposición"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Intuitive Insight Callout */}
          <div className="bg-cyan/5 border-l-4 border-cyan p-4 rounded-r-xl text-xs leading-relaxed text-slate-300">
            <strong className="text-cyan block mb-1 font-orbitron text-[11px]">
              🪙 Analogía de la Moneda en el Aire:
            </strong>
            Una moneda apoyada es cara o sello (bit clásico). Mientras gira en el aire, es una combinación de ambos a la vez (superposición). Pero al atraparla en la mano para observarla... ¡colapsa de inmediato a una sola cara!
          </div>
        </div>
      </div>

      {/* Gamified Deductive Challenge */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 mt-2">
        <h4 className="text-sm font-rajdhani font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-2">
          🎯 Reto de Descubrimiento: ¿Qué le ocurre al qubit al ser medido por el detector?
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleDeductionSelect('duplicate')}
            className={`p-3 rounded-xl border text-left text-xs transition-all ${
              userDeduction === 'duplicate'
                ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                : 'bg-black/30 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            A) Se duplica en dos partículas idénticas independientes
          </button>
          <button
            onClick={() => handleDeductionSelect('collapse')}
            className={`p-3 rounded-xl border text-left text-xs transition-all ${
              userDeduction === 'collapse'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-black/30 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            B) Colapsa a uno de los estados posibles (0 o 1)
          </button>
          <button
            onClick={() => handleDeductionSelect('infinite')}
            className={`p-3 rounded-xl border text-left text-xs transition-all ${
              userDeduction === 'infinite'
                ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                : 'bg-black/30 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            C) Permanece en superposición indefinidamente
          </button>
        </div>

        {showDeductionFeedback && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs flex items-center justify-between ${
              userDeduction === 'collapse'
                ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/40 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                {userDeduction === 'collapse'
                  ? '¡Exacto! La interacción con el instrumento de medida destruye la superposición y fuerza el colapso.'
                  : 'Pista: Observa el vector en 3D al pulsar el detector. ¿Ves que se fija firmemente en un polo?'}
              </span>
            </div>
            {userDeduction === 'collapse' && (
              <button
                onClick={onComplete}
                className="ml-3 px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-orbitron font-bold text-xs uppercase flex items-center gap-1 hover:brightness-110 shrink-0"
              >
                Avanzar a Fase 2 <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
