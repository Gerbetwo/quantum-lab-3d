import { vi } from 'vitest';

export class MockAudioContext {
  state: AudioContextState = 'suspended';
  currentTime = 0;
  destination = {};

  resume() {
    this.state = 'running';
    return Promise.resolve();
  }

  createOscillator() {
    return {
      type: 'sine',
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
  }

  createGain() {
    return {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    };
  }
}

function makeWebGLContext(canvas: HTMLCanvasElement): WebGLRenderingContext {
  return {
    canvas,
    getExtension: vi.fn(),
    getParameter: vi.fn((param: number) => {
      if (param === 7938) return 'WebGL 2.0';
      if (param === 35724) return 'WebGL GLSL ES 3.00';
      if (param === 7936) return 'WebKit';
      if (param === 7937) return 'WebKit WebGL';
      return 16;
    }),
    getShaderPrecisionFormat: vi.fn(() => ({ rangeMin: 1, rangeMax: 1, precision: 1 })),
    createTexture: vi.fn(),
    bindTexture: vi.fn(),
    texParameteri: vi.fn(),
    createBuffer: vi.fn(),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    createProgram: vi.fn(),
    createShader: vi.fn(),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => true),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    useProgram: vi.fn(),
    getAttribLocation: vi.fn(() => 0),
    getUniformLocation: vi.fn(() => ({})),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    drawArrays: vi.fn(),
    clear: vi.fn(),
    clearColor: vi.fn(),
    viewport: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
    depthFunc: vi.fn(),
    pixelStorei: vi.fn(),
  } as unknown as WebGLRenderingContext;
}

function make2DContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  return {
    canvas,
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(0) })),
    putImageData: vi.fn(),
    createImageData: vi.fn(() => []),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    fillText: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    transform: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
  } as unknown as CanvasRenderingContext2D;
}

export function installWebStubs(): void {
  Object.defineProperty(window, 'AudioContext', {
    configurable: true,
    writable: true,
    value: MockAudioContext,
  });

  Object.defineProperty(window, 'webkitAudioContext', {
    configurable: true,
    writable: true,
    value: MockAudioContext,
  });

  Object.defineProperty(globalThis, 'ResizeObserver', {
    writable: true,
    value: class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  });

  HTMLCanvasElement.prototype.getContext = vi.fn(function (
    this: HTMLCanvasElement,
    contextId: string
  ) {
    if (
      contextId === 'webgl' ||
      contextId === 'webgl2' ||
      contextId === 'experimental-webgl'
    ) {
      return makeWebGLContext(this);
    }
    if (contextId === '2d') {
      return make2DContext(this);
    }
    return null;
  }) as unknown as typeof HTMLCanvasElement.prototype.getContext;
}
