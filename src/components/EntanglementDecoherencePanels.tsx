'use client';

import React from 'react';

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
  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            4. Entanglement <span className="text-primary text-sm font-mono font-normal">[Bell Pair]</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Correlated Bell state |Φ⁺⟩ = 1/√2(|00⟩ + |11⟩) with instantaneous measurement correlation.
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
            <span className="text-xs font-mono uppercase text-muted-foreground block font-semibold">State Indicator</span>
            <div className="text-2xl font-mono font-bold text-primary mt-1">|00⟩</div>
            <span className="text-xs font-mono text-muted-foreground mt-1 block">
              {entangledPair ? (entangledPair.state === '|00⟩' ? 'Observed (100%)' : '0%') : '50% Born Probability'}
            </span>
          </div>

          <div
            className={`p-4 rounded-xl border transition-all ${
              entangledPair?.state === '|11⟩'
                ? 'bg-secondary border-border ring-2 ring-ring'
                : 'bg-background border-border'
            }`}
          >
            <span className="text-xs font-mono uppercase text-muted-foreground block font-semibold">State Indicator</span>
            <div className="text-2xl font-mono font-bold text-foreground mt-1">|11⟩</div>
            <span className="text-xs font-mono text-muted-foreground mt-1 block">
              {entangledPair ? (entangledPair.state === '|11⟩' ? 'Observed (100%)' : '0%') : '50% Born Probability'}
            </span>
          </div>
        </div>

        {/* Correlated Pair Telemetry */}
        <div className="p-4 rounded-xl bg-background border border-border space-y-3">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold block">
            Correlated Pair Telemetry
          </span>
          <div className="grid grid-cols-2 gap-3 text-sm font-mono">
            <div className="p-3 rounded-lg bg-card border border-border">
              <span className="text-muted-foreground text-xs block">Alice (q0)</span>
              <span className="text-primary font-bold text-lg">
                {entangledPair ? `|${entangledPair.alice}⟩` : '|ψ⟩'}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-card border border-border">
              <span className="text-muted-foreground text-xs block">Bob (q1)</span>
              <span className="text-foreground font-bold text-lg">
                {entangledPair ? `|${entangledPair.bob}⟩` : '|ψ⟩'}
              </span>
            </div>
          </div>
          <div className="text-xs font-mono text-muted-foreground">
            Correlation:{' '}
            <span className="text-success font-bold">
              {entangledPair ? `Perfect Correlation: ${entangledPair.state}` : 'Unbroken Entanglement (EPR)'}
            </span>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-border/80 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            type="button"
            onClick={onMeasure}
            className="flex-1 py-3 px-6 rounded-lg bg-linear-to-r from-success to-success hover:from-success hover:to-success text-background font-bold text-sm tracking-wide transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
          >
            Measure Entangled Pair
          </button>
          {entangledPair && (
            <div className="px-4 py-2.5 rounded-lg bg-secondary border border-success text-success font-mono text-base font-bold text-center">
              Result: {entangledPair.state}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onReset}
          className="w-full py-2.5 px-4 rounded-lg bg-secondary hover:bg-secondary border border-border hover:border-border text-foreground hover:text-white font-medium text-sm transition-all active:scale-95 cursor-pointer"
        >
          Reset to |Φ⁺⟩ Pair
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
  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            5. Decoherence <span className="text-primary text-sm font-mono font-normal">[Cryostat]</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Thermal noise degrades qubit coherence. T₂ coherence decay damps vector purity into the Bloch sphere interior.
          </p>
        </div>

        {/* Temperature Slider (15mK to 300mK) */}
        <div className="p-4 rounded-xl bg-background border border-border space-y-3">
          <div className="flex justify-between items-center text-sm font-mono">
            <span className="text-muted-foreground font-semibold uppercase text-xs">Temperature Slider</span>
            <span className="text-primary font-bold text-base">{temperature} mK</span>
          </div>
          <input
            type="range"
            min={15}
            max={300}
            value={temperature}
            onChange={(e) => onTemperatureChange(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
            <span>15 mK (Cryo)</span>
            <span>150 mK</span>
            <span>300 mK (Noise)</span>
          </div>
        </div>

        {/* Coherence Telemetry */}
        <div className="p-4 rounded-xl bg-background border border-border space-y-3">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground font-semibold block">
            Decoherence Telemetry
          </span>
          <div className="grid grid-cols-2 gap-3 text-sm font-mono">
            <div className="p-3 rounded-lg bg-card border border-border">
              <span className="text-muted-foreground text-xs block">T₂ Coherence Time:</span>
              <span className="text-primary font-bold text-lg">{t2Time.toFixed(1)} μs</span>
            </div>
            <div className="p-3 rounded-lg bg-card border border-border">
              <span className="text-muted-foreground text-xs block">Bloch Purity:</span>
              <span className="text-success font-bold text-lg">{(vectorPurity * 100).toFixed(1)}%</span>
            </div>
          </div>
          <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-primary to-emerald-400 transition-all duration-200"
              style={{ width: `${vectorPurity * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-border/80 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {[15, 150, 300].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onTemperatureChange(t)}
              className="py-2 px-3 rounded-lg bg-secondary hover:bg-muted text-foreground font-mono text-xs font-semibold cursor-pointer border border-border"
            >
              {t} mK
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onReset}
          className="w-full py-2.5 px-4 rounded-lg bg-secondary hover:bg-secondary border border-border hover:border-border text-foreground hover:text-white font-medium text-sm transition-all active:scale-95 cursor-pointer"
        >
          Reset Temperature (15 mK)
        </button>
      </div>
    </>
  );
}
