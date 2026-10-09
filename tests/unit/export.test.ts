import { describe, test, expect, vi, beforeEach } from 'vitest';
import Cookies from 'js-cookie';
import { exportSessionJSON, downloadSessionJSON } from '@/features/session/lib/sessionService';
import { saveMissionState, saveCompletedMission, COOKIE_USER_ID, COOKIE_MISSION_STATE } from '@/features/session/lib/sessionService';

describe('Exportación de sesión JSON', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-02T12:00:00.000Z'));
    Cookies.remove(COOKIE_MISSION_STATE);
    Cookies.set(COOKIE_USER_ID, 'QL-TEST-USER');
  });

  test('exportSessionJSON genera la estructura completa y coincide con la snapshot', () => {
    saveCompletedMission(0);
    saveMissionState(0, { angle: 45, result: 0 });

    const jsonString = exportSessionJSON();
    const parsed = JSON.parse(jsonString);

    expect(parsed).toMatchObject({
      version: '1.0',
      exportedAt: '2026-10-02T12:00:00.000Z',
      userId: 'QL-TEST-USER',
      progress: [0],
      activeTab: 0,
      missionState: {
        '0': { angle: 45, result: 0 },
      },
    });

    expect(parsed.userId).toBe('QL-TEST-USER');
    expect(parsed.metrics).toBeDefined();

    expect(jsonString).toMatchSnapshot();
  });

  test('downloadSessionJSON crea el elemento anchor y gatilla la descarga', () => {
    const createObjectURLMock = vi.fn(() => 'blob:http://localhost/test-uuid');
    const revokeObjectURLMock = vi.fn();
    global.URL.createObjectURL = createObjectURLMock;
    global.URL.revokeObjectURL = revokeObjectURLMock;

    const clickMock = vi.fn();
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const elem = document.createElementNS('http://www.w3.org/1999/xhtml', tagName);
      if (tagName === 'a') {
        elem.click = clickMock;
      }
      return elem as HTMLElement;
    });

    downloadSessionJSON();

    expect(createObjectURLMock).toHaveBeenCalled();
    expect(clickMock).toHaveBeenCalled();
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalled();
  });
});
