import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';

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

import LabPage from '@/app/lab/page';
const WrappedLabPage = LabPage as unknown as React.ComponentType<Record<string, unknown>>;

describe('Phase 3 - Lab integration (particles + audio)', () => {
  beforeEach(() => {
    burstMock.mockClear();
    collapseMock.mockClear();
    gateMock.mockClear();
  });

  it('mounts without throwing', () => {
    render(<WrappedLabPage />);
    expect(screen.getByTestId('circuit-grid')).toBeInTheDocument();
  });

  it('places a gate without crashing when palette selection is active', () => {
    render(<WrappedLabPage />);
    const hOption = screen.getByTestId('gate-option-H');
    fireEvent.click(hOption);
    const cell = screen.getByTestId('cell-0-0');
    fireEvent.click(cell);
    expect(screen.getByTestId('circuit-grid')).toBeInTheDocument();
  });

  it('advances the playhead when clicking a column header', () => {
    render(<WrappedLabPage />);
    const header = screen.getByTestId('playhead-3');
    fireEvent.click(header);
    expect(screen.getByTestId('playhead-3')).toHaveAttribute('data-playhead', 'true');
  });
});
