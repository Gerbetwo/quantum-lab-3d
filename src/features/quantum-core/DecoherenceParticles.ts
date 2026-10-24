import * as THREE from 'three';
import { kelvinToMilliKelvin, calculateT2CoherenceTime } from '@/core/decoherenceMath';

export interface ThermalMetrics {
  temperatureK: number;
  temperatureMilliK: number;
  t2CoherenceTimeUs: number;
  normalizedDegradation: number;
  particleSpeed: number;
  distortionAmplitude: number;
  jitterVariance: number;
}

/**
 * Computes thermal degradation and particle velocity metrics from temperature (K).
 * Freezes particleSpeed, distortionAmplitude, and normalizedDegradation to 0 at <= 15 mK.
 */
export function calculateThermalMetrics(temperatureK: number): ThermalMetrics {
  const clampedK = Math.max(0.015, Math.min(300, Number.isFinite(temperatureK) ? temperatureK : 0.015));
  const tempMilliK = kelvinToMilliKelvin(clampedK);
  const t2 = calculateT2CoherenceTime(tempMilliK);

  // If tempK <= 0.015 (15 mK minimum), explicitly set particleSpeed = 0, distortionAmplitude = 0, and normalizedDegradation = 0
  if (clampedK <= 0.015) {
    return {
      temperatureK: 0.015,
      temperatureMilliK: 15,
      t2CoherenceTimeUs: t2,
      normalizedDegradation: 0,
      particleSpeed: 0,
      distortionAmplitude: 0,
      jitterVariance: 0,
    };
  }

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
  // When tempK <= 0.015, set velocity displacement to 0 and skip position jitter so particles remain stationary
  if (temperatureK <= 0.015) {
    for (let i = 0; i < system.velocities.length; i++) {
      system.velocities[i] = 0;
    }
    return;
  }

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

export { DecoherenceParticles, type DecoherenceParticlesProps } from './DecoherenceParticlesView';
export { default } from './DecoherenceParticlesView';
