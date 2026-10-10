import React, { useState } from 'react';

interface PrepareBellStepProps {
  onComplete?: (completed: boolean) => void;
  onStateChange?: (state: { prepared: boolean }) => void;
}

export const PrepareBellStep: React.FC<PrepareBellStepProps> = ({ onComplete, onStateChange }) => {
  const [prepared, setPrepared] = useState<boolean>(false);

  const handlePrepareBell = () => {
    if (prepared) return;
    setPrepared(true);
    if (onComplete) onComplete(true);
    if (onStateChange) onStateChange({ prepared: true });
  };

  return (
    <div className="p-6 bg-slate-900 rounded-xl text-slate-100 shadow-lg border border-slate-800" role="region" aria-label="Prepare Bell Pair Step">
      <h3 className="text-xl font-bold mb-3">Preparing a Bell Pair (Entanglement)</h3>
      <p className="text-sm text-slate-300 mb-4">
        By applying canonical domain gates (Hadamard followed by CNOT) across Station Alice and Station Bob, we generate a maximally entangled Bell state.
      </p>

      {/* Physics Safeguard: Explicitly disclaim FTL messaging */}
      <div className="bg-amber-950/40 border border-amber-600/50 p-4 rounded-lg mb-6 text-xs text-amber-200">
        <strong>Important Physics Note:</strong> Entanglement creates non-local correlations, but it does <em>not</em> allow faster-than-light (FTL) communication or messaging. Measuring one qubit instantaneously correlates with the other, but no signals travel between Alice and Bob faster than light.
      </div>

      <div className="bg-slate-800 p-5 rounded-lg mb-6 border border-slate-700 text-center">
        <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">Canonical Bell State Expression</div>
        <div className="text-2xl font-mono font-bold text-cyan-400 mb-2" aria-live="polite">
          {prepared ? '(|00⟩ + |11⟩) / √2' : 'Unentangled State (Independent)'}
        </div>
        <p className="text-xs text-slate-400">
          Link Status: {prepared ? 'Entangled (Bell Pair Active)' : 'Unlinked / Independent'}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrepareBell}
          disabled={prepared}
          className={`px-6 py-2.5 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 ${prepared ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white'}`}
          aria-label="Prepare Bell pair entanglement"
        >
          {prepared ? 'Bell Pair Prepared' : 'Prepare Bell Pair'}
        </button>
        <span className="text-xs text-slate-400" aria-live="polite">
          {prepared ? '✓ Entanglement step completed' : 'Awaiting bell preparation action'}
        </span>
      </div>
    </div>
  );
};

export default PrepareBellStep;
