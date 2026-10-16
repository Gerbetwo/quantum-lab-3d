'use client';

import React, { useState } from 'react';
import { useQuantumStore } from '@/store/useQuantumStore';

export const GlassCard: React.FC<{ children: React.ReactNode; className?: string; title?: string; badge?: string }> = ({
  children, className = '', title, badge,
}) => (
  <div className={`p-3.5 rounded-xl border border-accent/20 bg-card/60 backdrop-blur-md shadow-lg ${className}`}>
    {(title || badge) && (
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-border/80">
        {title && <h3 className="text-xs font-mono font-semibold tracking-wider text-accent uppercase">{title}</h3>}
        {badge && <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/30">{badge}</span>}
      </div>
    )}
    {children}
  </div>
);

export const Tooltip: React.FC<{ content: string; children: React.ReactElement; className?: string }> = ({ content, children, className }) => {
  const [show, setShow] = useState(false);
  return (
    <div className={`relative inline-flex ${className ?? ''}`} onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div role="tooltip" className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-background text-foreground text-xs rounded border border-border shadow-lg whitespace-nowrap z-50 pointer-events-none">
          {content}
        </div>
      )}
    </div>
  );
};

export const StateVectorCard: React.FC<{ className?: string }> = ({ className }) => {
  const theta = useQuantumStore((s) => s.theta);
  const phi = useQuantumStore((s) => s.phi);
  const alpha = Math.cos(theta / 2);
  const beta = Math.sin(theta / 2);

  return (
    <GlassCard title="Dirac State Vector" badge="|ψ⟩" className={className}>
      <div className="p-2 font-mono text-xs text-accent bg-background/60 rounded border border-accent/30 my-1">
        |ψ⟩ = {alpha.toFixed(3)}|0⟩ + {beta.toFixed(3)}|1⟩
      </div>
      <div className="flex justify-between text-[11px] font-mono text-muted-foreground mt-1">
        <span>α = cos(θ/2) = {alpha.toFixed(3)}</span>
        <span>β = sin(θ/2) = {beta.toFixed(3)}</span>
      </div>
      <div className="flex justify-between text-[11px] font-mono text-muted-foreground mt-0.5">
        <span>θ: {((theta * 180) / Math.PI).toFixed(1)}°</span>
        <span>φ: {((phi * 180) / Math.PI).toFixed(1)}°</span>
      </div>
    </GlassCard>
  );
};

export const MeasurementCard: React.FC<{ className?: string }> = ({ className }) => {
  const theta = useQuantumStore((s) => s.theta);
  const currentPhase = useQuantumStore((s) => s.currentPhase);
  const measure = useQuantumStore((s) => s.measure);
  const setPrediction = useQuantumStore((s) => s.setPrediction);
  const transitionPhase = useQuantumStore((s) => s.transitionPhase);

  const [selectedPrediction, setSelectedPrediction] = useState<'|0>' | '|1>' | '50/50' | null>(null);
  const [revealedOutcome, setRevealedOutcome] = useState<0 | 1 | null>(null);

  const p0 = Math.cos(theta / 2) ** 2;
  const p1 = Math.sin(theta / 2) ** 2;
  const isPrediction = currentPhase === 'PREDICTION';
  const isHidden = isPrediction && revealedOutcome === null;

  const handlePredict = (pred: '|0>' | '|1>' | '50/50') => {
    setSelectedPrediction(pred);
    setPrediction(pred === '|0>' ? 1 : pred === '|1>' ? 0 : 0.5);
  };

  const handleMeasure = () => {
    const outcome = measure();
    setRevealedOutcome(outcome);
    if (isPrediction) transitionPhase('MEASUREMENT');
  };

  return (
    <GlassCard title="Measurement Probabilities" badge="Zero-Spoiler" className={className}>
      <div className="space-y-2 text-xs font-mono my-1">
        {isHidden ? (
          <div className="py-2 text-center text-muted-foreground italic bg-background/40 rounded border border-border/40">
            [LOCKED: Submit prediction to reveal Born probabilities]
          </div>
        ) : (
          <>
            <div>
              <div className="flex justify-between text-muted-foreground mb-1">
                <span>P(|0⟩)</span><span className="text-accent font-bold">{(p0 * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-accent transition-all duration-300" style={{ width: `${p0 * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-muted-foreground mb-1">
                <span>P(|1⟩)</span><span className="text-cyan-400 font-bold">{(p1 * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400 transition-all duration-300" style={{ width: `${p1 * 100}%` }} />
              </div>
            </div>
          </>
        )}

        {isPrediction && (
          <div className="pt-2 border-t border-border/60 flex flex-col gap-1.5">
            <span className="text-[11px] text-muted-foreground">Select Prediction:</span>
            <div className="grid grid-cols-3 gap-1.5">
              {(['|0>', '|1>', '50/50'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handlePredict(opt)}
                  className={`py-1 rounded text-xs border cursor-pointer ${
                    selectedPrediction === opt ? 'bg-accent text-background font-bold border-accent' : 'bg-card hover:bg-muted text-foreground border-border'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleMeasure}
          className="w-full mt-2 py-1.5 px-3 bg-accent hover:opacity-90 text-background font-bold rounded-lg text-xs transition-opacity cursor-pointer shadow-md"
        >
          Measure State (Collapse)
        </button>
      </div>
    </GlassCard>
  );
};

export const CryostatCard: React.FC<{ className?: string }> = ({ className }) => {
  const temperatureK = useQuantumStore((s) => s.temperatureK);
  const coherenceTimeUs = useQuantumStore((s) => s.coherenceTimeUs);
  const setTemperature = useQuantumStore((s) => s.setTemperature);
  const tempMilliKelvin = Math.round(temperatureK * 1000);

  return (
    <GlassCard title="Cryogenic Environment" badge="Decoherence" className={className}>
      <div className="space-y-2 text-xs font-mono">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Temperature:</span>
          <span className="text-amber-400 font-bold">{tempMilliKelvin} mK ({temperatureK.toFixed(3)} K)</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Coherence T₂(T):</span>
          <span className="text-emerald-400 font-bold">{coherenceTimeUs.toFixed(1)} μs</span>
        </div>
        <div className="pt-1">
          <div className="flex justify-between text-muted-foreground mb-1 text-[11px]">
            <label htmlFor="temp-range">Thermal Fluctuation Controller</label>
            <span>{tempMilliKelvin >= 1000 ? `${(tempMilliKelvin / 1000).toFixed(1)} K` : `${tempMilliKelvin} mK`}</span>
          </div>
          <input
            id="temp-range"
            type="range"
            min="15"
            max="300000"
            step="10"
            value={tempMilliKelvin}
            onChange={(e) => setTemperature(parseFloat(e.target.value) / 1000)}
            className="w-full accent-amber-400 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>15 mK (0.015 K)</span><span>150 K</span><span>300,000 mK (300 K)</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export const MathDock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex flex-col gap-3 w-full ${className}`}>
    <StateVectorCard />
    <MeasurementCard />
    <CryostatCard />
  </div>
);

export default MathDock;
