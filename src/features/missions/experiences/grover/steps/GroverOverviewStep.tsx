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
    <div className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border" role="region" aria-label="Grover Overview Step">
      <h3 className="text-xl font-bold mb-3">Grover&apos;s Search: Overview & Amplitude Amplification</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Grover&apos;s algorithm provides a quadratic speedup for unstructured search problems. It uses quantum superposition, an oracle to mark the target item, and a diffusion operator (amplitude amplification) to increase the probability amplitude of the correct solution.
      </p>

      {/* Scope and Performance Safeguard */}
      <div className="bg-card p-4 rounded-lg mb-6 border border-border text-xs text-amber-300 space-y-2">
        <div>🔍 <strong>Marked Item & Oracle:</strong> The oracle identifies and flips the phase of the target solution state without revealing its location beforehand.</div>
        <div>📈 <strong>Amplitude Amplification:</strong> The diffusion operator reflects amplitudes about the average, boosting the success probability with each iteration.</div>
        <div>⚠️ <strong>Scope Limit:</strong> This provides a quadratic speedup, not a universal exponential speedup for all computational problems.</div>
      </div>

      {/* Visual / Text Equivalent Representation */}
      <div className="bg-card p-5 rounded-lg mb-6 border border-border text-center">
        <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-2">Visual Teaching Model Equivalent</span>
        <div className="flex justify-center items-center gap-2 font-mono text-sm text-accent">
          <span className="bg-background px-3 py-2 rounded border border-border">Superposition State</span>
          <span>→</span>
          <span className="bg-background px-3 py-2 rounded border border-border">Oracle Marking</span>
          <span>→</span>
          <span className="bg-background px-3 py-2 rounded border border-border">Diffusion Amplification</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleAcknowledge}
          disabled={acknowledged}
          className={`px-6 py-2.5 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 ${acknowledged ? 'bg-emerald-700 text-white cursor-default' : 'bg-primary text-primary-foreground hover:opacity-90 text-white'}`}
          aria-label="Acknowledge Grover overview concepts"
        >
          {acknowledged ? '✓ Acknowledged & Understood' : 'Acknowledge Overview'}
        </button>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {acknowledged ? 'Step completed' : 'Review concepts and acknowledge'}
        </span>
      </div>
    </div>
  );
};

export default GroverOverviewStep;
