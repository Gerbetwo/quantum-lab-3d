import '@testing-library/jest-dom/vitest';
 import { vi } from 'vitest';
 import { installWebStubs } from './tests/helpers/webgl-stub';

// Mock de THREE.WebGLRenderer para evitar la inicializacion de contexto WebGL en JSDOM
vi.mock('three', async () => {
  const actual = await vi.importActual<typeof import('three')>('three');
  class MockWebGLRenderer {
    setSize = vi.fn();
    setPixelRatio = vi.fn();
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

installWebStubs();
