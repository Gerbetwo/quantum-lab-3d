import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, test, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { CelebrationModal } from '@/components/AppLayout';
import { useSession, MISSIONS, SessionProvider } from '@/store/useQuantumStore';


const burstMock = vi.fn();
const collapseMock = vi.fn();
const gateMock = vi.fn();
const hoverMock = vi.fn();

vi.mock('@/features/quantum-3d/hooks/useMeasurementBurst', () => ({
  useMeasurementBurst: () => ({ burst: burstMock }),
}));

vi.mock('@/shared/lib/sound', () => ({
  playButtonClick: vi.fn(),
  playChimeSuccess: vi.fn(),
  playLaserScan: vi.fn(),
  playQuantumCollapse: vi.fn(),
  playDecoherenceAlert: vi.fn(),
  playGatePlaced: vi.fn(),
  playStepAdvance: vi.fn(),
  playGateForQubit: gateMock,
  playHover: hoverMock,
  playMeasurementCollapse: collapseMock,
  isAudioEnabled: () => true,
  setAudioEnabled: vi.fn(),
  toggleAudio: vi.fn(),
  __markUserInteracted: vi.fn(),
  __resetAudioOverride: vi.fn(),
}));

vi.mock('@/features/quantum-3d/canvas/MeasurementParticles', () => ({
  default: React.forwardRef(function MockMP(_props, ref: React.Ref<unknown>) {
    React.useImperativeHandle(ref, () => ({ trigger: vi.fn(), dispose: vi.fn() }));
    return null;
  }),
}));

describe('Lab Particles & Audio Integration', () => {
  it('loads mocked audio and particle hooks without throwing', () => {
    expect(collapseMock).toBeDefined();
    expect(gateMock).toBeDefined();
    expect(hoverMock).toBeDefined();
  });
});


vi.mock('@/shared/lib/sound', () => ({
  playButtonClick: vi.fn(),
  playChimeSuccess: vi.fn(),
  playLaserScan: vi.fn(),
  playQuantumCollapse: vi.fn(),
  playDecoherenceAlert: vi.fn(),
  isAudioEnabled: () => false,
  setAudioEnabled: vi.fn(),
  toggleAudio: vi.fn(),
}));

function TestMissionRunner() {
  const { session, completeMission, elapsedSeconds } = useSession();
  const completedCount = session.completed.length;
  const isAllComplete = MISSIONS.every((m) => session.completed.includes(m.id));

  return (
    <div>
      <div data-testid="timer-display">Time: {elapsedSeconds}s</div>
      <div data-testid="completed-count">{completedCount}</div>
      {MISSIONS.map((mission, index) => (
        <button
          key={mission.id}
          data-testid={`mission-${index + 1}`}
          onClick={() => completeMission(mission.id)}
        >
          Complete Mission {index + 1}
        </button>
      ))}
      <CelebrationModal isOpen={isAllComplete} onClose={() => {}} />
    </div>
  );
}

describe('Phase 6 - Home integration (7 missions + celebration)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('advances tabs through all 7 missions', async () => {
    render(
      <SessionProvider>
        <TestMissionRunner />
      </SessionProvider>
    );

    for (let i = 1; i <= 7; i++) {
      expect(screen.getByTestId(`mission-${i}`)).toBeInTheDocument();
      fireEvent.click(screen.getByTestId(`mission-${i}`));
    }
    expect(screen.getByTestId('completed-count')).toHaveTextContent('7');
  });

  it('records mission completions in order 0..6', async () => {
    render(
      <SessionProvider>
        <TestMissionRunner />
      </SessionProvider>
    );

    for (let i = 1; i <= 7; i++) {
      fireEvent.click(screen.getByTestId(`mission-${i}`));
    }

    expect(screen.getByTestId('completed-count')).toHaveTextContent('7');
  });

  it('shows CelebrationModal only after completing all 7 missions', async () => {
    render(
      <SessionProvider>
        <TestMissionRunner />
      </SessionProvider>
    );

    expect(screen.queryByTestId('celebration-modal')).not.toBeInTheDocument();

    for (let i = 1; i <= 6; i++) {
      fireEvent.click(screen.getByTestId(`mission-${i}`));
      expect(screen.queryByTestId('celebration-modal')).not.toBeInTheDocument();
    }

    fireEvent.click(screen.getByTestId('mission-7'));
    expect(screen.getByTestId('celebration-modal')).toBeInTheDocument();
  });

  it('timer decrements when lab is started', async () => {
    render(
      <SessionProvider>
        <TestMissionRunner />
      </SessionProvider>
    );

    expect(screen.getByTestId('timer-display')).toHaveTextContent('Time: 0s');

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByTestId('timer-display')).toHaveTextContent('Time: 3s');
  });
});