export interface MissionStep {
  id: string;
  instruction: string;
  targetStateCheck?: (circuitState: unknown) => boolean;
}

export interface MissionConfig {
  id: string;
  title: string;
  subtitle: string;
  sceneType: 'bloch' | 'cryostat' | 'entanglement' | 'shor';
  steps: MissionStep[];
}
