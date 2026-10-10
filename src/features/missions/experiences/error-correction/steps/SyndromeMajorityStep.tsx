import React, { useState } from 'react';
import { detectBitFlipSyndrome, BitTriple } from '@/core/quantum/algorithms/errorCorrection';

interface SyndromeMajorityStepProps {
  onComplete?: (completed: boolean) => void;
  onStateChange?: (state: { evaluated: boolean }) => void;
}

export const SyndromeMajorityStep: React.FC<SyndromeMajorityStepProps> = ({ onComplete, onStateChange }) => {
  const [word] = useState<BitTriple>([1, 0, 1]); // Error at index 1 represented as BitTriple
  const [corrected, setCorrected] = useState<string>('111');
  const [syndromeStr, setSyndromeStr] = useState<string>('10');
  const [evaluated, setEvaluated] = useState<boolean>(false);

  const handleEvaluate = () => {
    const res = detectBitFlipSyndrome(word);
    setCorrected(res.corrected.join(''));
    setSyndromeStr(String(res.syndrome));
    setEvaluated(true);
    if (onComplete) onComplete(true);
    if (onStateChange) onStateChange({ evaluated: true });
  };

  return (
    <div className="p-6 bg-slate-900 rounded-xl text-slate-100 shadow-lg border border-slate-800" role="region" aria-label="Syndrome and Majority Vote Step">
      <h3 className="text-xl font-bold mb-3">Syndrome Measurement & Majority-Vote Decision</h3>
      <p className="text-sm text-slate-300 mb-4">
        Using the canonical domain API, syndrome extraction inspects parity checks across the three-bit repetition code word without collapsing logical superposition. A majority-vote decision then corrects the documented single-error case.
      </p>

      <div className="bg-amber-950/40 border border-amber-600/50 p-4 rounded-lg mb-6 text-xs text-amber-200">
        ⚠️ <strong>Limitation Note:</strong> This mechanism corrects <em>only</em> the documented single-error case. Multiple simultaneous errors cause misidentification and decode into incorrect states.
      </div>

      <div className="bg-slate-800 p-5 rounded-lg mb-6 border border-slate-700 space-y-3">
        <div className="flex justify-between items-center text-xs border-b border-slate-700 pb-2">
          <span className="text-slate-400">Three-Bit Word (Test Input):</span>
          <span className="font-mono text-amber-300 font-bold">{word.join('')}</span>
        </div>
        <div className="flex justify-between items-center text-xs border-b border-slate-700 pb-2">
          <span className="text-slate-400">Extracted Syndrome:</span>
          <span className="font-mono text-purple-300 font-bold">{evaluated ? syndromeStr : '10'}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400">Majority-Vote Corrected Output:</span>
          <span className="font-mono text-emerald-300 font-bold">{evaluated ? corrected : 'Pending Evaluation...'}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleEvaluate}
          disabled={evaluated}
          className={`px-6 py-2.5 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 ${evaluated ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white'}`}
          aria-label="Evaluate syndrome and majority vote"
        >
          {evaluated ? 'Evaluated' : 'Run Syndrome & Majority Vote'}
        </button>
        <span className="text-xs text-slate-400" aria-live="polite">
          {evaluated ? '✓ Step complete' : 'Awaiting evaluation action'}
        </span>
      </div>
    </div>
  );
};

export default SyndromeMajorityStep;
