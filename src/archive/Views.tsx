// @ts-nocheck
/* eslint-disable */
import React, { useState } from 'react';
import { MISSIONS } from '@/features/missions/missionRegistry';
import { CircuitWorkbench, ViewModeSwitcher, HistogramView, PhaseDiskView } from '@/archive/legacy-ui-workbenches';
import { BlochPairView } from '@/features/quantum-core/EntanglementOverlay';
import { BlochSphereWorkspace } from '@/features/quantum-core/BlochViewport';
import { useSession } from '@/archive/legacy-store-telemetry';

export function LegacyViewsWrapper() {
  const [mode, setMode] = useState('bloch');
  return (
    <div className="p-4">
      <ViewModeSwitcher mode={mode} onChange={setMode} />
      {mode === 'bloch' && <BlochPairView />}
      {mode === 'histogram' && <HistogramView />}
      {mode === 'phase-disk' && <PhaseDiskView />}
      <CircuitWorkbench />
    </div>
  );
}