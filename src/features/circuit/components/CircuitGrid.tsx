'use client';

import React from 'react';
import type { QuantumCircuit, QubitIndex } from '@/core/math/circuit';

interface CircuitGridProps {
  circuit: QuantumCircuit;
  totalQubits?: number;
  depth?: number;
  playhead?: number;
  activeGate?: string | null;
  onSetPlayhead?: (step: number) => void;
  onPlaceGate: (step: number, qubit: number) => void;
  onRemoveGate?: (gateId: string) => void;
}

export function CircuitGrid({
  circuit,
  totalQubits,
  depth,
  playhead = 0,
  activeGate: _activeGate,
  onSetPlayhead,
  onPlaceGate,
  onRemoveGate,
}: CircuitGridProps) {
  const numQubits = totalQubits ?? circuit?.nQubits ?? 3;
  const gridDepth = depth ?? circuit?.maxDepth ?? 16;

  const qubits = Array.from({ length: Number(numQubits) }, (_, i) => i as QubitIndex);
  const steps = Array.from({ length: Number(gridDepth) }, (_, i) => i);

  const handleKeyDown = (e: React.KeyboardEvent, gateId?: string) => {
    if (e.key === 'Delete' && onRemoveGate && gateId) {
      onRemoveGate(gateId);
    }
  };

  return (
    <div data-testid="circuit-grid" className="flex flex-col bg-slate-900 p-4 rounded-lg overflow-x-auto" role="grid">
      <div className="flex space-x-2 mb-2">
        {steps.map((s) => {
          const isActive = playhead === s;
          return (
            <div
              key={String(s)}
              data-testid={`playhead-${s}`}
              {...(isActive ? { 'data-playhead': 'true' } : {})}
              onClick={() => onSetPlayhead && onSetPlayhead(Number(s))}
              className={`px-3 py-1 cursor-pointer rounded text-xs ${isActive ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-300'}`}
            >
              {String(s)}
            </div>
          );
        })}
      </div>
      <div className="flex flex-col">
        {qubits.map((q) => (
          <div key={String(q)} role="row" className="flex items-center space-x-1 my-1">
            <div className="w-10 text-right pr-2 text-slate-400 text-sm">q{String(q)}</div>
            {steps.map((s) => {
              const stepObj = circuit?.steps?.find((st) => st.step === s);
              const gate = stepObj?.gates?.find((g) => {
                const targets = g.targets || (g.targetQubit !== undefined ? [g.targetQubit] : []);
                return targets.includes(q);
              });

              return (
                <div
                  key={String(s)}
                  role="gridcell"
                  data-testid={`cell-${s}-${q}`}
                  tabIndex={0}
                  onKeyDown={(e) => handleKeyDown(e, gate?.id)}
                  onClick={() => {
                    if (gate && onRemoveGate && gate.id) {
                      onRemoveGate(gate.id);
                    } else {
                      onPlaceGate(Number(s), Number(q));
                    }
                  }}
                  className="w-10 h-10 bg-slate-800 border border-slate-700 rounded flex items-center justify-center cursor-pointer hover:bg-slate-700 text-cyan-300 font-bold text-xs"
                >
                  {gate ? String(gate.type || '') : ''}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default CircuitGrid;
