'use client';

import React from 'react';
import { BlochSphereWorkspace } from '@/components/quantum/BlochSphereWorkspace';

interface MissionWorkspaceFactoryProps {
  activeMissionId: number;
}

export default function MissionWorkspaceFactory({ activeMissionId }: MissionWorkspaceFactoryProps) {
  switch (activeMissionId) {
    case 0:
    case 1:
      return <BlochSphereWorkspace />;
    case 2:
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 bg-card border border-border rounded-xl text-center">
          <h3 className="text-xl font-bold text-foreground mb-2">Bell State Entanglement</h3>
          <p className="text-muted-foreground max-w-md">
            Interactive multi-qubit workspace initialized.
          </p>
        </div>
      );
    case 3:
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 bg-card border border-border rounded-xl text-center">
          <h3 className="text-xl font-bold text-foreground mb-2">Cryogenic Decoherence Dock</h3>
          <p className="text-muted-foreground max-w-md">
            Thermal decoherence simulation active.
          </p>
        </div>
      );
    case 4:
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 bg-card border border-border rounded-xl text-center">
          <h3 className="text-xl font-bold text-foreground mb-2">Quantum Circuit Grid</h3>
          <p className="text-muted-foreground max-w-md">
            Gate pipeline canvas loaded.
          </p>
        </div>
      );
    default:
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 bg-card border border-border rounded-xl text-center">
          <h3 className="text-xl font-bold text-foreground mb-2">Mission Workspace</h3>
          <p className="text-muted-foreground max-w-md">
            Selected mission environment active.
          </p>
        </div>
      );
  }
}
