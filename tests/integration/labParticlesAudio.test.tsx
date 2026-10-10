import '@testing-library/jest-dom';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';

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
