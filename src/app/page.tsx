'use client';

import { BlochSphereWorkspace } from '@/features/quantum-core/BlochViewport';
import { MathDock } from '@/features/quantum-core/MathDock';
import { EntanglementOverlay } from '@/features/quantum-core/EntanglementOverlay';
import { MissionWorkspace } from '@/features/missions/MissionWorkspace';
import { useQuantumStore } from '@/store/useQuantumStore';

export default function Page() {
  const activeMissionId = useQuantumStore(
    (s) => s.currentMissionId ?? s.activeMissionId ?? 'superposition'
  );

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-61px)] overflow-hidden p-4 gap-4 bg-background">
      {/* Left/Center (60%): BlochSphereWorkspace mounted as a single persistent WebGL canvas across missions */}
      <div className="w-full lg:w-[60%] h-full flex flex-col min-h-0 gap-3">
        <div className="flex-1 min-h-0">
          <BlochSphereWorkspace />
        </div>
        {activeMissionId === 'entanglement' && (
          <div className="shrink-0">
            <EntanglementOverlay />
          </div>
        )}
      </div>

      {/* Right (40%): Active Mission control panel (top) + MathDock (bottom) */}
      <div className="w-full lg:w-[40%] h-full flex flex-col gap-4 overflow-y-auto pr-1">
        <div className="shrink-0">
          <MissionWorkspace />
        </div>
        <div className="flex-1">
          <MathDock />
        </div>
      </div>
    </div>
  );
}