'use client';

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

  const alpha = Math.cos(theta / 2);
  const beta = Math.sin(theta / 2);
  const prob0 = (alpha ** 2 * 100).toFixed(1);
  const prob1 = (beta ** 2 * 100).toFixed(1);

  return (
    <div className="flex flex-col gap-3 w-full">
      <GlassCard title="Dirac State Vector" badge="|ψ⟩">
        <div className="p-2 hud-font-mono text-sm text-accent-light bg-background-60 rounded border border-accent-border my-1">
          |ψ⟩ = {alpha.toFixed(3)}|0⟩ + {beta.toFixed(3)}|1⟩
        </div>
        <div className="mt-2 flex flex-col gap-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>α = Math.cos(θ/2) = {alpha.toFixed(3)}</span>
            <span>β = Math.sin(θ/2) = {beta.toFixed(3)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Polar (θ): {(theta * 180 / Math.PI).toFixed(0)}°</span>
            <span>Azimuthal (φ): {(phi * 180 / Math.PI).toFixed(0)}°</span>
          </div>
          <input
            type="range"
            min="0"
            max={Math.PI}
            step="0.01"
            value={theta}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAngles(parseFloat(e.target.value), phi)}
            className="w-full accent-cyan-400 cursor-pointer mt-1"
          />
        </div>
      </GlassCard>

      <GlassCard title="Measurement Probabilities" badge="Zero-Spoiler">
        <div className="space-y-3 my-1">
          <div>
            <div className="flex justify-between text-xs hud-font-mono mb-1">
              <span className="text-accent font-semibold">P(|0⟩) = α²</span>
              <span>{prob0}%</span>
            </div>
            <div className="w-full h-2 bg-card rounded-full overflow-hidden">
              <div className="h-full bg-accent transition-all duration-300" style={{ width: `${prob0}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs hud-font-mono mb-1">
              <span className="text-axis-y font-semibold">P(|1⟩) = β²</span>
              <span>{prob1}%</span>
            </div>
            <div className="w-full h-2 bg-card rounded-full overflow-hidden">
              <div className="h-full bg-quantum-purple transition-all duration-300" style={{ width: `${prob1}%` }} />
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => measureQubit()}
          className="mt-3 w-full py-2 rounded bg-accent hover:bg-accent text-accent-foreground font-bold text-xs uppercase tracking-wider hud-font-mono transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)] cursor-pointer"
        >
          Execute Wavefunction Collapse
        </button>
      </GlassCard>

      <GlassCard title="Cryogenic Environment" badge="Decoherence">
        <div className="space-y-2 text-xs hud-font-mono">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Temperature:</span>
            <span className="text-warning font-bold">{temperatureK.toFixed(3)} K</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Coherence T₂:</span>
            <span className="text-success font-bold">{coherenceTimeUs.toFixed(1)} μs</span>
          </div>
          <div className="pt-1">
            <label className="text-muted-foreground block mb-1">Thermal Fluctuation Controller</label>
            <input
              type="range"
              min="0.01"
              max="2.0"
              step="0.01"
              value={temperatureK}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTemperature(parseFloat(e.target.value) * 1000)}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
