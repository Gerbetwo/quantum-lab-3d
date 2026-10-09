import React, { useMemo, useState, useEffect } from 'react';
import type { QuantumCircuit, QubitIndex, GateType } from '@/core/quantum/circuit';

export interface CircuitGridProps {
  circuit: QuantumCircuit;
  activeGate?: GateType | null | string;
  playhead?: number;
  onPlaceGate?: (stepIndex: number, qubitIndex: QubitIndex, gateType?: string) => void;
  onRemoveGate?: (gateId: string) => void;
  onSetPlayhead?: React.Dispatch<React.SetStateAction<number>> | ((val: number) => void);
}

export const CircuitGrid: React.FC<CircuitGridProps> = ({
  circuit,
  playhead = 0,
  onPlaceGate,
  onRemoveGate,
  onSetPlayhead,
}) => {
  const { numQubits, nQubits, depth = 16, steps } = circuit;
  const totalQubits = numQubits ?? nQubits ?? 6;
  const [selectedGateId, setSelectedGateId] = useState<string | null>(null);

  const qubits = useMemo(
    () => Array.from({ length: totalQubits }, (_, i) => i as QubitIndex),
    [totalQubits]
  );

  const stepsArray = useMemo(
    () => Array.from({ length: depth }, (_, i) => i),
    [depth]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedGateId && onRemoveGate) {
        onRemoveGate(selectedGateId);
        setSelectedGateId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedGateId, onRemoveGate]);

  return (
    <div data-testid="circuit-grid" role="grid" className="p-4 bg-slate-900 rounded-lg overflow-x-auto">
      <div className="flex space-x-1 mb-2 ml-12">
        {stepsArray.map((s) => {
          const isPlayheadCol = s === playhead;
          return (
            <div
              key={s}
              data-testid={`playhead-${s}`}
              data-playhead={isPlayheadCol ? 'true' : undefined}
              onClick={() => onSetPlayhead && onSetPlayhead(s)}
              className={`w-10 text-center text-xs cursor-pointer py-1 rounded ${
                isPlayheadCol ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              {s}
            </div>
          );
        })}
      </div>

      {qubits.map((q) => (
        <div key={q} role="row" className="flex items-center space-x-1 my-1">
          <div className="w-10 text-right pr-2 text-slate-400 text-sm">q{q}</div>
          {stepsArray.map((s) => {
            const stepObj = steps?.find((st) => st.step === s);
            const gate = stepObj?.gates.find(
              (g) => g.targets?.includes(q) || g.targetQubit === q
            );
            const isPlayheadCol = s === playhead;

            return (
              <div
                key={s}
                role="gridcell"
                tabIndex={0}
                data-testid={`cell-${s}-${q}`}
                data-playhead={isPlayheadCol ? 'true' : undefined}
                onClick={() => {
                  if (gate?.id) {
                    setSelectedGateId(gate.id);
                  }
                  if (onPlaceGate) {
                    onPlaceGate(s, q);
                  }
                }}
                onKeyDown={(e) => {
                  if ((e.key === 'Delete' || e.key === 'Backspace')) {
                    if (gate?.id && onRemoveGate) {
                      onRemoveGate(gate.id);
                    }
                  }
                }}
                className={`w-10 h-10 border flex items-center justify-center text-cyan-400 cursor-pointer select-none transition-colors ${
                  isPlayheadCol ? 'border-cyan-500 bg-slate-800/60' : 'border-slate-700 bg-slate-900'
                } ${selectedGateId === gate?.id ? 'ring-2 ring-yellow-400' : ''}`}
              >
                {gate ? (
                  <span className="font-mono text-xs font-semibold px-1 py-0.5 rounded bg-cyan-950 text-cyan-300">
                    {gate.type}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default CircuitGrid;
