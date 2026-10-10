import React from 'react';
import { useQuantumStore } from '../../store/useQuantumStore';
import { GlassCard } from '../ui/GlassCard';

export const MathDock: React.FC = () => {
  const theta = useQuantumStore((s) => s.theta);
  const phi = useQuantumStore((s) => s.phi);
  const measureQubit = useQuantumStore((s) => s.measureQubit);
  const temperatureK = useQuantumStore((s) => s.temperatureK);
  const coherenceTimeUs = useQuantumStore((s) => s.coherenceTimeUs);
  const setAngles = useQuantumStore((s) => s.setAngles);
  const setTemperature = useQuantumStore((s) => s.setTemperature);

  const alpha = Math.cos(theta / 2).toFixed(3);
  const beta = Math.sin(theta / 2).toFixed(3);
  const prob0 = (Math.cos(theta / 2) ** 2 * 100).toFixed(1);
  const prob1 = (Math.sin(theta / 2) ** 2 * 100).toFixed(1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
      <GlassCard title="Quantum State Vector" badge="LaTeX Pure">
        <div className="p-2 hud-font-mono text-sm text-cyan-200 bg-background/60 rounded border border-cyan-900/40 my-2">
          |ψ⟩ = {alpha}|0⟩ + {beta}e^(i·{phi.toFixed(2)})|1⟩
        </div>
        <div className="mt-3 flex flex-col gap-2">
          <label className="text-xs text-muted-foreground flex justify-between">
            <span>Polar Angle (θ): {(theta * 180 / Math.PI).toFixed(0)}°</span>
          </label>
          <input
            type="range"
            min="0"
            max={Math.PI}
            step="0.01"
            value={theta}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAngles(parseFloat(e.target.value), phi)}
            className="w-full accent-cyan-400 cursor-pointer"
          />
        </div>
      </GlassCard>

      <GlassCard title="Measurement Probabilities" badge="Zero-Spoiler">
        <div className="space-y-3 my-1">
          <div>
            <div className="flex justify-between text-xs hud-font-mono mb-1">
              <span className="text-accent">P(|0⟩)</span>
              <span>{prob0}%</span>
            </div>
            <div className="w-full h-2 bg-card rounded-full overflow-hidden">
              <div className="h-full bg-cyan-400 transition-all duration-300" style={{ width: `${prob0}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs hud-font-mono mb-1">
              <span className="text-purple-400">P(|1⟩)</span>
              <span>{prob1}%</span>
            </div>
            <div className="w-full h-2 bg-card rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 transition-all duration-300" style={{ width: `${prob1}%` }} />
            </div>
          </div>
        </div>
        <button
          onClick={() => measureQubit()}
          className="mt-3 w-full py-2 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider hud-font-mono transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)]"
        >
          Execute Wavefunction Collapse
        </button>
      </GlassCard>

      <GlassCard title="Cryogenic Environment" badge="Decoherence">
        <div className="space-y-2 text-xs hud-font-mono">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Temperature:</span>
            <span className="text-amber-400 font-bold">{temperatureK.toFixed(3)} K</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Coherence T₂:</span>
            <span className="text-emerald-400 font-bold">{coherenceTimeUs} μs</span>
          </div>
          <div className="pt-2">
            <label className="text-muted-foreground block mb-1">Thermal Fluctuation Controller</label>
            <input
              type="range"
              min="0.01"
              max="2.0"
              step="0.01"
              value={temperatureK}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
