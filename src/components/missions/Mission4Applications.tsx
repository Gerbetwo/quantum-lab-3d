'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Layers, CheckCircle2, HelpCircle, Info, FlaskConical, Network, ShieldCheck, Award } from 'lucide-react';
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
      const globeGeo = new THREE.SphereGeometry(0.9, 16, 16);
      const globeMat = new THREE.MeshBasicMaterial({ color: 0x10b981, wireframe: true, transparent: true, opacity: 0.35 });
      const globe = new THREE.Mesh(globeGeo, globeMat);
      group.add(globe);

      const ringGeo = new THREE.TorusGeometry(1.05, 0.02, 16, 32);
      const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
      group.add(ring);
    } else {
      const icoGeo = new THREE.IcosahedronGeometry(0.9, 1);
      const shield = new THREE.Mesh(icoGeo, new THREE.MeshBasicMaterial({ color: 0xf59e0b, wireframe: true }));
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
      {/* Header */}
      <div className="border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs uppercase tracking-wider">
          <Layers className="w-3.5 h-3.5" /> Misión 4 de 4
        </div>
        <h2 className="text-xl sm:text-2xl font-orbitron font-bold text-white mt-1">
          Aplicaciones de la Computación Cuántica
        </h2>
        <p className="text-sm text-slate-300 mt-1">
          Conoce en qué áreas genera una ventaja computacional real frente a las computadoras clásicas.
        </p>
      </div>

      {/* Main split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 3D Canvas Viewport */}
        <div className="lg:col-span-7 bg-[#080d1a] border border-slate-800 rounded-xl p-4 flex flex-col items-center relative">
          <div className="w-full flex justify-between items-center text-xs font-mono text-slate-400 border-b border-slate-800/80 pb-2 mb-2">
            <span>Visualización de Casos de Uso</span>
            <span className="text-emerald-400 font-sans font-medium">Modelo 3D Activo</span>
          </div>

          <div ref={containerRef} className="w-full cursor-grab active:cursor-grabbing" />

          {/* Model Selector Buttons */}
          <div className="w-full mt-3 grid grid-cols-3 gap-2">
            <button
              onClick={() => handleSelectApp('molecule')}
              className={`p-2.5 rounded-lg text-center text-xs border flex items-center justify-center gap-1.5 transition-all ${
                selectedApp === 'molecule'
                  ? 'bg-cyan/15 border-cyan text-cyan font-semibold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" /> Fármacos
            </button>
            <button
              onClick={() => handleSelectApp('optimization')}
              className={`p-2.5 rounded-lg text-center text-xs border flex items-center justify-center gap-1.5 transition-all ${
                selectedApp === 'optimization'
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 font-semibold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Network className="w-3.5 h-3.5" /> Optimización
            </button>
            <button
              onClick={() => handleSelectApp('crypto')}
              className={`p-2.5 rounded-lg text-center text-xs border flex items-center justify-center gap-1.5 transition-all ${
                selectedApp === 'crypto'
                  ? 'bg-amber-500/15 border-amber-500 text-amber-400 font-semibold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Criptografía
            </button>
          </div>
        </div>

        {/* Info Column */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-xs leading-relaxed text-slate-300">
            <div className="font-semibold text-sm text-white mb-1.5 flex items-center gap-2">
              {selectedApp === 'molecule' && <FlaskConical className="w-4 h-4 text-cyan" />}
              {selectedApp === 'optimization' && <Network className="w-4 h-4 text-emerald-400" />}
              {selectedApp === 'crypto' && <ShieldCheck className="w-4 h-4 text-amber-400" />}

              {selectedApp === 'molecule' && 'Simulación molecular y desarrollo de fármacos'}
              {selectedApp === 'optimization' && 'Optimización compleja y logística'}
              {selectedApp === 'crypto' && 'Criptografía y seguridad cuántica'}
            </div>
            <p>
              {selectedApp === 'molecule' &&
                'Las moléculas obedecen principios cuánticos. Simular el acoplamiento atómico en computadoras clásicas es inviable por la cantidad de combinaciones; las computadoras cuánticas modelan estas estructuras de forma directa.'}
              {selectedApp === 'optimization' &&
                'Permite evaluar millones de rutas y asignaciones energéticas o financieras en paralelo, resolviendo problemas de optimización combinatoria que saturarían procesadores tradicionales.'}
              {selectedApp === 'crypto' &&
                'Facilita la factorización de grandes números primos y habilita la distribución cuántica de claves para comunicaciones seguras.'}
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-slate-300">
            <Info className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-medium mb-1">
                Límites y alcance
              </strong>
              La computación cuántica no busca sustituir computadoras personales para navegar por internet ni aumentar la velocidad de carga de baterías de teléfonos. Su función se concentra en problemas matemáticos y físicos de alta complejidad.
            </div>
          </div>
        </div>
      </div>

      {/* Discovery Task */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-emerald-400" />
          Reto de comprensión: ¿Cuál es una aplicación potencial de la computación cuántica?
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleChoice('web_browsing')}
            className={`p-3.5 rounded-lg border text-left text-xs leading-normal transition-all ${
              userChoice === 'web_browsing'
                ? 'bg-rose-950/40 border-rose-500/80 text-rose-200'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            A) Reemplazar totalmente las computadoras clásicas en tareas cotidianas como navegar en internet
          </button>
          <button
            onClick={() => handleChoice('real_applications')}
            className={`p-3.5 rounded-lg border text-left text-xs leading-normal transition-all ${
              userChoice === 'real_applications'
                ? 'bg-emerald-950/40 border-emerald-500/80 text-emerald-200'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            B) Optimización compleja, simulación de moléculas para el desarrollo de fármacos y criptografía
          </button>
          <button
            onClick={() => handleChoice('phone_battery')}
            className={`p-3.5 rounded-lg border text-left text-xs leading-normal transition-all ${
              userChoice === 'phone_battery'
                ? 'bg-rose-950/40 border-rose-500/80 text-rose-200'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            C) Aumentar la velocidad de carga de las baterías de los celulares
          </button>
        </div>

        {showFeedback && (
          <div
            className={`mt-4 p-3.5 rounded-lg text-xs flex items-center justify-between gap-3 ${
              userChoice === 'real_applications'
                ? 'bg-emerald-950/30 border border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/30 border border-rose-500/40 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {userChoice === 'real_applications' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>
                {userChoice === 'real_applications'
                  ? 'Correcto. La computación cuántica destaca en optimización, física molecular y criptografía.'
                  : 'Pista: Recuerda los modelos vistos: optimización de redes y modelado molecular para medicamentos.'}
              </span>
            </div>
            {userChoice === 'real_applications' && (
              <button
                onClick={onFinishAll}
                className="px-3.5 py-1.5 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 shrink-0 transition-colors"
              >
                Completar y Ver Resumen <Award className="w-3.5 h-3.5" />
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
          ← Regresar a Misión 3
        </button>
      </div>
    </div>
  );
}
