import React from 'react';
import { SuperpositionMission } from './modules/SuperpositionMission';
import { EntanglementMission } from './modules/EntanglementMission';
import { DecoherenceMission } from './modules/DecoherenceMission';
import { ApplicationsMission } from './modules/ApplicationsMission';
import { GatesMission } from './modules/GatesMission';
import { GroverMission } from './modules/GroverMission';
import { ErrorCorrectionMission } from './modules/ErrorCorrectionMission';

export const MISSION_COMPONENTS: Record<string, React.FC> = {
  'superposition': SuperpositionMission,
  'entanglement': EntanglementMission,
  'decoherence': DecoherenceMission,
  'applications': ApplicationsMission,
  'gates': GatesMission,
  'grover': GroverMission,
  'error-correction': ErrorCorrectionMission,
};

interface MissionRegistryProps {
  missionId: string;
}

export const MissionRegistry: React.FC<MissionRegistryProps> = ({ missionId }) => {
  const Component = MISSION_COMPONENTS[missionId];

  if (!Component) {
    return (
      <div className="p-8 bg-slate-900 text-red-400 rounded-xl border border-red-800">
        <h3 className="text-xl font-bold">Mission Not Found</h3>
        <p className="text-sm">Canonical mission ID &quot;{missionId}&quot; is not recognized.</p>
      </div>
    );
  }

  return <Component />;
};
