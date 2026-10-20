import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as THREE from 'three';
import {
  EntanglementOverlay3D,
  createDualBlochScene,
  updateLaserStrand,
  computeSynchronizedAngles,
  type SpinFlipWaveState,
} from '@/features/quantum-core/EntanglementOverlay3D';
import { useQuantumStore } from '@/store/useQuantumStore';

describe('3D Quantum Entanglement Correlation Laser (EntanglementOverlay3D)', () => {
  beforeEach(() => {
    useQuantumStore.setState({
      currentMissionId: 'superposition',
      language: 'en',
      theta: Math.PI / 2,
      phi: 0,
      isEntangled: true,
      lastOutcome: null,
    });
  });

  describe('createDualBlochScene (Scene Architecture)', () => {
    it('creates Qubit A (Alice) at X = -2.2 and Qubit B (Bob) at X = +2.2', () => {
      const elements = createDualBlochScene();
      expect(elements.sphereA.position.x).toBeCloseTo(-2.2);
      expect(elements.sphereB.position.x).toBeCloseTo(2.2);
      expect(elements.arrowA).toBeDefined();
      expect(elements.arrowB).toBeDefined();
      expect(elements.tipHandleA).toBeDefined();
      expect(elements.tipHandleB).toBeDefined();
    });

    it('initializes the laser strand particle system with 120 points bridging Alice and Bob', () => {
      const elements = createDualBlochScene();
      expect(elements.particleCount).toBe(120);
      expect(elements.laserParticles).toBeInstanceOf(THREE.Points);

      const pos = elements.laserPositions;
      expect(pos[0]).toBeCloseTo(-1.2); // First particle near Qubit A surface
      expect(pos[(120 - 1) * 3]).toBeCloseTo(1.2); // Last particle near Qubit B surface
    });

    it('registers geometries and materials for deterministic disposal', () => {
      const elements = createDualBlochScene();
      expect(elements.geometries.length).toBeGreaterThanOrEqual(4);
      expect(elements.materials.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('updateLaserStrand (Kinematics & Spin-Flip Waves)', () => {
    it('animates baseline coherence pulse along the laser strand', () => {
      const elements = createDualBlochScene();
      const waveState: SpinFlipWaveState = { active: false, startTime: 0, duration: 1.2, outcome: 0 };

      updateLaserStrand(elements, 1.0, waveState);
      const posAttr = elements.laserParticles.geometry.getAttribute('position');

      // Baseline transverse ripple should be non-zero
      let hasDisplacement = false;
      for (let i = 0; i < elements.particleCount; i++) {
        if (Math.abs(posAttr.getY(i)) > 0.001 || Math.abs(posAttr.getZ(i)) > 0.001) {
          hasDisplacement = true;
          break;
        }
      }
      expect(hasDisplacement).toBe(true);
    });

    it('propagates high-amplitude helical spin-flip waves across the strand during collapse', () => {
      const elements = createDualBlochScene();
      const waveState: SpinFlipWaveState = { active: true, startTime: 0.0, duration: 1.0, outcome: 0 };

      // Update at mid-collapse progress (tau = 0.5)
      updateLaserStrand(elements, 0.5, waveState);
      const posAttr = elements.laserParticles.geometry.getAttribute('position');

      let maxAmplitude = 0;
      for (let i = 0; i < elements.particleCount; i++) {
        const y = posAttr.getY(i);
        const z = posAttr.getZ(i);
        const r = Math.sqrt(y * y + z * z);
        if (r > maxAmplitude) maxAmplitude = r;
      }

      // Spin-flip wave amplitude should peak significantly higher than baseline (> 0.15)
      expect(maxAmplitude).toBeGreaterThan(0.15);
    });

    it('modulates particle colors based on measurement outcome 0 vs 1', () => {
      const elements0 = createDualBlochScene();
      const wave0: SpinFlipWaveState = { active: true, startTime: 0, duration: 1.0, outcome: 0 };
      updateLaserStrand(elements0, 0.5, wave0);
      const colAttr0 = elements0.laserParticles.geometry.getAttribute('color');

      const elements1 = createDualBlochScene();
      const wave1: SpinFlipWaveState = { active: true, startTime: 0, duration: 1.0, outcome: 1 };
      updateLaserStrand(elements1, 0.5, wave1);
      const colAttr1 = elements1.laserParticles.geometry.getAttribute('color');

      // Outcome 0 (emerald/cyan) vs Outcome 1 (magenta/red) must produce distinct green/red ratios
      const greenRatio0 = colAttr0.getY(60);
      const greenRatio1 = colAttr1.getY(60);
      expect(greenRatio0).toBeGreaterThan(greenRatio1);
    });
  });

  describe('computeSynchronizedAngles', () => {
    it('maintains entangled superposition angles when unmeasured', () => {
      const waveState: SpinFlipWaveState = { active: false, startTime: 0, duration: 1.2, outcome: 0 };
      const angles = computeSynchronizedAngles(Math.PI / 2, 0.5, null, waveState, 0);

      expect(angles.thetaA).toBeCloseTo(Math.PI / 2);
      expect(angles.thetaB).toBeCloseTo(Math.PI / 2);
      expect(angles.phiA).toBeCloseTo(0.5);
      expect(angles.phiB).toBeCloseTo(0.5);
    });

    it('synchronously collapses Alice and Bob to identical eigenstate |00⟩', () => {
      const waveState: SpinFlipWaveState = { active: false, startTime: 0, duration: 1.2, outcome: 0 };
      const angles = computeSynchronizedAngles(Math.PI / 2, 0, 0, waveState, 2.0);

      expect(angles.thetaA).toBeCloseTo(0);
      expect(angles.thetaB).toBeCloseTo(0);
    });

    it('synchronously collapses Alice and Bob to identical eigenstate |11⟩', () => {
      const waveState: SpinFlipWaveState = { active: false, startTime: 0, duration: 1.2, outcome: 1 };
      const angles = computeSynchronizedAngles(Math.PI / 2, 0, 1, waveState, 2.0);

      expect(angles.thetaA).toBeCloseTo(Math.PI);
      expect(angles.thetaB).toBeCloseTo(Math.PI);
    });
  });

  describe('React Component Rendering & Mission Condition', () => {
    it('renders null when currentMissionId is not mission-2 / entanglement', () => {
      useQuantumStore.setState({ currentMissionId: 'superposition' });
      const { container } = render(<EntanglementOverlay3D />);
      expect(container.firstChild).toBeNull();
    });

    it('renders dual Bloch viewport when currentMissionId === "mission-2"', () => {
      useQuantumStore.setState({ currentMissionId: 'mission-2' as unknown as 'superposition' });
      render(<EntanglementOverlay3D />);

      const overlay = screen.getByTestId('entanglement-overlay-3d');
      expect(overlay).toBeDefined();
      expect(screen.getByText('Qubit A (Alice)')).toBeDefined();
      expect(screen.getByText('Qubit B (Bob)')).toBeDefined();
      expect(screen.getByText(/Dual Bloch Viewport/i)).toBeDefined();
    });

    it('renders dual Bloch viewport when prop missionId="mission-2" is passed', () => {
      render(<EntanglementOverlay3D missionId="mission-2" />);
      expect(screen.getByTestId('entanglement-overlay-3d')).toBeDefined();
    });

    it('renders dual Bloch viewport when currentMissionId === "entanglement"', () => {
      useQuantumStore.setState({ currentMissionId: 'entanglement' });
      render(<EntanglementOverlay3D />);
      expect(screen.getByTestId('entanglement-overlay-3d')).toBeDefined();
    });
  });
});
