import React, { useMemo } from 'react';
import { useQuantumStore } from '../../../../../store/useQuantumStore';

interface BlochStateStepProps {
  onComplete?: (completed: boolean) => void;
  onStateChange?: (state: { theta: number; phi: number; p0: number; p1: number }) => void;
}

export const BlochStateStep: React.FC<BlochStateStepProps> = ({ onComplete, onStateChange }) => {
  const theta = useQuantumStore((s) => s.theta);
  const phi = useQuantumStore((s) => s.phi);
  const setAngles = useQuantumStore((s) => s.setAngles);

  // Canonical quantum probability calculations
  const p0 = useMemo(() => Math.cos(theta / 2) ** 2, [theta]);
  const p1 = useMemo(() => Math.sin(theta / 2) ** 2, [theta]);

  const handleThetaChange = (newTheta: number) => {
    setAngles(newTheta, phi);
    if (onComplete) onComplete(true);
    if (onStateChange) {
      onStateChange({ theta: newTheta, phi, p0: Math.cos(newTheta / 2) ** 2, p1: Math.sin(newTheta / 2) ** 2 });
    }
  };

  const handlePhiChange = (newPhi: number) => {
    setAngles(theta, newPhi);
    if (onComplete) onComplete(true);
    if (onStateChange) {
      onStateChange({ theta, phi: newPhi, p0, p1 });
    }
  };

  const applyPreset = (presetTheta: number, presetPhi: number = 0) => {
    setAngles(presetTheta, presetPhi);
    if (onComplete) onComplete(true);
    if (onStateChange) {
      onStateChange({
        theta: presetTheta,
        phi: presetPhi,
        p0: Math.cos(presetTheta / 2) ** 2,
        p1: Math.sin(presetTheta / 2) ** 2,
      });
    }
  };

  return (
    <div className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border" role="region" aria-label="Bloch State Step">
      <h3 className="text-xl font-bold mb-3">Bloch Sphere & State Parameterization</h3>
      <p className="text-sm text-muted-foreground mb-6">
        Explore quantum state parameterization using polar angle theta ($	heta$) and azimuthal angle phi ($phi$). Adjust theta to alter state probabilities.
      </p>

      {/* WebGL / Textual Workspace Fallback Container */}
      <div className="bg-card p-5 rounded-lg mb-6 border border-border flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-1/2">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">State Vector Coefficients</div>
          <div className="font-mono text-sm bg-background p-3 rounded border border-border text-accent">
            <div>|ψ⟩ = cos(θ/2)|0⟩ + e^(iφ) sin(θ/2)|1⟩</div>
            <div className="mt-2 text-xs text-muted-foreground">
              Probabilities: P(|0⟩) = {(p0 * 100).toFixed(1)}% | P(|1⟩) = {(p1 * 100).toFixed(1)}%
            </div>
          </div>
        </div>
        <div className="w-full md:w-1/2 flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Canonical Presets</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => applyPreset(0, phi)}
              className="flex-1 py-1.5 px-3 bg-muted hover:bg-secondary rounded text-xs font-semibold"
            >
              |0⟩
            </button>
            <button
              type="button"
              onClick={() => applyPreset(Math.PI / 2, phi)}
              className="flex-1 py-1.5 px-3 bg-primary text-primary-foreground hover:bg-primary rounded text-xs font-semibold"
            >
              |+⟩ (θ=π/2)
            </button>
            <button
              type="button"
              onClick={() => applyPreset(Math.PI, phi)}
              className="flex-1 py-1.5 px-3 bg-muted hover:bg-secondary rounded text-xs font-semibold"
            >
              |1⟩
            </button>
          </div>
        </div>
      </div>

      {/* Angle Sliders (theta, phi) */}
      <div className="space-y-4 mb-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="theta-slider" className="text-sm font-medium text-muted-foreground">
              Polar Angle Theta (θ): <span className="font-mono text-accent">{theta.toFixed(3)} rad</span> ({(theta * 180 / Math.PI).toFixed(0)}°)
            </label>
            <span className="text-xs text-muted-foreground" aria-live="polite">
              P(|0⟩): {(p0 * 100).toFixed(1)}% | P(|1⟩): {(p1 * 100).toFixed(1)}%
            </span>
          </div>
          <input
            id="theta-slider"
            type="range"
            min={0}
            max={Math.PI}
            step={0.01}
            value={theta}
            onChange={(e) => handleThetaChange(parseFloat(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer bg-muted rounded-lg h-2"
            aria-label="Theta angle slider"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="phi-slider" className="text-sm font-medium text-muted-foreground">
              Azimuthal Angle Phi (φ): <span className="font-mono text-accent">{phi.toFixed(3)} rad</span> ({(phi * 180 / Math.PI).toFixed(0)}°)
            </label>
          </div>
          <input
            id="phi-slider"
            type="range"
            min={0}
            max={2 * Math.PI}
            step={0.01}
            value={phi}
            onChange={(e) => handlePhiChange(parseFloat(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer bg-muted rounded-lg h-2"
            aria-label="Phi angle slider"
          />
        </div>
      </div>
    </div>
  );
};

export default BlochStateStep;
