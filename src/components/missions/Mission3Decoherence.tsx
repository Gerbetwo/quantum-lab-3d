'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ThermometerSnowflake, AlertTriangle, ArrowRight, CheckCircle2, HelpCircle, Info, Sliders } from 'lucide-react';
import { playButtonClick, playChimeSuccess, playDecoherenceAlert } from '@/lib/sound';
import { saveCompletedMission, updateStoredMetrics } from '@/lib/cookies';

interface Props {
  onComplete: () => void;
  onBack: () => void;
}

export default function Mission3Decoherence({ onComplete, onBack }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [temperature, setTemperature] = useState(15);
  const [userChoice, setUserChoice] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const coreMeshRef = useRef<THREE.Mesh | null>(null);
  const chandelierRingsRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const particleVelocitiesRef = useRef<Float32Array | null>(null);
  const animFrameId = useRef<number | null>(null);

  const isDecoherent = temperature > 120;

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 360;
    const height = 300;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.3, 3.8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Chandelier Rings
    const chandelier = new THREE.Group();
    chandelierRingsRef.current = chandelier;

    const ringRadii = [1.2, 0.9, 0.6];
    const ringHeights = [0.8, 0.4, 0.0];
    ringRadii.forEach((r, idx) => {
      const ringGeo = new THREE.TorusGeometry(r, 0.025, 16, 40);
      const ringMesh = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xf59e0b, wireframe: true }));
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = ringHeights[idx];
      chandelier.add(ringMesh);
    });
    scene.add(chandelier);

    // Quantum Core
    const coreGeo = new THREE.BoxGeometry(0.5, 0.25, 0.5);
    const coreMesh = new THREE.Mesh(coreGeo, new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true }));
    coreMesh.position.y = -0.3;
    coreMeshRef.current = coreMesh;
    scene.add(coreMesh);

    // Thermal Particles
    const pCount = 80;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    const pVel = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount * 3; i += 3) {
      pPos[i] = (Math.random() - 0.5) * 3;
      pPos[i + 1] = (Math.random() - 0.5) * 2;
      pPos[i + 2] = (Math.random() - 0.5) * 2;
      pVel[i] = (Math.random() - 0.5) * 0.01;
      pVel[i + 1] = (Math.random() - 0.5) * 0.01;
      pVel[i + 2] = (Math.random() - 0.5) * 0.01;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    particleVelocitiesRef.current = pVel;

    const particles = new THREE.Points(
      pGeo,
      new THREE.PointsMaterial({ color: 0x00f0ff, size: 0.035, transparent: true, opacity: 0.6 })
    );
    particlesRef.current = particles;
    scene.add(particles);

    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);
      chandelier.rotation.y += 0.005;
      coreMesh.rotation.y += 0.01;

      if (coreMeshRef.current && temperature > 120) {
        coreMeshRef.current.position.x = (Math.random() - 0.5) * 0.03;
        coreMeshRef.current.position.z = (Math.random() - 0.5) * 0.03;
      } else if (coreMeshRef.current) {
        coreMeshRef.current.position.x = 0;
        coreMeshRef.current.position.z = 0;
      }

      if (particlesRef.current && particleVelocitiesRef.current) {
        const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
        const speedMultiplier = 1 + (temperature / 300) * 12;

        for (let i = 0; i < pCount * 3; i += 3) {
          positions[i] += particleVelocitiesRef.current[i] * speedMultiplier;
          positions[i + 1] += particleVelocitiesRef.current[i + 1] * speedMultiplier;
          positions[i + 2] += particleVelocitiesRef.current[i + 2] * speedMultiplier;

          if (Math.abs(positions[i]) > 1.8) positions[i] *= -0.9;
          if (Math.abs(positions[i + 1]) > 1.2) positions[i + 1] *= -0.9;
          if (Math.abs(positions[i + 2]) > 1.2) positions[i + 2] *= -0.9;
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
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
      coreGeo.dispose();
    };
  }, []);

  const handleTempChange = (val: number) => {
    setTemperature(val);

    if (coreMeshRef.current && particlesRef.current) {
      if (val > 120) {
        (coreMeshRef.current.material as THREE.MeshBasicMaterial).color.setHex(0xf43f5e);
        (particlesRef.current.material as THREE.PointsMaterial).color.setHex(0xf43f5e);
        playDecoherenceAlert();
      } else {
        (coreMeshRef.current.material as THREE.MeshBasicMaterial).color.setHex(0x00f0ff);
        (particlesRef.current.material as THREE.PointsMaterial).color.setHex(0x00f0ff);
      }
    }

    updateStoredMetrics((prev) => ({
      ...prev,
      actions: {
        ...prev.actions,
        decoherenceTested: true,
      },
    }));
  };

  const handleChoice = (choice: string) => {
    setUserChoice(choice);
    setShowFeedback(true);
    if (choice === 'noise_reduction') {
      playChimeSuccess();
      saveCompletedMission(2);
    } else {
      playButtonClick();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-cyan font-mono text-xs uppercase tracking-wider">
          <ThermometerSnowflake className="w-3.5 h-3.5" /> Misión 3 de 4
        </div>
        <h2 className="text-xl sm:text-2xl font-orbitron font-bold text-white mt-1">
          Criogenia y Decoherencia Cuántica
        </h2>
        <p className="text-sm text-slate-300 mt-1">
          Observa por qué los procesadores cuánticos operan dentro de refrigeradores de dilución a temperaturas cercanas al cero absoluto.
        </p>
      </div>

      {/* Main split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 3D Canvas Viewport */}
        <div className="lg:col-span-7 bg-[#080d1a] border border-slate-800 rounded-xl p-4 flex flex-col items-center relative">
          <div className="w-full flex justify-between items-center text-xs font-mono text-slate-400 border-b border-slate-800/80 pb-2 mb-2">
            <span>Cámara Criogénica de Dilución</span>
            <span className={isDecoherent ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
              {isDecoherent ? 'Alerta: Decoherencia' : 'Coherencia Estable'}
            </span>
          </div>

          <div ref={containerRef} className="w-full cursor-grab active:cursor-grabbing" />

          {/* Temperature HUD */}
          <div className="w-full mt-3 bg-slate-900 border border-slate-800 rounded-lg p-3 flex justify-between items-center font-mono text-xs">
            <div>
              <span className="text-slate-400">Temperatura del chip:</span>{' '}
              <strong className={`text-base font-orbitron ${isDecoherent ? 'text-rose-400' : 'text-cyan'}`}>
                {temperature === 15 ? '0.015 K (-273.13 °C)' : `${temperature} K`}
              </strong>
            </div>
            {isDecoherent && (
              <div className="flex items-center gap-1.5 text-rose-400 font-bold font-sans">
                <AlertTriangle className="w-4 h-4 shrink-0" /> Ruido térmico destructivo
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan" /> Regulador de Temperatura
            </div>

            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-mono">
                <span className="text-cyan font-semibold">0.015 K (Cero Absoluto)</span>
                <span className="text-rose-400">300 K (Ambiente)</span>
              </div>
              <input
                type="range"
                min="15"
                max="300"
                step="5"
                value={temperature}
                onChange={(e) => handleTempChange(parseInt(e.target.value))}
                className="w-full accent-cyan cursor-pointer"
                aria-label="Ajustar temperatura del procesador"
              />
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Desliza hacia la derecha para calentar la cámara. A temperatura ambiente, las vibraciones y el calor del entorno colisionan con el chip provocando la pérdida del estado cuántico (<strong className="text-white">decoherencia</strong>).
            </p>
          </div>

          {/* Simple Observation Box */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex gap-3 text-xs leading-relaxed text-slate-300">
            <ThermometerSnowflake className="w-5 h-5 text-cyan shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block font-medium mb-1">
                El propósito del frío extremo
              </strong>
              Operar cerca del cero absoluto no es un requisito estético ni busca reducir el peso físico de los componentes. Su único propósito es reducir el ruido y las interferencias del entorno que destruyen el estado cuántico.
            </div>
          </div>
        </div>
      </div>

      {/* Discovery Task */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-cyan" />
          Reto de comprensión: ¿Por qué muchas computadoras cuánticas operan a temperaturas cercanas al cero absoluto?
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleChoice('weight')}
            className={`p-3.5 rounded-lg border text-left text-xs leading-normal transition-all ${
              userChoice === 'weight'
                ? 'bg-rose-950/40 border-rose-500/80 text-rose-200'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            A) Para que los qubits y los cables pesen menos físicamente
          </button>
          <button
            onClick={() => handleChoice('noise_reduction')}
            className={`p-3.5 rounded-lg border text-left text-xs leading-normal transition-all ${
              userChoice === 'noise_reduction'
                ? 'bg-emerald-950/40 border-emerald-500/80 text-emerald-200'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            B) Para reducir el ruido y la interferencia que provocan la pérdida del estado cuántico (decoherencia)
          </button>
          <button
            onClick={() => handleChoice('aesthetic')}
            className={`p-3.5 rounded-lg border text-left text-xs leading-normal transition-all ${
              userChoice === 'aesthetic'
                ? 'bg-rose-950/40 border-rose-500/80 text-rose-200'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            C) Por un requerimiento estético del diseño exterior de los equipos
          </button>
        </div>

        {showFeedback && (
          <div
            className={`mt-4 p-3.5 rounded-lg text-xs flex items-center justify-between gap-3 ${
              userChoice === 'noise_reduction'
                ? 'bg-emerald-950/30 border border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/30 border border-rose-500/40 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {userChoice === 'noise_reduction' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Info className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>
                {userChoice === 'noise_reduction'
                  ? 'Correcto. El frío extremo silencia las perturbaciones térmicas para evitar la decoherencia.'
                  : 'Pista: Recuerda lo observado: el calor genera ruido en el entorno que colapsa el estado de superposición.'}
              </span>
            </div>
            {userChoice === 'noise_reduction' && (
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
          ← Regresar a Misión 2
        </button>
      </div>
    </div>
  );
}
