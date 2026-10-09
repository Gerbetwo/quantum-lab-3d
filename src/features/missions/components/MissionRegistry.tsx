import React from 'react';
import { MissionShell } from './MissionShell';

export interface MissionRegistryProps {
  missionId?: string;
  [key: string]: unknown;
}

export function MissionRegistry({ missionId, ...props }: MissionRegistryProps) {
  return <MissionShell config={{ id: missionId || 'default', title: `Misión ${missionId || ''}`, subtitle: 'Módulo de aprendizaje cuántico', sceneType: 'bloch', steps: [] }} {...props} />;
}

export default MissionRegistry;
