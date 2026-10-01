'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Layers, Trophy, CheckCircle2 } from 'lucide-react';
import { playButtonClick, playChimeSuccess } from '@/lib/sound';
import { saveCompletedMission, updateStoredMetrics } from '@/lib/cookies';

interface Props {
  onFinishAll: () => void;
  onBack: () => void;
}

export default function Mission4Applications({ onFinishAll, onBack }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedApp, setSelectedApp] = useState<'molecule' | 'optimization' | 'crypto'>('molecule');
  const [userChoice, setUserChoice] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const activeMeshGroup = useRef<THREE.Group | null>(null);
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 360;
    const height = 300;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 3.8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    activeMeshGroup.current = group;
    scene.add(group);

    // Initial render of molecule
    build3DModel('molecule', group);

    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);
      group.rotation.y += 0.01;
      group.rotation.x += 0.004;
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
    };
  }, []);

  const build3DModel = (type: 'molecule' | 'optimization' | 'crypto', group: THREE.Group) => {
    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
    }

    if (type === 'molecule') {
      // Atoms and bonds
      const atomGeo = new THREE.SphereGeometry(0.18, 16, 16);
      const atomMat1 = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true });
      const atomMat2 = new THREE.MeshBasicMaterial({ color: 0xa855f7, wireframe: true });

      const positions = [
        [0, 0, 0],
        [0.7, 0.5, 0],
        [-0.7, 0.5, 0],
        [0, -0.8, 0.4],
        [0.6, -0.6, -0.5],
      ];

      positions.forEach((pos, idx) => {
        const atom = new THREE.Mesh(atomGeo, idx % 2 === 0 ? atomMat1 : atomMat2);
        atom.position.set(pos[0], pos[1], pos[2]);
        group.add(atom);
      });
    } else if (type === 'optimization') {
      // Globe with routing arcs
      const globeGeo = new THREE.SphereGeometry(0.9, 16, 16);
      const globeMat = new THREE.MeshBasicMaterial({ color: 0x10b981, wireframe: true, transparent: true, opacity: 0.35 });
      const globe = new THREE.Mesh(globeGeo, globeMat);
      group.add(globe);

      const ringGeo = new THREE.TorusGeometry(1.05, 0.02, 16, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      group.add(ring);
    } else {
      // Cryptographic shield lattice
      const icoGeo = new THREE.IcosahedronGeometry(0.9, 1);
      const icoMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, wireframe: true });
      const shield = new THREE.Mesh(icoGeo, icoMat);
      group.add(shield);
    }
  };

  const handleSelectApp = (type: 'molecule' | 'optimization' | 'crypto') => {
    playButtonClick();
    setSelectedApp(type);
    if (activeMeshGroup.current) {
      build3DModel(type, activeMeshGroup.current);
    }
    updateStoredMetrics((prev) => ({
      ...prev,
      actions: {
        ...prev.actions,
        applicationsExplored: Array.from(new Set([...prev.actions.applicationsExplored, type])),
      },
    }));
  };

  const handleChoice = (choice: string) => {
    setUserChoice(choice);
    setShowFeedback(true);
    if (choice === 'real_applications') {
      playChimeSuccess();
      saveCompletedMission(3);
    } else {
      playButtonClick();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
            Fase 04: El Futuro Práctico
          </span>
          <h2 className="text-2xl font-bold font-orbitron text-white mt-1">
            ¿Para qué sirve realmente la Computación Cuántica?
          </h2>
        </div>
      </div>

      {/* 3D Simulation & Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* 3D Viewport */}
        <div className="lg:col-span-7 bg-[#0b0f1d] border border-emerald-500/20 rounded-2xl p-4 flex flex-col items-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-3 left-4 text-xs font-mono text-slate-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            HOLOGRAFO DE APLICACIONES CUÁNTICAS
          </div>

          <div ref={containerRef} className="w-full cursor-grab active:cursor-grabbing" />

          {/* Model Selector Buttons */}
          <div className="w-full mt-2 grid grid-cols-3 gap-2">
            <button
              onClick={() => handleSelectApp('molecule')}
              className={`p-2 rounded-xl text-center text-xs font-mono border transition-all ${
                selectedApp === 'molecule'
                  ? 'bg-cyan/20 border-cyan text-cyan font-bold'
                  : 'bg-black/40 border-slate-800 text-slate-400'
              }`}
            >
              🧪 Simulación Molecular
            </button>
            <button
              onClick={() => handleSelectApp('optimization')}
              className={`p-2 rounded-xl text-center text-xs font-mono border transition-all ${
                selectedApp === 'optimization'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold'
                  : 'bg-black/40 border-slate-800 text-slate-400'
              }`}
            >
              ⚡ Optimización Global
            </button>
            <button
              onClick={() => handleSelectApp('crypto')}
              className={`p-2 rounded-xl text-center text-xs font-mono border transition-all ${
                selectedApp === 'crypto'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-bold'
                  : 'bg-black/40 border-slate-800 text-slate-400'
              }`}
            >
              🔐 Criptografía
            </button>
          </div>
        </div>

        {/* Real Info Panel */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-xs leading-relaxed text-slate-300">
            <h4 className="font-orbitron font-bold text-sm text-white mb-2 flex items-center gap-2">
              {selectedApp === 'molecule' && '🧪 Modelado Atómico & Nuevos Fármacos'}
              {selectedApp === 'optimization' && '⚡ Logística de Billones de Variables'}
              {selectedApp === 'crypto' && '🔐 Criptoanálisis y Redes Inviolables'}
            </h4>
            <p>
              {selectedApp === 'molecule' &&
                'Las moléculas complejas obedecen las leyes de la mecánica cuántica. Simular sus enlaces químicos en una supercomputadora clásica requeriría millones de años; una computadora cuántica lo procesa en su lenguaje natural para descubrir medicinas.'}
              {selectedApp === 'optimization' &&
                'Rutas de aviación mundial, flujos de energía e inversiones financieras. El algoritmo explora simultáneamente innumerables combinaciones gracias a la superposición cuántica.'}
              {selectedApp === 'crypto' &&
                'Permite factorizar números primos de gran tamaño y crear sistemas de distribución cuántica de claves que alertan si alguien intenta interceptar la señal.'}
            </p>
          </div>

          <div className="bg-rose-500/5 border-l-4 border-rose-500 p-4 rounded-r-xl text-xs leading-relaxed text-slate-300">
            <strong className="text-rose-400 block mb-1 font-orbitron text-[11px]">
              🚫 Lo que NO es la Computación Cuántica:
            </strong>
            No reemplazará tu laptop para ver videos o navegar por internet, ni hará que la batería de tu celular cargue más rápido. Su nicho exclusivo son problemas matemáticos intratables.
          </div>
        </div>
      </div>

      {/* Deductive Challenge */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 mt-2">
        <h4 className="text-sm font-rajdhani font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-2">
          🎯 Reto de Descubrimiento: ¿Cuál es una aplicación potencial de la computación cuántica?
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleChoice('web_browsing')}
            className={`p-3 rounded-xl border text-left text-xs transition-all ${
              userChoice === 'web_browsing'
                ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                : 'bg-black/30 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            A) Reemplazar totalmente las computadoras de casa en tareas como navegar en internet
          </button>
          <button
            onClick={() => handleChoice('real_applications')}
            className={`p-3 rounded-xl border text-left text-xs transition-all ${
              userChoice === 'real_applications'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-black/30 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            B) Optimización compleja, simulación de moléculas para el desarrollo de fármacos y criptografía
          </button>
          <button
            onClick={() => handleChoice('phone_battery')}
            className={`p-3 rounded-xl border text-left text-xs transition-all ${
              userChoice === 'phone_battery'
                ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                : 'bg-black/30 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            C) Aumentar la velocidad de carga de las baterías de los celulares
          </button>
        </div>

        {showFeedback && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs flex items-center justify-between ${
              userChoice === 'real_applications'
                ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/40 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                {userChoice === 'real_applications'
                  ? '¡Perfección absoluta! Has descubierto el trío dorado de aplicaciones cuánticas reales.'
                  : 'Pista: La computación cuántica resuelve problemas de optimización y física molecular, no tareas cotidianas.'}
              </span>
            </div>
            {userChoice === 'real_applications' && (
              <button
                onClick={onFinishAll}
                className="ml-3 px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-orbitron font-bold text-xs uppercase flex items-center gap-1 hover:brightness-110 shrink-0"
              >
                🏆 Finalizar Entrenamiento y Ver Insignia <Trophy className="w-3.5 h-3.5" />
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
          ← Regresar a Fase 3
        </button>
      </div>
    </div>
  );
}
