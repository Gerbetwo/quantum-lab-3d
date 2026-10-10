import React, { useState } from 'react';
import { injectBitFlip, detectBitFlipSyndrome, BitTriple } from '@/core/quantum/algorithms/errorCorrection';

interface BitFlipCorrectionStepProps {
  onComplete?: (completed: boolean) => void;
  onRecordCorrection?: () => void;
  onStateChange?: (state: { original: string; corrupted: string; corrected: string; errorInjected: boolean }) => void;
}

export const BitFlipCorrectionStep: React.FC<BitFlipCorrectionStepProps> = ({
  onComplete,
  onRecordCorrection,
}) => {
  const [logicalState, setLogicalState] = useState<'0' | '1'>('0');
  const [errorIndex, setErrorIndex] = useState<number | null>(null);
  const [corruptedWord, setCorruptedWord] = useState<string>('000');
  const [syndrome, setSyndrome] = useState<string>('0');
  const [correctedWord, setCorrectedWord] = useState<string>('000');
  const [isCorrected, setIsCorrected] = useState<boolean>(false);
  const [eventRecorded, setEventRecorded] = useState<boolean>(false);

  const handleInjectError = (index: number) => {
    const baseTriple: BitTriple = logicalState === '0' ? [0, 0, 0] : [1, 1, 1];
    const corrupted = injectBitFlip(baseTriple, index as 0 | 1 | 2);
    const synResult = detectBitFlipSyndrome(corrupted);

    setErrorIndex(index);
    setCorruptedWord(corrupted.join(''));
    setSyndrome(String(synResult.syndrome));
    setIsCorrected(false);
  };

  const handleCorrect = () => {
    if (errorIndex === null || isCorrected) return;

    const corrupted: BitTriple = corruptedWord.split('').map(Number) as BitTriple;
    const synResult = detectBitFlipSyndrome(corrupted);

    setCorrectedWord(synResult.corrected.join(''));
    setIsCorrected(true);

    if (!eventRecorded) {
      setEventRecorded(true);
      if (onRecordCorrection) onRecordCorrection();
    }

    if (onComplete) {
      onComplete(true);
    }
  };

  const handleReset = () => {
    setErrorIndex(null);
    setCorruptedWord(logicalState === '0' ? '000' : '111');
    setSyndrome('0');
    setCorrectedWord(logicalState === '0' ? '000' : '111');
    setIsCorrected(false);
  };

  return (
    <div className="p-6 bg-slate-900 rounded-xl text-slate-100 shadow-lg border border-slate-800" role="region" aria-label="Bit-Flip Error Correction Step">
      <h3 className="text-xl font-bold mb-3">Single Bit-Flip Injection & Syndrome Correction</h3>
      <p className="text-sm text-slate-300 mb-4">
        Encode a logical state (<code className="text-cyan-300 font-mono">|{logicalState}⟩</code> → <code className="text-cyan-300 font-mono">{logicalState === '0' ? '000' : '111'}</code>), inject a single bit error, measure the syndrome, and apply majority-vote correction.
      </p>

      {/* State Display Console */}
      <div className="bg-slate-800 p-5 rounded-lg mb-6 border border-slate-700 space-y-4">
        <div className="flex justify-between items-center text-xs border-b border-slate-700 pb-3">
          <span className="text-slate-400 uppercase tracking-wider">Original Encoded Word</span>
          <span className="font-mono text-cyan-300 font-bold text-base">{logicalState === '0' ? '000' : '111'}</span>
        </div>

        <div className="flex justify-between items-center text-xs border-b border-slate-700 pb-3">
          <span className="text-slate-400 uppercase tracking-wider">Corrupted Word (After Error)</span>
          <span className="font-mono text-amber-300 font-bold text-base">{corruptedWord}</span>
        </div>

        <div className="flex justify-between items-center text-xs border-b border-slate-700 pb-3">
          <span className="text-slate-400 uppercase tracking-wider">Measured Syndrome</span>
          <span className="font-mono text-purple-300 font-bold text-base">{syndrome}</span>
        </div>

        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400 uppercase tracking-wider">Corrected Output State</span>
          <span className="font-mono text-emerald-300 font-bold text-base">{isCorrected ? correctedWord : 'Awaiting Correction...'}</span>
        </div>
      </div>

      {/* Error Injection Controls */}
      <div className="mb-6">
        <span className="text-xs uppercase tracking-wider text-slate-400 block mb-2">1. Inject Single Bit Error (Choose Position)</span>
        <div className="flex gap-3">
          {[0, 1, 2].map((idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleInjectError(idx)}
              className={`flex-1 py-2.5 rounded font-mono font-bold text-sm transition-colors ${errorIndex === idx ? 'bg-amber-600 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'}`}
              aria-label={`Inject bit error at physical qubit index ${idx}`}
            >
              Flip Qubit [{idx}]
            </button>
          ))}
        </div>
      </div>

      {/* Correction & Reset Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCorrect}
            disabled={errorIndex === null || isCorrected}
            className={`px-5 py-2.5 font-medium rounded-lg transition-colors focus:ring-2 focus:ring-cyan-400 ${errorIndex === null || isCorrected ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white'}`}
            aria-label="Apply error correction"
          >
            {isCorrected ? 'Corrected' : 'Apply Syndrome Correction'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-slate-400"
            aria-label="Reset error simulation"
          >
            Reset
          </button>
        </div>
        <span className="text-xs text-slate-400" aria-live="polite">
          {isCorrected ? '✓ Correction completed & recorded' : 'Inject error and apply correction'}
        </span>
      </div>
    </div>
  );
};

export default BitFlipCorrectionStep;
