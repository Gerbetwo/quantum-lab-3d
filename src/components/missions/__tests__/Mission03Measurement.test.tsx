import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Mission03Measurement } from "../Mission03Measurement";
import { useQuantumStore } from "@/store/useQuantumStore";
import { useSpatialTelemetryBridge } from "@/hooks/useSpatialTelemetryBridge";

describe("Mission03Measurement - Measurement Chamber, Collapse Ray & 3D Histogram", () => {
  beforeEach(() => {
    useQuantumStore.setState({
      currentMissionId: "superposition",
      theta: Math.PI / 2, // equal superposition for 50/50 tests
      phi: 0,
      lastOutcome: null,
      language: "en",
    });
    useSpatialTelemetryBridge.getState().clearFocus();
  });

  it("renders inside MissionCanvasShell with 3 standardized tiers and NO 2D sliders", () => {
    render(<Mission03Measurement />);

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
    render(<Mission03Measurement />);

    expect(screen.getByTestId("state-vector-formula")).toBeInTheDocument();
    expect(screen.getByTestId("born-probabilities-readout")).toBeInTheDocument();
    expect(screen.getByTestId("state-vector-formula").textContent).toContain("|ψ⟩");
    expect(screen.getByTestId("born-probabilities-readout").textContent).toContain("P(|0⟩): 50.0%");
    expect(screen.getByTestId("born-probabilities-readout").textContent).toContain("P(|1⟩): 50.0%");
  });

  it("displays 3D sampling statistics scoreboard", () => {
    render(<Mission03Measurement />);

    expect(screen.getByTestId("total-shots-counter")).toHaveTextContent("0");
    expect(screen.getByTestId("outcome-0-count")).toHaveTextContent("0");
    expect(screen.getByTestId("outcome-1-count")).toHaveTextContent("0");
  });

  it("executes single-shot measurement and increments shot counter", () => {
    render(<Mission03Measurement />);

    const singleShotBtn = screen.getByTestId("single-shot-button");
    fireEvent.click(singleShotBtn);

    expect(screen.getByTestId("total-shots-counter")).toHaveTextContent("1");
    expect(useQuantumStore.getState().lastOutcome).not.toBeNull();
  });

  it("supports batch stochastic sampling (+10 shots and +50 shots)", () => {
    render(<Mission03Measurement />);

    const batch10Btn = screen.getByTestId("batch-10-button");
    fireEvent.click(batch10Btn);
    expect(screen.getByTestId("total-shots-counter")).toHaveTextContent("10");

    const batch50Btn = screen.getByTestId("batch-50-button");
    fireEvent.click(batch50Btn);
    expect(screen.getByTestId("total-shots-counter")).toHaveTextContent("60");

    // Reset histogram
    const resetBtn = screen.getByTestId("reset-histogram-button");
    fireEvent.click(resetBtn);
    expect(screen.getByTestId("total-shots-counter")).toHaveTextContent("0");
  });

  it("binds spatial telemetry bridge to focused elements", () => {
    render(<Mission03Measurement />);

    // Initially no element focused
    expect(screen.queryByTestId("spatial-telemetry-card")).toBeNull();

    // Focus measurement chamber
    act(() => {
      useSpatialTelemetryBridge.getState().setActiveFocusId("measurement-chamber");
    });

    const card = screen.getByTestId("spatial-telemetry-card");
    expect(card).toBeInTheDocument();
    expect(card.textContent).toContain("Measurement Chamber");
    expect(card.textContent).toContain("M̂");

    // Focus collapse ray
    act(() => {
      useSpatialTelemetryBridge.getState().setActiveFocusId("collapse-ray");
    });
    expect(card.textContent).toContain("Wavefunction Collapse Ray");

    // Clear focus
    act(() => {
      useSpatialTelemetryBridge.getState().clearFocus();
    });
    expect(screen.queryByTestId("spatial-telemetry-card")).toBeNull();
  });
});
