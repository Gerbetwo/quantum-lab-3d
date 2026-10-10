import React, { useState } from 'react';

interface ClassicalBitStepProps {
  onComplete?: (completed: boolean) => void;
  onStateChange?: (state: { value: number; label: string }) => void;
}

export const ClassicalBitStep: React.FC<ClassicalBitStepProps> = ({ onComplete, onStateChange }) => {
  const [bitValue, setBitValue] = useState<0 | 1>(0);
  const [hasToggled, setHasToggled] = useState<boolean>(false);

  const label = bitValue === 0 ? 'LOW' : 'HIGH';

  const handleToggle = () => {
    const nextValue = bitValue === 0 ? (1 as const) : (0 as const);
    setBitValue(nextValue);
    const nextLabel = nextValue === 0 ? 'LOW' : 'HIGH';
    
    if (!hasToggled) {
      setHasToggled(true);
      if (onComplete) onComplete(true);
    }

    if (onStateChange) {
      onStateChange({ value: nextValue, label: nextLabel });
    }
  };

  return (
    <div className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border" role="region" aria-label="Classical Bit Step">
      <h3 className="text-xl font-bold mb-3">Classical Bit: Deterministic State</h3>
      <p className="text-sm text-muted-foreground mb-6">
        A classical bit is strictly deterministic, existing in a definite state of either 0 (LOW) or 1 (HIGH).
      </p>

      <div className="flex items-center justify-between bg-card p-4 rounded-lg mb-6">
        <div>
          <span className="text-xs uppercase tracking-wider text-muted-foreground block">Current State</span>
          <span className="text-2xl font-mono font-bold text-accent" aria-live="polite">
            {bitValue} ({label})
          </span>
        </div>
        <div 
          className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-colors duration-300 ${bitValue === 1 ? 'bg-cyan-500 text-slate-950' : 'bg-muted text-muted-foreground'}`}
          aria-hidden="true"
        >
          {bitValue}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleToggle}
          className="px-5 py-2.5 bg-primary text-primary-foreground hover:opacity-90 active:bg-cyan-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-400"
          aria-label={`Toggle bit value from ${label} to ${bitValue === 0 ? 'HIGH' : 'LOW'}`}
        >
          Toggle Bit
        </button>
        <div className="text-xs text-muted-foreground" aria-live="polite">
          {hasToggled ? '✓ Step requirement completed (Toggled)' : 'Pending first toggle...'}
        </div>
      </div>
    </div>
  );
};

export default ClassicalBitStep;
