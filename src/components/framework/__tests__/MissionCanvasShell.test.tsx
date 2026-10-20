import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { MissionCanvasShell } from "../MissionCanvasShell";
import { useQuantumStore } from "@/store/useQuantumStore";

describe("MissionCanvasShell", () => {
  beforeEach(() => {
    useQuantumStore.setState({
      currentMissionId: "superposition",
      theta: 0,
      phi: 0,
      lastOutcome: null,
      language: "en",
    });
  });

  it("renders the 3 standardized tiers: Header, Viewport/Canvas, Ribbon", () => {
    render(
      <MissionCanvasShell
        tier2Canvas={<div data-testid="custom-test-canvas">Canvas 3D</div>}
      />
    );

    expect(screen.getByTestId("mission-canvas-shell")).toBeInTheDocument();
    expect(screen.getByTestId("tier-1-header")).toBeInTheDocument();
    expect(screen.getByTestId("tier-2-canvas-container")).toBeInTheDocument();
    expect(screen.getByTestId("tier-3-ribbon")).toBeInTheDocument();

    // Default inner elements
    expect(screen.getByTestId("mission-header")).toBeInTheDocument();
    expect(screen.getByTestId("custom-test-canvas")).toBeInTheDocument();
    expect(screen.getByTestId("quantum-pipeline-ribbon")).toBeInTheDocument();
  });

  it("supports overriding Tier 1, Tier 2, and Tier 3 with custom nodes", () => {
    render(
      <MissionCanvasShell
        tier1Header={<div data-testid="custom-header">Custom Tier 1</div>}
        tier2Canvas={<div data-testid="custom-canvas">Custom Tier 2 Canvas</div>}
        tier2Overlays={<div data-testid="custom-overlays">Custom Overlay Node</div>}
        tier3Ribbon={<div data-testid="custom-ribbon">Custom Tier 3 Ribbon</div>}
      >
        <div data-testid="child-overlay">Extra Child Overlay</div>
      </MissionCanvasShell>
    );

    expect(screen.getByTestId("custom-header")).toBeInTheDocument();
    expect(screen.getByTestId("custom-canvas")).toBeInTheDocument();
    expect(screen.getByTestId("custom-overlays")).toBeInTheDocument();
    expect(screen.getByTestId("custom-ribbon")).toBeInTheDocument();
    expect(screen.getByTestId("child-overlay")).toBeInTheDocument();

    // Verify overridden defaults are not rendered
    expect(screen.queryByTestId("mission-header")).not.toBeInTheDocument();
    expect(screen.queryByTestId("quantum-pipeline-ribbon")).not.toBeInTheDocument();
  });
});
