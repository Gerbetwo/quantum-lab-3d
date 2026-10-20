"use client";

import React from "react";
import { useQuantumStore } from "@/store/useQuantumStore";
import { MissionHeader } from "@/components/game/MissionHeader";
import { BlochViewport } from "@/features/quantum-core/BlochViewport";
import {
  QuantumPipelineRibbon,
  type QuantumPipelineRibbonProps,
} from "./QuantumPipelineRibbon";

export interface MissionCanvasShellProps {
  /** Active mission ID. Defaults to store currentMissionId */
  missionId?: string;

  /**
   * Tier 1: Top Header & Objective HUD Slot.
   * If not provided, defaults to standard <MissionHeader missionId={missionId} />.
   */
  tier1Header?: React.ReactNode;

  /**
   * Tier 2: WebGL 3D Canvas Slot.
   * If not provided, defaults to singleton <BlochViewport />.
   */
  tier2Canvas?: React.ReactNode;

  /**
   * Tier 2 Overlays: Spatial HUD panels, tooltips, or MathDock placed over the 3D canvas.
   */
  tier2Overlays?: React.ReactNode;

  /**
   * Tier 3: Bottom Control Ribbon Slot.
   * If not provided, defaults to <QuantumPipelineRibbon {...pipelineRibbonProps} />.
   */
  tier3Ribbon?: React.ReactNode;

  /** Custom props passed to default QuantumPipelineRibbon if tier3Ribbon is not overridden */
  pipelineRibbonProps?: QuantumPipelineRibbonProps;

  /** Additional overlay children rendered inside the tactical HUD container */
  children?: React.ReactNode;

  /** Custom class names for root container */
  className?: string;
}

/**
 * MissionCanvasShell:
 * Standardized 3-Tier Viewport Shell for the 7-mission quantum visualizer.
 * - Tier 1: Header / Objective HUD
 * - Tier 2: WebGL Canvas + Spatial Overlays
 * - Tier 3: Quantum Pipeline Ribbon [1. PREPARE] -> [2. TRANSFORM] -> [3. MEASURE]
 */
export const MissionCanvasShell: React.FC<MissionCanvasShellProps> = ({
  missionId: propMissionId,
  tier1Header,
  tier2Canvas,
  tier2Overlays,
  tier3Ribbon,
  pipelineRibbonProps,
  children,
  className = "",
}) => {
  const currentMissionId = useQuantumStore((s) => s.currentMissionId ?? "superposition");
  const activeMissionId = propMissionId || currentMissionId;

  return (
    <div
      data-testid="mission-canvas-shell"
      className={`relative w-full h-screen overflow-hidden select-none bg-background text-foreground flex flex-col ${className}`.trim()}
    >
      {/* TIER 2: WebGL Canvas Layer (Fixed full viewport, singleton WebGL context) */}
      <div
        data-testid="tier-2-canvas-container"
        className="fixed inset-0 z-0 w-full h-full pointer-events-auto"
      >
        {tier2Canvas !== undefined ? (
          tier2Canvas
        ) : (
          <BlochViewport className="fixed inset-0 z-0 w-full h-full rounded-none border-0 bg-transparent" />
        )}
      </div>

      {/* TIER 1: Header / Objective HUD */}
      <header
        data-testid="tier-1-header"
        className="relative z-10 w-full pointer-events-auto"
      >
        {tier1Header !== undefined ? (
          tier1Header
        ) : (
          <MissionHeader missionId={activeMissionId} />
        )}
      </header>

      {/* TIER 2 OVERLAYS: Spatial Tooltips, MathDock, Telemetry Cards */}
      <div
        data-testid="tier-2-overlays"
        className="relative z-10 flex-1 w-full pointer-events-none overflow-hidden"
      >
        {tier2Overlays}
        {children}
      </div>

      {/* TIER 3: Control Ribbon [1. PREPARE] -> [2. TRANSFORM] -> [3. MEASURE] */}
      <footer
        data-testid="tier-3-ribbon"
        className="relative z-20 pointer-events-auto"
      >
        {tier3Ribbon !== undefined ? (
          tier3Ribbon
        ) : (
          <QuantumPipelineRibbon {...pipelineRibbonProps} />
        )}
      </footer>
    </div>
  );
};
