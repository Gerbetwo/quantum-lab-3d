import React, { useState } from 'react';

interface MeasurementStepProps {
  onComplete?: (completed: boolean) => void;
  onRecordMeasurement?: (result: '|0⟩' | '|1⟩') => void;
}

export const MeasurementStep: React.FC<MeasurementStepProps> = ({ onComplete, onRecordMeasurement }) => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [measuredState, setMeasuredState] = useState< '|0⟩' | '|1⟩' | null>(null);
  const [probabilities, setProbabilities] = useState<{ p0: number; p1: number }>({ p0: 0.5, p1: 0.5 });

  const handleMeasure = () => {
    if (collapsed) return; // Prevent duplicate actions

    const result: '|0⟩' | '|1⟩' = Math.random() > 0.5 ? '|0⟩' : '|1⟩';
    setMeasuredState(result);
    setCollapsed(true);
    setProbabilities(result === '|0⟩' ? { p0: 1.0, p1: 0.0 } : { p0: 0.0, p1: 1.0 });

    if (onRecordMeasurement) {
      onRecordMeasurement(result);
    }
    if (onComplete) {
      onComplete(true);
    }
  };

  return (
    <div className="p-6 bg-slate-900 rounded-xl text-slate-100 shadow-lg border border-slate-800" role="region" aria-label="Measurement Step">
      <h3 className="text-xl font-bold mb-3">Wavefunction Collapse & Measurement</h3>
      <p className="text-sm text-slate-300 mb-6">
        Measurement forces a superposition state to collapse into one of the computational basis states ($|0angle$ or $|1angle$) based on their squared probability amplitudes.
      </p>

      <div className="bg-slate-800 p-5 rounded-lg mb-6 border border-slate-700 text-center">
        <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">Observation Status</div>
        <div className="text-3xl font-mono font-bold text-cyan-400 mb-2" aria-live="polite">
          {collapsed ? `Collapsed Result: ${measuredState}` : 'Superposition Active (|ψ⟩)'}
        </div>
        <p className="text-xs text-slate-400">
          Post-Collapse Probabilities: P(|0⟩) = {(probabilities.p0 * 100).toFixed(0)}% | P(|1⟩) = {(probabilities.p1 * 100).toFixed(0)}%
        </p>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleMeasure}
          disabled={collapsed}
          className={`px-6 py-2.5 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 ${collapsed ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white'}`}
          aria-label="Perform quantum measurement collapse"
        >
          {collapsed ? 'Measurement Recorded' : 'Collapse Wavefunction'}
        </button>
        <span className="text-xs text-slate-400" aria-live="polite">
          {collapsed ? '✓ superpositionMeasurements recorded' : 'Awaiting measurement action'}
        </span>
      </div>
    </div>
  );
};

export default MeasurementStep;
