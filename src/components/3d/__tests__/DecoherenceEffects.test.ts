import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  calculateDecoherenceVisualMetrics,
  createThermalDistortionShaderMaterial,
  updateThermalDistortionUniforms,
  createDecoherenceParticleSystem,
  updateThermalParticles,
  HOT_DECOHERENCE_COLOR,
} from '../DecoherenceEffects';

describe('DecoherenceEffects (Thermal Animation & Shaders)', () => {
  describe('calculateDecoherenceVisualMetrics', () => {
    it('returns zero degradation and frozen baseline values at cryogenic base temperature (15 mK, purity 1)', () => {
      const metrics = calculateDecoherenceVisualMetrics(15, 1.0);
      expect(metrics.temperatureMilliK).toBe(15);
      expect(metrics.normalizedDegradation).toBe(0);
      expect(metrics.distortionAmplitude).toBe(0);
      expect(metrics.particleSpeed).toBe(0);
      expect(metrics.t2CoherenceTimeUs).toBeGreaterThan(240);
    });

    it('returns maximum degradation and high distortion at 300 mK', () => {
      const metrics = calculateDecoherenceVisualMetrics(300, 1.0);
      expect(metrics.normalizedDegradation).toBe(1.0);
      expect(metrics.distortionAmplitude).toBeCloseTo(0.18);
      expect(metrics.particleSpeed).toBeGreaterThan(3.0);
    });

    it('scales degradation based on reduced vector purity even at low temperature', () => {
      const metrics = calculateDecoherenceVisualMetrics(15, 0.4);
      expect(metrics.normalizedDegradation).toBeCloseTo(0.6);
      expect(metrics.distortionAmplitude).toBeGreaterThan(0.08);
    });

    it('monotonically increases distortion and velocity as temperature rises', () => {
      const m15 = calculateDecoherenceVisualMetrics(15, 1.0);
      const m150 = calculateDecoherenceVisualMetrics(150, 1.0);
      const m300 = calculateDecoherenceVisualMetrics(300, 1.0);

      expect(m15.distortionAmplitude).toBeLessThan(m150.distortionAmplitude);
      expect(m150.distortionAmplitude).toBeLessThan(m300.distortionAmplitude);

      expect(m15.particleSpeed).toBeLessThan(m150.particleSpeed);
      expect(m150.particleSpeed).toBeLessThan(m300.particleSpeed);
    });
  });

  describe('createThermalDistortionShaderMaterial', () => {
    it('creates a custom ShaderMaterial with distortion uniforms and wireframe', () => {
      const mat = createThermalDistortionShaderMaterial({ baseColor: 0x00f0ff, hotColor: HOT_DECOHERENCE_COLOR });
      expect(mat).toBeInstanceOf(THREE.ShaderMaterial);
      expect(mat.wireframe).toBe(true);
      expect(mat.transparent).toBe(true);
      expect(mat.uniforms.uTime).toBeDefined();
      expect(mat.uniforms.uDistortion).toBeDefined();
      expect(mat.uniforms.uBaseColor.value.getHex()).toBe(0x00f0ff);
      expect(mat.uniforms.uHotColor.value.getHex()).toBe(HOT_DECOHERENCE_COLOR);
    });

    it('updates uniforms dynamically when temperature and time step advance', () => {
      const mat = createThermalDistortionShaderMaterial();

      // Base temperature: zero distortion
      updateThermalDistortionUniforms(mat, 1.0, 15, 1.0);
      expect(mat.uniforms.uTime.value).toBe(1.0);
      expect(mat.uniforms.uDistortion.value).toBe(0);

      // Elevated temperature: non-zero distortion
      updateThermalDistortionUniforms(mat, 2.5, 300, 1.0, 1.5);
      expect(mat.uniforms.uTime.value).toBe(2.5);
      expect(mat.uniforms.uDistortion.value).toBeCloseTo(0.18 * 1.5);
    });
  });

  describe('createDecoherenceParticleSystem & updateThermalParticles', () => {
    it('creates spherical shell particle system with points', () => {
      const system = createDecoherenceParticleSystem(100);
      expect(system.count).toBe(100);
      expect(system.points).toBeInstanceOf(THREE.Points);
      expect(system.points.visible).toBe(false);
      expect(system.positions.length).toBe(300);
      expect(system.colors.length).toBe(300);
    });

    it('keeps particles hidden at nominal 15 mK and activates them at elevated temperature', () => {
      const system = createDecoherenceParticleSystem(100);

      // Cold: hidden
      updateThermalParticles(system, 0.016, 15, 1.0);
      expect(system.points.visible).toBe(false);

      // Hot: activated
      updateThermalParticles(system, 0.016, 250, 0.7);
      expect(system.points.visible).toBe(true);
    });

    it('shifts particle colors towards red under thermal degradation', () => {
      const system = createDecoherenceParticleSystem(50);

      // Warm up
      updateThermalParticles(system, 0.05, 300, 0.2);

      let avgRed = 0;
      for (let i = 0; i < 50; i++) {
        avgRed += system.colors[i * 3];
      }
      avgRed /= 50;

      // Red channel should be substantially high (> 0.8)
      expect(avgRed).toBeGreaterThan(0.8);
    });

    it('disposes geometry and material cleanly', () => {
      const system = createDecoherenceParticleSystem(50);
      expect(() => system.dispose()).not.toThrow();
    });
  });
});
