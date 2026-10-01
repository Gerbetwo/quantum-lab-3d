'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { ThermometerSnowflake, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { playButtonClick, playChimeSuccess, playDecoherenceAlert } from '@/lib/sound';
import { saveCompletedMission, updateStoredMetrics } from '@/lib/cookies';

interface Props {
  onComplete: () => void;
  onBack: () => void;
}

export default function Mission3Decoherence({ onComplete, onBack }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [temperature, setTemperature] = useState(15); // 15 millikelvin = 0.015 K
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

    // 1. Chandelier Rings (Golden cryostat plates)
    const chandelier = new THREE.Group();
    chandelierRingsRef.current = chandelier;

    const ringRadii = [1.2, 0.9, 0.6];
    const ringHeights = [0.8, 0.4, 0.0];
    ringRadii.forEach((r, idx) => {
      const ringGeo = new THREE.TorusGeometry(r, 0.025, 16, 40);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, wireframe: true });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.y = ringHeights[idx];
      chandelier.add(ringMesh);
    });
    scene.add(chandelier);

    // 2. Central Quantum Processor Core
    const coreGeo = new THREE.BoxGeometry(0.5, 0.25, 0.5);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.y = -0.3;
    coreMeshRef.current = coreMesh;
    scene.add(coreMesh);

    // 3. Thermal Noise Particles
    const pCount = 90;
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

    const pMat = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.035,
      transparent: true,
      opacity: 0.6,
    });
    const particles = new THREE.Points(pGeo, pMat);
    particlesRef.current = particles;
    scene.add(particles);

    // 4. Animation
    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);
      chandelier.rotation.y += 0.005;
      coreMesh.rotation.y += 0.01;

      // Jitter core if hot
      if (coreMeshRef.current && temperature > 120) {
        coreMeshRef.current.position.x = (Math.random() - 0.5) * 0.03;
        coreMeshRef.current.position.z = (Math.random() - 0.5) * 0.03;
      } else if (coreMeshRef.current) {
        coreMeshRef.current.position.x = 0;
        coreMeshRef.current.position.z = 0;
      }

      // Animate thermal particles based on temperature
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

  // Handle temperature changes and update materials
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
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-cyan px-2 py-0.5 rounded bg-cyan/10 border border-cyan/30">
            Fase 03: Estabilidad Térmica
          </span>
          <h2 className="text-2xl font-bold font-orbitron text-white mt-1">
            El Congelador Cuántico y la Decoherencia
          </h2>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Estado criogénico:{' '}
          <span className={isDecoherent ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
            {isDecoherent ? 'DECOHERENCIA CRÍTICA' : 'SUPERCONDUCTOR COHERENTE'}
          </span>
        </div>
      </div>

      {/* 3D Simulation & Thermal Slider */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* 3D Viewport */}
        <div className="lg:col-span-7 bg-[#0b0f1d] border border-cyan/20 rounded-2xl p-4 flex flex-col items-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-3 left-4 text-xs font-mono text-slate-400 flex items-center gap-1.5">
            <ThermometerSnowflake className="w-3.5 h-3.5 text-cyan animate-pulse" />
            CRIÓSTATO DE DILUCIÓN (CERO ABSOLUTO)
          </div>

          <div ref={containerRef} className="w-full cursor-grab active:cursor-grabbing" />

          {/* Temperature HUD */}
          <div className="w-full mt-2 flex justify-between items-center bg-black/50 border border-slate-800 rounded-xl px-4 py-2.5">
            <div className="text-xs font-mono">
              TEMPERATURA DEL NÚCLEO:{' '}
              <span className={`font-bold font-orbitron text-base ${isDecoherent ? 'text-rose-400' : 'text-cyan'}`}>
                {temperature === 15 ? '0.015 K (-273.13 °C)' : `${temperature} K`}
              </span>
            </div>
            {isDecoherent && (
              <div className="flex items-center gap-1 text-[11px] font-mono text-rose-400 font-bold uppercase animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" /> Ruido Térmico Destructivo
              </div>
            )}
          </div>
        </div>

        {/* Controls & Insight */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
            <h3 className="text-sm font-rajdhani font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <ThermometerSnowflake className="w-4 h-4 text-cyan" /> Regulador Térmico
            </h3>

            {/* Temperature Slider */}
            <div>
              <div className="flex justify-between text-xs font-mono text-slate-400 mb-1">
                <span className="text-cyan font-bold">0.015 K (Cero Absoluto)</span>
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
              />
            </div>

            <p className="text-xs text-slate-400">
              👉 <strong>Arrastra el slider a la derecha:</strong> Las vibraciones atómicas y el calor colisionan con el chip, destruyendo la superposición. Esto se denomina <strong className="text-white">Decoherencia Cuántica</strong>.
            </p>
          </div>

          <div className="bg-amber-500/5 border-l-4 border-amber-500 p-4 rounded-r-xl text-xs leading-relaxed text-slate-300">
            <strong className="text-amber-400 block mb-1 font-orbitron text-[11px]">
              ❄️ ¿Por qué tanto frío?
            </strong>
            No es por estética ni para que los procesadores pesen menos. Se enfría a temperaturas más gélidas que el espacio exterior para reducir al mínimo el ruido del entorno que provocaría la pérdida del estado cuántico.
          </div>
        </div>
      </div>

      {/* Deductive Challenge */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 mt-2">
        <h4 className="text-sm font-rajdhani font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-2">
          🎯 Reto de Descubrimiento: ¿Por qué muchas computadoras cuánticas operan a temperaturas cercanas al cero absoluto?
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => handleChoice('weight')}
            className={`p-3 rounded-xl border text-left text-xs transition-all ${
              userChoice === 'weight'
                ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                : 'bg-black/30 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            A) Para que los qubits y los cables pesen menos físicamente
          </button>
          <button
            onClick={() => handleChoice('noise_reduction')}
            className={`p-3 rounded-xl border text-left text-xs transition-all ${
              userChoice === 'noise_reduction'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-black/30 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            B) Para reducir el ruido y la interferencia que provocan la pérdida del estado cuántico (decoherencia)
          </button>
          <button
            onClick={() => handleChoice('aesthetic')}
            className={`p-3 rounded-xl border text-left text-xs transition-all ${
              userChoice === 'aesthetic'
                ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                : 'bg-black/30 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            C) Es un requerimiento puramente estético del diseño del equipo
          </button>
        </div>

        {showFeedback && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs flex items-center justify-between ${
              userChoice === 'noise_reduction'
                ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/40 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                {userChoice === 'noise_reduction'
                  ? '¡Excelente deducción! El cero absoluto detiene las vibraciones que de otro modo destruirían la computación cuántica.'
                  : 'Pista: Recuerda lo que viste en la simulación: el calor genera ruido que destruye la coherencia cuántica.'}
              </span>
            </div>
            {userChoice === 'noise_reduction' && (
              <button
                onClick={onComplete}
                className="ml-3 px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-orbitron font-bold text-xs uppercase flex items-center gap-1 hover:brightness-110 shrink-0"
              >
                Avanzar a Fase 4 <ArrowRight className="w-3.5 h-3.5" />
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
          ← Regresar a Fase 2
        </button>
      </div>
    </div>
  );
}
