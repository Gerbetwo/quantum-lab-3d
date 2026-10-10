import React, { useState, useMemo } from 'react';

interface BlochStateStepProps {
  onComplete?: (completed: boolean) => void;
  onStateChange?: (state: { theta: number; phi: number; p0: number; p1: number }) => void;
}

export const BlochStateStep: React.FC<BlochStateStepProps> = ({ onComplete, onStateChange }) => {
  const [theta, setTheta] = useState<number>(Math.PI / 4); // Default superposition angle
  const [phi, setPhi] = useState<number>(0);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);

  // Canonical quantum probability calculations
  const p0 = useMemo(() => Math.cos(theta / 2) ** 2, [theta]);
  const p1 = useMemo(() => Math.sin(theta / 2) ** 2, [theta]);

  const handleThetaChange = (newTheta: number) => {
    setTheta(newTheta);
    if (!hasInteracted) {
      setHasInteracted(true);
      if (onComplete) onComplete(true);
    }
    if (onStateChange) {
      onStateChange({ theta: newTheta, phi, p0, p1 });
    }
  };

  const applyPreset = (presetTheta: number, presetPhi: number = 0) => {
    setTheta(presetTheta);
    setPhi(presetPhi);
    if (!hasInteracted) {
      setHasInteracted(true);
      if (onComplete) onComplete(true);
    }
    if (onStateChange) {
      onStateChange({ theta: presetTheta, phi: presetPhi, p0: Math.cos(presetTheta / 2) ** 2, p1: Math.sin(presetTheta / 2) ** 2 });
    }
  };

  return (
    <div className="p-6 bg-slate-900 rounded-xl text-slate-100 shadow-lg border border-slate-800" role="region" aria-label="Bloch State Step">
      <h3 className="text-xl font-bold mb-3">Bloch Sphere & State Parameterization</h3>
      <p className="text-sm text-slate-300 mb-6">
        Explore quantum state parameterization using polar angle theta ($	heta$) and azimuthal angle phi ($phi$). Adjust theta to alter state probabilities.
      </p>

      {/* WebGL / Textual Workspace Fallback Container */}
      <div className="bg-slate-800 p-5 rounded-lg mb-6 border border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-1/2">
          <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">State Vector Coefficients</div>
          <div className="font-mono text-sm bg-slate-900 p-3 rounded border border-slate-700 text-cyan-300">
            <div>|ψ⟩ = cos(θ/2)|0⟩ + e^(iφ) sin(θ/2)|1⟩</div>
            <div className="mt-2 text-xs text-slate-400">
              Probabilities: P(|0⟩) = {(p0 * 100).toFixed(1)}% | P(|1⟩) = {(p1 * 100).toFixed(1)}%
            </div>
          </div>
        </div>
        <div className="w-full md:w-1/2 flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wider text-slate-400">Canonical Presets</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => applyPreset(0.001, 0)}
              className="flex-1 py-1.5 px-3 bg-slate-700 hover:bg-slate-600 rounded text-xs font-semibold"
            >
              |0⟩ State
            </button>
            <button
              type="button"
              onClick={() => applyPreset(Math.PI / 2, 0)}
              className="flex-1 py-1.5 px-3 bg-cyan-700 hover:bg-cyan-600 rounded text-xs font-semibold"
            >
              |+⟩ State
            </button>
            <button
              type="button"
              onClick={() => applyPreset(Math.PI - 0.001, 0)}
              className="flex-1 py-1.5 px-3 bg-slate-700 hover:bg-slate-600 rounded text-xs font-semibold"
            >
              |1⟩ State
            </button>
          </div>
        </div>
      </div>

      {/* Theta Slider Control (Bounded from 0.001 to π - 0.001) */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="theta-slider" className="text-sm font-medium text-slate-300">
            Polar Angle Theta ($	heta$): <span className="font-mono text-cyan-400">{theta.toFixed(3)} rad</span>
          </label>
          <span className="text-xs text-slate-400" aria-live="polite">
            {hasInteracted ? '✓ Parameterized' : 'Adjust slider to interact'}
          </span>
        </div>
        <input
          id="theta-slider"
          type="range"
          min={0.001}
          max={Math.PI - 0.001}
          step={0.001}
          value={theta}
          onChange={(e) => handleThetaChange(parseFloat(e.target.value))}
          className="w-full accent-cyan-500 cursor-pointer bg-slate-700 rounded-lg h-2"
          aria-label="Theta angle slider"
        />
      </div>
    </div>
  );
};

export default BlochStateStep;
