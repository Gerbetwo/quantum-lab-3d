import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import CelebrationModal from '@/components/CelebrationModal';

vi.mock('@/lib/sound', () => ({ playChimeSuccess: vi.fn() }));
vi.mock('@/lib/cookies', () => ({
  getOrCreateUserId: vi.fn(() => 'QL-ABCD'),
  updateStoredMetrics: vi.fn(),
}));

const { confettiFnMock, confettiResetMock } = vi.hoisted(() => ({
  confettiFnMock: vi.fn(),
  confettiResetMock: vi.fn(),
}));

vi.mock('canvas-confetti', () => ({
  default: Object.assign(confettiFnMock, { reset: confettiResetMock }),
}));

vi.mock('@/lib/three/createScene', () => ({
  prefersReducedMotion: vi.fn(() => false),
}));

describe('Phase 4 - CelebrationModal cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when closed', () => {
    render(<CelebrationModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByTestId('celebration-modal')).not.toBeInTheDocument();
  });

  it('renders userId and default CTA when open without formUrl', () => {
    render(<CelebrationModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByTestId('celebration-modal')).toBeInTheDocument();
    expect(screen.getByTestId('celebration-user-id')).toHaveTextContent('QL-ABCD');
    expect(screen.getByRole('button', { name: /Cerrar y Revisar Módulos/i })).toBeInTheDocument();
  });

  it('calls confetti.reset on unmount', () => {
    const { unmount } = render(<CelebrationModal isOpen={true} onClose={vi.fn()} />);
    unmount();
    expect(confettiResetMock).toHaveBeenCalled();
  });
});
