import React, { useState, useMemo } from 'react';

interface TemperatureCoherenceStepProps {
  onComplete?: (completed: boolean) => void;
  onStateChange?: (state: { temperature: number; coherenceTimeUs: number; isCritical: boolean }) => void;
}

export const TemperatureCoherenceStep: React.FC<TemperatureCoherenceStepProps> = ({
  onComplete,
  onStateChange,
}) => {
  const [temperature, setTemperature] = useState<number>(300); // 15 to 5,000 mK
  const [interacted, setInteracted] = useState<boolean>(false);

  // Canonical helper logic: finite coherence time calculation inversely proportional to temperature
  const coherenceTimeUs = useMemo(() => {
    const t = Math.max(temperature, 1);
    return Number((15000 / t).toFixed(2));
  }, [temperature]);

  // Critical status ONLY when temperature is strictly greater than 1,200 mK
  const isCritical = temperature > 1200;

  const handleTemperatureChange = (newTemp: number) => {
    setTemperature(newTemp);
    if (!interacted) {
      setInteracted(true);
      if (onComplete) onComplete(true);
    }
    if (onStateChange) {
      onStateChange({ temperature: newTemp, coherenceTimeUs, isCritical });
    }
  };

  return (
    <div className="p-6 bg-slate-900 rounded-xl text-slate-100 shadow-lg border border-slate-800" role="region" aria-label="Temperature Coherence Step">
      <h3 className="text-xl font-bold mb-3">Cryogenic Temperature & Coherence Lifetime</h3>
      <p className="text-sm text-slate-300 mb-6">
        Adjust the refrigerator temperature between 15 mK and 5,000 mK. Lower temperatures drastically extend finite quantum coherence times by suppressing thermal fluctuations.
      </p>

      <div className="bg-slate-800 p-5 rounded-lg mb-6 border border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-400 block">Finite Coherence Time</span>
          <span className="text-2xl font-mono font-bold text-cyan-400" aria-live="polite">
            {coherenceTimeUs} us
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs uppercase tracking-wider text-slate-400 block">Thermal Status</span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded border ${isCritical ? 'bg-red-950/50 text-red-300 border-red-700' : 'bg-emerald-950/50 text-emerald-300 border-emerald-700'}`}>
            {isCritical ? 'Critical (T > 1,200 mK)' : 'Stable Cryogenic Range'}
          </span>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="temp-slider" className="text-sm font-medium text-slate-300">
            Temperature: <span className="font-mono text-cyan-400">{temperature} mK</span>
          </label>
          <span className="text-xs text-slate-400" aria-live="polite">
            {interacted ? '✓ Temperature adjusted' : 'Adjust temperature slider'}
          </span>
        </div>
        <input
          id="temp-slider"
          type="range"
          min={15}
          max={5000}
          step={5}
          value={temperature}
          onChange={(e) => handleTemperatureChange(Number(e.target.value))}
          className="w-full accent-cyan-500 cursor-pointer bg-slate-700 rounded-lg h-2"
          aria-label="Cryogenic temperature in millikelvin"
        />
        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
          <span>15 mK (Base Dilution)</span>
          <span>1,200 mK (Critical Threshold)</span>
          <span>5,000 mK (Thermal Noise)</span>
        </div>
      </div>
    </div>
  );
};

export default TemperatureCoherenceStep;
