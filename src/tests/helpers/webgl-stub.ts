// WebGL Context Stub for Vitest DOM environment
if (typeof window !== 'undefined' && !window.WebGLRenderingContext) {
  (window as any).WebGLRenderingContext = class WebGLRenderingContext {};
}
