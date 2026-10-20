import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { render, fireEvent } from '@testing-library/react';
import React from 'react';
import {
  createBlochSphereScene,
  computeSphericalVector,
  vectorToSphericalAngles,
  updateBlochSphereUniforms,
  computePolarArcPositions,
  updatePolarArc,
  computeAzimuthalLinePositions,
  updateAzimuthalLine,
} from '@/features/quantum-core/blochSceneObjects';
import { useQuantumStore } from '@/store/useQuantumStore';
import { BlochViewport } from '@/features/quantum-core/BlochViewport';

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

  describe('Bloch Sphere Visual Contrast & Readability Enhancements', () => {
    it('initializes sphere wireframe with subtle dim color (0x1e293b), opacity 0.15, and depthWrite false', () => {
      const elements = createBlochSphereScene();
      const sphereMat = elements.sphere.material as THREE.MeshBasicMaterial;
      expect(sphereMat.color.getHex()).toBe(0x1e293b);
      expect(sphereMat.opacity).toBeGreaterThanOrEqual(0.12);
      expect(sphereMat.opacity).toBeLessThanOrEqual(0.15);
      expect(sphereMat.depthWrite).toBe(false);
      expect(sphereMat.transparent).toBe(true);
      expect(sphereMat.wireframe).toBe(true);
    });

    it('sets depthWrite false on equator ring and axes materials to prevent z-fighting', () => {
      const elements = createBlochSphereScene();
      const ringMat = elements.ring.material as THREE.MeshBasicMaterial;
      expect(ringMat.depthWrite).toBe(false);
      expect(ringMat.opacity).toBeLessThanOrEqual(0.2);

      const axesMat = elements.axes.material as THREE.LineBasicMaterial;
      expect(axesMat.depthWrite).toBe(false);
      expect(axesMat.opacity).toBeLessThanOrEqual(0.35);
    });

    it('creates polarArc with bright cyan (0x00f3ff), ~0.90 opacity, and depthWrite false', () => {
      const elements = createBlochSphereScene();
      expect(elements.polarArc).toBeDefined();
      expect(elements.polarArc.name).toBe('bloch-polar-arc');
      const mat = elements.polarArc.material;
      expect(mat.color.getHex()).toBe(0x00f3ff);
      expect(mat.opacity).toBeCloseTo(0.9, 1);
      expect(mat.depthWrite).toBe(false);
      expect(elements.geometries).toContain(elements.polarArc.geometry);
      expect(elements.materials).toContain(elements.polarArc.material);
    });

    it('creates azimuthalLine with electric yellow (0xffee00), opacity 1.0, linewidth 4, and depthWrite false', () => {
      const elements = createBlochSphereScene();
      expect(elements.azimuthalLine).toBeDefined();
      expect(elements.azimuthalLine.name).toBe('bloch-azimuthal-line');
      const mat = elements.azimuthalLine.material;
      expect(mat.color.getHex()).toBe(0xffee00);
      expect(mat.opacity).toBe(1.0);
      expect(mat.linewidth).toBe(4);
      expect(mat.depthWrite).toBe(false);
      expect(elements.geometries).toContain(elements.azimuthalLine.geometry);
      expect(elements.materials).toContain(elements.azimuthalLine.material);
    });

    it('updates gridAlpha and sphereColor cleanly via updateBlochSphereUniforms without resetting background', () => {
      const elements = createBlochSphereScene();
      updateBlochSphereUniforms(elements, {
        gridAlpha: 0.15,
        sphereColor: 0x1e293b,
        arrowColor: 0x00f3ff,
      });
      const sphereMat = elements.sphere.material as THREE.MeshBasicMaterial;
      expect(sphereMat.opacity).toBe(0.15);
      expect(sphereMat.color.getHex()).toBe(0x1e293b);
    });

    it('computes polar arc positions accurately without NaN', () => {
      const pos0 = computePolarArcPositions(0, 0, 1.3);
      expect(pos0.length).toBeGreaterThanOrEqual(6);
      expect(pos0.every((v) => Number.isFinite(v))).toBe(true);

      const posPi2 = computePolarArcPositions(Math.PI / 2, Math.PI / 4, 1.3);
      expect(posPi2.length).toBeGreaterThanOrEqual(6);
      expect(posPi2.every((v) => Number.isFinite(v))).toBe(true);

      const elements = createBlochSphereScene();
      updatePolarArc(elements.polarArc, Math.PI / 3, Math.PI / 2, 1.3);
      expect(elements.polarArc.geometry).toBeDefined();
    });

    it('computes azimuthal line projection positions accurately without NaN', () => {
      const pos = computeAzimuthalLinePositions(Math.PI / 4, Math.PI / 3, 1.3);
      expect(pos.length).toBe(12); // 4 3D points: [p0, p1, p2, p3]
      expect(pos.every((v) => Number.isFinite(v))).toBe(true);

      const elements = createBlochSphereScene();
      updateAzimuthalLine(elements.azimuthalLine, Math.PI / 4, Math.PI / 3, 1.3);
      expect(elements.azimuthalLine.geometry).toBeDefined();
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

  describe('Keyboard 3D Vector Manipulation (BlochViewport)', () => {
    beforeEach(() => {
      useQuantumStore.getState().resetState();
    });

    it('modifies polar angle theta with ArrowDown and ArrowUp', () => {
      render(React.createElement(BlochViewport));
      useQuantumStore.getState().setAngles(1.0, 0.0);

      fireEvent.keyDown(window, { key: 'ArrowDown' });
      expect(useQuantumStore.getState().theta).toBeCloseTo(1.08, 2);

      fireEvent.keyDown(window, { key: 'ArrowUp' });
      expect(useQuantumStore.getState().theta).toBeCloseTo(1.0, 2);
    });

    it('clamps theta between 0 and pi', () => {
      render(React.createElement(BlochViewport));
      useQuantumStore.getState().setAngles(0.04, 0.0);

      fireEvent.keyDown(window, { key: 'ArrowUp' });
      expect(useQuantumStore.getState().theta).toBe(0);

      useQuantumStore.getState().setAngles(Math.PI - 0.04, 0.0);
      fireEvent.keyDown(window, { key: 'ArrowDown' });
      expect(useQuantumStore.getState().theta).toBe(Math.PI);
    });

    it('rotates azimuthal angle phi with ArrowRight and ArrowLeft', () => {
      render(React.createElement(BlochViewport));
      useQuantumStore.getState().setAngles(Math.PI / 2, 1.0);

      fireEvent.keyDown(window, { key: 'ArrowRight' });
      expect(useQuantumStore.getState().phi).toBeCloseTo(1.08, 2);

      fireEvent.keyDown(window, { key: 'ArrowLeft' });
      expect(useQuantumStore.getState().phi).toBeCloseTo(1.0, 2);
    });

    it('applies quantum gates with H, X, Z keys', () => {
      render(React.createElement(BlochViewport));
      useQuantumStore.getState().setAngles(0, 0);

      fireEvent.keyDown(window, { key: 'h' });
      expect(useQuantumStore.getState().theta).toBeCloseTo(Math.PI / 2, 2);

      fireEvent.keyDown(window, { key: 'x' });
      expect(useQuantumStore.getState().theta).toBeCloseTo(Math.PI / 2, 2);

      useQuantumStore.getState().setAngles(0, 0);
      fireEvent.keyDown(window, { key: 'X' });
      expect(useQuantumStore.getState().theta).toBeCloseTo(Math.PI, 2);

      fireEvent.keyDown(window, { key: 'Z' });
      expect(useQuantumStore.getState().phi).toBeCloseTo(Math.PI, 2);
    });

    it('triggers measurement with Spacebar', () => {
      render(React.createElement(BlochViewport));
      useQuantumStore.getState().setAngles(0, 0);
      expect(useQuantumStore.getState().lastOutcome).toBeNull();

      fireEvent.keyDown(window, { key: ' ' });
      expect(useQuantumStore.getState().lastOutcome).toBe(0);
    });

    it('ignores keyboard navigation when target is INPUT or TEXTAREA', () => {
      render(React.createElement(BlochViewport));
      useQuantumStore.getState().setAngles(1.0, 1.0);

      const input = document.createElement('input');
      document.body.appendChild(input);

      fireEvent.keyDown(input, { key: 'ArrowDown' });
      expect(useQuantumStore.getState().theta).toBe(1.0);

      fireEvent.keyDown(input, { key: 'h' });
      expect(useQuantumStore.getState().theta).toBe(1.0);

      document.body.removeChild(input);
    });
  });
});
