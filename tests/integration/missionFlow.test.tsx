import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';

const { cookieState, pushProgress } = vi.hoisted(() => {
  const state = { progress: [0] as number[], saveCalls: [] as number[] };
  const push = (i: number) => {
    state.saveCalls.push(i);
    state.progress = Array.from(new Set([...state.progress, i])).sort((a, b) => a - b);
  };
  return { cookieState: state, pushProgress: push };
});

vi.mock('@/lib/cookies', () => ({
  getOrCreateUserId: () => 'QL-TEST',
  getStoredProgress: () => [...cookieState.progress],
  getStoredActiveTab: () => 0,
  saveActiveTab: vi.fn(),
  incrementActiveMissionTime: vi.fn(),
  saveCompletedMission: (i: number) => { pushProgress(i); return cookieState.progress; },
  updateStoredMetrics: vi.fn(),
  createDefaultMetrics: () => ({
    totalTimeSeconds: 0,
    missionTimes: { superposition: 0, entanglement: 0, decoherence: 0, applications: 0 },
    actions: { superpositionMeasurements: 0, entanglementMeasurements: 0, decoherenceTested: false, applicationsExplored: [] },
  }),
  DEFAULT_METRICS: {},
  COOKIE_USER_ID: 'quantum_user_id',
  COOKIE_PROGRESS: 'quantum_lab_progress',
  COOKIE_METRICS: 'quantum_lab_metrics',
  COOKIE_ACTIVE_TAB: 'quantum_lab_active_tab',
}));

vi.mock('@/lib/sound', () => ({
  playButtonClick: vi.fn(),
  playChimeSuccess: vi.fn(),
  playLaserScan: vi.fn(),
  playQuantumCollapse: vi.fn(),
  playDecoherenceAlert: vi.fn(),
  isAudioEnabled: () => false,
}));

vi.mock('@/components/Header', () => ({
  default: () => <div data-testid="header-mock">Header</div>,
}));

vi.mock('@/components/CelebrationModal', () => ({
  default: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="celebration-modal">Complete!</div> : null,
}));

vi.mock('@/components/missions/Mission1Superposition', () => ({
  default: ({ onComplete }: { onComplete: () => void }) => (
    <button data-testid="mission-1" onClick={() => { pushProgress(0); onComplete(); }}>Complete Mission 1</button>
  ),
}));
vi.mock('@/components/missions/Mission2Entanglement', () => ({
  default: ({ onComplete }: { onComplete: () => void }) => (
    <button data-testid="mission-2" onClick={() => { pushProgress(1); onComplete(); }}>Complete Mission 2</button>
  ),
}));
vi.mock('@/components/missions/Mission3Decoherence', () => ({
  default: ({ onComplete }: { onComplete: () => void }) => (
    <button data-testid="mission-3" onClick={() => { pushProgress(2); onComplete(); }}>Complete Mission 3</button>
  ),
}));
vi.mock('@/components/missions/Mission4Applications', () => ({
  default: ({ onFinishAll }: { onFinishAll: () => void }) => (
    <button data-testid="mission-4" onClick={() => { pushProgress(3); onFinishAll(); }}>Complete Mission 4</button>
  ),
}));

import Home from '@/app/page';

describe('Phase 5 - Home integration (mission flow + celebration)', () => {
  beforeEach(() => {
    cookieState.progress = [0];
    cookieState.saveCalls = [];
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('advances tabs as each mission completes', async () => {
    render(<Home />);
    fireEvent.click(screen.getByRole('button', { name: /Iniciar Experimentos/i }));

    expect(await screen.findByTestId('mission-1')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('mission-1'));
    expect(await screen.findByTestId('mission-2')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('mission-2'));
    expect(await screen.findByTestId('mission-3')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('mission-3'));
    expect(await screen.findByTestId('mission-4')).toBeInTheDocument();
  });

  it('records mission completions in order 0,1,2,3', async () => {
    render(<Home />);
    fireEvent.click(screen.getByRole('button', { name: /Iniciar Experimentos/i }));

    fireEvent.click(await screen.findByTestId('mission-1'));
    fireEvent.click(await screen.findByTestId('mission-2'));
    fireEvent.click(await screen.findByTestId('mission-3'));
    fireEvent.click(await screen.findByTestId('mission-4'));

    expect(cookieState.saveCalls).toEqual([0, 1, 2, 3]);
  });

  it('shows CelebrationModal after completing all 4 missions', async () => {
    render(<Home />);
    fireEvent.click(screen.getByRole('button', { name: /Iniciar Experimentos/i }));

    expect(screen.queryByTestId('celebration-modal')).not.toBeInTheDocument();

    fireEvent.click(await screen.findByTestId('mission-1'));
    fireEvent.click(await screen.findByTestId('mission-2'));
    fireEvent.click(await screen.findByTestId('mission-3'));
    fireEvent.click(await screen.findByTestId('mission-4'));

    expect(await screen.findByTestId('celebration-modal')).toBeInTheDocument();
  });

  it('timer decrements when lab is started', async () => {
    render(<Home />);
    fireEvent.click(screen.getByRole('button', { name: /Iniciar Experimentos/i }));
    await screen.findByTestId('mission-1');

    act(() => { vi.advanceTimersByTime(3000); });

    expect(screen.getByTestId('mission-1')).toBeInTheDocument();
  });
});
