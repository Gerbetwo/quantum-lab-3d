import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  createBlochSphereScene,
  computeSphericalVector,
  vectorToSphericalAngles,
  updateBlochSphereUniforms,
} from '@/features/quantum-core/blochSceneObjects';
import { useQuantumStore } from '@/store/useQuantumStore';

describe('Bloch State Vector Tip Handle & Raycasting Kinematics', () => {
  describe('vectorToSphericalAngles (Spherical Inverse Kinematics)', () => {
    it('computes North Pole |0⟩ (theta=0, phi=0)', () => {
      const v = new THREE.Vector3(0, 1.3, 0);
      const { theta, phi } = vectorToSphericalAngles(v);
      expect(theta).toBeCloseTo(0);
      expect(phi).toBeCloseTo(0);
    });

    it('computes South Pole |1⟩ (theta=pi, phi=0)', () => {
      const v = new THREE.Vector3(0, -1.3, 0);
      const { theta, phi } = vectorToSphericalAngles(v);
      expect(theta).toBeCloseTo(Math.PI);
      expect(phi).toBeCloseTo(0);
    });

    it('computes Equator cardinal state |+⟩ (theta=pi/2, phi=0)', () => {
      const v = new THREE.Vector3(1.3, 0, 0);
      const { theta, phi } = vectorToSphericalAngles(v);
      expect(theta).toBeCloseTo(Math.PI / 2);
      expect(phi).toBeCloseTo(0);
    });

    it('computes Equator cardinal state |+i⟩ (theta=pi/2, phi=pi/2)', () => {
      const v = new THREE.Vector3(0, 0, 1.3);
      const { theta, phi } = vectorToSphericalAngles(v);
      expect(theta).toBeCloseTo(Math.PI / 2);
      expect(phi).toBeCloseTo(Math.PI / 2);
    });

    it('computes Equator cardinal state |-⟩ (theta=pi/2, phi=pi)', () => {
      const v = new THREE.Vector3(-1.3, 0, 0);
      const { theta, phi } = vectorToSphericalAngles(v);
      expect(theta).toBeCloseTo(Math.PI / 2);
      expect(phi).toBeCloseTo(Math.PI);
    });

    it('computes Equator cardinal state |-i⟩ (theta=pi/2, phi=3pi/2)', () => {
      const v = new THREE.Vector3(0, 0, -1.3);
      const { theta, phi } = vectorToSphericalAngles(v);
      expect(theta).toBeCloseTo(Math.PI / 2);
      expect(phi).toBeCloseTo((3 * Math.PI) / 2);
    });

    it('faithfully preserves roundtrip with computeSphericalVector', () => {
      const testCases = [
        { theta: 0.35, phi: 1.2 },
        { theta: 1.1, phi: 3.4 },
        { theta: 2.5, phi: 5.6 },
        { theta: Math.PI / 3, phi: Math.PI / 4 },
      ];

      for (const tc of testCases) {
        const v = computeSphericalVector(tc.theta, tc.phi);
        const res = vectorToSphericalAngles(v);
        expect(res.theta).toBeCloseTo(tc.theta, 4);
        expect(res.phi).toBeCloseTo(tc.phi, 4);
      }
    });

    it('safely handles degenerate zero vectors without NaN', () => {
      const v = new THREE.Vector3(0, 0, 0);
      const res = vectorToSphericalAngles(v);
      expect(res.theta).toBe(0);
      expect(res.phi).toBe(0);
    });
  });

  describe('createBlochSphereScene & Tip Handle Elements', () => {
    it('creates tipHandle mesh at initial North pole position', () => {
      const elements = createBlochSphereScene();
      expect(elements.tipHandle).toBeDefined();
      expect(elements.tipHandle).toBeInstanceOf(THREE.Mesh);
      expect(elements.tipHandle.name).toBe('bloch-vector-tip-handle');
      expect(elements.tipHandle.position.x).toBeCloseTo(0);
      expect(elements.tipHandle.position.y).toBeCloseTo(1.3);
      expect(elements.tipHandle.position.z).toBeCloseTo(0);
    });

    it('registers tipHandle geometry and material for disposal', () => {
      const elements = createBlochSphereScene();
      expect(elements.geometries).toContain(elements.tipHandle.geometry);
      expect(elements.materials).toContain(elements.tipHandle.material);
    });

    it('updates tipHandle color when arrowColor is modified', () => {
      const elements = createBlochSphereScene();
      updateBlochSphereUniforms(elements, { arrowColor: 0xa855f7 });
      const mat = elements.tipHandle.material as THREE.MeshBasicMaterial;
      expect(mat.color.getHex()).toBe(0xa855f7);
    });
  });

  describe('Dynamic Angle Sync with Quantum Store', () => {
    it('updates theta and phi in useQuantumStore dynamically as simulated drag updates', () => {
      useQuantumStore.getState().resetState();

      // Drag to |+> state
      const hitPoint = new THREE.Vector3(1.3, 0, 0);
      const angles = vectorToSphericalAngles(hitPoint);
      useQuantumStore.getState().setAngles(angles.theta, angles.phi);

      const state = useQuantumStore.getState();
      expect(state.theta).toBeCloseTo(Math.PI / 2);
      expect(state.phi).toBeCloseTo(0);

      // Verify Dirac probability amplitudes are synced
      const alpha = Math.cos(state.theta / 2);
      const beta = Math.sin(state.theta / 2);
      expect(alpha).toBeCloseTo(Math.SQRT1_2);
      expect(beta).toBeCloseTo(Math.SQRT1_2);
    });
  });
});
