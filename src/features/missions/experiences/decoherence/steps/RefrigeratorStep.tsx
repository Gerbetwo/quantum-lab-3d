import React, { useState } from 'react';

interface RefrigeratorStepProps {
  onComplete?: (completed: boolean) => void;
  onStateChange?: (state: { temperature: number; coherenceTimeUs: number; isCritical: boolean; activated: boolean }) => void;
}

export const RefrigeratorStep: React.FC<RefrigeratorStepProps> = ({ onComplete, onStateChange }) => {
  const [activated, setActivated] = useState<boolean>(false);
  const [temperature, setTemperature] = useState<number>(300);
  const [coherenceTimeUs, setCoherenceTimeUs] = useState<number>(50);
  const [_isCritical, setIsCritical] = useState<boolean>(true);

  const handleActivateRefrigerator = () => {
    if (activated) return;
    const targetTemp = 15; // 15 mK base dilution refrigerator activation
    const targetCoherence = Number((15000 / targetTemp).toFixed(2));
    const targetCritical = targetTemp > 1200;

    setTemperature(targetTemp);
    setCoherenceTimeUs(targetCoherence);
    setIsCritical(targetCritical);
    setActivated(true);

    if (onComplete) onComplete(true);
    if (onStateChange) {
      onStateChange({
        temperature: targetTemp,
        coherenceTimeUs: targetCoherence,
        isCritical: targetCritical,
        activated: true,
      });
    }
  };

  return (
    <div className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border" role="region" aria-label="Refrigerator Step">
      <h3 className="text-xl font-bold mb-3">Cryogenic Dilution Refrigerator Activation</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Activate the dilution refrigerator to cool the quantum processor down to base operating temperature (15 mK), maximizing coherence lifetime.
      </p>

      <div className="bg-card p-5 rounded-lg mb-6 border border-border flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-muted-foreground block">System Temperature</span>
          <span className="text-2xl font-mono font-bold text-accent" aria-live="polite">
            {temperature} mK
          </span>
        </div>
        <div>
          <span className="text-xs uppercase tracking-wider text-muted-foreground block">Coherence Lifetime</span>
          <span className="text-2xl font-mono font-bold text-emerald-400" aria-live="polite">
            {coherenceTimeUs} us
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs uppercase tracking-wider text-muted-foreground block">Status</span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded border ${activated ? 'bg-cyan-950/50 text-accent border-cyan-700' : 'bg-muted text-muted-foreground'}`}>
            {activated ? 'Refrigerator Active (15 mK)' : 'Standby / Warm'}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleActivateRefrigerator}
          disabled={activated}
          className={`px-6 py-2.5 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400 ${activated ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary text-primary-foreground hover:opacity-90 active:bg-cyan-700 text-white'}`}
          aria-label="Activate cryogenic refrigerator"
        >
          {activated ? 'Refrigerator Active' : 'Activate Refrigerator'}
        </button>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {activated ? '✓ Step complete & recomputed' : 'Awaiting activation action'}
        </span>
      </div>
    </div>
  );
};

export default RefrigeratorStep;
