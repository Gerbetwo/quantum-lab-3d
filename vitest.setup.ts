// WebGL Stub Setup
(globalThis as unknown as { WebGLRenderingContext: unknown }).WebGLRenderingContext = class {};
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import { installWebStubs } from './src/tests/helpers/webgl-stub';

installWebStubs();

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  };
}

if (typeof window !== 'undefined' && typeof window.matchMedia === 'undefined') {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

if (typeof window !== 'undefined' && typeof (window as unknown as { AudioContext: unknown }).AudioContext === 'undefined') {
  (window as unknown as { AudioContext: unknown }).AudioContext = class {
    createOscillator = vi.fn(() => ({
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      frequency: { setValueAtTime: vi.fn(), value: 440 },
    }));
    createGain = vi.fn(() => ({
      connect: vi.fn(),
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), value: 1 },
    }));
    destination = {};
    currentTime = 0;
    close = vi.fn().mockResolvedValue(undefined);
    state = 'suspended';
    resume = vi.fn().mockImplementation(() => {
      this.state = 'running';
      return Promise.resolve();
    });
  };
}

// Mock de THREE.WebGLRenderer para evitar la inicializacion de contexto WebGL en JSDOM
vi.mock('three', async () => {
  const actual = await vi.importActual<typeof import('three')>('three');
  class MockWebGLRenderer {
    setSize = vi.fn();
    setPixelRatio = vi.fn();
    setAnimationLoop = vi.fn();
    render = vi.fn();
    dispose = vi.fn();
    domElement = document.createElement('canvas');
    shadowMap = {};
  }
  return {
    ...actual,
    WebGLRenderer: MockWebGLRenderer,
  };
});

// Mock canvas-confetti globally to prevent jsdom canvas 2d context errors
vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}));