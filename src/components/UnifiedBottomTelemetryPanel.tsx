'use client';

import React, { useState } from 'react';
import type { QubitState, StateMetrics } from '@/core/qubitMath';
import type { BitTriple, SyndromeResult } from '@/core/types';
import type { QuantumObjective } from '@/lib/quantum/objectivesConfig';
import { useTranslation } from '@/hooks/useTranslation';
import { TargetGoalCard } from './ui/TargetGoalCard';
import { SingleQubitPanel, formatDirac } from './SingleQubitPanel';
import { EntanglementPanel, DecoherencePanel } from './EntanglementDecoherencePanels';
import { GroverPanel, QECPanel } from './AlgorithmWorkshopPanels';
import { QuantumPipelineRibbon, type StatePreset } from './ui/QuantumPipelineRibbon';
import { ChevronUp, ChevronDown, Activity, Sparkles, CheckCircle2 } from 'lucide-react';

export interface UnifiedBottomTelemetryPanelProps {
  activeTab: number;
  state: QubitState;
  metrics: StateMetrics;
  lastOutcome: 0 | 1 | null;
  onGate: (gate: 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T') => void;
  onMeasure: () => void;
  onReset: () => void;
  onPreparePreset?: (preset: StatePreset) => void;

  entangledPair: { alice: 0 | 1; bob: 0 | 1; state: string } | null;
  onMeasureEntangled: () => void;
  onResetEntangled: () => void;

  temperature: number;
  t2Time: number;
  vectorPurity: number;
  onTemperatureChange: (temp: number) => void;
  onResetTemperature: () => void;

  groverTarget: number;
  groverProbs: number[];
  onSelectGroverTarget: (idx: number) => void;
  onRunGrover: () => void;
  onResetGrover: () => void;

  qecTriple: BitTriple;
  syndromeInfo: SyndromeResult | null;
  onInjectBitFlip: (idx?: 0 | 1 | 2) => void;
  onRunSyndromeCorrection: () => void;
  onResetQec: (bit?: 0 | 1) => void;

  activeObjective?: QuantumObjective | null;
  isObjectiveCompleted?: boolean;
  objectiveProgress?: string;
  shorPeriod?: number;
  className?: string;
  defaultExpanded?: boolean;
}

export function UnifiedBottomTelemetryPanel({
  activeTab,
  state,
  metrics,
  lastOutcome,
  onGate,
  onMeasure,
  onReset,
  onPreparePreset,
  entangledPair,
  onMeasureEntangled,
  onResetEntangled,
  temperature,
  t2Time,
  vectorPurity,
  onTemperatureChange,
  onResetTemperature,
  groverTarget,
  groverProbs,
  onSelectGroverTarget,
  onRunGrover,
  onResetGrover,
  qecTriple,
  syndromeInfo,
  onInjectBitFlip,
  onRunSyndromeCorrection,
  onResetQec,
  activeObjective,
  isObjectiveCompleted = false,
  objectiveProgress = '',
  shorPeriod = 4,
  className = '',
  defaultExpanded = true,
}: UnifiedBottomTelemetryPanelProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);

  const s1 = qecTriple[0] ^ qecTriple[1];
  const s2 = qecTriple[1] ^ qecTriple[2];
  const groverTargetLabels = ['|00⟩', '|01⟩', '|10⟩', '|11⟩'];

