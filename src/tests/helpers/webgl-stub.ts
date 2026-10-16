// WebGL Context Stub for Vitest DOM environment
export function installWebStubs(): void {
  if (typeof window !== 'undefined' && !window.WebGLRenderingContext) {
    (window as any).WebGLRenderingContext = class WebGLRenderingContext {};
  }
}

if (typeof window !== 'undefined' && !window.WebGLRenderingContext) {
  (window as any).WebGLRenderingContext = class WebGLRenderingContext {};
}
