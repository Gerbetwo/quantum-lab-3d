'use client';

import React from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from '@/hooks/useTranslation';
import {
  type QuantumObjective,
  getObjectiveById,
} from '@/lib/quantum/objectivesConfig';
import { TargetGoalCard } from './TargetGoalCard';
import { SpatialTooltipOverlay } from './SpatialTooltipOverlay';
import { BlochSphereViewport } from '../BlochSphereViewport';
import {
  QuantumPipelineRibbon,
  type QuantumPipelineRibbonProps,
} from './QuantumPipelineRibbon';
import { Sun, Moon, Globe } from 'lucide-react';

export interface MissionCanvasShellProps {
  /** Active mission or workshop ID / title */
  missionId?: string;

  /** Active objective definition to display in Tier 1 HUD */
  activeObjective?: QuantumObjective;

  /** Whether the active objective is currently completed */
  isObjectiveCompleted?: boolean;

  /** Progress description text (e.g. "85/100 shots") */
  objectiveProgress?: string;

  /**
   * Tier 1: Top Header & Objective HUD Slot.
   * If not provided, defaults to standard header with goal card, theme and language toggles.
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
 * - Tier 1: Header HUD with embedded TargetGoalCard, useTheme and useTranslation toggles
 * - Tier 2: WebGL Canvas + Spatial Overlays with active SpatialTooltipOverlay
 * - Tier 3: Quantum Pipeline Ribbon [1. PREPARE] -> [2. TRANSFORM] -> [3. MEASURE]
 */
export const MissionCanvasShell: React.FC<MissionCanvasShellProps> = ({
  missionId = 'superposition',
  activeObjective: propObjective,
  isObjectiveCompleted = false,
  objectiveProgress,
  tier1Header,
  tier2Canvas,
  tier2Overlays,
  tier3Ribbon,
  pipelineRibbonProps,
  children,
  className = '',
}) => {
  const { theme, toggleTheme } = useTheme();
  const { locale, toggleLanguage, t } = useTranslation();

  const activeObjective = propObjective ?? getObjectiveById(missionId);

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
        className="relative z-10 w-full pointer-events-auto p-3 sm:p-4 flex items-center justify-between gap-3 border-b border-border bg-card/80 backdrop-blur-md"
      >
        {tier1Header !== undefined ? (
          tier1Header
        ) : (
          <>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold tracking-widest text-primary uppercase bg-secondary px-2.5 py-1 rounded border border-border">
                {t('header.title')}
              </span>
              <span className="text-xs font-mono text-muted-foreground hidden lg:inline">
                {t('header.mission', { mission: missionId })}
              </span>
            </div>

            {/* Tier 1 Embedded Target Objective Card */}
            {activeObjective && (
              <div className="hidden sm:flex flex-1 justify-center max-w-md mx-2">
                <TargetGoalCard
                  objective={activeObjective}
                  isCompleted={isObjectiveCompleted}
                  progressText={objectiveProgress}
                />
              </div>
            )}

            {/* Tier 1 Switchers: Language & Theme */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleLanguage}
                data-testid="language-toggle-button"
                aria-label={t('header.toggle_language')}
                title={t('header.toggle_language')}
                className="px-2 py-1 rounded-lg text-xs font-mono font-bold border border-border bg-card hover:bg-secondary text-foreground transition-colors flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
              >
                <Globe className="w-3.5 h-3.5 text-primary" />
                <span>{locale === 'en' ? 'EN' : 'ES'}</span>
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                data-testid="theme-toggle-button"
                aria-label={t('header.toggle_theme')}
                title={theme === 'dark' ? t('header.switch_to_light') : t('header.switch_to_dark')}
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
        <SpatialTooltipOverlay spatialId="state-vector" />
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
