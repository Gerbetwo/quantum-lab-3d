'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Scan, RotateCcw, ArrowRight, CheckCircle2, HelpCircle, Activity, Info, Coins } from 'lucide-react';
import { playButtonClick, playChimeSuccess, playLaserScan, playQuantumCollapse } from '@/lib/sound';
import { saveCompletedMission, updateStoredMetrics } from '@/lib/cookies';

interface Props {
  onComplete: () => void;
}

export default function Mission1Superposition({ onComplete }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [theta, setTheta] = useState(Math.PI / 2);
  const [isSuperposition, setIsSuperposition] = useState(true);
  const [collapsedState, setCollapsedState] = useState<number | null>(null);
  const [measureCount, setMeasureCount] = useState(0);
  const [userDeduction, setUserDeduction] = useState<string | null>(null);
  const [showDeductionFeedback, setShowDeductionFeedback] = useState(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const vectorArrowRef = useRef<THREE.ArrowHelper | null>(null);
  const shockwaveRef = useRef<THREE.Mesh | null>(null);
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
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
      opacity: 0.14,
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

    // Ambient Particles
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
  }, []);

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
      {/* Header section */}
      <div className="border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-cyan font-mono text-xs uppercase tracking-wider">
          <Activity className="w-3.5 h-3.5" /> Misión 1 de 4
        </div>
        <h2 className="text-xl sm:text-2xl font-orbitron font-bold text-white mt-1">
          Qubit y Superposición Cuántica
        </h2>
        <p className="text-sm text-slate-300 mt-1">
          Experimenta cómo un bit clásico solo puede ser 0 o 1, mientras que un qubit existe en una combinación de ambos hasta que es medido.
        </p>
      </div>

      {/* Main interactive split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 3D Canvas Box */}
        <div className="lg:col-span-7 bg-[#080d1a] border border-slate-800 rounded-xl p-4 flex flex-col items-center relative">
          <div className="w-full flex justify-between items-center text-xs font-mono text-slate-400 border-b border-slate-800/80 pb-2 mb-2">
            <span>Esfera de Bloch (Espacio de Estados)</span>
            <span>Mediciones: <strong className="text-cyan">{measureCount}</strong></span>
          </div>

          <div ref={containerRef} className="w-full cursor-grab active:cursor-grabbing" />

          {/* Telemetry bar */}
          <div className="w-full mt-3 bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Estado actual:</span>
              {isSuperposition ? (
                <span className="text-purple-300 font-bold bg-purple-950/60 border border-purple-500/40 px-2 py-0.5 rounded">
                  Superposición (|0⟩ + |1⟩)
                </span>
              ) : (
                <span className="text-emerald-300 font-bold bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded">
                  Colapsado a |{collapsedState}⟩
                </span>
              )}
            </div>
            <div className="text-slate-400">
              Probabilidad: |0⟩ = {Math.round(Math.cos(theta / 2) ** 2 * 100)}% | |1⟩ ={' '}
              {Math.round(Math.sin(theta / 2) ** 2 * 100)}%
            </div>
          </div>
        </div>

        {/* Controls and Insight */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Scan className="w-4 h-4 text-cyan" /> Controles de Medición
            </div>

            {/* Slider */}
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-mono">
                <span>Polo Norte |0⟩</span>
                <span className="text-cyan font-semibold">Ecuador (50/50)</span>
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
                aria-label="Ajustar ángulo del qubit"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2.5 pt-1">
              <button
                onClick={handleMeasure}
                className="flex-1 py-3 px-4 rounded-lg bg-cyan text-slate-950 font-orbitron font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-cyan/90 transition-all shadow-md shadow-cyan/20 active:scale-95"
              >
                <Scan className="w-4 h-4" /> Medir Qubit
              </button>
              <button
                onClick={handleReset}
                className="py-3 px-3.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center justify-center transition-all border border-slate-700"
                title="Reiniciar superposición"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Simple Observation Box */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-slate-300">
            <Coins className="w-5 h-5 text-cyan shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-medium mb-1">
                Analogía cotidiana: La moneda girando en el aire
              </strong>
              Una moneda clásica apoyada en la mesa solo puede ser cara o sello (0 o 1). Mientras gira en el aire representa ambos estados a la vez (superposición). Al atraparla para observarla, la superposición desaparece y colapsa a una única cara definitiva.
            </div>
          </div>
        </div>
      </div>

      {/* Discovery Task */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-cyan" />
          Reto de comprensión: ¿Qué ocurre físicamente cuando se mide un qubit que está en superposición?
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleDeductionSelect('duplicate')}
            className={`p-3.5 rounded-lg border text-left text-xs leading-normal transition-all ${
              userDeduction === 'duplicate'
                ? 'bg-rose-950/40 border-rose-500/80 text-rose-200'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            A) Se duplica en dos qubits independientes
          </button>
          <button
            onClick={() => handleDeductionSelect('collapse')}
            className={`p-3.5 rounded-lg border text-left text-xs leading-normal transition-all ${
              userDeduction === 'collapse'
                ? 'bg-emerald-950/40 border-emerald-500/80 text-emerald-200'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            B) Colapsa a uno de los estados posibles (0 o 1)
          </button>
          <button
            onClick={() => handleDeductionSelect('infinite')}
            className={`p-3.5 rounded-lg border text-left text-xs leading-normal transition-all ${
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
            className={`mt-4 p-3.5 rounded-lg text-xs flex items-center justify-between gap-3 ${
              userDeduction === 'collapse'
                ? 'bg-emerald-950/30 border border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/30 border border-rose-500/40 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {userDeduction === 'collapse' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>
                {userDeduction === 'collapse'
                  ? 'Correcto. La medición destruye la superposición y fuerza al qubit a colapsar a un único estado clásico.'
                  : 'Pista: Observa el vector en la esfera 3D al medir: ¿permanece a mitad de camino o se fija en un polo?'}
              </span>
            </div>
            {userDeduction === 'collapse' && (
              <button
                onClick={onComplete}
                className="px-3.5 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 shrink-0 transition-colors"
              >
                Siguiente Misión <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
