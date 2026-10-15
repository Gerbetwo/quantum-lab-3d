import React, { useMemo } from "react";
import {
  useQuantumStore,
  calculateCoherenceTime,
} from "../../../../../store/useQuantumStore";

interface TemperatureCoherenceStepProps {
  onComplete?: (completed: boolean) => void;
  onStateChange?: (state: {
    temperature: number;
    coherenceTimeUs: number;
    isCritical: boolean;
  }) => void;
}

export const TemperatureCoherenceStep: React.FC<
  TemperatureCoherenceStepProps
> = ({ onComplete, onStateChange }) => {
  const temperatureK = useQuantumStore((s) => s.temperatureK);
  const coherenceTimeUs = useQuantumStore((s) => s.coherenceTimeUs);
  const setTemperature = useQuantumStore((s) => s.setTemperature);

  const tempMilliKelvin = Math.round(temperatureK * 1000);

  // Critical status when coherence time drops critically low (< 20 us) or temp > 1,200 mK
  const isCritical = tempMilliKelvin > 1200;

  const handleTemperatureChange = (newMilliKelvin: number) => {
    setTemperature(newMilliKelvin);
    const calculatedT2 = calculateCoherenceTime(newMilliKelvin);
    if (onComplete) onComplete(true);
    if (onStateChange) {
      onStateChange({
        temperature: newMilliKelvin,
        coherenceTimeUs: calculatedT2,
        isCritical: newMilliKelvin > 1200,
      });
    }
  };

  const formattedTempLabel = useMemo(() => {
    if (tempMilliKelvin >= 1000) {
      return `${(tempMilliKelvin / 1000).toFixed(2)} K (${tempMilliKelvin.toLocaleString()} mK)`;
    }
    return `${tempMilliKelvin} mK (${(tempMilliKelvin / 1000).toFixed(3)} K)`;
  }, [tempMilliKelvin]);

  return (
    <div
      className="p-6 bg-background rounded-xl text-foreground shadow-lg border border-border"
      role="region"
      aria-label="Temperature Coherence Step"
    >
      <h3 className="text-xl font-bold mb-3">
        Cryogenic Temperature & Coherence Lifetime
      </h3>
      <p className="text-sm text-muted-foreground mb-6">
        Adjust the cryogenic environment temperature between 15 mK and 300,000
        mK (300 K). Coherence follows $T_2(T) = 250 \cdot e^{"-T / 800"}\
        \mu\text{"{s}"}$, scaling and jittering the 3D Bloch vector as
        decoherence accelerates.
      </p>

      <div className="bg-card p-5 rounded-lg mb-6 border border-border flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-muted-foreground block">
            Coherence Time T₂(T)
          </span>
          <span
            className="text-2xl font-mono font-bold text-accent"
            aria-live="polite"
          >
            {coherenceTimeUs.toFixed(2)} μs
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs uppercase tracking-wider text-muted-foreground block">
            Thermal Status
          </span>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded border ${isCritical ? "bg-destructive-subtle text-destructive border-destructive-border" : "bg-success-subtle text-success border-success-border"}`}
          >
            {isCritical
              ? "Critical (Decoherence Active)"
              : "Cryogenic Coherent Range"}
          </span>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label
            htmlFor="temp-slider"
            className="text-sm font-medium text-muted-foreground"
          >
            Temperature:{" "}
            <span className="font-mono text-accent">{formattedTempLabel}</span>
          </label>
          <span
            className="text-xs text-muted-foreground font-mono"
            aria-live="polite"
          >
            T₂(T) = 250 · exp(-T / 800) μs
          </span>
        </div>
        <input
          id="temp-slider"
          type="range"
          min={15}
          max={300000}
          step={15}
          value={tempMilliKelvin}
          onChange={(e) => handleTemperatureChange(Number(e.target.value))}
          className="w-full accent-cyan-500 cursor-pointer bg-muted rounded-lg h-2"
          aria-label="Cryogenic temperature in millikelvin"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>15 mK (0.015 K - Base Dilution)</span>
          <span>1,200 mK (1.2 K - Critical Threshold)</span>
          <span>77,000 mK (77 K - LN2)</span>
          <span>300,000 mK (300 K - Room Temp)</span>
        </div>
      </div>
    </div>
  );
};

export default TemperatureCoherenceStep;
