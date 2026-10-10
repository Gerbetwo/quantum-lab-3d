import React, { useState } from 'react';

interface ThermalPhotonStepProps {
  onComplete?: (completed: boolean) => void;
  onDecoherenceTested?: () => void;
  onStateChange?: (state: { photonCount: number; tested: boolean }) => void;
}

export const ThermalPhotonStep: React.FC<ThermalPhotonStepProps> = ({
  onComplete,
  onDecoherenceTested,
  onStateChange,
}) => {
  const [photonCount, setPhotonCount] = useState<number>(0);
  const [tested, setTested] = useState<boolean>(false);
  const [isPerturbing, setIsPerturbing] = useState<boolean>(false);

  const handlePerturb = () => {
    if (isPerturbing) return; // Duplicate-action protection
    setIsPerturbing(true);

    const nextCount = photonCount + 1;
    setPhotonCount(nextCount);

    if (!tested) {
      setTested(true);
      if (onComplete) onComplete(true);
      if (onDecoherenceTested) onDecoherenceTested(); // Exactly one decoherenceTested metric update per accepted event
    }

    if (onStateChange) {
      onStateChange({ photonCount: nextCount, tested: true });
    }

    setTimeout(() => setIsPerturbing(false), 300);
  };

  return (
    <div className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border" role="region" aria-label="Thermal Photon Step">
      <h3 className="text-xl font-bold mb-3">Thermal Photon Bombardment & Decoherence</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Stray thermal photons interact with quantum circuits, inducing environmental decoherence and collapsing superposition states. Trigger a perturbation to test thermal interaction.
      </p>

      <div className="bg-card p-5 rounded-lg mb-6 border border-border flex items-center justify-between">
        <div>
          <span className="text-xs uppercase tracking-wider text-muted-foreground block">Thermal Photon Counter</span>
          <span className="text-3xl font-mono font-bold text-amber-400" aria-live="polite">
            {photonCount} Photons Detected
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs uppercase tracking-wider text-muted-foreground block">Metric Status</span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded ${tested ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700' : 'bg-muted text-muted-foreground'}`}>
            {tested ? 'decoherenceTested Recorded' : 'Awaiting Perturbation'}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handlePerturb}
          disabled={isPerturbing}
          className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-50"
          aria-label="Perturb thermal field"
        >
          {isPerturbing ? 'Perturbing...' : 'Perturb Thermal Field'}
        </button>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {tested ? '✓ Step complete' : 'Click to perturb field'}
        </span>
      </div>
    </div>
  );
};

export default ThermalPhotonStep;
