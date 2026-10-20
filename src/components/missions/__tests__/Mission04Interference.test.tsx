import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Mission04Interference } from "../Mission04Interference";
import { useQuantumStore } from "@/store/useQuantumStore";
import { useSpatialTelemetryBridge } from "@/hooks/useSpatialTelemetryBridge";

describe("Mission04Interference - Dual-Path Interferometer & Complex Phase Disk", () => {
  beforeEach(() => {
    useQuantumStore.setState({
      currentMissionId: "gates",
      theta: Math.PI / 2,
      phi: 0,
      language: "en",
    });
    useSpatialTelemetryBridge.getState().clearFocus();
  });

  it("renders inside MissionCanvasShell with 3 standardized tiers", () => {
    render(<Mission04Interference />);

    expect(screen.getByTestId("mission-canvas-shell")).toBeInTheDocument();
    expect(screen.getByTestId("tier-1-header")).toBeInTheDocument();
    expect(screen.getByTestId("tier-2-canvas-container")).toBeInTheDocument();
    expect(screen.getByTestId("tier-3-ribbon")).toBeInTheDocument();

    // Renders 3D CoreBlochSphere
    expect(screen.getByTestId("core-bloch-sphere")).toBeInTheDocument();

    // Replaced sliders: NO slider-theta
    expect(screen.queryByTestId("slider-theta")).toBeNull();
  });

  it("displays the interactive complex phase disk and interference formulas", () => {
    render(<Mission04Interference />);

    expect(screen.getByTestId("complex-phase-disk")).toBeInTheDocument();
    expect(screen.getByTestId("interference-state-formula")).toBeInTheDocument();
    expect(screen.getByTestId("interference-state-formula").textContent).toContain("|ψ⟩ = 1/√2");

    // At φ = 0: Constructive 100%, Destructive 0%
    expect(screen.getByTestId("p-constructive")).toHaveTextContent("100.0%");
    expect(screen.getByTestId("p-destructive")).toHaveTextContent("0.0%");
    expect(screen.getByTestId("interference-regime-tag")).toHaveTextContent("CONSTRUCTIVE MAXIMUM");
  });

  it("updates interference probabilities when relative phase φ changes via slider", () => {
    render(<Mission04Interference />);

    const slider = screen.getByTestId("phase-slider");
    // Change to φ = π (3.14159...)
    fireEvent.change(slider, { target: { value: Math.PI.toString() } });

    expect(screen.getByTestId("p-constructive")).toHaveTextContent("0.0%");
    expect(screen.getByTestId("p-destructive")).toHaveTextContent("100.0%");
    expect(screen.getByTestId("interference-regime-tag")).toHaveTextContent("DESTRUCTIVE MINIMUM / NODE");
  });

  it("updates phase through preset buttons", () => {
    render(<Mission04Interference />);

    // Click on π/2 preset
    const presetHalf = screen.getByRole("button", { name: /^π\/2/i });
    fireEvent.click(presetHalf);

    expect(useQuantumStore.getState().phi).toBeCloseTo(Math.PI / 2, 2);
    expect(screen.getByTestId("p-constructive")).toHaveTextContent("50.0%");
    expect(screen.getByTestId("p-destructive")).toHaveTextContent("50.0%");
    expect(screen.getByTestId("interference-regime-tag")).toHaveTextContent("PARTIAL INTERFERENCE");
  });

  it("binds spatial telemetry bridge to focused elements", () => {
    render(<Mission04Interference />);

    // Initially no element focused
    expect(screen.queryByTestId("spatial-telemetry-card")).toBeNull();

    // Focus phase-shifter
    act(() => {
      useSpatialTelemetryBridge.getState().setActiveFocusId("phase-shifter");
    });

    const card = screen.getByTestId("spatial-telemetry-card");
    expect(card).toBeInTheDocument();
    expect(card.textContent).toContain("Optical Phase Shifter");
    expect(card.textContent).toContain("U(φ)");

    // Focus interference-detector
    act(() => {
      useSpatialTelemetryBridge.getState().setActiveFocusId("interference-detector");
    });
    expect(screen.getByTestId("spatial-telemetry-card").textContent).toContain("Interference Detector Target");
    expect(screen.getByTestId("spatial-telemetry-card").textContent).toContain("I(φ)");

    // Focus complex-amplitude-disk
    act(() => {
      useSpatialTelemetryBridge.getState().setActiveFocusId("complex-amplitude-disk");
    });
    expect(screen.getByTestId("spatial-telemetry-card").textContent).toContain("Complex Amplitude Addition");
  });
});
