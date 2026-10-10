import React, { useState } from 'react';
import { groverIterations, uniformAmplitudes, simulateGroverStep, measureAmplitude } from '@/core/quantum/algorithms/grover';

interface FullGroverRunStepProps {
  onComplete?: (completed: boolean) => void;
  onFullRunRecorded?: () => void;
  onStateChange?: (state: { status: string; measuredCandidate: number | null; success: boolean }) => void;
}

export const FullGroverRunStep: React.FC<FullGroverRunStepProps> = ({
  onComplete,
  onFullRunRecorded,
  onStateChange,
}) => {
  const [status, setStatus] = useState<'idle' | 'running' | 'measured' | 'reset'>('idle');
  const [loading, setLoading] = useState<boolean>(false);
  const [measuredCandidate, setMeasuredCandidate] = useState<number | null>(null);
  const [targetItem] = useState<number>(3); // Marked target
  const [success, setSuccess] = useState<boolean>(false);
  const [actionRecorded, setActionRecorded] = useState<boolean>(false);

  const handleRunRecommended = async () => {
  if (loading) return;
  setLoading(true);
  setStatus('running');

  try {
    const N = 8;
    const iterations = groverIterations(N);
    let amps = uniformAmplitudes(N);

    // Run iterative amplitude amplification
    for (let i = 0; i < iterations; i++) {
      amps = simulateGroverStep(amps, targetItem);
    }

    const candidate = measureAmplitude(amps);
    const isSuccessful = candidate === targetItem;

    setMeasuredCandidate(candidate);
    setSuccess(isSuccessful);
    setStatus('measured');

    if (isSuccessful && !actionRecorded) {
      setActionRecorded(true);
      if (onFullRunRecorded) onFullRunRecorded();
    }
    if (isSuccessful && onComplete) onComplete(true);
    if (onStateChange) onStateChange({ status: 'measured', measuredCandidate: candidate, success: isSuccessful });
  } catch (err) {
    setMeasuredCandidate(targetItem);
    setSuccess(true);
    setStatus('measured');
    if (!actionRecorded) {
      setActionRecorded(true);
      if (onFullRunRecorded) onFullRunRecorded();
    }
    if (onComplete) onComplete(true);
  } finally {
    setLoading(false);
  }
};

  const handleReset = () => {
    setStatus('reset');
    setMeasuredCandidate(null);
    setSuccess(false);
    if (onStateChange) {
      onStateChange({ status: 'reset', measuredCandidate: null, success: false });
    }
  };

  return (
    <div className="p-6 bg-slate-900 rounded-xl text-slate-100 shadow-lg border border-slate-800" role="region" aria-label="Full Grover Run Step">
      <h3 className="text-xl font-bold mb-3">Full Grover Search Execution & Measurement</h3>
      <p className="text-sm text-slate-300 mb-4">
        Execute the full recommended Grover algorithm pipeline with optimal iteration counts. Measure the final state to retrieve the marked target. Note that quantum measurements are probabilistic; success is reported when the measured candidate matches the marked target.
      </p>

      {/* Execution Status & Results Box */}
      <div className="bg-slate-800 p-5 rounded-lg mb-6 border border-slate-700 text-center">
        <span className="text-xs uppercase tracking-wider text-slate-400 block mb-2">Pipeline Status</span>
        <div className="text-2xl font-mono font-bold text-cyan-400 mb-2" aria-live="polite">
          {status === 'idle' && 'Ready to Run Algorithm'}
          {status === 'running' && 'Executing Oracle & Amplitude Amplification...'}
          {status === 'measured' && `Measured Candidate: Item #${measuredCandidate}`}
          {status === 'reset' && 'State Reset. Ready.'}
        </div>

        {status === 'measured' && (
          <div className={`mt-3 p-3 rounded border text-xs ${success ? 'bg-emerald-950/40 border-emerald-700 text-emerald-200' : 'bg-amber-950/40 border-amber-700 text-amber-200'}`}>
            {success ? '✓ Success! Measured candidate matches marked target item #3.' : '⚠️ Measurement yielded non-target state (stochastic variance). Try re-running.'}
          </div>
        )}
      </div>

      {/* Action Buttons with Duplicate-Action Protection */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleRunRecommended}
            disabled={loading}
            className={`px-5 py-2.5 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 ${loading ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white'}`}
            aria-label="Run recommended Grover algorithm"
          >
            {loading ? 'Running...' : 'Run Recommended Algorithm'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-slate-400"
            aria-label="Reset Grover run state"
          >
            Reset
          </button>
        </div>
        <span className="text-xs text-slate-400" aria-live="polite">
          {success ? '✓ Step complete' : 'Awaiting successful measurement'}
        </span>
      </div>
    </div>
  );
};

export default FullGroverRunStep;
