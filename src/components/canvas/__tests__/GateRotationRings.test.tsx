import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as THREE from "three";
import {
  GateRotationRings,
  getGateRotationAxis,
  computeGeodesicArcPoints,
  createGateRingsGroup,
  createGeodesicParticleSystem,
} from "../GateRotationRings";
import { useQuantumStore } from "@/store/useQuantumStore";
import { useSpatialTelemetryBridge } from "@/hooks/useSpatialTelemetryBridge";

describe("GateRotationRings - Mathematical Utilities & Scene Builders", () => {
  it("computes accurate rotation axes for X, Y, Z, and H ((X+Z)/√2)", () => {
    const axisX = getGateRotationAxis("X");
    expect(axisX.x).toBeCloseTo(1, 5);
    expect(axisX.y).toBeCloseTo(0, 5);
    expect(axisX.z).toBeCloseTo(0, 5);

    const axisY = getGateRotationAxis("Y");
    expect(axisY.x).toBeCloseTo(0, 5);
    expect(axisY.y).toBeCloseTo(1, 5);
    expect(axisY.z).toBeCloseTo(0, 5);

    const axisZ = getGateRotationAxis("Z");
    expect(axisZ.x).toBeCloseTo(0, 5);
    expect(axisZ.y).toBeCloseTo(0, 5);
    expect(axisZ.z).toBeCloseTo(1, 5);

    const axisH = getGateRotationAxis("H");
    expect(axisH.x).toBeCloseTo(Math.SQRT1_2, 5);
    expect(axisH.y).toBeCloseTo(0, 5);
    expect(axisH.z).toBeCloseTo(Math.SQRT1_2, 5);
    expect(axisH.length()).toBeCloseTo(1, 5);
  });

  it("computes geodesic arc points along great circle connecting two vectors", () => {
    const start = new THREE.Vector3(1, 0, 0);
    const target = new THREE.Vector3(0, 1, 0);
    const radius = 1.3;

    const points = computeGeodesicArcPoints(start, target, 8, radius);
    expect(points.length).toBe(9);

    // Start point
    expect(points[0].x).toBeCloseTo(radius, 4);
    expect(points[0].y).toBeCloseTo(0, 4);

    // End point
    expect(points[8].x).toBeCloseTo(0, 4);
    expect(points[8].y).toBeCloseTo(radius, 4);

    // Midpoint (index 4) should be at 45 degrees
    expect(points[4].x).toBeCloseTo(radius * Math.SQRT1_2, 3);
    expect(points[4].y).toBeCloseTo(radius * Math.SQRT1_2, 3);

    // All points must lie on sphere surface with radius 1.3
    points.forEach((pt) => {
      expect(pt.length()).toBeCloseTo(radius, 4);
    });
  });

  it("creates 3D rotation rings group for X, Y, Z, and H", () => {
    const { group, rings, dispose } = createGateRingsGroup(1.33);

    expect(group.children.length).toBe(4);
    expect(rings.X).toBeDefined();
    expect(rings.Y).toBeDefined();
    expect(rings.Z).toBeDefined();
    expect(rings.H).toBeDefined();

    expect(rings.X.name).toBe("gate-ring-x");
    expect(rings.H.name).toBe("gate-ring-h");

    expect(rings.X.userData.spatialId).toBe("gate-axis-x");
    expect(rings.H.userData.spatialId).toBe("gate-axis-h");

    dispose();
  });

  it("creates and animates geodesic particle system", () => {
    const particles = createGeodesicParticleSystem(50, 1.3);

    expect(particles.mesh).toBeDefined();
    expect(particles.guideLine).toBeDefined();
    expect(particles.mesh.count).toBe(0);

    const start = new THREE.Vector3(0, 1.3, 0);
    const target = new THREE.Vector3(1.3, 0, 0);

    particles.triggerArc(start, target, 0x00f3ff);
    expect(particles.mesh.count).toBe(50);

    // Progress animation frame
    particles.update(0.1);
    expect(particles.mesh.count).toBe(50);

    // Progress beyond duration -> resets
    particles.update(0.7);
    expect(particles.mesh.count).toBe(0);

    particles.dispose();
  });
});

describe("GateRotationRings - Component Interaction", () => {
  beforeEach(() => {
    useQuantumStore.setState({
      theta: 0,
      phi: 0,
    });
    useSpatialTelemetryBridge.getState().clearFocus();
  });

  it("renders rotation ring buttons for X, Y, Z, H", () => {
    render(<GateRotationRings />);

    expect(screen.getByTestId("rotation-ring-btn-X")).toBeInTheDocument();
    expect(screen.getByTestId("rotation-ring-btn-Y")).toBeInTheDocument();
    expect(screen.getByTestId("rotation-ring-btn-Z")).toBeInTheDocument();
    expect(screen.getByTestId("rotation-ring-btn-H")).toBeInTheDocument();
  });

  it("applies quantum gate and fires callback when ring button is clicked", () => {
    const onGateSelect = vi.fn();
    render(<GateRotationRings onGateSelect={onGateSelect} />);

    // Initial state |0⟩ (theta=0)
    expect(useQuantumStore.getState().theta).toBe(0);

    // Click Hadamard ring
    fireEvent.click(screen.getByTestId("rotation-ring-btn-H"));
    expect(onGateSelect).toHaveBeenCalledWith("H");
    expect(useQuantumStore.getState().theta).toBeCloseTo(Math.PI / 2, 2);

    // Click Pauli-X ring
    fireEvent.click(screen.getByTestId("rotation-ring-btn-X"));
    expect(onGateSelect).toHaveBeenCalledWith("X");
  });

  it("binds spatial telemetry ID on hover and clears on mouse leave", () => {
    render(<GateRotationRings />);

    const btnH = screen.getByTestId("rotation-ring-btn-H");

    fireEvent.mouseEnter(btnH);
    expect(useSpatialTelemetryBridge.getState().activeFocusId).toBe("gate-axis-h");

    fireEvent.mouseLeave(btnH);
    expect(useSpatialTelemetryBridge.getState().activeFocusId).toBeNull();
  });
});