  // Summary pill content for collapsed handle
  const renderCollapsedSummary = () => {
    switch (activeTab) {
      case 0:
      case 1:
      case 2:
        return (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-primary font-bold">{formatDirac(metrics)}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-foreground">P(|0⟩): {(metrics.prob0 * 100).toFixed(0)}%</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-foreground">P(|1⟩): {(metrics.prob1 * 100).toFixed(0)}%</span>
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
              {entangledPair ? `State: ${entangledPair.state}` : 'Bell |Φ⁺⟩ Unmeasured'}
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-success font-bold">
              {entangledPair ? '100% Correlation' : '50% / 50% Born'}
            </span>
          </div>
        );
      case 4:
        return (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-primary font-bold">{temperature} mK</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-foreground">T₂: {t2Time.toFixed(1)} μs</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-success">{(vectorPurity * 100).toFixed(0)}% purity</span>
          </div>
        );
      case 5:
        return (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-primary font-bold">Target: {groverTargetLabels[groverTarget]}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-foreground">
              P(target): {((groverProbs[groverTarget] ?? 0.25) * 100).toFixed(0)}%
            </span>
          </div>
        );
      case 6:
        return (
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-primary font-bold">
              [q0, q1, q2] = [{qecTriple.join(', ')}]
            </span>
            <span className="text-muted-foreground">•</span>
            <span className={s1 === 1 || s2 === 1 ? 'text-destructive font-bold' : 'text-success'}>
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
      className={`fixed bottom-0 left-0 right-0 z-30 pointer-events-auto border-t border-border bg-card/95 backdrop-blur-md shadow-2xl transition-all duration-300 ${className}`.trim()}
    >
      {/* Collapsible Top Handle Bar */}
      <div
        data-testid="telemetry-panel-handle"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 sm:px-6 py-2 bg-secondary/60 hover:bg-secondary cursor-pointer border-b border-border/50 select-none transition-colors"
      >
        <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-none py-0.5">
          <Activity className="w-4 h-4 text-primary shrink-0 animate-pulse" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground shrink-0">
            {t('panels.telemetryPanel.drawer_summary')}
          </span>
          {!isExpanded && (
            <>
              <div className="h-3.5 w-px bg-border shrink-0" />
              {renderCollapsedSummary()}
            </>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {isObjectiveCompleted && (
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-success font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t('panels.telemetryPanel.objective_met')}</span>
            </div>
          )}

          <button
            type="button"
            aria-label={isExpanded ? t('panels.telemetryPanel.collapse') : t('panels.telemetryPanel.expand')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-card border border-border text-foreground hover:bg-muted transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <span>{isExpanded ? t('panels.telemetryPanel.collapse') : t('panels.telemetryPanel.expand')}</span>
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-primary" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 text-primary" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Multi-Column Grid Drawer */}
      {isExpanded && (
        <div
          data-testid="telemetry-expanded-drawer"
          className="p-3 sm:p-5 max-h-[60vh] sm:max-h-[50vh] overflow-y-auto scrollbar-thin"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 items-start">
            {/* Column 1: Active Goal Objective Card & Target Kinematics */}
            <div className="space-y-4">
              {activeObjective && (
                <TargetGoalCard
                  objective={activeObjective}
                  isCompleted={isObjectiveCompleted}
                  progressText={objectiveProgress}
                />
              )}

              {/* State Vector Angle Quick Readout */}
              <div className="p-3.5 rounded-xl bg-background border border-border space-y-2">
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  {t('panels.telemetryPanel.kinematic_angles')}
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded bg-card border border-border">
                    <span className="text-muted-foreground block text-[10px]">{t('panels.telemetryPanel.polar_theta')}</span>
                    <span className="text-primary font-bold text-sm">
                      {Math.round((state.theta * 180) / Math.PI)}°
                    </span>
                  </div>
                  <div className="p-2 rounded bg-card border border-border">
                    <span className="text-muted-foreground block text-[10px]">{t('panels.telemetryPanel.azimuthal_phi')}</span>
                    <span className="text-foreground font-bold text-sm">
                      {Math.round((state.phi * 180) / Math.PI)}°
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 2, 3, 4: Active Tab Specific Mission Controls */}
            <div className="md:col-span-1 lg:col-span-2 xl:col-span-3">
              {activeTab <= 2 && (
                <div className="space-y-4">
                  <SingleQubitPanel
                    activeTab={activeTab}
                    state={state}
                    metrics={metrics}
                    lastOutcome={lastOutcome}
                    onGate={onGate}
                    onMeasure={onMeasure}
                    onReset={onReset}
                  />

                  {/* Integrated Tactical Execution Ribbon */}
                  <div className="pt-2">
                    <QuantumPipelineRibbon
                      onPreparePreset={onPreparePreset}
                      onTransformGate={(gate) => onGate(gate as 'H' | 'X' | 'Y' | 'Z' | 'S' | 'T')}
                      onMeasure={onMeasure}
                      onReset={onReset}
                      lastOutcome={lastOutcome}
                    />
                  </div>
                </div>
              )}

              {activeTab === 3 && (
                <EntanglementPanel
                  entangledPair={entangledPair}
                  onMeasure={onMeasureEntangled}
                  onReset={onResetEntangled}
                />
              )}

              {activeTab === 4 && (
                <DecoherencePanel
                  temperature={temperature}
                  t2Time={t2Time}
                  vectorPurity={vectorPurity}
                  onTemperatureChange={onTemperatureChange}
                  onReset={onResetTemperature}
                />
              )}

              {activeTab === 5 && (
                <GroverPanel
                  groverTarget={groverTarget}
                  groverProbs={groverProbs}
                  onSelectTarget={onSelectGroverTarget}
                  onRunGrover={onRunGrover}
                  onReset={onResetGrover}
                />
              )}

              {activeTab === 6 && (
                <QECPanel
                  qecTriple={qecTriple}
                  syndromeInfo={syndromeInfo}
                  onInjectBitFlip={onInjectBitFlip}
                  onRunSyndromeCorrection={onRunSyndromeCorrection}
                  onReset={onResetQec}
                />
              )}

              {/* Shor Didactic Telemetry Footer */}
              <div className="text-[11px] font-mono text-muted-foreground flex justify-between items-center border-t border-border/50 pt-3 mt-5">
                <span>QuantumLab Workshop Suite</span>
                <span>Shor N=15 Reference (r={shorPeriod})</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UnifiedBottomTelemetryPanel;
