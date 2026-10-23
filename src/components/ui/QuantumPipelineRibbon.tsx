'use client';

import React, { useState } from 'react';
import {
  playGateSweep,
  playCollapseDrop,
  playVectorSnap,
} from '@/lib/audio/soundEngine';
import { useTranslation } from '@/hooks/useTranslation';
import { ChevronRight, RotateCcw, Zap } from 'lucide-react';

export interface StatePreset {
  id: string;
  label?: string;
  symbol: string;
  theta: number;
  phi: number;
  description?: string;
}

export const STATE_PRESETS: StatePreset[] = [
  { id: 'zero', symbol: '|0⟩', theta: 0, phi: 0 },
  { id: 'one', symbol: '|1⟩', theta: Math.PI, phi: 0 },
  { id: 'plus', symbol: '|+⟩', theta: Math.PI / 2, phi: 0 },
  { id: 'minus', symbol: '|-⟩', theta: Math.PI / 2, phi: Math.PI },
  { id: 'plusi', symbol: '|+i⟩', theta: Math.PI / 2, phi: Math.PI / 2 },
  { id: 'minusi', symbol: '|-i⟩', theta: Math.PI / 2, phi: (3 * Math.PI) / 2 },
];

export interface GateDefinition {
  id: string;
  symbol: string;
  i18nKey: string;
}

export const PIPELINE_GATES: GateDefinition[] = [
  { id: 'H', symbol: 'H', i18nKey: 'hadamard' },
  { id: 'X', symbol: 'X', i18nKey: 'pauliX' },
  { id: 'Y', symbol: 'Y', i18nKey: 'pauliY' },
  { id: 'Z', symbol: 'Z', i18nKey: 'pauliZ' },
  { id: 'S', symbol: 'S', i18nKey: 'phaseS' },
  { id: 'T', symbol: 'T', i18nKey: 'phaseT' },
];

export interface QuantumPipelineRibbonProps {
  className?: string;
  /** Active phase highlight */
  activePhase?: 'prepare' | 'transform' | 'measure';
  /** Callback fired when a state preset is selected */
  onPreparePreset?: (preset: StatePreset) => void;
  /** Callback fired when a gate transform is triggered */
  onTransformGate?: (gate: string) => void;
  /** Callback fired when wavefunction collapse is triggered */
  onMeasure?: () => void;
  /** Callback fired to reset quantum state */
  onReset?: () => void;
  /** Last measurement outcome override */
  lastOutcome?: 0 | 1 | null;
  /** Whether the ribbon is disabled */
  disabled?: boolean;
}

/**
 * QuantumPipelineRibbon:
 * Sleek bottom-center control bar with 3 unified tactical phases:
 * [1. PREPARE] -> [2. TRANSFORM] -> [3. MEASURE].
 */
