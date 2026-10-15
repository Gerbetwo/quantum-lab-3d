import React, { useState } from 'react';

interface IndependentQubitsStepProps {
  onComplete?: (completed: boolean) => void;
  onStateChange?: (state: { alice: 0 | 1; bob: 0 | 1 }) => void;
}

export const IndependentQubitsStep: React.FC<IndependentQubitsStepProps> = ({ onComplete, onStateChange }) => {
  const [aliceState, setAliceState] = useState<0 | 1>(0);
  const [bobState, setBobState] = useState<0 | 1>(0);
  const [interacted, setInteracted] = useState<boolean>(false);

  const handleAliceToggle = () => {
    const next = aliceState === 0 ? (1 as const) : (0 as const);
    setAliceState(next);
    checkComplete();
    if (onStateChange) onStateChange({ alice: next, bob: bobState });
  };

  const handleBobToggle = () => {
    const next = bobState === 0 ? (1 as const) : (0 as const);
    setBobState(next);
    checkComplete();
    if (onStateChange) onStateChange({ alice: aliceState, bob: next });
  };

  const checkComplete = () => {
    if (!interacted) {
      setInteracted(true);
      if (onComplete) onComplete(true);
    }
  };

  return (
    <div className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border" role="region" aria-label="Independent Qubits Step">
      <h3 className="text-xl font-bold mb-3">Station Alice & Station Bob: Independent Qubits</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Before entanglement, Alice and Bob operate entirely independently. Changing Alice&apos;s qubit state has zero effect on Bob&apos;s qubit.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Station Alice */}
        <div className="bg-card p-4 rounded-lg border border-border">
          <div className="text-xs uppercase tracking-wider text-accent font-semibold mb-2">Station Alice</div>
          <div className="text-2xl font-mono font-bold mb-4" aria-live="polite">State: |{aliceState}⟩</div>
          <button
            type="button"
            onClick={handleAliceToggle}
            className="px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 active:bg-primary text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Toggle Alice qubit state independently"
          >
            Toggle Alice
          </button>
        </div>

        {/* Station Bob */}
        <div className="bg-card p-4 rounded-lg border border-border">
          <div className="text-xs uppercase tracking-wider text-axis-y font-semibold mb-2">Station Bob</div>
          <div className="text-2xl font-mono font-bold mb-4" aria-live="polite">State: |{bobState}⟩</div>
          <button
            type="button"
            onClick={handleBobToggle}
            className="px-4 py-2 bg-quantum-purple hover:bg-quantum-purple active:bg-quantum-purple text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-axis-y"
            aria-label="Toggle Bob qubit state independently"
          >
            Toggle Bob
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between bg-card p-3 rounded-lg border border-border">
        <span className="text-xs font-semibold uppercase tracking-wider text-warning">System Link Status: Not Entangled</span>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {interacted ? '✓ Independent interaction verified' : 'Modify individual qubit states to proceed'}
        </span>
      </div>
    </div>
  );
};

export default IndependentQubitsStep;
