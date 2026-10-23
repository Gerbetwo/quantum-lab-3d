import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  soundEngine,
  isAudioEnabled,
  setAudioEnabled,
  toggleAudio,
  playVectorSnap,
  playGateSweep,
  playCollapseDrop,
  playCompletionTriad,
} from '../soundEngine';

interface MockOscillator {
  type: string;
  frequency: {
    setValueAtTime: ReturnType<typeof vi.fn>;
    exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
  };
  connect: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  onended?: () => void;
}

interface MockGain {
  gain: {
    setValueAtTime: ReturnType<typeof vi.fn>;
    exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
    linearRampToValueAtTime: ReturnType<typeof vi.fn>;
  };
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
}

interface MockBufferSource {
  buffer: unknown;
  connect: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  onended?: () => void;
}

interface MockAudioContext {
  currentTime: number;
  state: string;
  sampleRate: number;
  destination: unknown;
  createOscillator: ReturnType<typeof vi.fn>;
  createGain: ReturnType<typeof vi.fn>;
  createBufferSource: ReturnType<typeof vi.fn>;
  createBuffer: ReturnType<typeof vi.fn>;
  resume: ReturnType<typeof vi.fn>;
}

describe('SoundEngine Web Audio Synthesizer', () => {
  let mockAudioContext: MockAudioContext;
  let mockOscillator: MockOscillator;
  let mockGain: MockGain;
  let mockBufferSource: MockBufferSource;

  beforeEach(() => {
    setAudioEnabled(true);

    mockOscillator = {
      type: 'sine',
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn(),
    };

    mockGain = {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };

    mockBufferSource = {
      buffer: null,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn(),
    };

    mockAudioContext = {
      currentTime: 10,
      state: 'running',
      sampleRate: 44100,
      destination: {},
      createOscillator: vi.fn(() => ({ ...mockOscillator })),
      createGain: vi.fn(() => ({ ...mockGain })),
      createBufferSource: vi.fn(() => ({ ...mockBufferSource })),
      createBuffer: vi.fn(() => ({
        getChannelData: vi.fn(() => new Float32Array(100)),
      })),
      resume: vi.fn().mockResolvedValue(undefined),
    };

    // Inject mock context into soundEngine
    (soundEngine as unknown as { ctx: AudioContext | null }).ctx = mockAudioContext as unknown as AudioContext;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('manages audio enable/disable state', () => {
    expect(isAudioEnabled()).toBe(true);
    setAudioEnabled(false);
    expect(isAudioEnabled()).toBe(false);
    toggleAudio();
    expect(isAudioEnabled()).toBe(true);
  });

  it('plays vector snap with frequency ramp 880 Hz -> 220 Hz for 80ms', () => {
    playVectorSnap();

    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    expect(mockAudioContext.createGain).toHaveBeenCalled();
  });

  it('plays gate sweep profiles for X, Z, and H', () => {
    playGateSweep('X');
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();

    playGateSweep('Z');
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();

    playGateSweep('H');
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
  });

  it('plays collapse drop sub-bass and white noise burst', () => {
    playCollapseDrop();

    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    expect(mockAudioContext.createBuffer).toHaveBeenCalled();
    expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
  });

  it('plays completion triad chord C5-E5-G5', () => {
    playCompletionTriad();

    // 3 notes in chord
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(3);
  });

  it('silently ignores execution when audio is disabled', () => {
    setAudioEnabled(false);
    playVectorSnap();
    expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
  });
});
