import React, { useState } from 'react';

interface ErrorCorrectionOverviewStepProps {
  onComplete?: (completed: boolean) => void;
  onStateChange?: (state: { acknowledged: boolean }) => void;
}

export const ErrorCorrectionOverviewStep: React.FC<ErrorCorrectionOverviewStepProps> = ({
  onComplete,
  onStateChange,
}) => {
  const [acknowledged, setAcknowledged] = useState<boolean>(false);

  const handleAcknowledge = () => {
    if (acknowledged) return;
    setAcknowledged(true);
    if (onComplete) onComplete(true);
    if (onStateChange) onStateChange({ acknowledged: true });
  };

  return (
    <div className="p-6 bg-slate-900 rounded-xl text-slate-100 shadow-lg border border-slate-800" role="region" aria-label="Error Correction Overview Step">
      <h3 className="text-xl font-bold mb-3">Quantum Error Correction: Overview & Repetition Codes</h3>
      <p className="text-sm text-slate-300 mb-4">
        Quantum information is highly fragile due to environmental noise. Error correction protects logical qubits by encoding them into larger physical spaces using logical redundancy.
      </p>

      {/* Core Concepts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <span className="text-[10px] uppercase tracking-wider text-cyan-400 block mb-1">Three-Bit Repetition Code</span>
          <p className="text-xs text-slate-300">
            Encodes logical 0 as <code className="text-cyan-300 font-mono">000</code> and logical 1 as <code className="text-cyan-300 font-mono">111</code>, spreading information across multiple physical qubits.
          </p>
        </div>

        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
          <span className="text-[10px] uppercase tracking-wider text-purple-400 block mb-1">Syndrome & Majority Vote</span>
          <p className="text-xs text-slate-300">
            Syndrome measurements detect errors without destroying the encoded quantum superposition state, allowing a majority vote decoder to identify and correct single bit-flips.
          </p>
        </div>
      </div>

      {/* Limitations Warning */}
      <div className="bg-amber-950/40 border border-amber-600/50 p-4 rounded-lg mb-6 text-xs text-amber-200">
        ⚠️ <strong>Important Limitations:</strong> This simplified repetition code only protects against isolated single bit-flips. It <em>does not</em> correct phase errors or arbitrary multiple simultaneous bit-flips.
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleAcknowledge}
          disabled={acknowledged}
          className={`px-6 py-2.5 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 ${acknowledged ? 'bg-emerald-700 text-white cursor-default' : 'bg-cyan-600 hover:bg-cyan-500 text-white'}`}
          aria-label="Acknowledge error correction overview"
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

export default ErrorCorrectionOverviewStep;
