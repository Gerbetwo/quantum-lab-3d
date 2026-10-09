import { describe, it, expect, vi } from 'vitest';
import { playNote, playSweep, playChord } from '@/shared/lib/audio/synth';

interface MockOsc {
  type: string;
  frequency: {
    setValueAtTime: ReturnType<typeof vi.fn>;
    exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
    linearRampToValueAtTime: ReturnType<typeof vi.fn>;
  };
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
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

function makeMockCtx() {
  const oscs: MockOsc[] = [];
  const gains: MockGain[] = [];
  const ctx = {
    currentTime: 0,
    destination: { connect: vi.fn(), disconnect: vi.fn() } as unknown as AudioNode,
    createOscillator: vi.fn((): MockOsc => {
      const osc: MockOsc = {
        type: 'sine',
        frequency: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      };
      oscs.push(osc);
      return osc;
    }),
    createGain: vi.fn((): MockGain => {
      const g: MockGain = {
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
      };
      gains.push(g);
      return g;
    }),
  } as unknown as AudioContext & {
    createOscillator: ReturnType<typeof vi.fn>;
    createGain: ReturnType<typeof vi.fn>;
  };
  return { ctx, oscs, gains };
}

describe('Phase 3 - lib/audio/synth.ts', () => {
  it('playNote does not throw with a valid ctx', () => {
    const { ctx } = makeMockCtx();
    const env = { attack: 0.01, decay: 0.05, sustain: 0.5, release: 0.1 };
    expect(() => playNote({ ctx, destination: ctx.destination }, 440, 100, env)).not.toThrow();
  });

  it('playNote calls createOscillator exactly once', () => {
    const { ctx } = makeMockCtx();
    const env = { attack: 0.01, decay: 0.05, sustain: 0.5, release: 0.1 };
    playNote({ ctx, destination: ctx.destination }, 440, 100, env);
    expect(ctx.createOscillator).toHaveBeenCalledTimes(1);
  });

  it('playNote starts and stops the oscillator', () => {
    const { ctx, oscs } = makeMockCtx();
    const env = { attack: 0.01, decay: 0.05, sustain: 0.5, release: 0.1 };
    playNote({ ctx, destination: ctx.destination }, 440, 100, env);
    expect(oscs[0].start).toHaveBeenCalled();
    expect(oscs[0].stop).toHaveBeenCalled();
  });

  it('playNote sets oscillator frequency via setValueAtTime', () => {
    const { ctx, oscs } = makeMockCtx();
    const env = { attack: 0.01, decay: 0.05, sustain: 0.5, release: 0.1 };
    playNote({ ctx, destination: ctx.destination }, 880, 100, env);
    expect(oscs[0].frequency.setValueAtTime).toHaveBeenCalledWith(880, expect.any(Number));
  });

  it('playSweep uses exponentialRampToValueAtTime', () => {
    const { ctx, oscs } = makeMockCtx();
    playSweep({ ctx, destination: ctx.destination }, 800, 200, 300);
    expect(oscs[0].frequency.exponentialRampToValueAtTime).toHaveBeenCalled();
  });

  it('playChord creates 3 oscillators for a 3-note chord', () => {
    const { ctx } = makeMockCtx();
    playChord({ ctx, destination: ctx.destination }, [261.63, 329.63, 392], 200);
    expect(ctx.createOscillator).toHaveBeenCalledTimes(3);
  });

  it('playNote is a safe no-op when ctx.createOscillator throws', () => {
    const ctx = {
      currentTime: 0,
      destination: {} as AudioNode,
      createOscillator: () => { throw new Error('boom'); },
      createGain: () => { throw new Error('boom'); },
    } as unknown as AudioContext;
    const env = { attack: 0.01, decay: 0.05, sustain: 0.5, release: 0.1 };
    expect(() => playNote({ ctx, destination: ctx.destination }, 440, 100, env)).not.toThrow();
  });
});
