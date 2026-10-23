'use client';

import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { BlochSphereViewport } from '../BlochSphereViewport';
import {
  QuantumPipelineRibbon,
  type QuantumPipelineRibbonProps,
} from './QuantumPipelineRibbon';
import { Sun, Moon } from 'lucide-react';

export interface MissionCanvasShellProps {
  /** Active mission or workshop ID / title */
  missionId?: string;

  /**
   * Tier 1: Top Header & Objective HUD Slot.
   * If not provided, defaults to standard header with theme toggle.
   */
  tier1Header?: React.ReactNode;

  /**
   * Tier 2: WebGL 3D Canvas Slot.
   * If not provided, defaults to singleton <BlochSphereViewport />.
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
 * Standardized 3-Tier Viewport Shell for the tactical quantum visualizer.
 * - Tier 1: Header / Objective HUD with integrated useTheme switcher
 * - Tier 2: WebGL Canvas + Spatial Overlays
 * - Tier 3: Quantum Pipeline Ribbon [1. PREPARE] -> [2. TRANSFORM] -> [3. MEASURE]
 */
export const MissionCanvasShell: React.FC<MissionCanvasShellProps> = ({
  missionId = 'superposition',
  tier1Header,
  tier2Canvas,
  tier2Overlays,
  tier3Ribbon,
  pipelineRibbonProps,
  children,
  className = '',
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div
      data-testid="mission-canvas-shell"
      className={`relative w-full h-screen overflow-hidden select-none bg-background text-foreground flex flex-col ${className}`.trim()}
    >
      {/* TIER 2: WebGL Canvas Layer (Fixed full viewport) */}
      <div
        data-testid="tier-2-canvas-container"
        className="fixed inset-0 z-0 w-full h-full pointer-events-auto"
      >
        {tier2Canvas !== undefined ? (
          tier2Canvas
        ) : (
          <BlochSphereViewport
            state={{ theta: 0, phi: 0 }}
            className="fixed inset-0 z-0 w-full h-full rounded-none border-0 bg-transparent"
          />
        )}
      </div>

      {/* TIER 1: Header / Objective HUD Bar */}
      <header
        data-testid="tier-1-header"
        className="relative z-10 w-full pointer-events-auto p-3 sm:p-4 flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-md"
      >
        {tier1Header !== undefined ? (
          tier1Header
        ) : (
          <>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold tracking-widest text-primary uppercase bg-secondary px-2.5 py-1 rounded border border-border">
                {'QuantumLab 3D'}
              </span>
              <span className="text-xs font-mono text-muted-foreground hidden sm:inline">
                {'Mission: '}<span className="text-foreground capitalize">{missionId}</span>
              </span>
            </div>

            {/* Tier 1 Theme Switcher */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                data-testid="theme-toggle-button"
                aria-label={'Toggle theme'}
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
                className="p-1.5 rounded-lg text-xs font-mono border border-border bg-card hover:bg-secondary text-foreground transition-colors flex items-center justify-center cursor-pointer shadow-sm active:scale-95"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-warning" />
                ) : (
                  <Moon className="w-4 h-4 text-primary" />
                )}
              </button>
            </div>
          </>
        )}
      </header>

      {/* TIER 2 OVERLAYS: Spatial Tooltips, Telemetry Cards */}
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

export default MissionCanvasShell;
