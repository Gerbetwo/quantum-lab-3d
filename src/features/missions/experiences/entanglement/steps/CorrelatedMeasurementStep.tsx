import React, { useState } from 'react';

interface CorrelatedMeasurementStepProps {
  isBellPrepared: boolean;
  onComplete?: (completed: boolean) => void;
  onRecordMeasurement?: (result: { alice: '|0⟩' | '|1⟩'; bob: '|0⟩' | '|1⟩' }) => void;
}

export const CorrelatedMeasurementStep: React.FC<CorrelatedMeasurementStepProps> = ({
  isBellPrepared,
  onComplete,
  onRecordMeasurement,
}) => {
  const [measured, setMeasured] = useState<boolean>(false);
  const [results, setResults] = useState<{ alice: '|0⟩' | '|1⟩'; bob: '|0⟩' | '|1⟩' } | null>(null);

  const handleMeasure = () => {
    if (!isBellPrepared || measured) return;

    // Perfect correlation for |Φ+⟩ = (|00⟩ + |11⟩) / √2
    const outcome: '|0⟩' | '|1⟩' = Math.random() > 0.5 ? '|0⟩' : '|1⟩';
    const correlatedResult = { alice: outcome, bob: outcome };

    setResults(correlatedResult);
    setMeasured(true);

    if (onRecordMeasurement) {
      onRecordMeasurement(correlatedResult);
    }
    if (onComplete) {
      onComplete(true);
    }
  };

  return (
    <div className="p-6 bg-slate-900 rounded-xl text-slate-100 shadow-lg border border-slate-800" role="region" aria-label="Correlated Measurement Step">
      <h3 className="text-xl font-bold mb-3">Correlated Measurement & Non-Signaling</h3>
      <p className="text-sm text-slate-300 mb-4">
        Measure the entangled pair. Because the states are linked, Alice&apos;s measurement yields a random outcome, and Bob&apos;s measurement will <em>always perfectly match</em> Alice&apos;s result. However, Alice cannot choose or force the outcome to transmit a message.
      </p>

      {!isBellPrepared && (
        <div className="bg-amber-950/40 border border-amber-600/50 p-4 rounded-lg mb-6 text-xs text-amber-200">
          ⚠️ <strong>Action Required:</strong> You must prepare a Bell pair in the previous step before performing a correlated measurement.
        </div>
      )}

      <div className="bg-slate-800 p-5 rounded-lg mb-6 border border-slate-700 text-center">
        <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">Measurement Results Boundary</div>
        <div className="text-2xl font-mono font-bold text-cyan-400 mb-2" aria-live="polite">
          {measured && results ? `Alice: ${results.alice} | Bob: ${results.bob}` : 'Awaiting Measurement...'}
        </div>
        <p className="text-xs text-slate-400">
          {measured ? '✓ entanglementMeasurements recorded exactly once.' : 'Results are strictly randomized and perfectly correlated.'}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleMeasure}
          disabled={!isBellPrepared || measured}
          className={`px-6 py-2.5 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 ${!isBellPrepared || measured ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white'}`}
          aria-label="Perform correlated quantum measurement"
        >
          {measured ? 'Measured' : 'Measure Entangled Pair'}
        </button>
        <span className="text-xs text-slate-400" aria-live="polite">
          {measured ? 'Step complete' : isBellPrepared ? 'Ready to measure' : 'Bell pair required'}
        </span>
      </div>
    </div>
  );
};

export default CorrelatedMeasurementStep;
