'use client';

import React, { useState } from 'react';
import {
  type QubitState,
  type StateMetrics,
  computeStateMetrics,
  applyGate,
  measureState,
} from '@/lib/quantumCore';
import { BlochSphereViewport } from './BlochSphereViewport';

function formatDirac(m: StateMetrics): string {
  const round = (val: number) => {
    const v = Math.abs(val) < 1e-4 ? 0 : val;
    return v.toFixed(3);
  };

  const alpha = round(m.alpha);
  const br = m.betaReal;
  const bi = m.betaImag;

  let betaTerm = '';
  if (Math.abs(bi) < 1e-4) {
    if (br < -1e-4) {
      betaTerm = `- ${round(Math.abs(br))}|1⟩`;
    } else {
      betaTerm = `+ ${round(br)}|1⟩`;
    }
  } else if (Math.abs(br) < 1e-4) {
    if (bi < -1e-4) {
      betaTerm = `- ${round(Math.abs(bi))}i|1⟩`;
    } else {
      betaTerm = `+ ${round(bi)}i|1⟩`;
    }
  } else {
    const sign = bi < 0 ? '-' : '+';
    betaTerm = `+ (${round(br)} ${sign} ${round(Math.abs(bi))}i)|1⟩`;
  }

  return `|ψ⟩ = ${alpha}|0⟩ ${betaTerm}`;
}

export function QuantumLab() {
  const [state, setState] = useState<QubitState>({
    theta: Math.PI / 2,
    phi: 0,
  });
  const [lastOutcome, setLastOutcome] = useState<0 | 1 | null>(null);

  const metrics = computeStateMetrics(state);
  const p0Percent = (metrics.prob0 * 100).toFixed(1);
  const p1Percent = (metrics.prob1 * 100).toFixed(1);

  const handleGate = (gate: 'H' | 'X' | 'Z') => {
    setState((prev) => applyGate(prev, gate));
    setLastOutcome(null);
  };

  const handleMeasure = () => {
    const res = measureState(state);
    setState(res.newState);
    setLastOutcome(res.outcome);
  };

  const handleReset = () => {
    setState({ theta: 0, phi: 0 });
    setLastOutcome(null);
  };

  return (
    <div className="w-full min-h-screen bg-[#0B0E14] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-10">
      <div className="w-full max-w-6xl bg-slate-900/70 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        {/* Left Column (or Top on mobile): 3D Bloch Sphere Viewport */}
        <div className="relative min-h-90 sm:min-h-110 lg:min-h-140 bg-slate-950/80 border-b lg:border-b-0 lg:border-r border-slate-800 flex items-center justify-center p-4">
          <BlochSphereViewport state={state} className="w-full h-full min-h-85" />
          <div className="absolute top-4 left-4 pointer-events-none">
            <span className="text-xs uppercase tracking-widest text-cyan-400 font-mono font-semibold bg-slate-950/80 px-2.5 py-1 rounded border border-cyan-500/20">
              Bloch Sphere 3D
            </span>
          </div>
        </div>

        {/* Right Column (or Bottom on mobile): Control Dashboard */}
        <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2">
                Quantum Lab <span className="text-cyan-400 text-sm font-mono font-normal">[v1.0]</span>
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Single-qubit quantum simulation workspace with real-time state kinematics.
              </p>
            </div>

            {/* State Vector Readout */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold block">
                State Vector Readout
              </span>
              <div className="text-xl sm:text-2xl font-mono text-cyan-300 font-bold tracking-wide">
                {formatDirac(metrics)}
              </div>
              <div className="text-xs font-mono text-slate-500">
                θ: {(state.theta / Math.PI).toFixed(3)}π rad &bull; φ: {(state.phi / Math.PI).toFixed(3)}π rad
              </div>
            </div>

            {/* Born Probabilities */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold block">
                Born Probabilities
              </span>
              <div className="flex justify-between items-center text-sm font-mono font-semibold">
                <span className="text-cyan-400">P(|0⟩): {p0Percent}%</span>
                <span className="text-purple-400">P(|1⟩): {p1Percent}%</span>
              </div>
              <div
                className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden flex"
                role="progressbar"
                aria-label="[Born Probabilities]"
                aria-valuenow={Math.round(metrics.prob0 * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full bg-cyan-400 transition-all duration-300"
                  style={{ width: `${metrics.prob0 * 100}%` }}
                />
                <div
                  className="h-full bg-purple-500 transition-all duration-300"
                  style={{ width: `${metrics.prob1 * 100}%` }}
                />
              </div>
            </div>

            {/* Gate Action Buttons */}
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold block">
                Quantum Gates
              </span>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleGate('H')}
                  className="py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700/80 active:scale-95 border border-cyan-500/30 text-cyan-300 font-mono font-bold text-sm transition-all shadow-sm hover:shadow-cyan-500/10 cursor-pointer"
                >
                  Hadamard (H)
                </button>
                <button
                  type="button"
                  onClick={() => handleGate('X')}
                  className="py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700/80 active:scale-95 border border-cyan-500/30 text-cyan-300 font-mono font-bold text-sm transition-all shadow-sm hover:shadow-cyan-500/10 cursor-pointer"
                >
                  Pauli-X (X)
                </button>
                <button
                  type="button"
                  onClick={() => handleGate('Z')}
                  className="py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700/80 active:scale-95 border border-cyan-500/30 text-cyan-300 font-mono font-bold text-sm transition-all shadow-sm hover:shadow-cyan-500/10 cursor-pointer"
                >
                  Pauli-Z (Z)
                </button>
              </div>
            </div>
          </div>

          {/* Action Row: Measurement & Reset */}
          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={handleMeasure}
                className="flex-1 py-3 px-6 rounded-lg bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
              >
                Measure State
              </button>
              {lastOutcome !== null && (
                <div className="px-4 py-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono text-base font-bold text-center">
                  Outcome: |{lastOutcome}⟩
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="w-full py-2.5 px-4 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white font-medium text-sm transition-all active:scale-95 cursor-pointer"
            >
              Reset to |0⟩
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuantumLab;
