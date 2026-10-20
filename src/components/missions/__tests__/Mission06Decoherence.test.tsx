import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Mission06Decoherence } from "../Mission06Decoherence";
import { useQuantumStore } from "@/store/useQuantumStore";
import { useSpatialTelemetryBridge } from "@/hooks/useSpatialTelemetryBridge";

describe("Mission06Decoherence - Cryogenic Decoherence & Noise Simulation", () => {
  beforeEach(() => {
    useQuantumStore.setState({
      currentMissionId: "decoherence",
      theta: Math.PI / 2,
      phi: 0,
      temperatureK: 0.015,
      lastOutcome: null,
      language: "en",
    });
    useSpatialTelemetryBridge.getState().clearFocus();
  });

  it("renders inside MissionCanvasShell with 3 tiers and decoherence viewport", () => {
    render(<Mission06Decoherence />);

    expect(screen.getByTestId("mission-canvas-shell")).toBeInTheDocument();
    expect(screen.getByTestId("tier-1-header")).toBeInTheDocument();
    expect(screen.getByTestId("tier-2-canvas-container")).toBeInTheDocument();
    expect(screen.getByTestId("tier-3-ribbon")).toBeInTheDocument();
    expect(screen.getByTestId("decoherence-viewport")).toBeInTheDocument();
  });

  it("displays cryogenic baseline telemetry and target locked status at 15 mK", () => {
    render(<Mission06Decoherence />);

    const t2 = screen.getByTestId("t2-readout");
    expect(parseFloat(t2.textContent || "0")).toBeGreaterThan(240);

    const targetBadge = screen.getByTestId("target-alignment-badge");
    expect(targetBadge).toHaveTextContent("CRYO COHERENT");
  });

  it("degrades coherence time and flags thermal noise when heating to 300 K", () => {
    render(<Mission06Decoherence />);

    const preset300 = screen.getByTestId("temp-preset-300K");
    fireEvent.click(preset300);

    const t2 = screen.getByTestId("t2-readout");
    expect(parseFloat(t2.textContent || "0")).toBeLessThan(1);

    const targetBadge = screen.getByTestId("target-alignment-badge");
    expect(targetBadge).toHaveTextContent("THERMAL NOISE");
  });

  it("allows continuous temperature tuning via temperature slider", () => {
    render(<Mission06Decoherence />);

    const slider = screen.getByTestId("temperature-slider");
    fireEvent.change(slider, { target: { value: "77" } });

    expect(useQuantumStore.getState().temperatureK).toBe(77);
    const targetBadge = screen.getByTestId("target-alignment-badge");
    expect(targetBadge).toHaveTextContent("THERMAL NOISE");
  });

  it("resets temperature back to 15 mK upon clicking reset button", () => {
    render(<Mission06Decoherence />);

    // Heat first
    fireEvent.click(screen.getByTestId("temp-preset-300K"));
    expect(useQuantumStore.getState().temperatureK).toBe(300);

    // Reset
    fireEvent.click(screen.getByTestId("reset-button"));
    expect(useQuantumStore.getState().temperatureK).toBe(0.015);
    expect(screen.getByTestId("target-alignment-badge")).toHaveTextContent("CRYO COHERENT");
  });

  it("triggers collapse and updates last outcome upon observation", () => {
    render(<Mission06Decoherence />);

    const observeBtn = screen.getByTestId("measure-decoherence-button");
    fireEvent.click(observeBtn);

    expect(useQuantumStore.getState().lastOutcome).not.toBeNull();
  });

  it("binds spatial telemetry bridge when focus is updated", () => {
    render(<Mission06Decoherence />);

    expect(screen.queryByTestId("spatial-telemetry-card")).toBeNull();

    act(() => {
      useSpatialTelemetryBridge.getState().setActiveFocusId("decoherence-envelope");
    });

    const card = screen.getByTestId("spatial-telemetry-card");
    expect(card).toBeInTheDocument();
    expect(card.textContent).toContain("Transverse Coherence Time");
  });
});
