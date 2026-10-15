'use client';

import React, { useState } from 'react';
import { useQuantumStore } from '../../store/useQuantumStore';
import { GlassCard } from '../ui/GlassCard';
import { bellState } from '../../core/math/presets';
import { measureEntangledQubit } from '../../core/math/entanglement';

export const MathDock: React.FC = () => {
  const theta = useQuantumStore((s) => s.theta);
  const phi = useQuantumStore((s) => s.phi);
  const temperatureK = useQuantumStore((s) => s.temperatureK);
  const coherenceTimeUs = useQuantumStore((s) => s.coherenceTimeUs);
  const setAngles = useQuantumStore((s) => s.setAngles);
  const setTemperature = useQuantumStore((s) => s.setTemperature);
  const activeMission = useQuantumStore((s) => s.activeMission);

  // Zero-Spoiler Prediction & Outcome state
  const [selectedPrediction, setSelectedPrediction] = useState<'|0>' | '|1>' | '50/50' | null>(null);
  const [revealedOutcome, setRevealedOutcome] = useState<0 | 1 | null>(null);
  const [revealedProb, setRevealedProb] = useState<number | null>(null);
  const [lastPrediction, setLastPrediction] = useState<'|0>' | '|1>' | '50/50' | null>(null);

  // Mission 2 (Entanglement) state
  const [stationA, setStationA] = useState<0 | 1 | null>(null);
  const [stationB, setStationB] = useState<0 | 1 | null>(null);

  const alpha = Math.cos(theta / 2);
  const beta = Math.sin(theta / 2);
  const bornProb0 = Math.cos(theta / 2) ** 2;
  const bornProb1 = Math.sin(theta / 2) ** 2;
  const prob0Str = (bornProb0 * 100).toFixed(1);
  const prob1Str = (bornProb1 * 100).toFixed(1);

  const handleMeasureMission01 = () => {
    if (!selectedPrediction) return;

    // Sample Born probability cos^2(theta/2)
    const outcome: 0 | 1 = Math.random() < bornProb0 ? 0 : 1;
    const probability = outcome === 0 ? bornProb0 : bornProb1;

    // Snap theta in useQuantumStore to 0 (|0>) or Math.PI (|1>)
    setAngles(outcome === 0 ? 0 : Math.PI, phi);

    // Reveal prediction vs outcome
    setRevealedOutcome(outcome);
    setRevealedProb(probability);
    setLastPrediction(selectedPrediction);
  };

  const handleMeasureStationA = () => {
    // bellState('phi+') provides (|00> + |11>) / sqrt(2)
    bellState('phi+');
    const res = measureEntangledQubit();
    const outcome = res.aliceOutcome ?? (Math.random() < 0.5 ? 0 : 1);
    setStationA(outcome);
    setStationB(outcome); // Instantaneously same bit (00 or 11, never 01 or 10)
  };

  const tempMilliKelvin = Math.round(temperatureK * 1000);

  return (
    <div className="flex flex-col gap-3 w-full">
      <GlassCard title="Dirac State Vector" badge="|ψ⟩">
        <div className="p-2 hud-font-mono text-sm text-accent-light bg-background-60 rounded border border-accent-border my-1">
          |ψ⟩ = {alpha.toFixed(3)}|0⟩ + {beta.toFixed(3)}|1⟩
        </div>
        <div className="mt-2 flex flex-col gap-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>α = cos(θ/2) = {alpha.toFixed(3)}</span>
            <span>β = sin(θ/2) = {beta.toFixed(3)}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Polar (θ): {(theta * 180 / Math.PI).toFixed(0)}°</span>
            <span>Azimuthal (φ): {(phi * 180 / Math.PI).toFixed(0)}°</span>
          </div>

          {/* Angle Sliders */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono text-muted-foreground">
              <label htmlFor="dock-theta">θ (Polar)</label>
              <span>{theta.toFixed(3)} rad</span>
            </div>
            <input
              id="dock-theta"
              type="range"
              min="0"
              max={Math.PI}
              step="0.01"
              value={theta}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setAngles(parseFloat(e.target.value), phi);
                setRevealedOutcome(null);
              }}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono text-muted-foreground">
              <label htmlFor="dock-phi">φ (Azimuthal)</label>
              <span>{phi.toFixed(3)} rad</span>
            </div>
            <input
              id="dock-phi"
              type="range"
              min="0"
              max={2 * Math.PI}
              step="0.01"
              value={phi}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setAngles(theta, parseFloat(e.target.value));
              }}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Canonical Presets */}
          <div className="pt-1">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Presets</div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setAngles(0, phi);
                  setRevealedOutcome(null);
                }}
                className="flex-1 py-1 px-2 rounded bg-background border border-border hover:bg-card text-xs font-mono font-medium"
              >
                |0⟩
              </button>
              <button
                type="button"
                onClick={() => {
                  setAngles(Math.PI / 2, phi);
                  setRevealedOutcome(null);
                }}
                className="flex-1 py-1 px-2 rounded bg-background border border-border hover:bg-card text-xs font-mono font-medium text-accent"
              >
                |+⟩ (θ=π/2)
              </button>
              <button
                type="button"
                onClick={() => {
                  setAngles(Math.PI, phi);
                  setRevealedOutcome(null);
                }}
                className="flex-1 py-1 px-2 rounded bg-background border border-border hover:bg-card text-xs font-mono font-medium"
              >
                |1⟩
              </button>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Measurement Panel: Zero-Spoiler UX for Superposition & Collapse */}
      {(activeMission === 0 || activeMission === 1 || activeMission === undefined) && (
        <GlassCard title="Measurement Probabilities" badge="Zero-Spoiler">
          <div className="space-y-3 my-1">
            <div>
              <div className="flex justify-between text-xs hud-font-mono mb-1">
                <span className="text-accent font-semibold">P(|0⟩) = α²</span>
                <span>{prob0Str}%</span>
              </div>
              <div className="w-full h-2 bg-card rounded-full overflow-hidden">
                <div className="h-full bg-accent transition-all duration-300" style={{ width: `${prob0Str}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs hud-font-mono mb-1">
                <span className="text-axis-y font-semibold">P(|1⟩) = β²</span>
                <span>{prob1Str}%</span>
              </div>
              <div className="w-full h-2 bg-card rounded-full overflow-hidden">
                <div className="h-full bg-quantum-purple transition-all duration-300" style={{ width: `${prob1Str}%` }} />
              </div>
            </div>
          </div>

          {/* Zero-Spoiler Prediction Selector */}
          <div className="mt-3 pt-2 border-t border-border">
            <span className="text-xs text-muted-foreground block mb-1.5 font-semibold">
              Select Prediction before measuring:
            </span>
            <div className="flex gap-2">
              {(['|0>', '|1>', '50/50'] as const).map((pred) => (
                <button
                  key={pred}
                  type="button"
                  onClick={() => setSelectedPrediction(pred)}
                  className={`flex-1 py-1 px-2 rounded text-xs font-mono border transition-all ${
                    selectedPrediction === pred
                      ? 'bg-accent text-accent-foreground border-accent font-bold shadow-[0_0_8px_rgba(0,240,255,0.4)]'
                      : 'bg-background border-border hover:bg-card text-foreground'
                  }`}
                >
                  {pred}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={!selectedPrediction}
            onClick={handleMeasureMission01}
            className={`mt-3 w-full py-2 rounded font-bold text-xs uppercase tracking-wider hud-font-mono transition-all ${
              !selectedPrediction
                ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                : 'bg-accent hover:bg-accent text-accent-foreground shadow-[0_0_15px_rgba(0,240,255,0.3)] cursor-pointer'
            }`}
          >
            Measure (Collapse Wavefunction)
          </button>

          {/* Prediction vs Outcome Reveal */}
          {revealedOutcome !== null && (
            <div className="mt-3 p-2.5 rounded bg-background-80 border border-border text-xs hud-font-mono space-y-1 animate-fadeIn">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Your Prediction:</span>
                <span className="font-bold text-accent">{lastPrediction}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Observed Outcome:</span>
                <span className="font-bold text-success">|{revealedOutcome}⟩</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Born Probability:</span>
                <span className="font-mono">{((revealedProb ?? 0) * 100).toFixed(1)}%</span>
              </div>
            </div>
          )}
        </GlassCard>
      )}

      {/* Mission 2: Entanglement Controls */}
      {activeMission === 2 && (
        <GlassCard title="Bell State |Φ+⟩ Measurement" badge="Entanglement">
          <div className="p-2 hud-font-mono text-xs bg-background-60 rounded border border-accent-border my-1">
            |Φ⁺⟩ = (|00⟩ + |11⟩) / √2
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Measuring Station A collapses the pair instantaneously. Station B is guaranteed to match Station A perfectly.
          </p>
          <button
            type="button"
            onClick={handleMeasureStationA}
            className="mt-3 w-full py-2 rounded bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider hud-font-mono transition-all shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:opacity-90 cursor-pointer"
          >
            Measure Station A
          </button>
          {stationA !== null && (
            <div className="mt-3 p-2.5 rounded bg-background-80 border border-border text-xs hud-font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Station A Outcome:</span>
                <span className="font-bold text-accent">|{stationA}⟩</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Station B Outcome:</span>
                <span className="font-bold text-quantum-purple">|{stationB}⟩</span>
              </div>
              <div className="flex justify-between text-[11px] text-success pt-1 border-t border-border/50">
                <span>Joint State:</span>
                <span className="font-bold">|{stationA}{stationB}⟩ (Correlated)</span>
              </div>
            </div>
          )}
        </GlassCard>
      )}

      {/* Mission 3: Thermal Decoherence */}
      <GlassCard title="Cryogenic Environment" badge="Decoherence">
        <div className="space-y-2 text-xs hud-font-mono">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Temperature:</span>
            <span className="text-warning font-bold">
              {tempMilliKelvin} mK ({temperatureK.toFixed(3)} K)
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Coherence T₂(T):</span>
            <span className="text-success font-bold">{coherenceTimeUs.toFixed(1)} μs</span>
          </div>
          <div className="pt-1">
            <div className="flex justify-between text-muted-foreground mb-1">
              <label htmlFor="temp-range">Thermal Fluctuation Controller</label>
              <span>{tempMilliKelvin >= 1000 ? `${(tempMilliKelvin / 1000).toFixed(1)} K` : `${tempMilliKelvin} mK`}</span>
            </div>
            <input
              id="temp-range"
              type="range"
              min="15"
              max="300000"
              step="5"
              value={tempMilliKelvin}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>15 mK (0.015 K)</span>
              <span>150 K</span>
              <span>300,000 mK (300 K)</span>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
