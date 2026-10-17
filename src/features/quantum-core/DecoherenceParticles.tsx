'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useQuantumStore } from '@/store/useQuantumStore';
import { kelvinToMilliKelvin, calculateT2CoherenceTime } from '@/core/decoherenceMath';
import { computeSphericalVector } from './blochSceneObjects';

export interface ThermalMetrics {
  temperatureK: number;
  temperatureMilliK: number;
  t2CoherenceTimeUs: number;
  normalizedDegradation: number;
  particleSpeed: number;
  distortionAmplitude: number;
  jitterVariance: number;
}

export function calculateThermalMetrics(temperatureK: number): ThermalMetrics {
  const clampedK = Math.max(0.015, Math.min(300, Number.isFinite(temperatureK) ? temperatureK : 0.015));
  const tempMilliK = kelvinToMilliKelvin(clampedK);
  const t2 = calculateT2CoherenceTime(tempMilliK);

  const logMin = Math.log10(15);
  const logMax = Math.log10(300000);
  const logCur = Math.log10(tempMilliK);
  const normalized = Math.max(0, Math.min(1, (logCur - logMin) / (logMax - logMin)));

  const particleSpeed = 0.2 + normalized * 3.2;
  const distortionAmplitude = normalized * 0.22;
  const jitterVariance = 0.01 + normalized * 0.14;

  return {
    temperatureK: clampedK,
    temperatureMilliK: tempMilliK,
    t2CoherenceTimeUs: t2,
    normalizedDegradation: Number(normalized.toFixed(4)),
    particleSpeed: Number(particleSpeed.toFixed(4)),
    distortionAmplitude: Number(distortionAmplitude.toFixed(4)),
    jitterVariance: Number(jitterVariance.toFixed(4)),
  };
}

const VERTEX_SHADER = `
  uniform float uTime;
  uniform float uDistortion;
  uniform float uNoiseFreq;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vNoise;

  float getNoise(vec3 p) {
    return sin(p.x * uNoiseFreq + uTime * 2.2) * cos(p.y * uNoiseFreq + uTime * 1.8) * sin(p.z * uNoiseFreq + uTime * 2.6)
         + 0.5 * sin(p.y * uNoiseFreq * 2.2 + uTime * 3.4) * cos(p.z * uNoiseFreq * 2.2 + uTime * 2.4);
  }

  void main() {
    vNormal = normal;
    vPosition = position;
    float noiseVal = getNoise(position);
    vNoise = noiseVal;
    vec3 newPosition = position + normal * (noiseVal * uDistortion);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  uniform vec3 uBaseColor;
  uniform vec3 uHotColor;
  uniform float uDistortion;
  uniform float uOpacity;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vNoise;

  void main() {
    float heatFactor = clamp(uDistortion * 4.5 + vNoise * 0.15, 0.0, 1.0);
    vec3 color = mix(uBaseColor, uHotColor, heatFactor);
    gl_FragColor = vec4(color, uOpacity);
  }
`;

export function createThermalDistortionShaderMaterial(options: {
  baseColor?: number;
  hotColor?: number;
  opacity?: number;
} = {}): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDistortion: { value: 0 },
      uNoiseFreq: { value: 3.2 },
      uBaseColor: { value: new THREE.Color(options.baseColor ?? 0x00f3ff) },
      uHotColor: { value: new THREE.Color(options.hotColor ?? 0xff3b30) },
      uOpacity: { value: options.opacity ?? 0.35 },
    },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    wireframe: true,
    transparent: true,
  });
}

export function updateThermalDistortionUniforms(
  material: THREE.ShaderMaterial,
  timeSeconds: number,
  temperatureK: number
): void {
  const metrics = calculateThermalMetrics(temperatureK);
  material.uniforms.uTime.value = timeSeconds;
  material.uniforms.uDistortion.value = metrics.distortionAmplitude;
}

export interface DecoherenceParticleSystem {
  points: THREE.Points;
  positions: Float32Array;
  velocities: Float32Array;
  colors: Float32Array;
  baseRadii: Float32Array;
  thetas: Float32Array;
  phis: Float32Array;
  count: number;
}

export function createDecoherenceParticleSystem(count = 350): DecoherenceParticleSystem {
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const baseRadii = new Float32Array(count);
  const thetas = new Float32Array(count);
  const phis = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const r = 1.25 + Math.random() * 0.95;
    const theta = Math.acos(2 * Math.random() - 1);
    const phi = Math.random() * Math.PI * 2;

    baseRadii[i] = r;
    thetas[i] = theta;
    phis[i] = phi;

    positions[i * 3] = r * Math.sin(theta) * Math.cos(phi);
    positions[i * 3 + 1] = r * Math.cos(theta);
    positions[i * 3 + 2] = r * Math.sin(theta) * Math.sin(phi);

    velocities[i * 3] = (Math.random() - 0.5) * 0.02;
    velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;

    colors[i * 3] = 0.0;
    colors[i * 3 + 1] = 0.95;
    colors[i * 3 + 2] = 1.0;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.06,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  return { points, positions, velocities, colors, baseRadii, thetas, phis, count };
}

