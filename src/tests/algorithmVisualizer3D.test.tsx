import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import * as THREE from 'three';
import {
  AlgorithmVisualizer3D,
  resolveAlgorithmType,
  createGroverBarScene,
  updateGroverBars,
  createShorWheelScene,
  updateShorWheelAnimation,
  createQECLatticeScene,
  updateQECLattice,
} from '@/features/missions/AlgorithmVisualizer3D';
import { useQuantumStore } from '@/store/useQuantumStore';

describe('3D Bar Graph & Syndrome Lattice Visualizers for Missions 4–6', () => {
  beforeEach(() => {
    useQuantumStore.setState({
      currentMissionId: 'grover',
      language: 'en',
    });
  });

  describe('resolveAlgorithmType (Mission ID Mapping)', () => {
    it('maps grover and mission-4 to grover', () => {
      expect(resolveAlgorithmType('grover')).toBe('grover');
      expect(resolveAlgorithmType('mission-4')).toBe('grover');
    });

    it('maps applications, shor, and mission-5 to shor', () => {
      expect(resolveAlgorithmType('applications')).toBe('shor');
      expect(resolveAlgorithmType('shor')).toBe('shor');
      expect(resolveAlgorithmType('mission-5')).toBe('shor');
    });

    it('maps error-correction, qec, and mission-6 to qec', () => {
      expect(resolveAlgorithmType('error-correction')).toBe('qec');
      expect(resolveAlgorithmType('qec')).toBe('qec');
      expect(resolveAlgorithmType('mission-6')).toBe('qec');
    });
  });

  describe('Grover 3D Bar Graph (Mission 4)', () => {
    it('creates 4 3D bar meshes for N=4 basis states', () => {
      const elements = createGroverBarScene(2);
      expect(elements.bars).toHaveLength(4);
      expect(elements.bars[0].position.x).toBeLessThan(elements.bars[1].position.x);
      expect(elements.bars[2].position.x).toBeLessThan(elements.bars[3].position.x);
    });

    it('updates bar heights and target highlights dynamically on amplitude amplification', () => {
      const elements = createGroverBarScene(2);
      // Step 1: amplified state at index 2
      const probs = [0.0, 0.0, 1.0, 0.0];
      updateGroverBars(elements, probs, 2);

      // Target bar at index 2 should have maximum height and emerald color
      expect(elements.bars[2].scale.y).toBeCloseTo(2.8);
      expect(elements.materials[2].color.getHex()).toBe(0x10b981);

      // Non-target bar at index 0 should have minimum height and muted color
      expect(elements.bars[0].scale.y).toBeCloseTo(0.08);
      expect(elements.materials[0].color.getHex()).toBe(0x334155);
    });
  });

  describe('Shor Periodicity Wheel (Mission 5)', () => {
    it('creates circular rotor with nodes matching period r', () => {
      const elements = createShorWheelScene(4);
      expect(elements.period).toBe(4);
      expect(elements.rotor).toBeInstanceOf(THREE.Mesh);
      expect(elements.nodes).toHaveLength(4);
      expect(elements.pulseBead).toBeInstanceOf(THREE.Mesh);
    });

    it('animates orbital bead revolving along the wheel trajectory', () => {
      const elements = createShorWheelScene(4);
      updateShorWheelAnimation(elements, 1.0);

      expect(elements.pulseBead.position.x).not.toBe(0);
      expect(elements.pulseBead.position.y).not.toBe(0);
      expect(elements.rotor.rotation.z).toBeCloseTo(0.2);
    });
  });

  describe('3-Qubit QEC Syndrome Lattice (Mission 6)', () => {
    it('creates 3 qubit nodes and 2 syndrome parity check links', () => {
      const elements = createQECLatticeScene(null);
      expect(elements.nodes).toHaveLength(3);
      expect(elements.links).toHaveLength(2);
      expect(elements.clearingBeam).toBeInstanceOf(THREE.Line);
    });

    it('triggers red flash error state on faulty qubit and pulses shockwave', () => {
      const elements = createQECLatticeScene(1);
      updateQECLattice(elements, 1, 0.5);

      const faultyMat = elements.nodes[1].material as THREE.MeshBasicMaterial;
      expect(faultyMat.color.getHex()).toBe(0xef4444);

      const cleanMat = elements.nodes[0].material as THREE.MeshBasicMaterial;
      expect(cleanMat.color.getHex()).toBe(0x10b981);
    });

    it('restores green clearing beam when lattice is clean or recovered', () => {
      const elements = createQECLatticeScene(null);
      updateQECLattice(elements, null, 1.0);

      const beamMat = elements.clearingBeam.material as THREE.LineBasicMaterial;
      expect(beamMat.opacity).toBeGreaterThan(0.7);

      for (const node of elements.nodes) {
        const mat = node.material as THREE.MeshBasicMaterial;
        expect(mat.color.getHex()).toBe(0x10b981);
      }
    });
  });

  describe('React Component Interactive Rendering', () => {
    it('renders Grover 3D visualizer and updates steps on click', () => {
      render(<AlgorithmVisualizer3D missionId="grover" />);
      expect(screen.getByTestId('algorithm-visualizer-3d')).toBeDefined();
      expect(screen.getByText(/Grover 3D Amplitude Amplification/i)).toBeDefined();

      const amplifyBtn = screen.getByRole('button', { name: /Apply Oracle \+ Diffusion/i });
      fireEvent.click(amplifyBtn);
      expect(screen.getByText(/Step 1\/2/i)).toBeDefined();
    });

    it('renders Shor periodicity wheel and updates base selection', () => {
      render(<AlgorithmVisualizer3D missionId="applications" />);
      expect(screen.getByTestId('algorithm-visualizer-3d')).toBeDefined();
      expect(screen.getByText(/Shor Periodicity Wheel/i)).toBeDefined();

      const base2Btn = screen.getByRole('button', { name: '2' });
      fireEvent.click(base2Btn);
      expect(screen.getByText(/N=15, a=2/i)).toBeDefined();
    });

    it('renders 3-Qubit QEC lattice and handles error injection and cleaning', () => {
      render(<AlgorithmVisualizer3D missionId="error-correction" />);
      expect(screen.getByTestId('algorithm-visualizer-3d')).toBeDefined();
      expect(screen.getByText(/3-Qubit Syndrome Lattice/i)).toBeDefined();

      const flipQ1Btn = screen.getByRole('button', { name: 'Flip q1' });
      fireEvent.click(flipQ1Btn);
      expect(screen.getByText(/Syndrome: \[1, 1\]/i)).toBeDefined();

      const cleanBtn = screen.getByRole('button', { name: 'Clean' });
      fireEvent.click(cleanBtn);
      expect(screen.getByText(/Syndrome: \[0, 0\]/i)).toBeDefined();
    });
  });
});
