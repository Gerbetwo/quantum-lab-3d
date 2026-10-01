'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Radio, ArrowRight, CheckCircle2, Zap } from 'lucide-react';
import { playButtonClick, playChimeSuccess, playLaserScan, playQuantumCollapse } from '@/lib/sound';
import { saveCompletedMission, updateStoredMetrics } from '@/lib/cookies';

interface Props {
  onComplete: () => void;
  onBack: () => void;
}

export default function Mission2Entanglement({ onComplete, onBack }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(80); // Distance slider value
  const [aliceVal, setAliceVal] = useState<string>('?');
  const [bobVal, setBobVal] = useState<string>('?');
  const [isEntangled, setIsEntangled] = useState(true);
  const [measuredCount, setMeasuredCount] = useState(0);
  const [userChoice, setUserChoice] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const aliceMeshRef = useRef<THREE.Mesh | null>(null);
  const bobMeshRef = useRef<THREE.Mesh | null>(null);
  const laserBeamRef = useRef<THREE.Line | null>(null);
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 360;
    const height = 300;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.5, 4.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 1. Central Emitter
    const emitterGeo = new THREE.OctahedronGeometry(0.2, 0);
    const emitterMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, wireframe: true });
    const emitter = new THREE.Mesh(emitterGeo, emitterMat);
    scene.add(emitter);

    // 2. Alice Station (Left)
    const stationGeo = new THREE.IcosahedronGeometry(0.35, 1);
    const aliceMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true });
    const aliceMesh = new THREE.Mesh(stationGeo, aliceMat);
    aliceMesh.position.set(-1.8, 0, 0);
    aliceMeshRef.current = aliceMesh;
    scene.add(aliceMesh);

    // 3. Bob Station (Right)
    const bobMat = new THREE.MeshBasicMaterial({ color: 0x10b981, wireframe: true });
    const bobMesh = new THREE.Mesh(stationGeo, bobMat);
    bobMesh.position.set(1.8, 0, 0);
    bobMeshRef.current = bobMesh;
    scene.add(bobMesh);

    // 4. Entanglement Resonance Line
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1.8, 0, 0),
      new THREE.Vector3(1.8, 0, 0),
    ]);
    const lineMat = new THREE.LineDashedMaterial({
      color: 0xa855f7,
      dashSize: 0.1,
      gapSize: 0.05,
    });
    const laserBeam = new THREE.Line(lineGeo, lineMat);
    laserBeam.computeLineDistances();
    laserBeamRef.current = laserBeam;
    scene.add(laserBeam);

    // 5. Starfield / cosmic particles
    const starCount = 80;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 8;
      starPos[i + 1] = (Math.random() - 0.5) * 5;
      starPos[i + 2] = (Math.random() - 0.5) * 4;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.02, transparent: true, opacity: 0.5 });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // 6. Animation
    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);
      emitter.rotation.y += 0.02;
      aliceMesh.rotation.y += 0.01;
      bobMesh.rotation.y -= 0.01;
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
      stationGeo.dispose();
      emitterGeo.dispose();
    };
  }, []);

  const handleMeasureAlice = () => {
    if (!isEntangled) return;
    playLaserScan();
    setTimeout(() => playQuantumCollapse(), 120);

    const outcome = Math.random() < 0.5 ? '0' : '1';
    setAliceVal(`|${outcome}⟩`);
    setBobVal(`|${outcome}⟩`);
    setIsEntangled(false);
    setMeasuredCount((prev) => prev + 1);

    updateStoredMetrics((prev) => ({
      ...prev,
      actions: {
        ...prev.actions,
        entanglementMeasurements: prev.actions.entanglementMeasurements + 1,
      },
    }));
  };

  const handleResetPair = () => {
    playButtonClick();
    setAliceVal('?');
    setBobVal('?');
    setIsEntangled(true);
  };

  const handleChoice = (choice: string) => {
    setUserChoice(choice);
    setShowFeedback(true);
    if (choice === 'instant_info') {
      playChimeSuccess();
      saveCompletedMission(1);
    } else {
      playButtonClick();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-purple-400 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30">
            Fase 02: Entrelazamiento
          </span>
          <h2 className="text-2xl font-bold font-orbitron text-white mt-1">
            La Conexión Fantasmagórica a Distancia
          </h2>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Pares analizados: <span className="text-purple-400 font-bold">{measuredCount}</span>
        </div>
      </div>

      {/* 3D Simulation & Control */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* 3D Viewport */}
        <div className="lg:col-span-7 bg-[#0b0f1d] border border-purple-500/20 rounded-2xl p-4 flex flex-col items-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-3 left-4 text-xs font-mono text-slate-400 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            ENLACE CUÁNTICO INTERESTELAR (PARES BELL)
          </div>

          <div ref={containerRef} className="w-full cursor-grab active:cursor-grabbing" />

          {/* Detector Readout */}
          <div className="w-full mt-2 grid grid-cols-2 gap-3">
            <div className="bg-black/50 border border-cyan/40 rounded-xl p-3 text-center">
              <div className="text-[10px] font-mono text-cyan tracking-wider">DETECTOR ALICE (TIERRA)</div>
              <div className="text-xl font-orbitron font-bold text-white mt-0.5">{aliceVal}</div>
            </div>
            <div className="bg-black/50 border border-emerald-500/40 rounded-xl p-3 text-center">
              <div className="text-[10px] font-mono text-emerald-400 tracking-wider">DETECTOR BOB (ANDRÓMEDA)</div>
              <div className="text-xl font-orbitron font-bold text-white mt-0.5">{bobVal}</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
            <h3 className="text-sm font-rajdhani font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" /> Control del Experimento Bell
            </h3>

            {/* Distance Slider */}
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                <span>Distancia:</span>
                <span className="text-purple-400 font-bold font-mono">
                  {(distance * 0.035).toFixed(2)} Millones de Años Luz
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={distance}
                onChange={(e) => setDistance(parseInt(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={handleMeasureAlice}
                disabled={!isEntangled}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-orbitron font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-purple-500/25"
              >
                🔬 Medir Qubit de Alice
              </button>
              <button
                onClick={handleResetPair}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-orbitron text-xs flex items-center justify-center gap-1.5 transition-all"
                title="Generar Nuevo Par Entrelazado"
              >
                Nuevo Par
              </button>
            </div>
          </div>

          {/* Deep Insight */}
          <div className="bg-purple-500/5 border-l-4 border-purple-500 p-4 rounded-r-xl text-xs leading-relaxed text-slate-300">
            <strong className="text-purple-400 block mb-1 font-orbitron text-[11px]">
              🌌 La Regla de Correlación:
            </strong>
            No existe un cable físico ni señal electromagnética viajando entre Alice y Bob. Sin embargo, al medir la partícula de Alice, el estado de la de Bob queda fijado en el mismo instante exacto.
          </div>
        </div>
      </div>

      {/* Deductive Challenge */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 mt-2">
        <h4 className="text-sm font-rajdhani font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-2">
          🎯 Reto de Descubrimiento: Que dos partículas entrelazadas mantengan su correlación &ldquo;sin importar la distancia&rdquo; significa que...
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleChoice('ftls')}
            className={`p-3 rounded-xl border text-left text-xs transition-all ${
              userChoice === 'ftls'
                ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                : 'bg-black/30 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            A) La información clásica viaja por el espacio más rápido que la luz
          </button>
          <button
            onClick={() => handleChoice('instant_info')}
            className={`p-3 rounded-xl border text-left text-xs transition-all ${
              userChoice === 'instant_info'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-black/30 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            B) Al medir una partícula se conoce de inmediato información sobre el estado de la otra, aunque estén muy separadas
          </button>
          <button
            onClick={() => handleChoice('local')}
            className={`p-3 rounded-xl border text-left text-xs transition-all ${
              userChoice === 'local'
                ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                : 'bg-black/30 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            C) Solo funciona si ambas partículas están unidas físicamente por un cable
          </button>
        </div>

        {showFeedback && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs flex items-center justify-between ${
              userChoice === 'instant_info'
                ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/40 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                {userChoice === 'instant_info'
                  ? '¡Brillante! El entrelazamiento establece una correlación cuántica intrínseca que no depende de la distancia física.'
                  : 'Pista: La teoría de la relatividad impide señales superlumínicas. Lo que ocurre es una correlación instantánea al medir.'}
              </span>
            </div>
            {userChoice === 'instant_info' && (
              <button
                onClick={onComplete}
                className="ml-3 px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-orbitron font-bold text-xs uppercase flex items-center gap-1 hover:brightness-110 shrink-0"
              >
                Avanzar a Fase 3 <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center pt-2">
        <button
          onClick={onBack}
          className="text-xs font-mono text-slate-400 hover:text-white transition-colors"
        >
          ← Regresar a Fase 1
        </button>
      </div>
    </div>
  );
}
