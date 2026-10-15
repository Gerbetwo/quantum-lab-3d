import React, { useState } from 'react';
import { useQuantumStore } from '../../../../../store/useQuantumStore';

interface MeasurementStepProps {
  onComplete?: (completed: boolean) => void;
  onRecordMeasurement?: (result: '|0⟩' | '|1⟩') => void;
}

export const MeasurementStep: React.FC<MeasurementStepProps> = ({ onComplete, onRecordMeasurement }) => {
  const theta = useQuantumStore((s) => s.theta);
  const phi = useQuantumStore((s) => s.phi);
  const setAngles = useQuantumStore((s) => s.setAngles);

  const [prediction, setPrediction] = useState<'|0>' | '|1>' | '50/50' | null>(null);
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [measuredState, setMeasuredState] = useState<'|0⟩' | '|1⟩' | null>(null);
  const [probabilities, setProbabilities] = useState<{ p0: number; p1: number }>({ p0: 0.5, p1: 0.5 });
  const [revealedPrediction, setRevealedPrediction] = useState<'|0>' | '|1>' | '50/50' | null>(null);

  const bornProb0 = Math.cos(theta / 2) ** 2;

  const handleMeasure = () => {
    if (collapsed || !prediction) return; // Enforce Zero-Spoiler UX: prediction required

    // Sample Born probability cos^2(theta/2)
    const outcome: 0 | 1 = Math.random() < bornProb0 ? 0 : 1;
    const result: '|0⟩' | '|1⟩' = outcome === 0 ? '|0⟩' : '|1⟩';

    // Snap theta in useQuantumStore to 0 (|0>) or Math.PI (|1>)
    setAngles(outcome === 0 ? 0 : Math.PI, phi);

    setMeasuredState(result);
    setCollapsed(true);
    setRevealedPrediction(prediction);
    setProbabilities(outcome === 0 ? { p0: 1.0, p1: 0.0 } : { p0: 0.0, p1: 1.0 });

    if (onRecordMeasurement) {
      onRecordMeasurement(result);
    }
    if (onComplete) {
      onComplete(true);
    }
  };

  return (
    <div className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border" role="region" aria-label="Measurement Step">
      <h3 className="text-xl font-bold mb-3">Wavefunction Collapse & Measurement</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Measurement forces a superposition state to collapse into one of the computational basis states ($|0\rangle$ or $|1\rangle$) based on Born probability $P(|0\rangle) = \cos^2(\theta/2)$.
      </p>

      {/* Zero-Spoiler Prediction Selection */}
      <div className="bg-card p-4 rounded-lg mb-6 border border-border">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-semibold">
          Step 1: Select Prediction (Zero-Spoiler UX)
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          To prevent observer bias, choose your hypothesis before executing wavefunction collapse.
        </p>
        <div className="flex gap-2">
          {(['|0>', '|1>', '50/50'] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              disabled={collapsed}
              onClick={() => setPrediction(opt)}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono font-semibold border transition-all ${
                prediction === opt
                  ? 'bg-accent text-accent-foreground border-accent shadow-[0_0_10px_rgba(0,240,255,0.3)]'
                  : 'bg-background border-border hover:bg-muted text-foreground'
              } ${collapsed ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Observation Status */}
      <div className="bg-card p-5 rounded-lg mb-6 border border-border text-center">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Observation Status</div>
        <div className="text-3xl font-mono font-bold text-accent mb-2" aria-live="polite">
          {collapsed ? `Collapsed Result: ${measuredState}` : 'Superposition Active (|ψ⟩)'}
        </div>
        <p className="text-xs text-muted-foreground">
          {collapsed
            ? `Post-Collapse Probabilities: P(|0⟩) = ${(probabilities.p0 * 100).toFixed(0)}% | P(|1⟩) = ${(probabilities.p1 * 100).toFixed(0)}%`
            : `Current Born Probability: P(|0⟩) = ${(bornProb0 * 100).toFixed(1)}% | P(|1⟩) = ${((1 - bornProb0) * 100).toFixed(1)}%`}
        </p>

        {/* Revealed Prediction vs Outcome */}
        {collapsed && (
          <div className="mt-4 pt-4 border-t border-border flex justify-around text-xs font-mono">
            <div>
              <span className="text-muted-foreground block">Your Prediction:</span>
              <span className="text-accent font-bold text-sm">{revealedPrediction}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Observed Outcome:</span>
              <span className="text-success font-bold text-sm">{measuredState}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">Hypothesis Result:</span>
              <span className={`font-bold text-sm ${
                (revealedPrediction === '|0>' && measuredState === '|0⟩') ||
                (revealedPrediction === '|1>' && measuredState === '|1⟩') ||
                revealedPrediction === '50/50'
                  ? 'text-success'
                  : 'text-warning'
              }`}>
                {(revealedPrediction === '|0>' && measuredState === '|0⟩') ||
                (revealedPrediction === '|1>' && measuredState === '|1⟩')
                  ? 'Match'
                  : revealedPrediction === '50/50'
                  ? 'Probabilistic Match'
                  : 'Stochastic Divergence'}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleMeasure}
          disabled={collapsed || !prediction}
          className={`px-6 py-2.5 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
            collapsed || !prediction
              ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
              : 'bg-primary text-primary-foreground hover:opacity-90 active:bg-primary cursor-pointer'
          }`}
          aria-label="Perform quantum measurement collapse"
        >
          {collapsed ? 'Measurement Recorded' : 'Measure (Collapse Wavefunction)'}
        </button>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {collapsed
            ? '✓ Superposition measurement recorded'
            : !prediction
            ? 'Select a prediction (|0>, |1>, or 50/50) to unlock Measure'
            : 'Ready to collapse wavefunction'}
        </span>
      </div>
    </div>
  );
};

export default MeasurementStep;