export const QuantumPipelineRibbon: React.FC<QuantumPipelineRibbonProps> = ({
  className = '',
  activePhase,
  onPreparePreset,
  onTransformGate,
  onMeasure,
  onReset,
  lastOutcome = null,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const [activePresetId, setActivePresetId] = useState<string | null>('zero');

  const handleSelectPreset = (preset: StatePreset) => {
    if (disabled) return;
    setActivePresetId(preset.id);
    playVectorSnap();

    const fullPreset: StatePreset = {
      ...preset,
      label: t(`ribbon.presets.${preset.id}.label`),
      description: t(`ribbon.presets.${preset.id}.desc`),
    };
    onPreparePreset?.(fullPreset);
  };

  const handleApplyGate = (gate: string) => {
    if (disabled) return;
    setActivePresetId(null);
    playGateSweep(gate);
    onTransformGate?.(gate);
  };

  const handleMeasure = () => {
    if (disabled) return;
    playCollapseDrop();
    onMeasure?.();
  };

  const handleReset = () => {
    if (disabled) return;
    setActivePresetId('zero');
    playVectorSnap();
    onReset?.();
  };

  return (
    <nav
      data-testid="quantum-pipeline-ribbon"
      aria-label={t('ribbon.aria_label')}
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center gap-1.5 sm:gap-2.5 px-3 py-2 rounded-2xl border border-border bg-card/90 backdrop-blur-md shadow-2xl max-w-[95vw] overflow-x-auto select-none ${className}`.trim()}
    >
      {/* PHASE 1: PREPARE */}
      <div
        data-testid="phase-prepare"
        className={`flex items-center gap-1 transition-opacity ${
          activePhase && activePhase !== 'prepare' ? 'opacity-75' : 'opacity-100'
        }`}
      >
        <span className="hidden sm:inline text-[9px] font-mono tracking-wider text-muted-foreground uppercase mr-1">
          {t('ribbon.prepare')}
        </span>
        <button
          type="button"
          onClick={handleReset}
          disabled={disabled}
          title={t('ribbon.reset_title')}
          aria-label={t('ribbon.reset_aria')}
          className="p-1.5 rounded-lg border border-border hover:border-primary text-muted-foreground hover:text-foreground hover:bg-secondary transition-all disabled:opacity-40 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-warning" />
        </button>
        <div className="flex items-center gap-0.5 sm:gap-1">
          {STATE_PRESETS.slice(0, 4).map((p) => {
            const isSelected = activePresetId === p.id;
            const pLabel = t(`ribbon.presets.${p.id}.label`);
            const pDesc = t(`ribbon.presets.${p.id}.desc`);

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPreset(p)}
                disabled={disabled}
                title={`${pLabel}: ${pDesc}`}
                aria-label={`Prepare ${pLabel}`}
                className={`px-2 py-1 text-xs font-mono font-semibold rounded-md border transition-all disabled:opacity-40 cursor-pointer ${
                  isSelected
                    ? 'bg-secondary border-primary text-primary shadow-sm shadow-cyan-500/20'
                    : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                }`}
              >
                {p.symbol}
              </button>
            );
          })}
        </div>
      </div>

      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />

      {/* PHASE 2: TRANSFORM */}
      <div
        data-testid="phase-transform"
        className={`flex items-center gap-1 transition-opacity ${
          activePhase && activePhase !== 'transform' ? 'opacity-75' : 'opacity-100'
        }`}
      >
        <span className="hidden sm:inline text-[9px] font-mono tracking-wider text-muted-foreground uppercase mr-1">
          {t('ribbon.transform')}
        </span>
        <div className="flex items-center gap-0.5 sm:gap-1">
          {PIPELINE_GATES.map((g) => {
            const gName = t(`gates.${g.i18nKey}.name`);
            const gDesc = t(`gates.${g.i18nKey}.desc`);

            return (
              <button
                key={g.id}
                type="button"
                onClick={() => handleApplyGate(g.id)}
                disabled={disabled}
                title={`${gName}: ${gDesc}`}
                aria-label={`Apply ${gName} Gate`}
                className="px-2 py-1 text-xs font-mono font-bold rounded-md border border-border bg-card text-foreground hover:border-quantum-purple hover:text-quantum-purple hover:bg-secondary transition-all disabled:opacity-40 active:scale-95 shadow-sm cursor-pointer"
              >
                {g.symbol}
              </button>
            );
          })}
        </div>
      </div>

      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />

      {/* PHASE 3: MEASURE */}
      <div
        data-testid="phase-measure"
        className={`flex items-center gap-1.5 transition-opacity ${
          activePhase && activePhase !== 'measure' ? 'opacity-75' : 'opacity-100'
        }`}
      >
        <span className="hidden sm:inline text-[9px] font-mono tracking-wider text-muted-foreground uppercase mr-1">
          {t('ribbon.measure')}
        </span>
        <button
          type="button"
          onClick={handleMeasure}
          disabled={disabled}
          title={t('ribbon.collapse_title')}
          aria-label={t('ribbon.collapse_aria')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary bg-secondary hover:bg-card text-primary text-xs font-mono font-bold tracking-wider transition-all shadow-sm active:scale-95 disabled:opacity-40 cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 text-primary" />
          <span>{t('ribbon.collapse')}</span>
        </button>

        {lastOutcome !== null && (
          <span
            data-testid="pipeline-outcome-badge"
            className="px-2 py-1 rounded border border-success/40 bg-success/10 text-success font-mono text-xs font-bold animate-pulse"
          >
            |{lastOutcome}⟩
          </span>
        )}
      </div>
    </nav>
  );
};

export default QuantumPipelineRibbon;
