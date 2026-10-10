import React, { useState } from 'react';

interface MolecularComparisonStepProps {
  onComplete?: (completed: boolean) => void;
  onStateChange?: (state: { mode: 'classical' | 'quantum'; switched: boolean }) => void;
}

export const MolecularComparisonStep: React.FC<MolecularComparisonStepProps> = ({ onComplete, onStateChange }) => {
  const [mode, setMode] = useState<'classical' | 'quantum'>('classical');
  const [switched, setSwitched] = useState<boolean>(false);

  const handleSwitch = (newMode: 'classical' | 'quantum') => {
    setMode(newMode);
    if (!switched) {
      setSwitched(true);
      if (onComplete) onComplete(true);
    }
    if (onStateChange) {
      onStateChange({ mode: newMode, switched: true });
    }
  };

  return (
    <div className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border" role="region" aria-label="Molecular Comparison Step">
      <h3 className="text-xl font-bold mb-3">Molecular Simulation: Classical vs. Quantum</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Compare educational molecular models without losing workspace state. Switch between classical approximation and quantum state simulation.
      </p>

      {/* Mode Switcher Tabs */}
      <div className="flex gap-2 mb-6" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'classical'}
          onClick={() => handleSwitch('classical')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${mode === 'classical' ? 'bg-primary text-primary-foreground text-white' : 'bg-card text-muted-foreground hover:bg-muted'}`}
        >
          Classical Approximation Model
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'quantum'}
          onClick={() => handleSwitch('quantum')}
          className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-colors ${mode === 'quantum' ? 'bg-primary text-primary-foreground text-white' : 'bg-card text-muted-foreground hover:bg-muted'}`}
        >
          Quantum Simulation Model
        </button>
      </div>

      {/* Interactive Illustration Container with Textual Fallback */}
      <div className="bg-card p-6 rounded-lg mb-6 border border-border">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs uppercase tracking-wider text-accent font-semibold">
            {mode === 'classical' ? 'Classical Molecular Model (Approximation)' : 'Quantum Superposition Molecular Model'}
          </span>
          <span className="text-[10px] bg-background text-muted-foreground px-2 py-1 rounded border border-border">
            Educational Illustration Only
          </span>
        </div>

        {mode === 'classical' ? (
          <div>
            <p className="text-sm text-foreground mb-2">
              Classical algorithms approximate electronic orbitals using exponential scaling tables, leading to severe computational bottlenecks for larger molecules.
            </p>
            <div className="text-xs text-muted-foreground font-mono bg-background p-3 rounded border border-border">
              [Illustration] Estimated Classical Evaluation Time: ~10^12 years for Caffeine molecule approximation.
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-foreground mb-2">
              Quantum simulation maps molecular wavefunctions directly onto qubits, scaling polynomially and accurately capturing entanglement in chemical bonds.
            </p>
            <div className="text-xs text-accent font-mono bg-background p-3 rounded border border-border">
              [Illustration] Estimated Quantum Evaluation Time: ~Hours (Educational benchmark illustration — not a hardware guarantee).
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{switched ? '✓ Comparison mode switched & persisted.' : 'Switch views to explore models.'}</span>
        <span aria-live="polite">Current view: {mode.toUpperCase()}</span>
      </div>
    </div>
  );
};

export default MolecularComparisonStep;
