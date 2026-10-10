import React, { useState } from 'react';

interface GateOperationsStepProps {
  stepId?: 'gate-basics' | 'apply-gates' | string;
  onComplete?: (completed: boolean) => void;
  onStateChange?: (state: { ket: string; p0: number; p1: number; lastGate: string | null }) => void;
}

export const GateOperationsStep: React.FC<GateOperationsStepProps> = ({
  stepId = 'apply-gates',
  onComplete,
  onStateChange,
}) => {
  const [ket, setKet] = useState<string>('|0⟩');
  const [p0, setP0] = useState<number>(1.0);
  const [p1, setP1] = useState<number>(0.0);
  const [phaseNote, setPhaseNote] = useState<string | null>(null);
  const [lastGate, setLastGate] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState<boolean>(false);
  const [gateApplied, setGateApplied] = useState<boolean>(false);

  const isBasics = stepId === 'gate-basics';

  const handleAcknowledge = () => {
    setAcknowledged(true);
    if (onComplete) onComplete(true);
  };

  const applyGate = (gate: 'X' | 'Z' | 'H' | 'Reset') => {
    setLastGate(gate);
    setPhaseNote(null);
    let nextKet = ket;
    let nextP0 = p0;
    let nextP1 = p1;

    if (gate === 'Reset') {
      nextKet = '|0⟩';
      nextP0 = 1.0;
      nextP1 = 0.0;
    } else if (gate === 'X') {
      if (p0 > 0.99) {
        nextKet = '|1⟩';
        nextP0 = 0.0;
        nextP1 = 1.0;
      } else if (p1 > 0.99) {
        nextKet = '|0⟩';
        nextP0 = 1.0;
        nextP1 = 0.0;
      } else {
        const temp = nextP0;
        nextP0 = nextP1;
        nextP1 = temp;
        nextKet = '(|0⟩ + |1⟩)/√2';
      }
    } else if (gate === 'Z') {
      if (p0 > 0.99) {
        setPhaseNote('Z gate applied to |0⟩: Phase flip applied (-1), but basis probabilities remain unchanged.');
      } else if (p1 > 0.99) {
        setPhaseNote('Z gate applied to |1⟩: Inverts phase to -|1⟩.');
      } else {
        setPhaseNote('Z gate applied: Introduces relative phase shift.');
      }
    } else if (gate === 'H') {
      nextKet = '(|0⟩ + |1⟩)/√2';
      nextP0 = 0.5;
      nextP1 = 0.5;
    }

    setKet(nextKet);
    setP0(nextP0);
    setP1(nextP1);

    if (!gateApplied) {
      setGateApplied(true);
      if (onComplete) onComplete(true);
    }

    if (onStateChange) {
      onStateChange({ ket: nextKet, p0: nextP0, p1: nextP1, lastGate: gate });
    }
  };

  if (isBasics) {
    return (
      <div className="p-6 bg-slate-900 rounded-xl text-slate-100 shadow-lg border border-slate-800" role="region" aria-label="Gate Basics Step">
        <h3 className="text-xl font-bold mb-3">Quantum Gate Operations: Basics</h3>
        <p className="text-sm text-slate-300 mb-4">
          Quantum gates are unitary transformations that manipulate qubit statevectors. Unlike classical logic gates, quantum gates are reversible and operate on complex probability amplitudes.
        </p>
        <div className="bg-slate-800 p-4 rounded-lg mb-6 border border-slate-700 text-xs text-cyan-300 space-y-2">
          <div>• <strong>X Gate (Quantum NOT):</strong> Flips |0⟩ to |1⟩.</div>
          <div>• <strong>Z Gate (Phase Flip):</strong> Negates the phase of |1⟩ without altering computational basis measurement probabilities.</div>
          <div>• <strong>Hadamard (H) Gate:</strong> Creates equal superposition states ((|0⟩ + |1⟩)/√2).</div>
        </div>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleAcknowledge}
            disabled={acknowledged}
            className={'px-6 py-2.5 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 ' + (acknowledged ? 'bg-emerald-700 text-white cursor-default' : 'bg-cyan-600 hover:bg-cyan-500 text-white')}
            aria-label="Acknowledge gate basics"
          >
            {acknowledged ? '✓ Acknowledged' : 'Acknowledge Gate Basics'}
          </button>
          <span className="text-xs text-slate-400" aria-live="polite">
            {acknowledged ? 'Step completed' : 'Review and acknowledge to proceed'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-900 rounded-xl text-slate-100 shadow-lg border border-slate-800" role="region" aria-label="Gate Operations Interactive Step">
      <h3 className="text-xl font-bold mb-3">Interactive Gate Operations</h3>
      <p className="text-sm text-slate-300 mb-4">
        Apply quantum gates to a single qubit starting at |0⟩. Observe synchronized statevector ket notation and measurement probabilities.
      </p>

      <div className="bg-slate-800 p-5 rounded-lg mb-6 border border-slate-700">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs uppercase tracking-wider text-slate-400">Current Statevector / Ket</span>
          <span className="text-xs font-mono text-cyan-400">Last Gate: {lastGate || 'None'}</span>
        </div>
        <div className="text-3xl font-mono font-bold text-cyan-300 mb-3" aria-live="polite">
          |ψ⟩ = {ket}
        </div>
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-700 text-xs">
          <div>
            <span className="text-slate-400 block mb-1">P(|0⟩) Probability</span>
            <span className="font-mono text-lg text-emerald-300">{(p0 * 100).toFixed(0)}%</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-1">P(|1⟩) Probability</span>
            <span className="font-mono text-lg text-emerald-300">{(p1 * 100).toFixed(0)}%</span>
          </div>
        </div>
        {phaseNote && (
          <div className="mt-3 text-xs text-amber-300 bg-amber-950/40 p-2.5 rounded border border-amber-800" aria-live="polite">
            {phaseNote}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <button
          type="button"
          onClick={() => applyGate('X')}
          className="px-5 py-2.5 bg-cyan-700 hover:bg-cyan-600 active:bg-cyan-800 text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-cyan-400"
          aria-label="Apply Pauli-X gate"
        >
          Apply X Gate
        </button>
        <button
          type="button"
          onClick={() => applyGate('Z')}
          className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-600 active:bg-indigo-800 text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-indigo-400"
          aria-label="Apply Pauli-Z gate"
        >
          Apply Z Gate
        </button>
        <button
          type="button"
          onClick={() => applyGate('H')}
          className="px-5 py-2.5 bg-purple-700 hover:bg-purple-600 active:bg-purple-800 text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-purple-400"
          aria-label="Apply Hadamard gate"
        >
          Apply Hadamard (H)
        </button>
        <button
          type="button"
          onClick={() => applyGate('Reset')}
          className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-slate-400"
          aria-label="Reset qubit to state 0"
        >
          Reset to |0⟩
        </button>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{gateApplied ? '✓ Gate applied and step completed.' : 'Apply any gate to complete step.'}</span>
        <span aria-live="polite">{gateApplied ? 'Completed' : 'Pending Action'}</span>
      </div>
    </div>
  );
};

export default GateOperationsStep;
