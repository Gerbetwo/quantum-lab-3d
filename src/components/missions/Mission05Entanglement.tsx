"use client";
import React from "react";
import { EntanglementDualSphere, type EntanglementDualSphereProps } from "../3d/EntanglementDualSphere";
import { EntanglementPanel } from "../EntanglementDecoherencePanels";

export interface Mission05EntanglementProps extends EntanglementDualSphereProps {
  onMeasure?: () => void;
  onReset?: () => void;
}

export function Mission05Entanglement({
  entangledPair,
  onMeasure,
  onReset,
  ...props
}: Mission05EntanglementProps) {
  return (
    <div className="relative w-full h-full flex flex-col md:flex-row">
      <div className="flex-1 h-full min-h-60">
        <EntanglementDualSphere entangledPair={entangledPair} {...props} />
      </div>
      <div className="w-full md:w-80 p-4 border-l border-border bg-card/80 backdrop-blur-md">
        <EntanglementPanel entangledPair={entangledPair ?? null} onMeasure={onMeasure} onReset={onReset} />
      </div>
    </div>
  );
}

export default Mission05Entanglement;
