import * as THREE from 'three';
import { CRYO_MIN_MK, CRYO_MAX_MK, calculateT2CoherenceTime } from '@/core/decoherenceMath';

export const HOT_DECOHERENCE_COLOR = 0xf87171; // Incandescent red/rose

export interface DecoherenceVisualMetrics {
  temperatureMilliK: number;
  t2CoherenceTimeUs: number;
  normalizedDegradation: number;
  distortionAmplitude: number;
  particleSpeed: number;
  jitterVariance: number;
}

/**
 * Computes normalized degradation [0, 1] and visual simulation parameters
 * from temperature (mK) and optional vector purity [0, 1].
 */
export function calculateDecoherenceVisualMetrics(
  temperatureMilliK: number = CRYO_MIN_MK,
  purity: number = 1.0
): DecoherenceVisualMetrics {
  const clampedTemp = Math.max(CRYO_MIN_MK, Math.min(300000, Number.isFinite(temperatureMilliK) ? temperatureMilliK : CRYO_MIN_MK));
  const t2 = calculateT2CoherenceTime(clampedTemp);

  // If at cryogenic minimum (15 mK) and pure state, freeze velocity, distortion, and degradation to 0
  if (clampedTemp <= CRYO_MIN_MK && purity >= 0.9999) {
    return {
      temperatureMilliK: CRYO_MIN_MK,
      t2CoherenceTimeUs: t2,
      normalizedDegradation: 0,
      distortionAmplitude: 0,
      particleSpeed: 0,
      jitterVariance: 0,
    };
  }

  // Normalize temperature degradation: 15 mK = 0.0, 300 mK = 1.0 (or higher if ambient)
  const tempDegradation = Math.max(0, Math.min(1, (clampedTemp - CRYO_MIN_MK) / (CRYO_MAX_MK - CRYO_MIN_MK)));
  const purityDegradation = Math.max(0, Math.min(1, 1.0 - purity));

  // Combined degradation factor
  const normalizedDegradation = Math.max(tempDegradation, purityDegradation);

  const distortionAmplitude = normalizedDegradation * 0.18;
  const particleSpeed = 0.3 + normalizedDegradation * 2.8;
  const jitterVariance = 0.01 + normalizedDegradation * 0.12;

  return {
    temperatureMilliK: clampedTemp,
    t2CoherenceTimeUs: t2,
    normalizedDegradation: Number(normalizedDegradation.toFixed(4)),
    distortionAmplitude: Number(distortionAmplitude.toFixed(4)),
    particleSpeed: Number(particleSpeed.toFixed(4)),
    jitterVariance: Number(jitterVariance.toFixed(4)),
  };
}

const VERTEX_SHADER = /* glsl */ `
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

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uBaseColor;
  uniform vec3 uHotColor;
  uniform float uDistortion;
  uniform float uOpacity;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vNoise;

  void main() {
    float heatFactor = clamp(uDistortion * 5.0 + vNoise * 0.15, 0.0, 1.0);
    vec3 color = mix(uBaseColor, uHotColor, heatFactor);
    gl_FragColor = vec4(color, uOpacity);
  }
`;

export interface ThermalShaderMaterialOptions {
  baseColor?: number;
  hotColor?: number;
  opacity?: number;
}

export function createThermalDistortionShaderMaterial(
  options: ThermalShaderMaterialOptions = {}
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDistortion: { value: 0 },
      uNoiseFreq: { value: 3.2 },
      uBaseColor: { value: new THREE.Color(options.baseColor ?? 0x00f0ff) },
      uHotColor: { value: new THREE.Color(options.hotColor ?? HOT_DECOHERENCE_COLOR) },
      uOpacity: { value: options.opacity ?? 0.25 },
    },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    wireframe: true,
    transparent: true,
    depthWrite: false,
  });
}

export function updateThermalDistortionUniforms(
  material: THREE.ShaderMaterial,
  timeSeconds: number,
  temperatureMilliK: number,
  purity: number = 1.0,
  noiseIntensity: number = 1.0
): void {
  const metrics = calculateDecoherenceVisualMetrics(temperatureMilliK, purity);
  material.uniforms.uTime.value = timeSeconds;
  material.uniforms.uDistortion.value = metrics.distortionAmplitude * Math.max(0, noiseIntensity);
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
  dispose: () => void;
}

export function createDecoherenceParticleSystem(
  count = 180,
  radiusMin = 1.25,
  radiusMax = 2.1
): DecoherenceParticleSystem {
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const baseRadii = new Float32Array(count);
  const thetas = new Float32Array(count);
  const phis = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const r = radiusMin + Math.random() * (radiusMax - radiusMin);
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

    // Default cool cyan color
    colors[i * 3] = 0.0;
    colors[i * 3 + 1] = 0.94;
    colors[i * 3 + 2] = 1.0;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 0.05,
    vertexColors: true,
    transparent: true,
    opacity: 0.75,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geometry, material);
  points.visible = false;

  return {
    points,
    positions,
    velocities,
    colors,
    baseRadii,
    thetas,
    phis,
    count,
    dispose: () => {
      geometry.dispose();
      material.dispose();
    },
  };
}

export function updateThermalParticles(
  system: DecoherenceParticleSystem,
  dt: number,
  temperatureMilliK: number,
  purity: number = 1.0
): void {
  const metrics = calculateDecoherenceVisualMetrics(temperatureMilliK, purity);
  const { positions, baseRadii, thetas, phis, colors, count, points } = system;

  const isThermal = metrics.normalizedDegradation > 0.005;
  points.visible = isThermal;
  if (!isThermal || temperatureMilliK <= CRYO_MIN_MK) {
    for (let i = 0; i < system.velocities.length; i++) {
      system.velocities[i] = 0;
    }
    return;
  }

  const posAttr = points.geometry.getAttribute('position') as THREE.BufferAttribute;
  const colAttr = points.geometry.getAttribute('color') as THREE.BufferAttribute;

  const speed = metrics.particleSpeed;
  const jitter = metrics.jitterVariance;
  const deg = metrics.normalizedDegradation;

  const mat = points.material as THREE.PointsMaterial;
  mat.opacity = Math.min(0.85, 0.2 + deg * 0.65);

  for (let i = 0; i < count; i++) {
    phis[i] += dt * speed * 0.5;
    thetas[i] += (Math.random() - 0.5) * dt * jitter * 6.0;

    const r = baseRadii[i] + (Math.random() - 0.5) * jitter;
    positions[i * 3] = r * Math.sin(thetas[i]) * Math.cos(phis[i]);
    positions[i * 3 + 1] = r * Math.cos(thetas[i]);
    positions[i * 3 + 2] = r * Math.sin(thetas[i]) * Math.sin(phis[i]);

    // Color: cyan [0, 0.94, 1.0] at 15mK -> incandescent amber/red [1.0, 0.25, 0.15] at max degradation
    colors[i * 3] = THREE.MathUtils.lerp(0.0, 1.0, deg);
    colors[i * 3 + 1] = THREE.MathUtils.lerp(0.94, 0.25, deg);
    colors[i * 3 + 2] = THREE.MathUtils.lerp(1.0, 0.15, deg);
  }

  posAttr.needsUpdate = true;
  colAttr.needsUpdate = true;
}
