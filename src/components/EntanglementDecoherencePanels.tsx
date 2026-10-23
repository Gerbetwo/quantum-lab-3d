'use client';

import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';

export interface EntanglementPanelProps {
  entangledPair: { alice: 0 | 1; bob: 0 | 1; state: string } | null;
  onMeasure: () => void;
  onReset: () => void;
}

export function EntanglementPanel({
  entangledPair,
  onMeasure,
  onReset,
}: EntanglementPanelProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            {t('panels.entanglement.title')} <span className="text-primary text-sm font-mono font-normal">[Bell Pair]</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('panels.entanglement.desc')}
          </p>
        </div>

        {/* Correlated Qubit Indicators (|00⟩ vs |11⟩) */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className={`p-4 rounded-xl border transition-all ${
              entangledPair?.state === '|00⟩'
                ? 'bg-secondary border-primary ring-2 ring-ring'
                : 'bg-background border-border'
            }`}
          >
            <span className="text-xs font-mono uppercase text-muted-foreground block font-semibold">
              {t('panels.entanglement.state_indicator')}
            </span>
            <div className="text-2xl font-mono font-bold text-primary mt-1">|00⟩</div>
            <span className="text-xs font-mono text-muted-foreground mt-1 block">
              {entangledPair
                ? entangledPair.state === '|00⟩'
                  ? t('panels.entanglement.observed')
                  : t('panels.entanglement.zero_percent')
                : t('panels.entanglement.born_50')}
            </span>
          </div>

          <div
            className={`p-4 rounded-xl border transition-all ${
              entangledPair?.state === '|11⟩'
                ? 'bg-secondary border-border ring-2 ring-ring'
                : 'bg-background border-border'
            }`}
          >
            <span className="text-xs font-mono uppercase text-muted-foreground block font-semibold">
              {t('panels.entanglement.state_indicator')}
            </span>
            <div className="text-2xl font-mono font-bold text-foreground mt-1">|11⟩</div>
            <span className="text-xs font-mono text-muted-foreground mt-1 block">
              {entangledPair
                ? entangledPair.state === '|11⟩'
                  ? t('panels.entanglement.observed')
                  : t('panels.entanglement.zero_percent')
                : t('panels.entanglement.born_50')}
            </span>
          </div>
        </div>

        {/* Correlated Pair Telemetry */}
        <div className="p-4 rounded-xl bg-background border border-border space-y-3">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold block">
            {t('panels.entanglement.telemetry')}
          </span>
          <div className="grid grid-cols-2 gap-3 text-sm font-mono">
            <div className="p-3 rounded-lg bg-card border border-border">
              <span className="text-muted-foreground text-xs block">{t('panels.entanglement.alice')}</span>
              <span className="text-primary font-bold text-lg">
                {entangledPair ? `|${entangledPair.alice}⟩` : '|ψ⟩'}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-card border border-border">
              <span className="text-muted-foreground text-xs block">{t('panels.entanglement.bob')}</span>
              <span className="text-foreground font-bold text-lg">
                {entangledPair ? `|${entangledPair.bob}⟩` : '|ψ⟩'}
              </span>
            </div>
          </div>
          <div className="text-xs font-mono text-muted-foreground">
            {t('panels.entanglement.correlation_label')}{' '}
            <span className="text-success font-bold">
              {entangledPair
                ? t('panels.entanglement.perfect_correlation', { state: entangledPair.state })
                : t('panels.entanglement.unbroken')}
            </span>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-border/80 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            type="button"
            onClick={onMeasure}
            className="flex-1 py-3 px-6 rounded-lg bg-linear-to-r from-success to-success hover:from-success hover:to-success text-background font-bold text-sm tracking-wide transition-all shadow-lg shadow-success/20 active:scale-95 cursor-pointer"
          >
            {t('panels.entanglement.measure')}
          </button>
          {entangledPair && (
            <div className="px-4 py-2.5 rounded-lg bg-secondary border border-success text-success font-mono text-base font-bold text-center">
              {t('panels.entanglement.result', { state: entangledPair.state })}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onReset}
          className="w-full py-2.5 px-4 rounded-lg bg-secondary hover:bg-secondary border border-border hover:border-border text-foreground hover:text-foreground font-medium text-sm transition-all active:scale-95 cursor-pointer"
        >
          {t('panels.entanglement.reset')}
        </button>
      </div>
    </>
  );
}

export interface DecoherencePanelProps {
  temperature: number;
  t2Time: number;
  vectorPurity: number;
  onTemperatureChange: (temp: number) => void;
  onReset: () => void;
}

export function DecoherencePanel({
  temperature,
  t2Time,
  vectorPurity,
  onTemperatureChange,
  onReset,
}: DecoherencePanelProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            {t('panels.decoherence.title')} <span className="text-primary text-sm font-mono font-normal">[Cryostat]</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('panels.decoherence.desc')}
          </p>
        </div>

        {/* Temperature Slider (15mK to 300mK) */}
        <div className="p-4 rounded-xl bg-background border border-border space-y-3">
          <div className="flex justify-between items-center text-sm font-mono">
            <span className="text-muted-foreground font-semibold uppercase text-xs">
              {t('panels.decoherence.temperature_slider')}
            </span>
            <span className="text-primary font-bold text-base">{temperature} mK</span>
          </div>
          <input
            type="range"
            min={15}
            max={300}
            value={temperature}
            onChange={(e) => onTemperatureChange(Number(e.target.value))}
            className="w-full accent-primary cursor-pointer"
          />
          <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
            <span>{t('panels.decoherence.cryo_label')}</span>
            <span>{t('panels.decoherence.mid_label')}</span>
            <span>{t('panels.decoherence.noise_label')}</span>
          </div>
        </div>

        {/* Coherence Telemetry */}
        <div className="p-4 rounded-xl bg-background border border-border space-y-3">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold block">
            {t('panels.decoherence.telemetry')}
          </span>
          <div className="grid grid-cols-2 gap-3 text-sm font-mono">
            <div className="p-3 rounded-lg bg-card border border-border">
              <span className="text-muted-foreground text-xs block">{t('panels.decoherence.t2_time')}</span>
              <span className="text-primary font-bold text-lg">{t2Time.toFixed(1)} μs</span>
            </div>
            <div className="p-3 rounded-lg bg-card border border-border">
              <span className="text-muted-foreground text-xs block">{t('panels.decoherence.purity')}</span>
              <span className="text-success font-bold text-lg">{(vectorPurity * 100).toFixed(1)}%</span>
            </div>
          </div>
          <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-primary to-success transition-all duration-200"
              style={{ width: `${vectorPurity * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-border/80 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {[15, 150, 300].map((tVal) => (
            <button
              key={tVal}
              type="button"
              onClick={() => onTemperatureChange(tVal)}
              className="py-2 px-3 rounded-lg bg-secondary hover:bg-muted text-foreground font-mono text-xs font-semibold cursor-pointer border border-border"
            >
              {tVal} mK
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onReset}
          className="w-full py-2.5 px-4 rounded-lg bg-secondary hover:bg-secondary border border-border hover:border-border text-foreground hover:text-foreground font-medium text-sm transition-all active:scale-95 cursor-pointer"
        >
          {t('panels.decoherence.reset')}
        </button>
      </div>
    </>
  );
}
