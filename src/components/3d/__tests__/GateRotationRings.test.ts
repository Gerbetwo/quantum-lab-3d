import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  getGateRotationAxis,
  computeGeodesicArcPoints,
  createGateRingsGroup,
  createGeodesicParticleSystem,
} from '../GateRotationRings';

describe('GateRotationRings & Geodesic Particles', () => {
  it('returns unit rotation axis for X, Y, Z, and H', () => {
    const axisX = getGateRotationAxis('X');
    expect(axisX.x).toBe(1);
    expect(axisX.y).toBe(0);
    expect(axisX.z).toBe(0);

    const axisH = getGateRotationAxis('H');
    expect(axisH.length()).toBeCloseTo(1.0, 5);
    expect(axisH.x).toBeCloseTo(1 / Math.SQRT2, 5);
    expect(axisH.y).toBe(0);
    expect(axisH.z).toBeCloseTo(1 / Math.SQRT2, 5);
  });

  it('computes sampled geodesic arc points between two vectors', () => {
    const v1 = new THREE.Vector3(0, 1, 0); // North
    const v2 = new THREE.Vector3(0, -1, 0); // South
    const arc = computeGeodesicArcPoints(v1, v2, 16, 1.3);

    expect(arc).toHaveLength(17);
    expect(arc[0].length()).toBeCloseTo(1.3, 4);
    expect(arc[16].length()).toBeCloseTo(1.3, 4);
  });

  it('creates and disposes gate rotation rings group cleanly', () => {
    const { group, rings, dispose } = createGateRingsGroup(1.33);

    expect(group).toBeInstanceOf(THREE.Group);
    expect(rings.X).toBeDefined();
    expect(rings.Y).toBeDefined();
    expect(rings.Z).toBeDefined();
    expect(rings.H).toBeDefined();

    expect(() => dispose()).not.toThrow();
  });

  it('creates, triggers and updates geodesic particle system cleanly', () => {
    const { mesh, guideLine, triggerArc, update, dispose } = createGeodesicParticleSystem(50, 1.3);

    expect(mesh).toBeInstanceOf(THREE.InstancedMesh);
    expect(guideLine).toBeInstanceOf(THREE.Line);

    triggerArc(new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0));
    update(0.016);

    expect(() => dispose()).not.toThrow();
  });
});
