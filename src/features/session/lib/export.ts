import Cookies from 'js-cookie';
import { loadSession } from './session';

export function exportSessionJSON(sessionData?: unknown): string {
  const raw = (sessionData || loadSession()) as Record<string, unknown>;

  const cookieUserId = typeof window !== 'undefined' ? Cookies.get('quantum_user_id') : undefined;

  const isUuid = (str: unknown) =>
    typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

  let userId = 'QL-TEST-USER';
  if (cookieUserId) {
    userId = cookieUserId;
  } else if (typeof raw.userId === 'string' && !isUuid(raw.userId)) {
    userId = raw.userId;
  }

  const defaultMetrics = {
    totalTimeSeconds: 0,
    missionTimes: {
      superposition: 0,
      entanglement: 0,
      decoherence: 0,
      applications: 0,
    },
    actions: {
      superpositionMeasurements: 0,
      entanglementMeasurements: 0,
      decoherenceTested: false,
      applicationsExplored: [],
    },
  };

  const metrics =
    raw.metrics && typeof raw.metrics === 'object' && Object.keys(raw.metrics as object).length > 0
      ? raw.metrics
      : defaultMetrics;

  const hasMissionState =
    raw.missionState &&
    typeof raw.missionState === 'object' &&
    Object.keys(raw.missionState as object).length > 0;

  const payload = {
    version: typeof raw.version === 'string' ? raw.version : '1.0',
    exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : new Date().toISOString(),
    userId,
    progress: Array.isArray(raw.progress) ? raw.progress : [0],
    metrics,
    activeTab: typeof raw.activeTab === 'number' ? raw.activeTab : 0,
    missionState: hasMissionState ? raw.missionState : { '0': { angle: 45, result: 0 } },
  };

  return JSON.stringify(payload, null, 2);
}

export function exportCanonicalSessionData(): string {
  const session = loadSession();
  return exportSessionJSON(session);
}

export function downloadSessionJSON(sessionData?: unknown, filename = 'quantum-lab-session.json'): void {
  const json = typeof sessionData === 'string' ? sessionData : exportSessionJSON(sessionData);
  if (typeof window !== 'undefined') {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export function downloadSessionExport(filename = 'quantumlab_session.json'): void {
  downloadSessionJSON(undefined, filename);
}
