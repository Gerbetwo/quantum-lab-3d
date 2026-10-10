import React, { useState } from 'react';
import { factorizeShorN15 } from '@/core/quantum/algorithms/shor';

interface ShorDemoStepProps {
  onComplete?: (completed: boolean) => void;
  onExploreApplication?: (appId: string) => void;
  onStateChange?: (state: { evaluated: boolean; success: boolean }) => void;
}

export const ShorDemoStep: React.FC<ShorDemoStepProps> = ({
  onComplete,
  onExploreApplication,
  onStateChange,
}) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultData, setResultData] = useState<{ base: number; period: number; p: number; q: number } | null>(null);
  const [exploredRecorded, setExploredRecorded] = useState<boolean>(false);

  const handleRunShor = async () => {
    if (status === 'loading') return; // Prevent duplicate submissions

    setStatus('loading');
    setErrorMessage(null);

    try {
      const selectedBase = 2;
      // Execute domain export for Shor's algorithm (Educational N=15)
      const res = factorizeShorN15(selectedBase);
      
      if (!res.isSuccess || !res.factors) {
        throw new Error('Shor simulation failed to converge for N=15 with base ' + selectedBase + '.');
      }

      setResultData({
        base: selectedBase,
        period: res.period ?? 4,
        p: res.factors[0],
        q: res.factors[1],
      });
      setStatus('success');

      // Idempotently add shor-n15 to applicationsExplored ONLY on success
      if (!exploredRecorded) {
        setExploredRecorded(true);
        if (onExploreApplication) {
          onExploreApplication('shor-n15');
        }
      }

      if (onComplete) onComplete(true);
      if (onStateChange) onStateChange({ evaluated: true, success: true });
    } catch (err: unknown) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Recoverable simulation error occurred.');
      if (onStateChange) onStateChange({ evaluated: true, success: false });
    }
  };

  return (
    <div className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border" role="region" aria-label="Shor Algorithm Demo Step">
      <h3 className="text-xl font-bold mb-3">Shor&apos;s Algorithm Demonstration (N = 15)</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Run Shor&apos;s quantum factoring algorithm on integer <span className="font-mono text-accent">N = 15</span>. This educational demonstration uses modular exponentiation and quantum phase estimation to find prime factors.
      </p>

      {/* Physics / Scope Safeguards */}
      <div className="bg-card p-4 rounded-lg mb-6 border border-border text-xs text-amber-300 space-y-1">
        <div>⚠️ <strong>Educational Scope:</strong> Evaluates integer N=15 using educational simulator parameters.</div>
        <div>🔒 <strong>Hardware & Security Limit:</strong> Never claim RSA-2048 capability or real NISQ hardware runtime from this educational client demo.</div>
      </div>

      {/* Simulation Result Container */}
      <div className="bg-card p-5 rounded-lg mb-6 border border-border text-center">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Algorithm Execution Status</div>
        <div className="text-2xl font-mono font-bold text-accent mb-2" aria-live="polite">
          {status === 'idle' && 'Ready to Execute'}
          {status === 'loading' && 'Running Quantum Circuit & QPE...'}
          {status === 'success' && 'Factors Successfully Computed!'}
          {status === 'error' && 'Execution Error (Recoverable)'}
        </div>

        {status === 'success' && resultData && (
          <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
            <div className="bg-background p-3 rounded border border-border">
              <span className="text-[10px] text-muted-foreground block uppercase">Selected Base</span>
              <span className="font-mono text-accent text-lg">{resultData.base}</span>
            </div>
            <div className="bg-background p-3 rounded border border-border">
              <span className="text-[10px] text-muted-foreground block uppercase">Computed Period (r)</span>
              <span className="font-mono text-accent text-lg">{resultData.period}</span>
            </div>
            <div className="bg-background p-3 rounded border border-border">
              <span className="text-[10px] text-muted-foreground block uppercase">Factor 1 (p)</span>
              <span className="font-mono text-emerald-300 text-lg">{resultData.p}</span>
            </div>
            <div className="bg-background p-3 rounded border border-border">
              <span className="text-[10px] text-muted-foreground block uppercase">Factor 2 (q)</span>
              <span className="font-mono text-emerald-300 text-lg">{resultData.q}</span>
            </div>
          </div>
        )}

        {status === 'error' && errorMessage && (
          <div className="mt-3 text-xs text-red-400 bg-red-950/40 p-2 rounded border border-red-800">
            {errorMessage}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleRunShor}
          disabled={status === 'loading'}
          className={`px-6 py-2.5 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 ${status === 'loading' ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary text-primary-foreground hover:opacity-90 active:bg-cyan-700 text-white'}`}
          aria-label="Run Shor algorithm for N equals 15"
        >
          {status === 'loading' ? 'Executing...' : status === 'success' ? 'Re-run Shor Algorithm' : 'Run Shor (N=15)'}
        </button>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {exploredRecorded ? '✓ shor-n15 explored & recorded' : 'Awaiting execution action'}
        </span>
      </div>
    </div>
  );
};

export default ShorDemoStep;
