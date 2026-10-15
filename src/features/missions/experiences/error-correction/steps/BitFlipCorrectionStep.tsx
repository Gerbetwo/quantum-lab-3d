import React, { useState } from 'react';
import { bitFlipEncode, injectBitFlip, detectBitFlipSyndrome, BitTriple } from '@/core/quantum/algorithms/errorCorrection';

interface BitFlipCorrectionStepProps {
  onComplete?: (completed: boolean) => void;
  onRecordCorrection?: () => void;
  onStateChange?: (state: { original: string; corrupted: string; corrected: string; errorInjected: boolean }) => void;
}

export const BitFlipCorrectionStep: React.FC<BitFlipCorrectionStepProps> = ({
  onComplete,
  onRecordCorrection,
}) => {
  const [logicalBit, setLogicalBit] = useState<0 | 1>(0);
  const [phase, setPhase] = useState<'idle' | 'encoded' | 'error_injected' | 'recovered'>('idle');
  const [encodedWord, setEncodedWord] = useState<BitTriple | null>(null);
  const [corruptedWord, setCorruptedWord] = useState<BitTriple | null>(null);
  const [errorWire, setErrorWire] = useState<number | null>(null);
  const [syndrome, setSyndrome] = useState<number | null>(null);
  const [correctedWord, setCorrectedWord] = useState<BitTriple | null>(null);
  const [fidelity, setFidelity] = useState<number>(100);
  const [eventRecorded, setEventRecorded] = useState<boolean>(false);

  // 1. Encode |psi> to 3 Qubits
  const handleEncode = () => {
    const encoded = bitFlipEncode(logicalBit);
    setEncodedWord(encoded);
    setCorruptedWord(null);
    setErrorWire(null);
    setSyndrome(null);
    setCorrectedWord(null);
    setFidelity(100);
    setPhase('encoded');
  };

  // 2. Inject Bit-Flip Error
  const handleInjectError = (targetWire: 0 | 1 | 2 = 1) => {
    if (!encodedWord) return;
    const corrupted = injectBitFlip(encodedWord, targetWire);
    setErrorWire(targetWire);
    setCorruptedWord(corrupted);
    setFidelity(0); // Error corrupts state
    setPhase('error_injected');
  };

  // 3. Syndrome Measure & Recover
  const handleSyndromeAndRecover = () => {
    if (!corruptedWord) return;
    const synResult = detectBitFlipSyndrome(corruptedWord);
    setSyndrome(synResult.syndrome);
    setCorrectedWord(synResult.corrected);
    setFidelity(100); // Restores 100% fidelity on recovery
    setPhase('recovered');

    if (!eventRecorded) {
      setEventRecorded(true);
      if (onRecordCorrection) onRecordCorrection();
    }
    if (onComplete) onComplete(true);
  };

  const handleReset = () => {
    setPhase('idle');
    setEncodedWord(null);
    setCorruptedWord(null);
    setErrorWire(null);
    setSyndrome(null);
    setCorrectedWord(null);
    setFidelity(100);
  };

  return (
    <div className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border" role="region" aria-label="Bit-Flip Error Correction Step">
      <h3 className="text-xl font-bold mb-3">3-Qubit Quantum Error Correction (Bit-Flip Code)</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Protect a single logical qubit state $|\psi\rangle$ against environmental bit-flip errors by encoding it across three physical qubits. The 3-qubit repetition code detects which wire flipped via syndrome measurements and restores 100% state fidelity.
      </p>

      {/* Input Qubit Selection */}
      <div className="bg-card p-3 rounded-lg mb-4 border border-border flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          Select Input Logical State |ψ⟩:
        </span>
        <div className="flex gap-2">
          {([0, 1] as const).map((b) => (
            <button
              key={b}
              type="button"
              disabled={phase !== 'idle'}
              onClick={() => setLogicalBit(b)}
              className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                logicalBit === b
                  ? 'bg-accent text-accent-foreground border border-accent shadow-[0_0_8px_rgba(0,240,255,0.4)]'
                  : 'bg-background hover:bg-muted text-foreground border border-border'
              } ${phase !== 'idle' ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              |{b}⟩
            </button>
          ))}
        </div>
      </div>

      {/* 3-Qubit Circuit Visualizer / Wires */}
      <div className="bg-card p-5 rounded-lg mb-6 border border-border">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">3-Qubit Physical Register</span>
          <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
            fidelity === 100
              ? 'bg-success-subtle text-success border-success-border'
              : 'bg-destructive-subtle text-destructive border-destructive-border'
          }`}>
            Fidelity: {fidelity}%
          </span>
        </div>

        {/* 3 Physical Qubit Wires */}
        <div className="space-y-3 font-mono text-sm">
          {[0, 1, 2].map((wireIdx) => {
            const isFlippedWire = errorWire === wireIdx && phase === 'error_injected';
            const isRecoveredWire = errorWire === wireIdx && phase === 'recovered';

            const bitValue =
              phase === 'idle'
                ? '-'
                : phase === 'encoded'
                ? encodedWord?.[wireIdx] ?? '-'
                : phase === 'error_injected'
                ? corruptedWord?.[wireIdx] ?? '-'
                : correctedWord?.[wireIdx] ?? '-';

            return (
              <div
                key={wireIdx}
                className={`p-3 rounded-lg border transition-all flex items-center justify-between ${
                  isFlippedWire
                    ? 'bg-red-500/10 border-red-500 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                    : isRecoveredWire
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                    : 'bg-background border-border text-foreground'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`font-bold ${isFlippedWire ? 'text-red-400' : 'text-accent'}`}>
                    Qubit Wire [{wireIdx}]:
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {wireIdx === 0 ? 'Primary Data Qubit' : `Ancilla / Redundancy ${wireIdx}`}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {isFlippedWire && (
                    <span className="text-xs px-2 py-0.5 rounded bg-red-500 text-white font-bold animate-pulse">
                      X ERROR (Bit-Flip)
                    </span>
                  )}
                  {isRecoveredWire && (
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500 text-white font-bold">
                      RECOVERED
                    </span>
                  )}
                  <span className={`text-base font-bold px-2.5 py-0.5 rounded ${
                    isFlippedWire ? 'bg-red-500/20 text-red-300' : 'bg-card text-foreground'
                  }`}>
                    |{bitValue}⟩
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Telemetry info */}
        <div className="mt-4 pt-3 border-t border-border flex flex-wrap justify-between text-xs font-mono text-muted-foreground">
          <div>Phase: <span className="text-accent font-bold">{phase.toUpperCase()}</span></div>
          <div>Flipped Wire: <span className={errorWire !== null ? 'text-red-400 font-bold' : ''}>{errorWire !== null ? `Wire #${errorWire}` : 'None'}</span></div>
          <div>Syndrome: <span className="text-axis-y font-bold">{syndrome !== null ? `S = ${syndrome}` : 'Not measured'}</span></div>
        </div>
      </div>

      {/* Sequential Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap gap-2">
          {/* Button 1 */}
          <button
            type="button"
            onClick={handleEncode}
            disabled={phase !== 'idle' && phase !== 'recovered'}
            className={`px-4 py-2.5 rounded-lg text-xs font-semibold font-mono transition-all ${
              phase === 'idle' || phase === 'recovered'
                ? 'bg-primary text-primary-foreground hover:opacity-90 active:bg-primary cursor-pointer'
                : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
            }`}
          >
            {/* FIX: raw ">" is invalid in JSX text — use the &gt; entity */}
            1. Encode |psi&gt; to 3 Qubits
          </button>

          {/* Button 2 */}
          <button
            type="button"
            onClick={() => handleInjectError(1)}
            disabled={phase !== 'encoded'}
            className={`px-4 py-2.5 rounded-lg text-xs font-semibold font-mono transition-all ${
              phase === 'encoded'
                ? 'bg-amber-600 hover:bg-amber-500 text-white cursor-pointer shadow-[0_0_10px_rgba(217,119,6,0.3)]'
                : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
            }`}
          >
            2. Inject Bit-Flip Error
          </button>

          {/* Button 3 */}
          <button
            type="button"
            onClick={handleSyndromeAndRecover}
            disabled={phase !== 'error_injected'}
            className={`px-4 py-2.5 rounded-lg text-xs font-semibold font-mono transition-all ${
              phase === 'error_injected'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
            }`}
          >
            3. Syndrome Measure & Recover
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 bg-muted hover:bg-secondary text-foreground text-xs rounded-lg transition-colors"
          >
            Reset
          </button>
        </div>

        <span className="text-xs text-muted-foreground font-mono" aria-live="polite">
          {phase === 'idle' && 'Click 1 to encode'}
          {phase === 'encoded' && 'Encoded |000> / |111>. Click 2 to flip'}
          {phase === 'error_injected' && 'Wire highlighted red. Click 3 to recover'}
          {phase === 'recovered' && '✓ Restored 100% Fidelity'}
        </span>
      </div>
    </div>
  );
};

export default BitFlipCorrectionStep;