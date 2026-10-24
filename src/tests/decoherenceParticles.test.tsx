import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as THREE from 'three';
import {
  DecoherenceParticles,
  calculateThermalMetrics,
  createThermalDistortionShaderMaterial,
  updateThermalDistortionUniforms,
  createDecoherenceParticleSystem,
  updateThermalParticles,
} from '@/features/quantum-core/DecoherenceParticles';
import { useQuantumStore } from '@/store/useQuantumStore';

describe('Thermal Decoherence GPU Particle System & Mesh Noise Shader', () => {
  beforeEach(() => {
    useQuantumStore.setState({
      temperatureK: 0.015,
      theta: 0,
      phi: 0,
    });
  });

  describe('calculateThermalMetrics (Decoherence Physics)', () => {
    it('calculates frozen baseline metrics at cryogenic 15 mK with particleSpeed = 0', () => {
      const metrics = calculateThermalMetrics(0.015);
      expect(metrics.temperatureMilliK).toBe(15);
      expect(metrics.t2CoherenceTimeUs).toBeGreaterThan(240);
      expect(metrics.normalizedDegradation).toBe(0);
      expect(metrics.distortionAmplitude).toBe(0);
      expect(metrics.particleSpeed).toBe(0);
    });

    it('calculates maximum degradation and velocity at ambient 300 K', () => {
      const metrics = calculateThermalMetrics(300);
      expect(metrics.temperatureMilliK).toBe(300000);
      expect(metrics.t2CoherenceTimeUs).toBe(0);
      expect(metrics.normalizedDegradation).toBe(1.0);
      expect(metrics.distortionAmplitude).toBeCloseTo(0.22);
      expect(metrics.particleSpeed).toBeGreaterThan(3.0);
    });

    it('strictly increases degradation and velocity while reducing T2 as temperature rises', () => {
      const m15mK = calculateThermalMetrics(0.015);
      const m4K = calculateThermalMetrics(4.0);
      const m77K = calculateThermalMetrics(77.0);
      const m300K = calculateThermalMetrics(300.0);

      expect(m15mK.distortionAmplitude).toBeLessThan(m4K.distortionAmplitude);
      expect(m4K.distortionAmplitude).toBeLessThan(m77K.distortionAmplitude);
      expect(m77K.distortionAmplitude).toBeLessThan(m300K.distortionAmplitude);

      expect(m15mK.particleSpeed).toBeLessThan(m4K.particleSpeed);
      expect(m4K.particleSpeed).toBeLessThan(m77K.particleSpeed);
      expect(m77K.particleSpeed).toBeLessThan(m300K.particleSpeed);

      expect(m15mK.t2CoherenceTimeUs).toBeGreaterThan(m4K.t2CoherenceTimeUs);
    });
  });

  describe('createThermalDistortionShaderMaterial (GLSL Mesh Noise)', () => {
    it('creates shader material with thermal uniforms', () => {
      const mat = createThermalDistortionShaderMaterial();
      expect(mat).toBeInstanceOf(THREE.ShaderMaterial);
      expect(mat.uniforms.uTime).toBeDefined();
      expect(mat.uniforms.uDistortion).toBeDefined();
      expect(mat.uniforms.uNoiseFreq).toBeDefined();
      expect(mat.uniforms.uBaseColor).toBeDefined();
      expect(mat.uniforms.uHotColor).toBeDefined();
      expect(mat.wireframe).toBe(true);
    });

    it('updates uniforms dynamically matching temperature distortion amplitude', () => {
      const mat = createThermalDistortionShaderMaterial();
      updateThermalDistortionUniforms(mat, 1.5, 0.015);
      expect(mat.uniforms.uTime.value).toBe(1.5);
      expect(mat.uniforms.uDistortion.value).toBe(0);

      updateThermalDistortionUniforms(mat, 2.5, 300);
      expect(mat.uniforms.uTime.value).toBe(2.5);
      expect(mat.uniforms.uDistortion.value).toBeCloseTo(0.22);
    });
  });

  describe('createDecoherenceParticleSystem & updateThermalParticles', () => {
    it('creates particle system with 350 particles in spherical shell', () => {
      const system = createDecoherenceParticleSystem(350);
      expect(system.count).toBe(350);
      expect(system.points).toBeInstanceOf(THREE.Points);
      expect(system.positions.length).toBe(350 * 3);
      expect(system.colors.length).toBe(350 * 3);

      // Verify radii are outside the 1.0 unit sphere
      for (let i = 0; i < 350; i++) {
        expect(system.baseRadii[i]).toBeGreaterThan(1.2);
      }
    });

    it('freezes particle velocities to 0 and keeps positions unchanged at 15 mK', () => {
      const system = createDecoherenceParticleSystem(50);
      // Give initial non-zero velocities
      for (let i = 0; i < system.velocities.length; i++) {
        system.velocities[i] = 1.0;
      }
      const initialPos = Float32Array.from(system.positions);

      updateThermalParticles(system, 0.1, 0.015);

      // All velocities zeroed
      for (let i = 0; i < system.velocities.length; i++) {
        expect(system.velocities[i]).toBe(0);
      }
      // Positions unchanged
      expect(system.positions).toEqual(initialPos);
    });

    it('shifts particle colors towards red and increases jitter as temperature rises', () => {
      const systemHot = createDecoherenceParticleSystem(100);
      updateThermalParticles(systemHot, 0.1, 300.0);

      // Average red channel across particles
      let rHot = 0;
      for (let i = 0; i < 100; i++) {
        rHot += systemHot.colors[i * 3];
      }
      expect(rHot / 100).toBeGreaterThan(0.7);
    });
  });

  describe('React Component Rendering', () => {
    it('renders the decoherence viewport and perimeter HUD', () => {
      render(<DecoherenceParticles />);
      expect(screen.getByTestId('decoherence-particles')).toBeDefined();
      expect(screen.getByText(/Thermal Decoherence/i)).toBeDefined();
      expect(screen.getAllByText(/15 mK/i).length).toBeGreaterThanOrEqual(1);
    });

    it('updates store temperature when Cryo Preset buttons are clicked', () => {
      render(<DecoherenceParticles />);
      const btn300K = screen.getByRole('button', { name: '300 K' });
      fireEvent.click(btn300K);
      expect(useQuantumStore.getState().temperatureK).toBe(300);

      const btn77K = screen.getByRole('button', { name: '77 K' });
      fireEvent.click(btn77K);
      expect(useQuantumStore.getState().temperatureK).toBe(77);
    });
  });
});
