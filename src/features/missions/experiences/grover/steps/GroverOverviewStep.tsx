import React, { useState } from 'react';

interface GroverOverviewStepProps {
  onComplete?: (completed: boolean) => void;
  onStateChange?: (state: { acknowledged: boolean }) => void;
}

export const GroverOverviewStep: React.FC<GroverOverviewStepProps> = ({ onComplete, onStateChange }) => {
  const [acknowledged, setAcknowledged] = useState<boolean>(false);

  const handleAcknowledge = () => {
    if (acknowledged) return;
    setAcknowledged(true);
    if (onComplete) onComplete(true);
    if (onStateChange) onStateChange({ acknowledged: true });
  };

  return (
    <div className="p-6 bg-slate-900 rounded-xl text-slate-100 shadow-lg border border-slate-800" role="region" aria-label="Grover Overview Step">
      <h3 className="text-xl font-bold mb-3">Grover's Search: Overview & Amplitude Amplification</h3>
      <p className="text-sm text-slate-300 mb-4">
        Grover's algorithm provides a quadratic speedup for unstructured search problems. It uses quantum superposition, an oracle to mark the target item, and a diffusion operator (amplitude amplification) to increase the probability amplitude of the correct solution.
      </p>

      {/* Scope and Performance Safeguard */}
      <div className="bg-slate-800 p-4 rounded-lg mb-6 border border-slate-700 text-xs text-amber-300 space-y-2">
        <div>🔍 <strong>Marked Item & Oracle:</strong> The oracle identifies and flips the phase of the target solution state without revealing its location beforehand.</div>
        <div>📈 <strong>Amplitude Amplification:</strong> The diffusion operator reflects amplitudes about the average, boosting the success probability with each iteration.</div>
        <div>⚠️ <strong>Scope Limit:</strong> This provides a quadratic speedup, not a universal exponential speedup for all computational problems.</div>
      </div>

      {/* Visual / Text Equivalent Representation */}
      <div className="bg-slate-800 p-5 rounded-lg mb-6 border border-slate-700 text-center">
        <span className="text-xs uppercase tracking-wider text-slate-400 block mb-2">Visual Teaching Model Equivalent</span>
        <div className="flex justify-center items-center gap-2 font-mono text-sm text-cyan-300">
          <span className="bg-slate-900 px-3 py-2 rounded border border-slate-700">Superposition State</span>
          <span>→</span>
          <span className="bg-slate-900 px-3 py-2 rounded border border-slate-700">Oracle Marking</span>
          <span>→</span>
          <span className="bg-slate-900 px-3 py-2 rounded border border-slate-700">Diffusion Amplification</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleAcknowledge}
          disabled={acknowledged}
          className={`px-6 py-2.5 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 ${acknowledged ? 'bg-emerald-700 text-white cursor-default' : 'bg-cyan-600 hover:bg-cyan-500 text-white'}`}
          aria-label="Acknowledge Grover overview concepts"
        >
          {acknowledged ? '✓ Acknowledged & Understood' : 'Acknowledge Overview'}
        </button>
        <span className="text-xs text-slate-400" aria-live="polite">
          {acknowledged ? 'Step completed' : 'Review concepts and acknowledge'}
        </span>
      </div>
    </div>
  );
};

export default GroverOverviewStep;
