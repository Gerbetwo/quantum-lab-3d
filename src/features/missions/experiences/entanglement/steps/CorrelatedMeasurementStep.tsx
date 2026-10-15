import React, { useState } from 'react';
import { bellState } from '../../../../../core/math/presets';
import { measureEntangledQubit } from '../../../../../core/math/entanglement';

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
  const [results, setResults] = useState<{ alice: '|0⟩' | '|1⟩'; bob: '|0⟩' | '|1⟩'; bitString: '00' | '11' } | null>(null);

  const handleMeasureStationA = () => {
    if (!isBellPrepared || measured) return;

    // Use Bell state |Phi+> = (|00> + |11>) / sqrt(2) from src/core/math/
    bellState('phi+');
    const state = measureEntangledQubit();
    // Collapse Station A (50/50) and instantaneously set Station B to the exact same bit (00 or 11, never 01 or 10)
    const bit: 0 | 1 = state.aliceOutcome ?? (Math.random() < 0.5 ? 0 : 1);
    const bitLabel: '|0⟩' | '|1⟩' = bit === 0 ? '|0⟩' : '|1⟩';
    const bitStr: '00' | '11' = bit === 0 ? '00' : '11';

    const correlatedResult = { alice: bitLabel, bob: bitLabel, bitString: bitStr };

    setResults(correlatedResult);
    setMeasured(true);

    if (onRecordMeasurement) {
      onRecordMeasurement({ alice: bitLabel, bob: bitLabel });
    }
    if (onComplete) {
      onComplete(true);
    }
  };

  return (
    <div className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border" role="region" aria-label="Correlated Measurement Step">
      <h3 className="text-xl font-bold mb-3">Correlated Measurement & Non-Signaling</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Measure the entangled pair. Because the states are linked, Alice&apos;s measurement yields a random outcome, and Bob&apos;s measurement will <em>always perfectly match</em> Alice&apos;s result. However, Alice cannot choose or force the outcome to transmit a message.
      </p>

      {!isBellPrepared && (
        <div className="bg-warning-subtle border border-warning-border p-4 rounded-lg mb-6 text-xs text-warning">
          ⚠️ <strong>Action Required:</strong> You must prepare a Bell pair in the previous step before performing a correlated measurement.
        </div>
      )}

      <div className="bg-card p-5 rounded-lg mb-6 border border-border text-center">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Measurement Results Boundary (|Φ+⟩)</div>
        <div className="text-2xl font-mono font-bold text-accent mb-2" aria-live="polite">
          {measured && results ? `Station A: ${results.alice} | Station B: ${results.bob}` : 'Awaiting Measurement of Station A...'}
        </div>
        <p className="text-xs text-muted-foreground">
          {measured && results
            ? `Joint Collapsed State: |${results.bitString}⟩ (Perfect Correlation: 00 or 11, never 01 or 10)`
            : 'Measuring Station A forces instantaneous collapse of Station B into the exact same bit.'}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleMeasureStationA}
          disabled={!isBellPrepared || measured}
          className={`px-6 py-2.5 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${!isBellPrepared || measured ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary text-primary-foreground hover:opacity-90 active:bg-primary cursor-pointer'}`}
          aria-label="Perform correlated quantum measurement on Station A"
        >
          {measured ? 'Station A Measured' : 'Measure Station A'}
        </button>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {measured ? 'Step complete: Pair collapsed' : isBellPrepared ? 'Ready: Click Measure Station A' : 'Bell pair required'}
        </span>
      </div>
    </div>
  );
};

export default CorrelatedMeasurementStep;
