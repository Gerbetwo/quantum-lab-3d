import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Mission07GroverSearch } from "../Mission07GroverSearch";
import { useQuantumStore } from "@/store/useQuantumStore";
import { useSpatialTelemetryBridge } from "@/hooks/useSpatialTelemetryBridge";

describe("Mission07GroverSearch - 3D Amplitude Bar Graph & Mean-Reflection Plane", () => {
  beforeEach(() => {
    useQuantumStore.setState({
      currentMissionId: "grover",
      theta: Math.PI / 2,
      phi: 0,
      lastOutcome: null,
      language: "en",
    });
    useSpatialTelemetryBridge.getState().clearFocus();
  });

  it("renders inside MissionCanvasShell with 3 tiers and 3D grover bar viewport", () => {
    render(<Mission07GroverSearch />);

    expect(screen.getByTestId("mission-canvas-shell")).toBeInTheDocument();
    expect(screen.getByTestId("tier-1-header")).toBeInTheDocument();
    expect(screen.getByTestId("tier-2-canvas-container")).toBeInTheDocument();
    expect(screen.getByTestId("tier-3-ribbon")).toBeInTheDocument();
    expect(screen.getByTestId("grover-bar-viewport")).toBeInTheDocument();
  });

  it("displays initial equal superposition telemetry: P(target) = 25% and ⟨a_mean⟩ = 0.500", () => {
    render(<Mission07GroverSearch />);

    expect(screen.getByTestId("target-probability-readout")).toHaveTextContent("25.0%");
    expect(screen.getByTestId("multiplier-badge")).toHaveTextContent("1.0× Baseline");
    expect(screen.getByTestId("mean-amplitude-readout")).toHaveTextContent("0.500");
    expect(screen.getByTestId("grover-formula-card")).toHaveTextContent(
      "|ψ₀⟩ = 1/2 (|00⟩ + |01⟩ + |10⟩ + |11⟩)"
    );
  });

  it("allows selecting a new Oracle target state via target selector buttons", () => {
    render(<Mission07GroverSearch />);

    // Click target |01⟩ (index 1)
    const target1Btn = screen.getByTestId("target-selector-1");
    fireEvent.click(target1Btn);

    // Initial equal probability for the new target
    expect(screen.getByTestId("target-probability-readout")).toHaveTextContent("25.0%");
    expect(screen.getByTestId("basis-card-1")).toHaveTextContent("+0.50");
  });

  it("inverts target amplitude below zero and lowers mean line ⟨a_mean⟩ to 0.250 on Oracle step", () => {
    render(<Mission07GroverSearch />);

    const invertBtn = screen.getByTestId("oracle-inversion-button");
    fireEvent.click(invertBtn);

    // Target amplitude is flipped to -0.50
    expect(screen.getByTestId("basis-card-2")).toHaveTextContent("-0.50");

    // Mean plane drops from 0.500 to 0.250
    expect(screen.getByTestId("mean-amplitude-readout")).toHaveTextContent("0.250");
    expect(screen.getByTestId("grover-formula-card")).toHaveTextContent("flipped to negative");
  });

  it("amplifies target state to 100% (4.0× baseline) on Diffusion inversion-about-the-mean step", () => {
    render(<Mission07GroverSearch />);

    // Step 1: Invert
    const invertBtn = screen.getByTestId("oracle-inversion-button");
    fireEvent.click(invertBtn);

    // Step 2: Amplify
    const amplifyBtn = screen.getByTestId("diffusion-amplify-button");
    fireEvent.click(amplifyBtn);

    // Target probability amplified to 100%
    expect(screen.getByTestId("target-probability-readout")).toHaveTextContent("100.0%");
    expect(screen.getByTestId("multiplier-badge")).toHaveTextContent("4.0× Baseline");
    expect(screen.getByTestId("basis-card-2")).toHaveTextContent("+1.00");
    expect(screen.getByTestId("basis-card-0")).toHaveTextContent("+0.00");
    expect(screen.getByTestId("basis-card-1")).toHaveTextContent("+0.00");
    expect(screen.getByTestId("basis-card-3")).toHaveTextContent("+0.00");
  });

  it("collapses wavefunction to found target state and displays speedup banner on measurement", () => {
    render(<Mission07GroverSearch />);

    // Run invert and amplify
    fireEvent.click(screen.getByTestId("oracle-inversion-button"));
    fireEvent.click(screen.getByTestId("diffusion-amplify-button"));

    // Step 3: Measure
    const measureBtn = screen.getByTestId("measure-button");
    fireEvent.click(measureBtn);

    const outcomeBanner = screen.getByTestId("grover-outcome-banner");
    expect(outcomeBanner).toBeInTheDocument();
    expect(outcomeBanner).toHaveTextContent("Found Target: |10⟩");
    expect(outcomeBanner).toHaveTextContent("O(√N) SPEEDUP");
    expect(useQuantumStore.getState().lastOutcome).toBe(1);
  });

  it("binds spatial telemetry bridge to focused elements and mean reflection plane", () => {
    render(<Mission07GroverSearch />);

    expect(screen.queryByTestId("spatial-telemetry-card")).toBeNull();

    // Hover on basis card
    fireEvent.mouseEnter(screen.getByTestId("basis-card-0"));
    const telemetryCard = screen.getByTestId("spatial-telemetry-card");
    expect(telemetryCard).toBeInTheDocument();
    expect(telemetryCard.textContent).toContain("State Amplitude Bar");

    // Focus mean reflection plane
    act(() => {
      useSpatialTelemetryBridge.getState().setActiveFocusId("mean-reflection-plane");
    });
    expect(screen.getByTestId("spatial-telemetry-card").textContent).toContain("Mean Reflection Plane");
    expect(screen.getByTestId("spatial-telemetry-card").textContent).toContain("⟨a⟩");
  });
});
