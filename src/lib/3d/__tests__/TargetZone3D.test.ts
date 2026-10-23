import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  isVectorInBlochTarget,
  isPhaseInTargetSector,
  isBarInTargetZone,
  createBlochTargetZoneMesh,
  createBarTargetZoneMesh,
  computeSphericalVector,
} from '../TargetZone3D';

describe('TargetZone3D - Spatial 3D Calculations & Meshes', () => {
  it('computes unit spherical vector from theta and phi', () => {
    // North pole |0⟩: θ = 0 -> (0, 1, 0)
    const v0 = computeSphericalVector(0, 0);
    expect(v0.x).toBeCloseTo(0, 4);
    expect(v0.y).toBeCloseTo(1, 4);
    expect(v0.z).toBeCloseTo(0, 4);

    // +X pole |+⟩: θ = π/2, φ = 0 -> (1, 0, 0)
    const vPlus = computeSphericalVector(Math.PI / 2, 0);
    expect(vPlus.x).toBeCloseTo(1, 4);
    expect(vPlus.y).toBeCloseTo(0, 4);
    expect(vPlus.z).toBeCloseTo(0, 4);
  });

  it('checks vector alignment with isVectorInBlochTarget using THREE.Vector3 instances', () => {
    const target = new THREE.Vector3(0, 1, 0);
    const alignedState = new THREE.Vector3(0.01, 0.999, 0).normalize();
    const distantState = new THREE.Vector3(1, 0, 0);

    expect(isVectorInBlochTarget(alignedState, target, 0.1)).toBe(true);
    expect(isVectorInBlochTarget(distantState, target, 0.1)).toBe(false);
  });

  it('checks vector alignment with isVectorInBlochTarget using spherical angles', () => {
    // Current at θ = π - 0.02 (near South pole), target at θ = π
    expect(isVectorInBlochTarget(Math.PI - 0.02, 0, Math.PI, 0, 0.1)).toBe(true);
    // Far away: θ = 0 vs target θ = π
    expect(isVectorInBlochTarget(0, 0, Math.PI, 0, 0.1)).toBe(false);
  });

  it('checks phase sector alignment with isPhaseInTargetSector', () => {
    expect(isPhaseInTargetSector(Math.PI + 0.02, Math.PI, 0.1)).toBe(true);
    expect(isPhaseInTargetSector(0, Math.PI, 0.1)).toBe(false);
  });

  it('checks amplitude bar height with isBarInTargetZone', () => {
    expect(isBarInTargetZone(1.5, 1.4)).toBe(true);
    expect(isBarInTargetZone(1.2, 1.4)).toBe(false);
  });

  it('creates and disposes Bloch target zone mesh cleanly', () => {
    const target = createBlochTargetZoneMesh(0, 0, 1.3, 0.32);
    expect(target.mesh).toBeInstanceOf(THREE.Mesh);
    expect(target.mesh.name).toBe('bloch-target-zone');

    target.updateAlignment(true);
    target.updateAlignment(false);
    expect(() => target.dispose()).not.toThrow();
  });

  it('creates and disposes Bar target zone mesh group cleanly', () => {
    const barTarget = createBarTargetZoneMesh(0, 1.5);
    expect(barTarget.group).toBeInstanceOf(THREE.Group);
    expect(barTarget.boxMesh).toBeInstanceOf(THREE.Mesh);

    barTarget.updateAlignment(true);
    expect(() => barTarget.dispose()).not.toThrow();
  });
});
