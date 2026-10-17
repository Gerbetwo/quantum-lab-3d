'use client';

import React, { useState } from 'react';
import { useQuantumStore } from '@/store/useQuantumStore';
import { GlassCard, TelemetryValue } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { ChevronDown, ChevronUp } from 'lucide-react';

export { GlassCard, TelemetryValue };

export const Tooltip: React.FC<{ content: string; children: React.ReactElement; className?: string }> = ({
  content,
  children,
  className,
}) => {
  const [show, setShow] = useState(false);
  return (
    <div
      className={`relative inline-flex ${className ?? ''}`}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-background text-foreground text-xs rounded border border-border shadow-lg whitespace-nowrap z-50 pointer-events-none"
        >
          {content}
        </div>
      )}
    </div>
  );
};

export const StateVectorCard: React.FC<{ className?: string }> = ({ className }) => {
  const theta = useQuantumStore((s) => s.theta);
  const phi = useQuantumStore((s) => s.phi);
  const safeTheta = Number.isFinite(theta) ? theta : 0;
  const safePhi = Number.isFinite(phi) ? phi : 0;
  const alpha = Math.cos(safeTheta / 2);
  const beta = Math.sin(safeTheta / 2);

  return (
    <GlassCard title="Dirac State Vector" badge="|ψ⟩" telemetryId="TEL.STATE" className={className}>
      <div className="p-2 font-mono text-xs text-sky-700 dark:text-cyan-300 bg-slate-100 dark:bg-slate-900/90 rounded border border-slate-300 dark:border-cyan-500/30 my-1 tabular-nums">
        |ψ⟩ = {alpha.toFixed(3)}|0⟩ + {beta.toFixed(3)}|1⟩
      </div>
      <div className="flex justify-between text-[11px] font-mono text-slate-600 dark:text-slate-400 mt-1 tabular-nums">
        <span>α = cos(θ/2) = {alpha.toFixed(3)}</span>
        <span>β = sin(θ/2) = {beta.toFixed(3)}</span>
      </div>
      <div className="flex justify-between text-[11px] font-mono text-slate-600 dark:text-slate-400 mt-0.5 tabular-nums">
        <span>θ: {((safeTheta * 180) / Math.PI).toFixed(1)}°</span>
        <span>φ: {((safePhi * 180) / Math.PI).toFixed(1)}°</span>
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

  const safeTheta = Number.isFinite(theta) ? theta : 0;
  const p0 = Math.cos(safeTheta / 2) ** 2;
  const p1 = Math.sin(safeTheta / 2) ** 2;
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
    <GlassCard title="Born Probabilities" badge="P(|0⟩)/P(|1⟩)" telemetryId="TEL.BORN" className={className}>
      <div className="space-y-2 text-xs font-mono my-1">
        {isHidden ? (
          <div className="py-2 text-center text-slate-500 dark:text-slate-400 italic bg-slate-100 dark:bg-slate-900/60 rounded border border-slate-300 dark:border-slate-800">
            [LOCKED: Submit prediction to reveal Born probabilities]
          </div>
        ) : (
          <>
            <div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                <span>P(|0⟩)</span><span className="text-sky-700 dark:text-cyan-400 font-bold tabular-nums">{(p0 * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-none overflow-hidden">
                <div className="h-full bg-sky-600 dark:bg-cyan-400 transition-all duration-300" style={{ width: `${p0 * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400 mb-1">
                <span>P(|1⟩)</span><span className="text-purple-700 dark:text-purple-400 font-bold tabular-nums">{(p1 * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-none overflow-hidden">
                <div className="h-full bg-purple-600 dark:bg-purple-400 transition-all duration-300" style={{ width: `${p1 * 100}%` }} />
              </div>
            </div>
          </>
        )}

        {isPrediction && (
          <div className="pt-2 border-t border-slate-300 dark:border-slate-800 flex flex-col gap-1.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Select Prediction:</span>
            <div className="grid grid-cols-3 gap-1.5">
              {(['|0>', '|1>', '50/50'] as const).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handlePredict(opt)}
                  className={`py-1 rounded text-xs border cursor-pointer font-mono ${
                    selectedPrediction === opt
                      ? 'bg-sky-600 dark:bg-cyan-500 text-white font-bold border-sky-600 dark:border-cyan-500'
                      : 'bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 text-foreground border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        <Button
          variant="primary"
          cornerNotch
          onClick={handleMeasure}
          className="w-full mt-2"
          telemetryCode="COLLAPSE"
        >
          Measure State (Collapse)
        </Button>
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
    <GlassCard title="Cryogenic Environment" badge="Decoherence" telemetryId="TEL.CRYO" className={className}>
      <div className="space-y-2 text-xs font-mono">
        <TelemetryValue
          label="Temperature"
          value={`${tempMilliKelvin} mK`}
          unit={`(${temperatureK.toFixed(3)} K)`}
          highlight="amber"
        />
        <TelemetryValue
          label="Coherence T₂(T)"
          value={coherenceTimeUs.toFixed(1)}
          unit="μs"
          highlight="emerald"
        />
        <div className="pt-1">
          <div className="flex justify-between text-slate-500 dark:text-slate-400 mb-1 text-[11px]">
            <label htmlFor="cryostat-temp-range">Thermal Fluctuation Controller</label>
            <span className="tabular-nums font-mono">{tempMilliKelvin >= 1000 ? `${(tempMilliKelvin / 1000).toFixed(1)} K` : `${tempMilliKelvin} mK`}</span>
          </div>
          <input
            id="cryostat-temp-range"
            type="range"
            min="15"
            max="300000"
            step="10"
            value={tempMilliKelvin}
            onChange={(e) => setTemperature(parseFloat(e.target.value) / 1000)}
            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800"
          />
          <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1">
            <span>15 mK (0.015 K)</span><span>150 K</span><span>300,000 mK (300 K)</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export interface MathDockProps {
  className?: string;
  defaultCollapsed?: boolean;
}

/**
 * Tactical Dirac Math Dock - Re-anchored as a compact floating widget (fixed bottom-4 right-4 z-20 w-80).
 * Displays Dirac state vector |ψ⟩, Born probabilities (P₀, P₁), and T₂ decoherence readouts in high-rigor monospace text.
 * Includes a collapse/expand toggle button to allow hiding telemetry for full 3D viewport inspection.
 */
export const MathDock: React.FC<MathDockProps> = ({
  className = '',
  defaultCollapsed = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const theta = useQuantumStore((s) => s.theta);
  const phi = useQuantumStore((s) => s.phi);
  const temperatureK = useQuantumStore((s) => s.temperatureK);
  const coherenceTimeUs = useQuantumStore((s) => s.coherenceTimeUs);
  const lastOutcome = useQuantumStore((s) => s.lastOutcome);
  const measure = useQuantumStore((s) => s.measure);
  const setTemperature = useQuantumStore((s) => s.setTemperature);

  const safeTheta = Number.isFinite(theta) ? theta : 0;
  const safePhi = Number.isFinite(phi) ? phi : 0;
  const alpha = Math.cos(safeTheta / 2);
  const beta = Math.sin(safeTheta / 2);

  const p0 = Math.cos(safeTheta / 2) ** 2;
  const p1 = Math.sin(safeTheta / 2) ** 2;
  const tempMilliKelvin = Math.round(temperatureK * 1000);

  return (
    <aside
      data-testid="math-dock"
      aria-label="Quantum Dirac Telemetry Dock"
      className={`fixed bottom-4 right-4 z-20 w-80 select-none ${className}`.trim()}
    >
      <GlassCard
        title="Dirac Telemetry"
        badge="|ψ⟩"
        telemetryId="TEL.01"
        cornerNotch={true}
        variant="telemetry"
        headerRight={
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            data-testid="math-dock-toggle"
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? 'Expand Telemetry Dock' : 'Collapse Telemetry Dock'}
            title={isCollapsed ? 'Expand Telemetry' : 'Collapse Telemetry'}
            className="p-1 rounded text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-cyan-300 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            {isCollapsed ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        }
      >
        {!isCollapsed && (
          <div data-testid="math-dock-content" className="space-y-3 font-mono text-xs">
            {/* 1. Dirac State Vector Readout */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                <span>State Vector</span>
                <span className="tabular-nums">θ={((safeTheta * 180) / Math.PI).toFixed(1)}° φ={((safePhi * 180) / Math.PI).toFixed(1)}°</span>
              </div>
              <div
                data-testid="state-vector-formula"
                className="p-2 font-mono text-xs font-semibold text-sky-700 dark:text-cyan-300 bg-slate-100 dark:bg-slate-900/90 rounded border border-slate-300 dark:border-cyan-500/30 tabular-nums"
              >
                |ψ⟩ = {alpha.toFixed(3)}|0⟩ + {beta.toFixed(3)}|1⟩
              </div>
              <div className="flex justify-between text-[11px] font-mono text-slate-600 dark:text-slate-400 tabular-nums px-0.5">
                <span>α = cos(θ/2) = {alpha.toFixed(3)}</span>
                <span>β = sin(θ/2) = {beta.toFixed(3)}</span>
              </div>
            </div>

            {/* 2. Born Probabilities Readout */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800/80">
              <div className="flex items-center justify-between text-[10px] tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                <span>Born Probabilities</span>
                <span className="tabular-nums text-slate-400">P₀+P₁=1.000</span>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-mono mb-1">
                  <span className="text-slate-600 dark:text-slate-400">P(|0⟩) [Born P₀]</span>
                  <span className="font-bold tabular-nums text-sky-700 dark:text-cyan-400">
                    {(p0 * 100).toFixed(1)}% <span className="font-normal text-[10px] text-slate-400">({p0.toFixed(3)})</span>
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-none overflow-hidden">
                  <div
                    className="h-full bg-sky-600 dark:bg-cyan-400 transition-all duration-200"
                    style={{ width: `${Math.min(100, Math.max(0, p0 * 100))}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-mono mb-1">
                  <span className="text-slate-600 dark:text-slate-400">P(|1⟩) [Born P₁]</span>
                  <span className="font-bold tabular-nums text-purple-700 dark:text-purple-400">
                    {(p1 * 100).toFixed(1)}% <span className="font-normal text-[10px] text-slate-400">({p1.toFixed(3)})</span>
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-none overflow-hidden">
                  <div
                    className="h-full bg-purple-600 dark:bg-purple-400 transition-all duration-200"
                    style={{ width: `${Math.min(100, Math.max(0, p1 * 100))}%` }}
                  />
                </div>
              </div>

              <Button
                variant="primary"
                cornerNotch
                onClick={() => measure()}
                className="w-full mt-1.5 text-xs py-1"
                telemetryCode="MEASURE"
              >
                {lastOutcome !== null ? `Outcome |${lastOutcome}⟩ — Re-measure` : 'Measure State (Collapse)'}
              </Button>
            </div>

            {/* 3. T2 Decoherence Readout */}
            <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800/80">
              <div className="flex items-center justify-between text-[10px] tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                <span>Decoherence Telemetry</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">ONLINE</span>
              </div>

              <TelemetryValue
                label="Coherence T₂(T)"
                value={coherenceTimeUs.toFixed(1)}
                unit="μs"
                highlight="emerald"
              />
              <TelemetryValue
                label="Cryo Temp"
                value={`${tempMilliKelvin} mK`}
                unit={`(${temperatureK.toFixed(3)} K)`}
                highlight="amber"
              />

              <div className="pt-1">
                <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
                  <label htmlFor="mathdock-temp-slider">Thermal Fluctuation Controller</label>
                  <span className="tabular-nums font-mono">
                    {tempMilliKelvin >= 1000 ? `${(tempMilliKelvin / 1000).toFixed(1)} K` : `${tempMilliKelvin} mK`}
                  </span>
                </div>
                <input
                  id="mathdock-temp-slider"
                  type="range"
                  min="15"
                  max="300000"
                  step="10"
                  value={tempMilliKelvin}
                  onChange={(e) => setTemperature(parseFloat(e.target.value) / 1000)}
                  className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800"
                />
                <div className="flex justify-between text-[9px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                  <span>15 mK</span>
                  <span>150 K</span>
                  <span>300 K</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </GlassCard>
    </aside>
  );
};

export default MathDock;
