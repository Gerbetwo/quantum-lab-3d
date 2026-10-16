'use client';

import React, { useState } from 'react';
import { useQuantumStore } from '@/store/useQuantumStore';
import { BlochSphereWorkspace } from '@/features/quantum-core/BlochViewport';
import { EntanglementOverlay } from '@/features/quantum-core/EntanglementOverlay';
import { RotateCcw, Sparkles, Zap, Flame, Split } from 'lucide-react';

export default function SandboxPage() {
  const theta = useQuantumStore((s) => s.theta);
  const phi = useQuantumStore((s) => s.phi);
  const temperatureK = useQuantumStore((s) => s.temperatureK);
  const coherenceTimeUs = useQuantumStore((s) => s.coherenceTimeUs);
  const isEntangled = useQuantumStore((s) => s.isEntangled);
  const lastOutcome = useQuantumStore((s) => s.lastOutcome);

  const setTheta = useQuantumStore((s) => s.setTheta);
  const setPhi = useQuantumStore((s) => s.setPhi);
  const setTemperatureK = useQuantumStore((s) => s.setTemperatureK);
  const setEntangled = useQuantumStore((s) => s.setEntangled);
  const applyGate = useQuantumStore((s) => s.applyGate);
  const measure = useQuantumStore((s) => s.measure);
  const resetState = useQuantumStore((s) => s.resetState);

  const [activeTab, setActiveTab] = useState<'angles' | 'gates' | 'thermal'>('angles');
  const tempMilliKelvin = Math.round(temperatureK * 1000);
  const p0 = Math.cos(theta / 2) ** 2;

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-61px)] overflow-hidden p-4 gap-4 bg-background">
      {/* Left (60%): 3D Viewport & Entanglement Overlay */}
      <div className="w-full lg:w-[60%] h-full flex flex-col min-h-0 gap-3">
        <div className="flex-1 min-h-0">
          <BlochSphereWorkspace />
        </div>
        {isEntangled && (
          <div className="shrink-0">
            <EntanglementOverlay />
          </div>
        )}
      </div>

      {/* Right (40%): Unconstrained Experimentation Controls */}
      <div className="w-full lg:w-[40%] h-full flex flex-col gap-3 overflow-y-auto pr-1">
        {/* Sandbox Header */}
        <div className="p-4 rounded-xl border border-purple-500/30 bg-card/75 backdrop-blur-md flex items-center justify-between gap-3 shadow-lg">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-mono font-semibold text-purple-400 uppercase tracking-wider">
                Quantum Sandbox Lab
              </span>
            </div>
            <h1 className="text-sm font-bold text-foreground mt-0.5">Unconstrained Qubit Workbench</h1>
          </div>
          <button
            type="button"
            onClick={() => resetState()}
            title="Reset to |0⟩ Ground State"
            className="p-2 rounded-lg bg-surface-2 hover:bg-surface-3 text-muted-foreground hover:text-foreground border border-edge transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-surface-2 border border-edge">
          <button
            type="button"
            onClick={() => setActiveTab('angles')}
            className={`py-1.5 rounded text-xs font-mono font-semibold transition-all ${
              activeTab === 'angles' ? 'bg-cyan/20 text-cyan border border-cyan/40' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Angles (θ, φ)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gates')}
            className={`py-1.5 rounded text-xs font-mono font-semibold transition-all ${
              activeTab === 'gates' ? 'bg-cyan/20 text-cyan border border-cyan/40' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Gate Palette
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('thermal')}
            className={`py-1.5 rounded text-xs font-mono font-semibold transition-all ${
              activeTab === 'thermal' ? 'bg-cyan/20 text-cyan border border-cyan/40' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Thermal Decoherence
          </button>
        </div>

        {/* Tab 1: Continuous Angle Rotations */}
        {activeTab === 'angles' && (
          <div className="p-4 rounded-xl border border-border bg-card/60 flex flex-col gap-4 text-xs font-mono">
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Polar Angle θ (Superposition):</span>
                <span className="text-cyan font-bold">{((theta * 180) / Math.PI).toFixed(1)}° ({(theta / Math.PI).toFixed(2)}π)</span>
              </div>
              <input
                type="range"
                min={0}
                max={Math.PI}
                step={0.01}
                value={theta}
                onChange={(e) => setTheta(parseFloat(e.target.value))}
                className="w-full accent-cyan cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Azimuthal Phase φ:</span>
                <span className="text-purple-400 font-bold">{((phi * 180) / Math.PI).toFixed(1)}° ({(phi / Math.PI).toFixed(2)}π)</span>
              </div>
              <input
                type="range"
                min={0}
                max={2 * Math.PI}
                step={0.01}
                value={phi}
                onChange={(e) => setPhi(parseFloat(e.target.value))}
                className="w-full accent-purple-400 cursor-pointer"
              />
            </div>

            <div className="pt-2 border-t border-border flex items-center justify-between text-muted-foreground">
              <span>P(|0⟩): <b className="text-cyan">{(p0 * 100).toFixed(1)}%</b></span>
              <span>P(|1⟩): <b className="text-cyan">{((1 - p0) * 100).toFixed(1)}%</b></span>
            </div>
          </div>
        )}

        {/* Tab 2: Unitary Gate Execution */}
        {activeTab === 'gates' && (
          <div className="p-4 rounded-xl border border-border bg-card/60 flex flex-col gap-3">
            <span className="text-xs font-mono font-semibold text-cyan uppercase flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Unitary Gate Rotations
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(['H', 'X', 'Y', 'Z', 'S', 'T'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => applyGate(g)}
                  className="py-2.5 rounded-lg text-xs font-mono font-bold bg-surface-2 hover:bg-surface-3 text-cyan border border-edge hover:border-cyan/40 transition-all active:scale-95"
                >
                  [{g}] Gate
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Cryogenic Decoherence Environment */}
        {activeTab === 'thermal' && (
          <div className="p-4 rounded-xl border border-border bg-card/60 flex flex-col gap-3 text-xs font-mono">
            <span className="font-semibold text-amber-400 uppercase flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5" /> Thermal Chamber Simulation (15 mK – 300 K)
            </span>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Chamber Temperature:</span>
              <span className="text-amber-400 font-bold">{tempMilliKelvin >= 1000 ? `${(tempMilliKelvin / 1000).toFixed(1)} K` : `${tempMilliKelvin} mK`}</span>
            </div>
            <input
              type="range"
              min="15"
              max="300000"
              step="50"
              value={tempMilliKelvin}
              onChange={(e) => setTemperatureK(parseFloat(e.target.value) / 1000)}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <div className="p-2.5 rounded-lg bg-surface-2 border border-edge flex justify-between">
              <span className="text-muted-foreground">T₂(T) = 250·e^(-T/800) μs:</span>
              <span className="text-emerald-400 font-bold">{coherenceTimeUs.toFixed(1)} μs</span>
            </div>
          </div>
        )}

        {/* Mode Toggles & Measurement Action */}
        <div className="p-4 rounded-xl border border-border bg-card/60 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setEntangled(!isEntangled)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border flex items-center gap-1.5 transition-all ${
                isEntangled ? 'bg-purple-500/20 text-purple-300 border-purple-400' : 'bg-surface-2 text-muted-foreground border-edge'
              }`}
            >
              <Split className="w-3.5 h-3.5" /> {isEntangled ? 'Bell Pair |Φ⁺⟩ Active' : 'Enable Bell Entanglement'}
            </button>
            {lastOutcome !== null && (
              <span className="text-xs font-mono text-cyan">Outcome: |{lastOutcome}⟩</span>
            )}
          </div>

          <button
            type="button"
            onClick={() => measure()}
            className="w-full py-2 rounded-xl text-xs font-mono font-bold bg-accent hover:bg-accent/90 text-accent-foreground shadow-md transition-all active:scale-95"
          >
            Measure & Collapse Wavefunction
          </button>
        </div>
      </div>
    </div>
  );
}
