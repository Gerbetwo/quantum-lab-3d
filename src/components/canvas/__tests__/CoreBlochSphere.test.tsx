import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import * as THREE from "three";
import {
  CoreBlochSphere,
  slerpUnitVectors,
  interpolatePoleSlerp,
} from "../CoreBlochSphere";
import { useQuantumStore } from "@/store/useQuantumStore";

describe("CoreBlochSphere - Slerp & Pole Contact Utilities", () => {
  it("interpolates unit vectors with slerpUnitVectors", () => {
    const v1 = new THREE.Vector3(1, 0, 0);
    const v2 = new THREE.Vector3(0, 1, 0);

    // Halfway slerp (t = 0.5) between X and Y should point to (1/√2, 1/√2, 0)
    const mid = slerpUnitVectors(v1, v2, 0.5);
    expect(mid.x).toBeCloseTo(Math.SQRT1_2, 4);
    expect(mid.y).toBeCloseTo(Math.SQRT1_2, 4);
    expect(mid.z).toBeCloseTo(0, 4);
    expect(mid.length()).toBeCloseTo(1, 5);

    // Endpoint checks
    const start = slerpUnitVectors(v1, v2, 0);
    expect(start.x).toBeCloseTo(1, 5);
    expect(start.y).toBeCloseTo(0, 5);

    const end = slerpUnitVectors(v1, v2, 1);
    expect(end.x).toBeCloseTo(0, 5);
    expect(end.y).toBeCloseTo(1, 5);
  });

  it("handles identical or near-parallel vectors safely", () => {
    const v1 = new THREE.Vector3(0, 1, 0);
    const v2 = new THREE.Vector3(0, 1, 0);
    const res = slerpUnitVectors(v1, v2, 0.5);
    expect(res.y).toBeCloseTo(1, 5);
  });

  it("handles opposite vectors safely", () => {
    const v1 = new THREE.Vector3(0, 1, 0);
    const v2 = new THREE.Vector3(0, -1, 0);
    const res = slerpUnitVectors(v1, v2, 0.5);
    expect(res.length()).toBeCloseTo(1, 4);
  });

  it("detects when vector is far from poles (no pole contact)", () => {
    // Equator vector (|0⟩ + |1⟩)/√2 -> theta = π/2
    const equatorVec = new THREE.Vector3(1.3, 0, 0);
    const res = interpolatePoleSlerp(equatorVec, 1.3, 0.16);

    expect(res.isContact).toBe(false);
    expect(res.pole).toBeNull();
    expect(res.theta).toBeCloseTo(Math.PI / 2, 4);
  });

  it("applies Slerp smoothing when approaching north pole contact threshold", () => {
    // Near north pole: angle ~ 0.08 rad (< threshold 0.16)
    const angle = 0.08;
    const nearNorth = new THREE.Vector3(
      1.3 * Math.sin(angle),
      1.3 * Math.cos(angle),
      0
    );

    const res = interpolatePoleSlerp(nearNorth, 1.3, 0.16);
    expect(res.isContact).toBe(true);
    expect(res.pole).toBe("north");
    // Slerped angle should be smaller than raw angle, pulled toward pole (0 rad)
    expect(res.theta).toBeLessThan(angle);
    expect(res.vector.length()).toBeCloseTo(1.3, 4);
  });

  it("snaps cleanly to exact north pole |0⟩ when within snap threshold", () => {
    const angle = 0.02; // < snap threshold 0.035
    const tinyNorth = new THREE.Vector3(
      1.3 * Math.sin(angle),
      1.3 * Math.cos(angle),
      0
    );

    const res = interpolatePoleSlerp(tinyNorth, 1.3, 0.16);
    expect(res.isContact).toBe(true);
    expect(res.pole).toBe("north");
    expect(res.theta).toBe(0);
    expect(res.vector.y).toBeCloseTo(1.3, 5);
  });

  it("applies Slerp smoothing when approaching south pole contact threshold", () => {
    // Near south pole: angle from south ~ 0.08 rad
    const theta = Math.PI - 0.08;
    const nearSouth = new THREE.Vector3(
      1.3 * Math.sin(theta),
      1.3 * Math.cos(theta),
      0
    );

    const res = interpolatePoleSlerp(nearSouth, 1.3, 0.16);
    expect(res.isContact).toBe(true);
    expect(res.pole).toBe("south");
    // Slerped angle should be closer to π than raw angle
    expect(Math.PI - res.theta).toBeLessThan(0.08);
  });

  it("snaps cleanly to exact south pole |1⟩ when within snap threshold", () => {
    const theta = Math.PI - 0.02;
    const tinySouth = new THREE.Vector3(
      1.3 * Math.sin(theta),
      1.3 * Math.cos(theta),
      0
    );

    const res = interpolatePoleSlerp(tinySouth, 1.3, 0.16);
    expect(res.isContact).toBe(true);
    expect(res.pole).toBe("south");
    expect(res.theta).toBe(Math.PI);
    expect(res.vector.y).toBeCloseTo(-1.3, 5);
  });
});

describe("CoreBlochSphere - Component Rendering", () => {
  beforeEach(() => {
    useQuantumStore.setState({
      theta: 0,
      phi: 0,
      theme: "dark",
    });
  });

  it("renders canvas container and pole HUD markers", () => {
    render(<CoreBlochSphere showPoleLabels />);

    expect(screen.getByTestId("core-bloch-sphere")).toBeInTheDocument();
    expect(screen.getByTestId("north-pole-label")).toBeInTheDocument();
    expect(screen.getByTestId("south-pole-label")).toBeInTheDocument();
  });

  it("renders custom children overlays inside container", () => {
    render(
      <CoreBlochSphere>
        <div data-testid="custom-child-hud">Custom HUD Overlay</div>
      </CoreBlochSphere>
    );

    expect(screen.getByTestId("custom-child-hud")).toBeInTheDocument();
  });
});
