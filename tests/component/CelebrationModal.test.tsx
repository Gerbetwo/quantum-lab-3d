import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import CelebrationModal from '@/shared/layout/CelebrationModal';

vi.mock('@/shared/lib/sound', () => ({ playChimeSuccess: vi.fn() }));
vi.mock('@/features/session/lib/cookies', () => ({
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

vi.mock('@/features/quantum-3d/lib/createScene', () => ({
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

  it('autofocuses the first focusable element', () => {
    render(<CelebrationModal isOpen={true} onClose={vi.fn()} />);
    const close = screen.getByRole('button', { name: /Cerrar y Revisar Módulos/i });
    expect(close).toHaveFocus();
  });

  it('calls onClose on Escape key', () => {
    const onClose = vi.fn();
    render(<CelebrationModal isOpen={true} onClose={onClose} />);
    const close = screen.getByRole('button', { name: /Cerrar y Revisar Módulos/i });
    fireEvent.keyDown(close, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls confetti.reset on unmount', () => {
    const { unmount } = render(<CelebrationModal isOpen={true} onClose={vi.fn()} />);
    unmount();
    expect(confettiResetMock).toHaveBeenCalled();
  });
});
