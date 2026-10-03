// Mock completo de WebGL / 2D / Web Audio / browser APIs para JSDOM + Vitest

export function createMockWebGLContext(): Partial<WebGLRenderingContext> {
  return {
    canvas: {} as HTMLCanvasElement,
    drawingBufferWidth: 800,
    drawingBufferHeight: 600,
    getExtension: (name: string) => {
      if (name === 'OES_texture_float') return {};
      if (name === 'WEBGL_lose_context') {
        return { loseContext: () => {}, restoreContext: () => {} };
      }
      return null;
    },
    getParameter: () => 16,
    getShaderPrecisionFormat: () => ({ rangeMin: 1, rangeMax: 1, precision: 23 }),
    createBuffer: () => ({}),
    createTexture: () => ({}),
    createProgram: () => ({}),
    createShader: () => ({}),
    bindBuffer: () => {},
    bindTexture: () => {},
    useProgram: () => {},
    clearColor: () => {},
    clear: () => {},
    enable: () => {},
    disable: () => {},
    viewport: () => {},
  } as unknown as Partial<WebGLRenderingContext>;
}

function createMock2DContext(): Partial<CanvasRenderingContext2D> {
  const noop = () => {};
  return {
    canvas: document.createElement('canvas'),
    fillRect: noop,
    clearRect: noop,
    strokeRect: noop,
    fillText: noop,
    strokeText: noop,
    measureText: () => ({ width: 0 } as TextMetrics),
    beginPath: noop,
    closePath: noop,
    moveTo: noop,
    lineTo: noop,
    arc: noop,
    stroke: noop,
    fill: noop,
    save: noop,
    restore: noop,
    translate: noop,
    rotate: noop,
    scale: noop,
    drawImage: noop,
    createImageData: () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 } as ImageData),
    getImageData: () => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 } as ImageData),
    putImageData: noop,
    fillStyle: '#000',
    strokeStyle: '#000',
    font: '10px sans-serif',
    textAlign: 'left',
    textBaseline: 'top',
    shadowColor: 'transparent',
    shadowBlur: 0,
  } as unknown as Partial<CanvasRenderingContext2D>;
}

class MockAudioContext {
  state: 'suspended' | 'running' | 'closed' = 'suspended';
  currentTime = 0;
  destination = { connect: () => {}, disconnect: () => {} };
  async resume(): Promise<void> { this.state = 'running'; }
  async suspend(): Promise<void> { this.state = 'suspended'; }
  async close(): Promise<void> { this.state = 'closed'; }
  createOscillator() {
    return {
      type: 'sine' as OscillatorType,
      frequency: {
        value: 440,
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
        linearRampToValueAtTime: () => {},
      },
      connect: () => {},
      disconnect: () => {},
      start: () => {},
      stop: () => {},
      onended: null,
    };
  }
  createGain() {
    return {
      gain: {
        value: 0,
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
        linearRampToValueAtTime: () => {},
      },
      connect: () => {},
      disconnect: () => {},
    };
  }
}

/**
 * Instala stubs de browser APIs que jsdom no provee.
 * Llamado una vez desde vitest.setup.ts (no como side-effect de import).
 */
export function installWebStubs(): void {
  if (typeof window === 'undefined') return;

  // 1. Canvas 2D + WebGL contexts
  HTMLCanvasElement.prototype.getContext = function (
    this: HTMLCanvasElement,
    contextId: string,
    ..._args: unknown[]
  ): RenderingContext | null {
    if (contextId === 'webgl' || contextId === 'webgl2' || contextId === 'experimental-webgl') {
      return createMockWebGLContext() as unknown as WebGLRenderingContext;
    }
    if (contextId === '2d') {
      return createMock2DContext() as unknown as CanvasRenderingContext2D;
    }
    return null;
  } as typeof HTMLCanvasElement.prototype.getContext;

  // 2. Web Audio API
  if (typeof (window as unknown as { AudioContext?: unknown }).AudioContext === 'undefined') {
    (window as unknown as { AudioContext: typeof MockAudioContext }).AudioContext = MockAudioContext;
  }
  if (typeof (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext === 'undefined') {
    (window as unknown as { webkitAudioContext: typeof MockAudioContext }).webkitAudioContext = MockAudioContext;
  }

  // 3. ResizeObserver
  if (typeof (window as unknown as { ResizeObserver?: unknown }).ResizeObserver === 'undefined') {
    class MockResizeObserver {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    }
    (window as unknown as { ResizeObserver: typeof MockResizeObserver }).ResizeObserver = MockResizeObserver;
  }

  // 4. matchMedia
  if (typeof window.matchMedia !== 'function') {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  }
}
