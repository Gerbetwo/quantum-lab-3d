import React, { useState } from 'react';
import { uniformAmplitudes } from '@/core/quantum/algorithms/grover';

interface SingleGroverIterationStepProps {
  onComplete?: (completed: boolean) => void;
  onStateChange?: (state: { executed: boolean; distribution: number[] }) => void;
}

export const SingleGroverIterationStep: React.FC<SingleGroverIterationStepProps> = ({
  onComplete,
  onStateChange,
}) => {
  const N = 4; // 2 qubits: states |00>, |01>, |10>, |11>
  const targetIndex = 2; // Target state |10>
  const [amplitudes, setAmplitudes] = useState<number[]>(() => uniformAmplitudes(N));
  const [phaseFlipped, setPhaseFlipped] = useState<boolean>(false);
  const [stepPhase, setStepPhase] = useState<'initial' | 'oracle' | 'diffusion'>('initial');

  // Probability distribution: |amp|^2
  const distribution = amplitudes.map((amp) => amp * amp);

  // 1. Apply Oracle (Phase Flip)
  const handleApplyOracle = () => {
    // Oracle flips the phase of the target state |targetIndex>
    const nextAmps = amplitudes.map((amp, idx) => (idx === targetIndex ? -Math.abs(amp) : amp));
    setAmplitudes(nextAmps);
    setPhaseFlipped(true);
    setStepPhase('oracle');
  };

  // 2. Apply Diffusion (Amplify)
  const handleApplyDiffusion = () => {
    // Diffusion operator (inversion about the mean): 2 * mean - amp
    // For 2 qubits (N=4), after 1 oracle + 1 diffusion, target reaches 100% probability
    const mean = amplitudes.reduce((sum, val) => sum + val, 0) / N;
    const nextAmps = amplitudes.map((val) => 2 * mean - val);
    const nextDist = nextAmps.map((a) => a * a);

    setAmplitudes(nextAmps);
    setPhaseFlipped(false);
    setStepPhase('diffusion');

    if (onComplete) onComplete(true);
    if (onStateChange) onStateChange({ executed: true, distribution: nextDist });
  };

  const handleReset = () => {
    setAmplitudes(uniformAmplitudes(N));
    setPhaseFlipped(false);
    setStepPhase('initial');
  };

  return (
    <div className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border" role="region" aria-label="Single Grover Iteration Step">
      <h3 className="text-xl font-bold mb-3">Grover Iteration: Oracle & Diffusion Amplification</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Follow the two-stage Grover iteration step. First, the oracle marks the target state <span className="font-mono text-accent">|10⟩</span> by inverting its phase. Then, the diffusion operator reflects all amplitudes about their mean, amplifying the target state probability toward 100%.
      </p>

      {/* Normalized Distribution Bar / Grid */}
      <div className="bg-card p-5 rounded-lg mb-6 border border-border">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Normalized State Probabilities</span>
          <span className="text-xs font-mono text-accent">Target State: |10⟩ (Index #{targetIndex})</span>
        </div>
        <div className="grid grid-cols-4 gap-2 mb-3">
          {distribution.map((prob, idx) => {
            const isTarget = idx === targetIndex;
            const amp = amplitudes[idx] ?? 0;
            const percent = Math.min(100, Math.max(0, prob * 100));
            return (
              <div key={idx} className="bg-background p-3 rounded border border-border text-center">
                <span className="text-[10px] text-muted-foreground block mb-1">State |{idx.toString(2).padStart(2, '0')}⟩</span>
                <span className={`font-mono text-sm font-bold block ${isTarget ? 'text-accent' : 'text-muted-foreground'}`}>
                  {percent.toFixed(1)}%
                </span>
                <span className="font-mono text-[10px] text-muted-foreground block">
                  amp: {amp < 0 ? '-' : '+'}{Math.abs(amp).toFixed(3)}
                </span>
                <div className="w-full bg-card h-2 rounded-full mt-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${isTarget ? 'bg-accent shadow-[0_0_8px_rgba(0,240,255,0.5)]' : 'bg-slate-600'}`} 
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-muted-foreground italic">
          {stepPhase === 'initial' && 'Uniform superposition initialized: all 4 states have equal 25.0% probability.'}
          {stepPhase === 'oracle' && '✓ Phase flipped on target state |10⟩. Now apply diffusion to amplify amplitude.'}
          {stepPhase === 'diffusion' && '✓ Amplitude amplification complete! Target state |10⟩ amplified to 100.0%.'}
        </p>
      </div>

      {/* 2 Ordered Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleApplyOracle}
            disabled={stepPhase === 'oracle'}
            className={`px-5 py-2.5 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
              stepPhase === 'oracle'
                ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
                : 'bg-primary text-primary-foreground hover:opacity-90 active:bg-primary cursor-pointer'
            }`}
            aria-label="Apply Oracle Phase Flip"
          >
            1. Apply Oracle (Phase Flip)
          </button>

          <button
            type="button"
            onClick={handleApplyDiffusion}
            disabled={!phaseFlipped}
            className={`px-5 py-2.5 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
              !phaseFlipped
                ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
                : 'bg-accent hover:bg-accent text-accent-foreground font-bold shadow-[0_0_12px_rgba(0,240,255,0.3)] cursor-pointer'
            }`}
            aria-label="Apply Diffusion Amplify"
          >
            2. Apply Diffusion (Amplify)
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 bg-muted hover:bg-secondary text-foreground text-xs rounded-lg transition-colors"
          >
            Reset
          </button>
        </div>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          {stepPhase === 'diffusion' ? '✓ Amplified to 100%' : phaseFlipped ? 'Ready for Diffusion' : 'Click Step 1'}
        </span>
      </div>
    </div>
  );
};

export default SingleGroverIterationStep;
