import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Mission01StateVector } from "../Mission01StateVector";
import { Mission02GateRotations } from "../Mission02GateRotations";
import { useQuantumStore } from "@/store/useQuantumStore";
import { useSpatialTelemetryBridge } from "@/hooks/useSpatialTelemetryBridge";

describe("Mission01StateVector - 3-Tier Canvas Shell & Telemetry", () => {
  beforeEach(() => {
    useQuantumStore.setState({
      currentMissionId: "superposition",
      theta: 0,
      phi: 0,
      lastOutcome: null,
      language: "en",
    });
    useSpatialTelemetryBridge.getState().clearFocus();
  });

  it("renders inside MissionCanvasShell with 3 standardized tiers", () => {
    render(<Mission01StateVector />);

    expect(screen.getByTestId("mission-canvas-shell")).toBeInTheDocument();
    expect(screen.getByTestId("tier-1-header")).toBeInTheDocument();
    expect(screen.getByTestId("tier-2-canvas-container")).toBeInTheDocument();
    expect(screen.getByTestId("tier-3-ribbon")).toBeInTheDocument();

    // Renders 3D CoreBlochSphere
    expect(screen.getByTestId("core-bloch-sphere")).toBeInTheDocument();

    // Replaced sliders: NO slider-theta or slider-phi
    expect(screen.queryByTestId("slider-theta")).toBeNull();
    expect(screen.queryByTestId("slider-phi")).toBeNull();
  });

  it("renders Dirac state vector formula and Born probabilities", () => {
    render(<Mission01StateVector />);

    expect(screen.getByTestId("state-vector-formula")).toBeInTheDocument();
    expect(screen.getByTestId("born-probabilities-readout")).toBeInTheDocument();
    expect(screen.getByTestId("state-vector-formula").textContent).toContain("|ψ⟩");
  });

  it("binds live HUD telemetry to useSpatialTelemetryBridge focus", () => {
    render(<Mission01StateVector />);

    // Initially no element focused
    expect(screen.queryByTestId("spatial-telemetry-card")).toBeNull();

    // Focus polar arc
    act(() => {
      useSpatialTelemetryBridge.getState().setActiveFocusId("bloch-polar-arc");
    });

    const card = screen.getByTestId("spatial-telemetry-card");
    expect(card).toBeInTheDocument();
    expect(card.textContent).toContain("Polar Arc (θ)");
    expect(card.textContent).toContain("\\theta");

    // Clear focus
    act(() => {
      useSpatialTelemetryBridge.getState().clearFocus();
    });
    expect(screen.queryByTestId("spatial-telemetry-card")).toBeNull();
  });

  it("supports zero-spoiler prediction lock and wave collapse measurement", () => {
    render(<Mission01StateVector />);

    const lockBtn = screen.getByTestId("lock-guess-button");
    expect(lockBtn).toBeInTheDocument();

    // Lock guess
    fireEvent.click(lockBtn);
    expect(screen.getByTestId("unlock-guess-button")).toBeInTheDocument();

    // Measure collapse
    const measureBtn = screen.getByTestId("measure-collapse-button");
    fireEvent.click(measureBtn);

    expect(useQuantumStore.getState().lastOutcome).not.toBeNull();
  });
});

describe("Mission02GateRotations - Dynamic Rotation Rings & Geodesic Arcs", () => {
  beforeEach(() => {
    useQuantumStore.setState({
      currentMissionId: "gates",
      theta: 0,
      phi: 0,
      lastOutcome: null,
      language: "en",
    });
    useSpatialTelemetryBridge.getState().clearFocus();
  });

  it("renders inside MissionCanvasShell with CoreBlochSphere and rotation rings", () => {
    render(<Mission02GateRotations />);

    expect(screen.getByTestId("mission-canvas-shell")).toBeInTheDocument();
    expect(screen.getByTestId("core-bloch-sphere")).toBeInTheDocument();
    expect(screen.getByTestId("gate-rotation-rings-hud")).toBeInTheDocument();

    // Replaced sliders: NO slider-theta or slider-phi
    expect(screen.queryByTestId("slider-theta")).toBeNull();
    expect(screen.queryByTestId("slider-phi")).toBeNull();
  });

  it("displays 2x2 unitary matrix and geodesic arc indicators", () => {
    render(<Mission02GateRotations />);

    expect(screen.getByTestId("gate-matrix-display")).toBeInTheDocument();
    expect(screen.getByTestId("geodesic-arc-indicator")).toBeInTheDocument();
  });

  it("applies gates via rotation ring buttons and updates state", () => {
    render(<Mission02GateRotations />);

    expect(useQuantumStore.getState().theta).toBe(0);

    // Click Hadamard ring
    const btnH = screen.getByTestId("rotation-ring-btn-H");
    fireEvent.click(btnH);

    expect(useQuantumStore.getState().theta).toBeCloseTo(Math.PI / 2, 2);
  });

  it("binds gate telemetry to useSpatialTelemetryBridge", () => {
    render(<Mission02GateRotations />);

    // Hover Pauli-X ring button
    const btnX = screen.getByTestId("rotation-ring-btn-X");
    fireEvent.mouseEnter(btnX);

    const card = screen.getByTestId("spatial-telemetry-card");
    expect(card).toBeInTheDocument();
    expect(card.textContent).toContain("Pauli-X");
    expect(card.textContent).toContain("\\hat{\\sigma}_x");

    fireEvent.mouseLeave(btnX);
    expect(screen.queryByTestId("spatial-telemetry-card")).toBeNull();
  });
});
