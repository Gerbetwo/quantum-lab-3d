import React, { useState } from 'react';

interface TeachingCircuitStepProps {
  onComplete?: (completed: boolean) => void;
  onStateChange?: (state: { slots: ('—' | 'X' | 'Z' | 'H')[]; result: unknown; bellPrepared: boolean }) => void;
}

type GateType = '—' | 'X' | 'Z' | 'H';
const GATE_CYCLE: GateType[] = ['—', 'X', 'Z', 'H'];

export const TeachingCircuitStep: React.FC<TeachingCircuitStepProps> = ({ onComplete, onStateChange }) => {
  const [slots, setSlots] = useState<GateType[]>(['—', '—', '—']);
  const [result, setResult] = useState<{ ket: string; p0: number; p1: number; description: string } | null>(null);
  const [isStale, setIsStale] = useState<boolean>(false);
  const [bellPrepared, setBellPrepared] = useState<boolean>(false);
  const [completed, setCompleted] = useState<boolean>(false);

  const cycleGate = (index: number) => {
    setSlots(prev => {
      const next = [...prev];
      const currentIdx = GATE_CYCLE.indexOf(next[index]);
      next[index] = GATE_CYCLE[(currentIdx + 1) % GATE_CYCLE.length];
      return next;
    });
    setIsStale(true); // Edits invalidate stale results
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      cycleGate(index);
    }
  };

  const handleRunCircuit = () => {
    // Domain gate simulation logic for 3 slots starting from |0⟩ (empty slots act as identity)
    let p0 = 1.0;
    let p1 = 0.0;
    let ket = '|0⟩';

    slots.forEach(gate => {
      if (gate === 'X') {
        const temp = p0;
        p0 = p1;
        p1 = temp;
        ket = p0 > 0.99 ? '|0⟩' : p1 > 0.99 ? '|1⟩' : '(|0⟩ + |1⟩)/√2';
      } else if (gate === 'H') {
        p0 = 0.5;
        p1 = 0.5;
        ket = '(|0⟩ + |1⟩)/√2';
      } else if (gate === 'Z') {
        // Z gate applies phase shift (-1) on |1⟩, probabilities remain invariant
        ket = p1 > 0.01 ? '-|1⟩' : ket;
      }
      // '—' is identity (no-op)
    });

    const executionResult = {
      ket,
      p0,
      p1,
      description: `Executed circuit slots [${slots.join(', ')}] on initial state |0⟩.`,
    };

    setResult(executionResult);
    setIsStale(false);
    triggerCompletion();

    if (onStateChange) {
      onStateChange({ slots, result: executionResult, bellPrepared });
    }
  };

  const handlePrepareBell = () => {
    setBellPrepared(true);
    const bellResult = {
      ket: '(|00⟩ + |11⟩)/√2',
      p0: 0.5,
      p1: 0.5,
      description: 'Canonical Bell Pair helper executed successfully across two qubits.',
    };
    setResult(bellResult);
    setIsStale(false);
    triggerCompletion();

    if (onStateChange) {
      onStateChange({ slots, result: bellResult, bellPrepared: true });
    }
  };

  const triggerCompletion = () => {
    if (!completed) {
      setCompleted(true);
      if (onComplete) onComplete(true);
    }
  };

  return (
    <div className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border" role="region" aria-label="Teaching Circuit Step">
      <h3 className="text-xl font-bold mb-3">Teaching Circuit & Gate Sequence</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Construct a simple 3-slot gate sequence. Each slot cycles through <span className="font-mono text-accent">— → X → Z → H → —</span>. Empty slots act as identity gates.
      </p>

      {/* Exactly Three Labelled Slots */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {slots.map((gate, idx) => (
          <div key={idx} className="bg-card p-4 rounded-lg border border-border text-center">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground block mb-2">Slot {idx + 1}</span>
            <button
              type="button"
              onClick={() => cycleGate(idx)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className="w-full py-4 bg-background hover:bg-muted text-accent font-mono text-2xl font-bold rounded border border-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400"
              aria-label={`Slot ${idx + 1}, current gate ${gate}. Click or press space to cycle gate.`}
            >
              {gate}
            </button>
            <span className="text-[10px] text-muted-foreground mt-2 block">Click to cycle gate</span>
          </div>
        ))}
      </div>

      {/* Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleRunCircuit}
            className="px-5 py-2.5 bg-primary text-primary-foreground hover:opacity-90 active:bg-cyan-700 text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-cyan-400"
            aria-label="Run teaching circuit simulation"
          >
            Run Circuit
          </button>
          <button
            type="button"
            onClick={handlePrepareBell}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-purple-400"
            aria-label="Prepare Bell pair using canonical helper"
          >
            Prepare Bell Pair
          </button>
        </div>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {completed ? '✓ Step complete' : 'Configure slots & run to complete'}
        </span>
      </div>

      {/* Results Container with Stale Invalidation Notice */}
      <div className="bg-card p-5 rounded-lg border border-border">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Simulation Output</span>
          {isStale && (
            <span className="text-xs font-semibold text-amber-300 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-700" aria-live="polite">
              ⚠️ Circuit modified — results stale. Re-run required.
            </span>
          )}
        </div>

        {result ? (
          <div>
            <div className="text-2xl font-mono font-bold text-accent mb-2" aria-live="polite">
              |ψ⟩ = {result.ket}
            </div>
            <p className="text-xs text-muted-foreground mb-3">{result.description}</p>
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border text-xs">
              <div>
                <span className="text-muted-foreground block">P(|0⟩) Probability</span>
                <span className="font-mono text-base text-emerald-300">{(result.p0 * 100).toFixed(0)}%</span>
              </div>
              <div>
                <span className="text-muted-foreground block">P(|1⟩) Probability</span>
                <span className="font-mono text-base text-emerald-300">{(result.p1 * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground italic">
            Run the circuit or prepare a bell pair to inspect statevector and probabilities.
          </div>
        )}
      </div>
    </div>
  );
};

export default TeachingCircuitStep;
