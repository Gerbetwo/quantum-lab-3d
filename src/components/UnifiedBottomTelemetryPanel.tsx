"use client";

import React, { useState } from "react";
import type { QubitState, StateMetrics } from "@/core/qubitMath";
import type { BitTriple, SyndromeResult } from "@/core/types";
import { useTranslation } from "@/hooks/useTranslation";
import {
  ChevronUp,
  ChevronDown,
  Activity,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

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
  shorPeriod = 4,
  className = "",
  defaultExpanded = false,
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
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-foreground">
              P(|0⟩): {(metrics.prob0 * 100).toFixed(0)}%
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-foreground">
              P(|1⟩): {(metrics.prob1 * 100).toFixed(0)}%
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
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-primary font-bold">
              {entangledPair
                ? `State: ${entangledPair.state}`
                : "EPR Pair Unmeasured"}
            </span>
          </div>
        );
      case 4:
        return (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-primary font-bold">{temperature} mK</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-foreground">T₂: {t2Time.toFixed(1)} μs</span>
          </div>
        );
      case 5:
        return (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-primary font-bold">
              Target: {groverTargetLabels[groverTarget]}
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-foreground">
              P: {((groverProbs[groverTarget] ?? 0.25) * 100).toFixed(0)}%
            </span>
          </div>
        );
      case 6:
        return (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-primary font-bold">
              [{qecTriple.join(", ")}]
            </span>
            <span className="text-muted-foreground">•</span>
            <span
              className={
                s1 === 1 || s2 === 1
                  ? "text-destructive font-bold"
                  : "text-success"
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
      className={`fixed right-3 sm:right-4 top-16 z-20 pointer-events-auto flex flex-col items-end transition-all duration-300 ${className}`.trim()}
    >
      {/* Dock Toggle Handle */}
      <div
        data-testid="telemetry-panel-handle"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-xl border border-border bg-card/90 backdrop-blur-md hover:bg-secondary cursor-pointer select-none shadow-lg"
      >
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-primary shrink-0 animate-pulse" />
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Inspector
          </span>
          {!isExpanded && (
            <>
              <div className="h-3 w-px bg-border shrink-0" />
              {renderSummary()}
            </>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isObjectiveCompleted && (
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-success font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Met</span>
            </div>
          )}

          <button
            type="button"
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-secondary border border-border text-foreground hover:bg-muted cursor-pointer"
          >
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Readout Card */}
      {isExpanded && (
        <div
          data-testid="telemetry-expanded-drawer"
          className="mt-2 w-80 sm:w-88 max-h-[calc(100vh-10rem)] overflow-y-auto scrollbar-thin rounded-2xl bg-card/95 backdrop-blur-md border border-border shadow-2xl p-4 space-y-3"
        >
          {/* Kinematic Angle Readout */}
          <div className="p-2.5 rounded-xl bg-background/80 border border-border space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-primary" />
              Kinematic Angles
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-1.5 rounded bg-card border border-border">
                <span className="text-muted-foreground block text-[9px]">
                  Polar θ
                </span>
                <span className="text-primary font-bold text-xs">
                  {Math.round((state.theta * 180) / Math.PI)}°
                </span>
              </div>
              <div className="p-1.5 rounded bg-card border border-border">
                <span className="text-muted-foreground block text-[9px]">
                  Azimuthal φ
                </span>
                <span className="text-foreground font-bold text-xs">
                  {Math.round((state.phi * 180) / Math.PI)}°
                </span>
              </div>
            </div>
          </div>

          {/* Probabilities & Readouts */}
          <div className="p-2.5 rounded-xl bg-background/80 border border-border space-y-1.5 text-xs font-mono">
            <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
              Born State Probabilities
            </span>
            <div className="flex justify-between items-center font-bold">
              <span className="text-primary">
                P(|0⟩): {(metrics.prob0 * 100).toFixed(1)}%
              </span>
              <span className="text-foreground">
                P(|1⟩): {(metrics.prob1 * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Mode-specific status summary */}
          {activeTab === 6 && (
            <div className="p-2.5 rounded-xl bg-background/80 border border-border space-y-1 text-xs font-mono">
              <span className="text-[10px] uppercase text-muted-foreground font-semibold block">
                QEC Diagnostics
              </span>
              <div className="flex justify-between">
                <span>Parity S₁: |{s1}⟩</span>
                <span>Parity S₂: |{s2}⟩</span>
              </div>
              {syndromeInfo && (
                <div className="text-success font-bold mt-1 text-[11px]">
                  {syndromeInfo.errorIndex === -1
                    ? "Code Clean"
                    : `Repaired Qubit ${syndromeInfo.errorIndex}`}
                </div>
              )}
            </div>
          )}

          <div className="text-[10px] font-mono text-muted-foreground flex justify-between items-center border-t border-border/50 pt-2">
            <span>QuantumLab Inspector</span>
            <span>Shor r={shorPeriod}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default UnifiedBottomTelemetryPanel;
