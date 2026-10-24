"use client";
import React from "react";
import { CoreBlochSphere, type CoreBlochSphereProps } from "../3d/CoreBlochSphere";
import { DecoherencePanel } from "../EntanglementDecoherencePanels";
import { calculateT2CoherenceTime, applyPhaseDecay } from "@/core/decoherenceMath";

export interface Mission06DecoherenceProps extends CoreBlochSphereProps {
  temperature?: number;
  onTemperatureChange?: (temp: number) => void;
  onReset?: () => void;
}

export function Mission06Decoherence({
  temperature = 15,
  onTemperatureChange,
  onReset,
  ...props
}: Mission06DecoherenceProps) {
  const t2Time = calculateT2CoherenceTime(temperature);
  const phaseDecay = applyPhaseDecay(Math.PI / 2, 0, 0.15, t2Time);
  const vectorPurity = phaseDecay.purity;

  return (
    <div className="relative w-full h-full flex flex-col md:flex-row">
      <div className="flex-1 h-full min-h-60">
        <CoreBlochSphere
          temperature={temperature}
          purity={vectorPurity}
          {...props}
        />
      </div>
      <div className="w-full md:w-80 p-4 border-l border-border bg-card/80 backdrop-blur-md">
        <DecoherencePanel
          temperature={temperature}
          t2Time={t2Time}
          vectorPurity={vectorPurity}
          onTemperatureChange={onTemperatureChange ?? (() => {})}
          onReset={onReset}
        />
      </div>
    </div>
  );
}

export default Mission06Decoherence;
