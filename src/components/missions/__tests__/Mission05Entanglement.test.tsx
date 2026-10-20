import React from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Mission05Entanglement } from "../Mission05Entanglement";
import { useQuantumStore } from "@/store/useQuantumStore";
import { useSpatialTelemetryBridge } from "@/hooks/useSpatialTelemetryBridge";

describe("Mission05Entanglement - Dual Bloch Spheres & Entanglement Lattice", () => {
  beforeEach(() => {
    useQuantumStore.setState({
      currentMissionId: "entanglement",
      theta: 0,
      phi: 0,
      isEntangled: true,
      lastOutcome: null,
      language: "en",
    });
    useSpatialTelemetryBridge.getState().clearFocus();
  });

  it("renders inside MissionCanvasShell with 3 tiers and DualBlochViewport", () => {
    render(<Mission05Entanglement />);

    expect(screen.getByTestId("mission-canvas-shell")).toBeInTheDocument();
    expect(screen.getByTestId("tier-1-header")).toBeInTheDocument();
    expect(screen.getByTestId("tier-2-canvas-container")).toBeInTheDocument();
    expect(screen.getByTestId("tier-3-ribbon")).toBeInTheDocument();

    // Renders Dual Bloch Viewport
    expect(screen.getByTestId("dual-bloch-viewport")).toBeInTheDocument();
  });

  it("renders initial Bell state |Φ⁺⟩ formula and 4 basis probability cards", () => {
    render(<Mission05Entanglement />);

    expect(screen.getByTestId("two-qubit-formula")).toHaveTextContent("|ψ⟩ = 1/√2 (|00⟩ + |11⟩)");
    expect(screen.getByTestId("basis-card-00")).toHaveTextContent("50.0%");
    expect(screen.getByTestId("basis-card-01")).toHaveTextContent("0.0%");
    expect(screen.getByTestId("basis-card-10")).toHaveTextContent("0.0%");
    expect(screen.getByTestId("basis-card-11")).toHaveTextContent("50.0%");
    expect(screen.getByTestId("entropy-readout")).toHaveTextContent("1.00 ebits");
  });

  it("updates 2-qubit state probabilities when switching Bell presets", () => {
    render(<Mission05Entanglement />);

    // Switch to singlet state |Ψ⁻⟩
    const psiMinusBtn = screen.getByTestId("bell-preset-psi_minus");
    fireEvent.click(psiMinusBtn);

    expect(screen.getByTestId("two-qubit-formula")).toHaveTextContent("|ψ⟩ = 1/√2 (|01⟩ - |10⟩)");
    expect(screen.getByTestId("basis-card-00")).toHaveTextContent("0.0%");
    expect(screen.getByTestId("basis-card-01")).toHaveTextContent("50.0%");
    expect(screen.getByTestId("basis-card-10")).toHaveTextContent("50.0%");
    expect(screen.getByTestId("basis-card-11")).toHaveTextContent("0.0%");

    // Switch to Separable |00⟩
    const sepBtn = screen.getByTestId("bell-preset-separable");
    fireEvent.click(sepBtn);

    expect(screen.getByTestId("two-qubit-formula")).toHaveTextContent("|ψ⟩ = |00⟩");
    expect(screen.getByTestId("basis-card-00")).toHaveTextContent("100.0%");
    expect(screen.getByTestId("entropy-readout")).toHaveTextContent("0.00 ebits");
  });

  it("instantly triggers correlated collapse on Qubit B when Qubit A is measured", () => {
    render(<Mission05Entanglement />);

    // In |Φ⁺⟩, measuring Alice triggers correlated collapse on Bob
    const measureBtn = screen.getByTestId("measure-alice-button");
    fireEvent.click(measureBtn);

    const outcomeBanner = screen.getByTestId("entanglement-outcome-banner");
    expect(outcomeBanner).toBeInTheDocument();
    expect(outcomeBanner.textContent).toContain("CORRELATED");
    expect(useQuantumStore.getState().lastOutcome).not.toBeNull();
  });

  it("binds spatial telemetry bridge to focused elements", () => {
    render(<Mission05Entanglement />);

    // Initially no element focused
    expect(screen.queryByTestId("spatial-telemetry-card")).toBeNull();

    // Hover on basis card
    const card00 = screen.getByTestId("basis-card-00");
    fireEvent.mouseEnter(card00);

    const telemetryCard = screen.getByTestId("spatial-telemetry-card");
    expect(telemetryCard).toBeInTheDocument();
    expect(telemetryCard.textContent).toContain("2-Qubit State Vector");
    expect(telemetryCard.textContent).toContain("|ψ_AB⟩");

    // Focus entanglement lattice directly
    act(() => {
      useSpatialTelemetryBridge.getState().setActiveFocusId("entanglement-lattice");
    });
    expect(screen.getByTestId("spatial-telemetry-card").textContent).toContain("Entanglement Tensor Lattice");
    expect(screen.getByTestId("spatial-telemetry-card").textContent).toContain("|Φ⁺⟩");
  });
});
