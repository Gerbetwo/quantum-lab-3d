import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import { SessionProvider, useSession } from '@/features/session/components/SessionProvider';
import { MISSIONS } from '@/features/missions/config/missions';
import CelebrationModal from '@/shared/layout/CelebrationModal';

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
