import {
  getOrCreateUserId,
  getStoredProgress,
  getStoredMetrics,
  getStoredActiveTab,
  getAllMissionStates,
} from './cookies';

export interface SessionExportData {
  version: string;
  exportedAt: string;
  userId: string;
  progress: number[];
  metrics: ReturnType<typeof getStoredMetrics>;
  activeTab: number;
  missionState: Record<string, Record<string, unknown>>;
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
  if (typeof window === 'undefined') return;

  const jsonString = exportSessionJSON();
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `quantum-lab-session-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
