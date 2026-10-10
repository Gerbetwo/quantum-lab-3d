import React, { useState } from 'react';

interface SeparationStepProps {
  onComplete?: (completed: boolean) => void;
  onStateChange?: (distanceKm: number) => void;
}

export const SeparationStep: React.FC<SeparationStepProps> = ({ onComplete, onStateChange }) => {
  const [distance, setDistance] = useState<number>(1000); // 1,000 km to 400,000 km
  const [interacted, setInteracted] = useState<boolean>(false);

  const handleDistanceChange = (newDistance: number) => {
    setDistance(newDistance);
    if (!interacted) {
      setInteracted(true);
      if (onComplete) onComplete(true);
    }
    if (onStateChange) {
      onStateChange(newDistance);
    }
  };

  return (
    <div className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border" role="region" aria-label="Spatial Separation Step">
      <h3 className="text-xl font-bold mb-3">Spatial Separation & Non-Locality</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Adjust the spatial distance between Station Alice and Station Bob. Note that physical separation changes <em>only the visualization and propagation scale</em>, never the underlying quantum state or entanglement correlation strength.
      </p>

      {/* Physics Safeguard Note */}
      <div className="bg-card p-4 rounded-lg mb-6 border border-border text-xs text-accent">
        <strong>Observation:</strong> Quantum entanglement is independent of distance. Separating the stations by hundreds of thousands of kilometers does not diminish their correlation, nor does it enable faster-than-light signaling.
      </div>

      {/* Slider Control (1,000 to 400,000 km) */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="separation-slider" className="text-sm font-medium text-muted-foreground">
            Distance: <span className="font-mono text-accent">{distance.toLocaleString()} km</span>
          </label>
          <span className="text-xs text-muted-foreground" aria-live="polite">
            {interacted ? '✓ Separation visualized' : 'Adjust distance slider'}
          </span>
        </div>
        <input
          id="separation-slider"
          type="range"
          min={1000}
          max={400000}
          step={1000}
          value={distance}
          onChange={(e) => handleDistanceChange(Number(e.target.value))}
          className="w-full accent-cyan-500 cursor-pointer bg-muted rounded-lg h-2"
          aria-label="Station separation distance in kilometers"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>1,000 km (Orbital)</span>
          <span>200,000 km</span>
          <span>400,000 km (Lunar Distance)</span>
        </div>
      </div>
    </div>
  );
};

export default SeparationStep;
