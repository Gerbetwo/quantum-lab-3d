'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Radio, ArrowRight, CheckCircle2, Globe, Satellite, HelpCircle, Info, Share2 } from 'lucide-react';
import { playButtonClick, playChimeSuccess, playLaserScan, playQuantumCollapse } from '@/lib/sound';
import { saveCompletedMission, updateStoredMetrics } from '@/lib/cookies';

interface Props {
  onComplete: () => void;
  onBack: () => void;
}

export default function Mission2Entanglement({ onComplete, onBack }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(80);
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

    // Emitter
    const emitterGeo = new THREE.OctahedronGeometry(0.2, 0);
    const emitterMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, wireframe: true });
    const emitter = new THREE.Mesh(emitterGeo, emitterMat);
    scene.add(emitter);

    // Alice Station (Left)
    const stationGeo = new THREE.IcosahedronGeometry(0.35, 1);
    const aliceMesh = new THREE.Mesh(stationGeo, new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true }));
    aliceMesh.position.set(-1.8, 0, 0);
    aliceMeshRef.current = aliceMesh;
    scene.add(aliceMesh);

    // Bob Station (Right)
    const bobMesh = new THREE.Mesh(stationGeo, new THREE.MeshBasicMaterial({ color: 0x10b981, wireframe: true }));
    bobMesh.position.set(1.8, 0, 0);
    bobMeshRef.current = bobMesh;
    scene.add(bobMesh);

    // Resonance line
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1.8, 0, 0),
      new THREE.Vector3(1.8, 0, 0),
    ]);
    const lineMat = new THREE.LineDashedMaterial({ color: 0xa855f7, dashSize: 0.1, gapSize: 0.05 });
    const laserBeam = new THREE.Line(lineGeo, lineMat);
    laserBeam.computeLineDistances();
    scene.add(laserBeam);

    // Cosmic background particles
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(70 * 3);
    for (let i = 0; i < 70 * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 8;
      starPos[i + 1] = (Math.random() - 0.5) * 5;
      starPos[i + 2] = (Math.random() - 0.5) * 4;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.02, transparent: true, opacity: 0.4 })
    );
    scene.add(stars);

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
      {/* Header */}
      <div className="border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-purple-400 font-mono text-xs uppercase tracking-wider">
          <Share2 className="w-3.5 h-3.5" /> Misión 2 de 4
        </div>
        <h2 className="text-xl sm:text-2xl font-orbitron font-bold text-white mt-1">
          Entrelazamiento Cuántico y No-Localidad
        </h2>
        <p className="text-sm text-slate-300 mt-1">
          Descubre cómo dos o más partículas pueden compartir un estado correlacionado sin importar la distancia física que las separe.
        </p>
      </div>

      {/* Main split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 3D Canvas Viewport */}
        <div className="lg:col-span-7 bg-[#080d1a] border border-slate-800 rounded-xl p-4 flex flex-col items-center relative">
          <div className="w-full flex justify-between items-center text-xs font-mono text-slate-400 border-b border-slate-800/80 pb-2 mb-2">
            <span>Enlace entre Detectores Cuánticos</span>
            <span>Pares analizados: <strong className="text-purple-400">{measuredCount}</strong></span>
          </div>

          <div ref={containerRef} className="w-full cursor-grab active:cursor-grabbing" />

          {/* Detector Readout Cards */}
          <div className="w-full mt-3 grid grid-cols-2 gap-3 font-mono">
            <div className="bg-slate-900 border border-cyan/40 rounded-lg p-3 text-center">
              <div className="text-[11px] text-cyan flex items-center justify-center gap-1.5 font-sans font-semibold">
                <Globe className="w-3.5 h-3.5" /> Estación Alice (Tierra)
              </div>
              <div className="text-xl font-orbitron font-bold text-white mt-1">{aliceVal}</div>
            </div>
            <div className="bg-slate-900 border border-emerald-500/40 rounded-lg p-3 text-center">
              <div className="text-[11px] text-emerald-400 flex items-center justify-center gap-1.5 font-sans font-semibold">
                <Satellite className="w-3.5 h-3.5" /> Estación Bob (Andrómeda)
              </div>
              <div className="text-xl font-orbitron font-bold text-white mt-1">{bobVal}</div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Radio className="w-4 h-4 text-purple-400" /> Control del Par Entrelazado
            </div>

            {/* Distance Slider */}
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-mono">
                <span>Distancia relativa:</span>
                <span className="text-purple-300 font-semibold">
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
                aria-label="Ajustar distancia entre detectores"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2.5 pt-1">
              <button
                onClick={handleMeasureAlice}
                disabled={!isEntangled}
                className="flex-1 py-3 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-orbitron font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-40 transition-all shadow-md shadow-purple-600/20 active:scale-95"
              >
                <Radio className="w-4 h-4" /> Medir Qubit de Alice
              </button>
              <button
                onClick={handleResetPair}
                className="py-3 px-3.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center justify-center transition-all border border-slate-700"
                title="Generar nuevo par"
              >
                Reiniciar
              </button>
            </div>
          </div>

          {/* Simple Observation Box */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-slate-300">
            <Share2 className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-medium mb-1">
                La naturaleza de la correlación cuántica
              </strong>
              No existe ningún cable físico ni señal electromagnética viajando entre Alice y Bob tras haberse separado. Sin embargo, al medir la partícula de Alice, el estado de la partícula de Bob queda correlacionado al instante.
            </div>
          </div>
        </div>
      </div>

      {/* Discovery Task */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-purple-400" />
          Reto de comprensión: Que dos partículas entrelazadas mantengan su correlación &ldquo;sin importar la distancia&rdquo; significa que...
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleChoice('ftls')}
            className={`p-3.5 rounded-lg border text-left text-xs leading-normal transition-all ${
              userChoice === 'ftls'
                ? 'bg-rose-950/40 border-rose-500/80 text-rose-200'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            A) La información clásica viaja por el espacio más rápido que la luz
          </button>
          <button
            onClick={() => handleChoice('instant_info')}
            className={`p-3.5 rounded-lg border text-left text-xs leading-normal transition-all ${
              userChoice === 'instant_info'
                ? 'bg-emerald-950/40 border-emerald-500/80 text-emerald-200'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            B) Al medir una partícula se conoce de inmediato información sobre el estado de la otra, aunque estén muy separadas
          </button>
          <button
            onClick={() => handleChoice('local')}
            className={`p-3.5 rounded-lg border text-left text-xs leading-normal transition-all ${
              userChoice === 'local'
                ? 'bg-rose-950/40 border-rose-500/80 text-rose-200'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            C) Solo funciona si ambas partículas están físicamente unidas por un cable
          </button>
        </div>

        {showFeedback && (
          <div
            className={`mt-4 p-3.5 rounded-lg text-xs flex items-center justify-between gap-3 ${
              userChoice === 'instant_info'
                ? 'bg-emerald-950/30 border border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/30 border border-rose-500/40 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {userChoice === 'instant_info' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>
                {userChoice === 'instant_info'
                  ? 'Correcto. La medición revela de inmediato el estado correlacionado sin requerir un medio de transmisión físico.'
                  : 'Pista: La teoría de la relatividad prohíbe señales físicas más rápidas que la luz. Lo que ocurre es una correlación instantánea al medir.'}
              </span>
            </div>
            {userChoice === 'instant_info' && (
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

      <div className="flex justify-between items-center pt-1">
        <button
          onClick={onBack}
          className="text-xs font-mono text-slate-400 hover:text-white transition-colors"
        >
          ← Regresar a Misión 1
        </button>
      </div>
    </div>
  );
}
