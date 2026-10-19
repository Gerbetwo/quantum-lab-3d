'use client';

import React, { useState } from 'react';
import { useQuantumStore } from '@/store/useQuantumStore';
import { useTranslation } from '@/lib/i18n';
import { GlassCard, TelemetryValue } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { ChevronDown, ChevronUp } from 'lucide-react';

export { GlassCard, TelemetryValue };

export interface MathDockProps {
  className?: string;
  defaultCollapsed?: boolean;
}

export const MathDock: React.FC<MathDockProps> = ({
  className = '',
  defaultCollapsed = false,
}) => {
  const { t } = useTranslation();
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
      aria-label={t('math_dock.aria_label')}
      className={`fixed bottom-4 right-4 z-20 w-80 select-none ${className}`.trim()}
    >
      <GlassCard
        title={t('math_dock.dirac_telemetry_title')}
        badge="|ψ⟩"
        headerRight={
          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            data-testid="math-dock-toggle"
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? t('math_dock.expand_tooltip') : t('math_dock.collapse_tooltip')}
            title={isCollapsed ? t('math_dock.expand_tooltip') : t('math_dock.collapse_tooltip')}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-surface-2 transition-colors focus:outline-none focus:ring-1 focus:ring-ring"
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
              <div className="flex items-center justify-between text-[10px] tracking-wider text-muted-foreground uppercase">
                <span>{t('math_dock.state_vector_label')}</span>
                <span className="tabular-nums">
                  θ={((safeTheta * 180) / Math.PI).toFixed(1)}° φ={((safePhi * 180) / Math.PI).toFixed(1)}°
                </span>
              </div>
              <div
                data-testid="state-vector-formula"
                className="p-2 font-mono text-xs font-semibold text-quantum-cyan bg-surface-2 rounded border border-sim tabular-nums"
              >
                |ψ⟩ = {alpha.toFixed(3)}|0⟩ + {beta.toFixed(3)}|1⟩
              </div>
              <div className="flex justify-between text-[11px] font-mono text-muted-foreground tabular-nums px-0.5">
                <span>α = cos(θ/2) = {alpha.toFixed(3)}</span>
                <span>β = sin(θ/2) = {beta.toFixed(3)}</span>
              </div>
            </div>

            {/* 2. Born Probabilities Readout */}
            <div className="space-y-1.5 pt-2 border-t border-border">
              <div className="flex items-center justify-between text-[10px] tracking-wider text-muted-foreground uppercase">
                <span>{t('math_dock.born_probabilities')}</span>
                <span className="tabular-nums text-muted-foreground/80">{t('math_dock.born_check')}</span>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-mono mb-1">
                  <span className="text-muted-foreground">{t('math_dock.born_p0')}</span>
                  <span className="font-bold tabular-nums text-quantum-cyan">
                    {(p0 * 100).toFixed(1)}%{' '}
                    <span className="font-normal text-[10px] text-muted-foreground/80">({p0.toFixed(3)})</span>
                  </span>
                </div>
                <div className="w-full h-1.5 bg-surface-3 rounded-none overflow-hidden">
                  <div
                    className="h-full bg-quantum-cyan transition-all duration-200"
                    style={{ width: `${Math.min(100, Math.max(0, p0 * 100))}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-mono mb-1">
                  <span className="text-muted-foreground">{t('math_dock.born_p1')}</span>
                  <span className="font-bold tabular-nums text-quantum-purple">
                    {(p1 * 100).toFixed(1)}%{' '}
                    <span className="font-normal text-[10px] text-muted-foreground/80">({p1.toFixed(3)})</span>
                  </span>
                </div>
                <div className="w-full h-1.5 bg-surface-3 rounded-none overflow-hidden">
                  <div
                    className="h-full bg-quantum-purple transition-all duration-200"
                    style={{ width: `${Math.min(100, Math.max(0, p1 * 100))}%` }}
                  />
                </div>
              </div>

              <Button
                variant="primary"
                onClick={() => measure()}
                className="w-full mt-1.5 text-xs py-1"
              >
                {lastOutcome !== null ? `Outcome |${lastOutcome}⟩ — Re-measure` : t('math_dock.measure_button')}
              </Button>
            </div>

            {/* 3. T2 Decoherence Readout */}
            <div className="space-y-1.5 pt-2 border-t border-border">
              <div className="flex items-center justify-between text-[10px] tracking-wider text-muted-foreground uppercase">
                <span>{t('math_dock.decoherence_telemetry')}</span>
                <span className="text-success font-bold">{t('math_dock.online')}</span>
              </div>

              <TelemetryValue
                label={t('math_dock.coherence_t2')}
                value={coherenceTimeUs.toFixed(1)}
                unit="μs"
                highlight="emerald"
              />
              <TelemetryValue
                label={t('math_dock.cryo_temp')}
                value={`${tempMilliKelvin} mK`}
                unit={`(${temperatureK.toFixed(3)} K)`}
                highlight="amber"
              />

              <div className="pt-1">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <label htmlFor="mathdock-temp-slider">{t('math_dock.thermal_controller')}</label>
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
                  className="w-full accent-warning cursor-pointer h-1.5 bg-surface-3"
                />
                <div className="flex justify-between text-[9px] text-muted-foreground font-mono mt-0.5">
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
