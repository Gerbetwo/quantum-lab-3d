"use client";

import React, { useState } from "react";
import type { QubitState, StateMetrics, TwoQubitTensorState } from "@/core/qubitMath";
import type { BitTriple, SyndromeResult } from "@/core/types";
import { useTranslation } from "@/hooks/useTranslation";
import {
  ChevronUp,
  ChevronDown,
  Activity,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { GroverPanel, QECPanel } from "./AlgorithmWorkshopPanels";
import { MissionSubpanel } from "./ui/MissionSubpanel";

export interface UnifiedBottomTelemetryPanelProps {
  activeTab: number;
  state: QubitState;
  metrics: StateMetrics;
  lastOutcome: 0 | 1 | null;
  entangledPair: { alice: 0 | 1; bob: 0 | 1; state: string } | null;
  temperature: number;
  t2Time: number;
  vectorPurity: number;
  groverTarget: number;
  groverProbs: number[];
  qecTriple: BitTriple;
  syndromeInfo: SyndromeResult | null;
  isObjectiveCompleted?: boolean;
  shorPeriod?: number;
  className?: string;
  defaultExpanded?: boolean;

  // Interaction handlers
  onGate?: (gate: "H" | "X" | "Y" | "Z" | "S" | "T") => void;
  onMeasure?: () => void;
  onReset?: () => void;
  onPreparePreset?: (preset: { theta: number; phi: number }) => void;
  onStateChange?: (state: QubitState) => void;
  onMeasureEntangled?: () => void;
  onResetEntangled?: () => void;
  onTemperatureChange?: (temp: number) => void;
  onResetTemperature?: () => void;
  onSelectGroverTarget?: (idx: number) => void;
  onRunGrover?: () => void;
  onResetGrover?: () => void;
  onInjectBitFlip?: (idx?: 0 | 1 | 2) => void;
  onRunSyndromeCorrection?: () => void;
  onResetQec?: (bit?: 0 | 1) => void;
  gateHistory?: Array<"H" | "X" | "Y" | "Z" | "S" | "T">;
  activeGate?: string | null;
  twoQubitState?: TwoQubitTensorState;

  // Additional control enhancements
  noiseIntensity?: number;
  onNoiseIntensityChange?: (intensity: number) => void;
  autoRotateCamera?: boolean;
  onToggleAutoRotateCamera?: () => void;
}

export function UnifiedBottomTelemetryPanel({
  activeTab,
  state,
  metrics,
  lastOutcome,
  entangledPair,
  temperature,
  t2Time,
  vectorPurity,
  groverTarget,
  groverProbs,
  qecTriple,
  syndromeInfo,
  isObjectiveCompleted = false,
  shorPeriod: _shorPeriod = 4,
  className = "",
  defaultExpanded = true,
  onGate: _onGate,
  onMeasure,
  onReset,
  onStateChange,
  onMeasureEntangled,
  onResetEntangled,
  onTemperatureChange,
  onResetTemperature,
  onSelectGroverTarget,
  onRunGrover,
  onResetGrover,
  onInjectBitFlip,
  onRunSyndromeCorrection,
  onResetQec,
  gateHistory = [],
  activeGate = "H",
  twoQubitState,
  noiseIntensity = 1.0,
  onNoiseIntensityChange,
}: UnifiedBottomTelemetryPanelProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);

  const s1 = qecTriple[0] ^ qecTriple[1];
  const s2 = qecTriple[1] ^ qecTriple[2];
  const groverTargetLabels = ["|00⟩", "|01⟩", "|10⟩", "|11⟩"];

  const renderSummary = () => {
    switch (activeTab) {
      case 0:
      case 1:
      case 2:
        return (
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-foreground">
              P(|0⟩): {(metrics.prob0 * 100).toFixed(0)}%
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-primary hidden sm:inline">
              θ:{Math.round((state.theta * 180) / Math.PI)}°
            </span>
            {lastOutcome !== null && (
              <span className="px-1.5 py-0.5 rounded bg-success/20 text-success font-bold text-[11px]">
                |{lastOutcome}⟩
              </span>
            )}
          </div>
        );
      case 3:
        return (
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-primary font-bold">
              {entangledPair
                ? `State: ${entangledPair.state}`
                : "EPR Pair Unmeasured"}
            </span>
          </div>
        );
      case 4:
        return (
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-primary font-bold">{temperature} mK</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-foreground hidden sm:inline">T₂: {t2Time.toFixed(1)} μs</span>
          </div>
        );
      case 5:
        return (
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-primary font-bold">
              Target: {groverTargetLabels[groverTarget]}
            </span>
            <span className="text-muted-foreground hidden sm:inline">•</span>
            <span className="text-foreground hidden sm:inline">
              P: {((groverProbs[groverTarget] ?? 0.25) * 100).toFixed(0)}%
            </span>
          </div>
        );
      case 6:
        return (
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-primary font-bold">
              [{qecTriple.join(", ")}]
            </span>
            <span className="text-muted-foreground">•</span>
            <span
              className={
                s1 === 1 || s2 === 1
                  ? "text-destructive font-bold"
                  : "text-success font-bold"
              }
            >
              S₁={s1}, S₂={s2}
            </span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      data-testid="unified-bottom-telemetry-panel"
      className={`relative inline-block text-left select-none pointer-events-auto ${className}`.trim()}
    >
      {/* Topbar Dock Handle */}
      <div
        data-testid="telemetry-panel-handle"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-border bg-card/85 backdrop-blur-md hover:bg-secondary cursor-pointer shadow-sm transition-colors active:scale-95"
      >
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Activity className="w-3.5 h-3.5 text-primary shrink-0 animate-pulse" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground hidden sm:inline">
            Inspector
          </span>
          <div className="h-3 w-px bg-border shrink-0 hidden sm:block" />
          {renderSummary()}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-1">
          {isObjectiveCompleted && (
            <div className="hidden md:flex items-center gap-1 text-[11px] font-mono text-success font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t('panels.telemetryPanel.objective_met')}</span>
            </div>
          )}

          <div className="p-0.5 rounded text-[11px] font-mono text-foreground">
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </div>
        </div>
      </div>

      {/* Expanded Readout Dropdown Drawer floating below top-right header */}
      {isExpanded && (
        <div
          data-testid="telemetry-expanded-drawer"
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-h-[calc(100vh-5rem)] overflow-y-auto scrollbar-thin rounded-2xl bg-card/95 backdrop-blur-md border border-border shadow-2xl p-3.5 sm:p-4 space-y-3.5 z-30"
        >
          {/* Dynamic Mission-Aware Subpanel for Missions 1-5 (Tabs 0-4) */}
          {activeTab <= 4 && (
            <MissionSubpanel
              activeTab={activeTab}
              state={state}
              metrics={metrics}
              lastOutcome={lastOutcome}
              gateHistory={gateHistory}
              activeGate={activeGate}
              temperature={temperature}
              t2Time={t2Time}
              vectorPurity={vectorPurity}
              entangledPair={entangledPair}
              twoQubitState={twoQubitState}
              onReset={activeTab === 4 ? onResetTemperature : (activeTab === 3 ? onResetEntangled : onReset)}
              onMeasure={activeTab === 3 ? onMeasureEntangled : onMeasure}
              onStateChange={onStateChange}
              onTemperatureChange={onTemperatureChange}
              noiseIntensity={noiseIntensity}
              onNoiseIntensityChange={onNoiseIntensityChange}
            />
          )}

          {activeTab === 5 && (
            <GroverPanel
              groverTarget={groverTarget}
              groverProbs={groverProbs}
              onSelectTarget={(idx) => onSelectGroverTarget?.(idx)}
              onRunGrover={() => onRunGrover?.()}
              onReset={() => onResetGrover?.()}
            />
          )}

          {activeTab === 6 && (
            <QECPanel
              qecTriple={qecTriple}
              syndromeInfo={syndromeInfo}
              onInjectBitFlip={(idx) => onInjectBitFlip?.(idx)}
              onRunSyndromeCorrection={() => onRunSyndromeCorrection?.()}
              onReset={() => onResetQec?.(0)}
            />
          )}

          {/* Quick Precision Kinematic Angle Sliders (always accessible in Inspector drawer for algorithm tabs) */}
          {activeTab > 4 && (
            <div className="p-2.5 rounded-xl bg-background/80 border border-border space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-primary" />
                {t('panels.telemetryPanel.kinematic_angles')}
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-1.5 rounded bg-card border border-border">
                  <span className="text-muted-foreground block text-[9px]">{t('panels.telemetryPanel.polar_theta')}</span>
                  <span className="text-primary font-bold text-xs">{Math.round((state.theta * 180) / Math.PI)}°</span>
                </div>
                <div className="p-1.5 rounded bg-card border border-border">
                  <span className="text-muted-foreground block text-[9px]">{t('panels.telemetryPanel.azimuthal_phi')}</span>
                  <span className="text-foreground font-bold text-xs">{Math.round((state.phi * 180) / Math.PI)}°</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default UnifiedBottomTelemetryPanel;
