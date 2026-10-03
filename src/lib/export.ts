import {
  getOrCreateUserId,
  getStoredProgress,
  getStoredActiveTab,
  getStoredMetrics,
  getAllMissionStates,
  saveMissionState,
  getMissionState,
  saveCompletedMission,
  UserMetrics
} from './cookies';

export { saveMissionState, getMissionState, saveCompletedMission };

export interface SessionExportData {
  version: string;
  exportedAt: string;
  userId: string;
  progress: number[];
  metrics: UserMetrics;
  activeTab: number;
  missionState: Record<string, any>;
}

export function exportSessionJSON(): string {
  const data: SessionExportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    userId: getOrCreateUserId(),
    progress: getStoredProgress(),
    metrics: getStoredMetrics(),
    activeTab: getStoredActiveTab(),
    missionState: getAllMissionStates(),
  };
  return JSON.stringify(data, null, 2);
}

export function downloadSessionJSON(): void {
  const jsonString = exportSessionJSON();
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `quantum-session-${getOrCreateUserId()}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