export function updateThermalParticles(
  system: DecoherenceParticleSystem,
  dt: number,
  temperatureK: number
): void {
  const metrics = calculateThermalMetrics(temperatureK);
  const { positions, baseRadii, thetas, phis, colors, count, points } = system;
  const posAttr = points.geometry.getAttribute('position') as THREE.BufferAttribute;
  const colAttr = points.geometry.getAttribute('color') as THREE.BufferAttribute;

  const speed = metrics.particleSpeed;
  const jitter = metrics.jitterVariance;
  const deg = metrics.normalizedDegradation;

  for (let i = 0; i < count; i++) {
    phis[i] += dt * speed * 0.6;
    thetas[i] += (Math.random() - 0.5) * dt * jitter * 8.0;

    const r = baseRadii[i] + (Math.random() - 0.5) * jitter;
    positions[i * 3] = r * Math.sin(thetas[i]) * Math.cos(phis[i]);
    positions[i * 3 + 1] = r * Math.cos(thetas[i]);
    positions[i * 3 + 2] = r * Math.sin(thetas[i]) * Math.sin(phis[i]);

    // Color: cyan at 15mK -> incandescent amber/red at 300K
    colors[i * 3] = THREE.MathUtils.lerp(0.0, 1.0, deg);
    colors[i * 3 + 1] = THREE.MathUtils.lerp(0.95, 0.25, deg);
    colors[i * 3 + 2] = THREE.MathUtils.lerp(1.0, 0.15, deg);
  }

  posAttr.needsUpdate = true;
  colAttr.needsUpdate = true;
}

export interface DecoherenceParticlesProps {
  className?: string;
  initialTemperatureK?: number;
}

export const DecoherenceParticles: React.FC<DecoherenceParticlesProps> = ({
  className = '',
  initialTemperatureK,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const storeTemp = useQuantumStore((s) => s.temperatureK);
  const setTemperature = useQuantumStore((s) => s.setTemperature);

  const activeTemp = initialTemperatureK !== undefined ? initialTemperatureK : storeTemp;
  const metrics = useMemo(() => calculateThermalMetrics(activeTemp), [activeTemp]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2));
      renderer.setSize(container.clientWidth || 800, container.clientHeight || 500, false);
      container.appendChild(renderer.domElement);
    } catch (_e) {
      renderer = null;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1.6, 0.1, 1000);
    camera.position.set(0, 0, 5.2);
    camera.lookAt(0, 0, 0);

    const sphereGeo = new THREE.SphereGeometry(1.3, 36, 24);
    const sphereMat = createThermalDistortionShaderMaterial();
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphere);

    const ringGeo = new THREE.RingGeometry(1.29, 1.31, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.35, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    const arrowHelper = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 1.3, 0x00f3ff, 0.2, 0.08);
    scene.add(arrowHelper);

    const particleSystem = createDecoherenceParticleSystem(350);
    scene.add(particleSystem.points);

    let animId = 0;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const state = useQuantumStore.getState();
      const currentTemp = initialTemperatureK !== undefined ? initialTemperatureK : state.temperatureK;

      updateThermalDistortionUniforms(sphereMat, now / 1000, currentTemp);
      updateThermalParticles(particleSystem, dt, currentTemp);

      const dir = computeSphericalVector(state.theta, state.phi);
      arrowHelper.setDirection(dir);

      if (renderer) renderer.render(scene, camera);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    const onResize = () => {
      if (!renderer || !container) return;
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 500;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      sphereGeo.dispose();
      sphereMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      particleSystem.points.geometry.dispose();
      (particleSystem.points.material as THREE.Material).dispose();
      if (renderer && renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
        renderer.dispose();
      }
    };
  }, [initialTemperatureK]);

  return (
    <div
      data-testid="decoherence-particles"
      className={`relative w-full h-full min-h-[360px] rounded-2xl border border-cyan/30 bg-slate-950/70 backdrop-blur-md overflow-hidden flex flex-col select-none ${className}`}
    >
      <div ref={containerRef} className="absolute inset-0 z-0 touch-none" />

      {/* Perimeter Tactical HUD Header */}
      <div className="relative z-10 flex items-center justify-between p-3.5 border-b border-border/60 bg-background/50 backdrop-blur-sm pointer-events-none">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${metrics.normalizedDegradation > 0.6 ? 'bg-rose-500 animate-ping' : 'bg-cyan animate-pulse'}`} />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-cyan">
            Thermal Decoherence: GPU Jitter & Mesh Distortion
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan/15 text-cyan border border-cyan/30">
          T₂ = {metrics.t2CoherenceTimeUs} μs
        </span>
      </div>

      {/* Floating Bottom Telemetry & Cryo Presets */}
      <div className="relative z-10 flex-1 flex flex-col justify-end p-4 pointer-events-none">
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-surface-2/85 border border-edge/80 backdrop-blur-sm pointer-events-auto">
          {/* Readout */}
          <div className="flex gap-4 font-mono text-xs">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase block">Temp (T)</span>
              <span className="font-bold text-foreground">
                {metrics.temperatureK < 1 ? `${metrics.temperatureMilliK} mK` : `${metrics.temperatureK} K`}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase block">Coherence T₂</span>
              <span className="font-bold text-cyan">{metrics.t2CoherenceTimeUs} μs</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase block">Distortion Δ</span>
              <span className="font-bold text-amber-400">{(metrics.distortionAmplitude * 100).toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground uppercase block">Jitter v</span>
              <span className="font-bold text-rose-400">{metrics.particleSpeed}x</span>
            </div>
          </div>

          {/* Cryo Presets */}
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <button
              type="button"
              onClick={() => setTemperature(0.015)}
              className="px-2 py-1 rounded border border-cyan/40 bg-cyan/10 hover:bg-cyan/20 text-cyan text-[11px]"
            >
              15 mK
            </button>
            <button
              type="button"
              onClick={() => setTemperature(4.0)}
              className="px-2 py-1 rounded border border-border bg-surface-3 hover:bg-surface-2 text-muted-foreground text-[11px]"
            >
              4 K
            </button>
            <button
              type="button"
              onClick={() => setTemperature(77.0)}
              className="px-2 py-1 rounded border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-[11px]"
            >
              77 K
            </button>
            <button
              type="button"
              onClick={() => setTemperature(300.0)}
              className="px-2 py-1 rounded border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px]"
            >
              300 K
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DecoherenceParticles;
