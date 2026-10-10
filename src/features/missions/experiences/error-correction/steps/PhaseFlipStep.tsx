import React, { useState } from 'react';

interface PhaseFlipStepProps {
  onComplete?: (completed: boolean) => void;
  onStateChange?: (state: { phaseFlipped: boolean }) => void;
}

export const PhaseFlipStep: React.FC<PhaseFlipStepProps> = ({ onComplete, onStateChange }) => {
  const [flipped, setFlipped] = useState<boolean>(false);

  const handlePhaseFlip = () => {
    if (flipped) return;
    setFlipped(true);
    if (onComplete) onComplete(true);
    if (onStateChange) onStateChange({ phaseFlipped: true });
  };

  return (
    <div className="p-6 bg-slate-900 rounded-xl text-slate-100 shadow-lg border border-slate-800" role="region" aria-label="Phase Flip Step">
      <h3 className="text-xl font-bold mb-3">Quantum Phase Flip (Z Error)</h3>
      <p className="text-sm text-slate-300 mb-4">
        A phase flip alters the relative sign between computational basis states (e.g., transforming |+⟩ = (|0⟩ + |1⟩) / √2 into (|0⟩ - |1⟩) / √2). It is a uniquely quantum error and must <em>never</em> be represented as a classical 0 ↔ 1 bit flip.
      </p>

      <div className="bg-slate-800 p-5 rounded-lg mb-6 border border-slate-700 text-center">
        <span className="text-xs uppercase tracking-wider text-slate-400 block mb-2">Statevector Representation</span>
        <div className="text-2xl font-mono font-bold text-cyan-400 mb-2" aria-live="polite">
          |ψ⟩ = {flipped ? '(|0⟩ - |1⟩) / √2' : '(|0⟩ + |1⟩) / √2'}
        </div>
        <p className="text-xs text-slate-400">
          Computational probabilities remain P(|0⟩) = 50% | P(|1⟩) = 50%, but the relative phase is inverted.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handlePhaseFlip}
          disabled={flipped}
          className={`px-6 py-2.5 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 ${flipped ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white'}`}
          aria-label="Apply phase flip error"
        >
          {flipped ? 'Phase Flip Applied' : 'Apply Phase Flip Error'}
        </button>
        <span className="text-xs text-slate-400" aria-live="polite">
          {flipped ? '✓ Step complete' : 'Awaiting phase flip action'}
        </span>
      </div>
    </div>
  );
};

export default PhaseFlipStep;
