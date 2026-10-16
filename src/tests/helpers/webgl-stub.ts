// WebGL Context Stub for Vitest DOM environment
export function installWebStubs(): void {
  if (typeof window !== 'undefined' && !window.WebGLRenderingContext) {
    (window as unknown as { WebGLRenderingContext: unknown }).WebGLRenderingContext = class WebGLRenderingContext {};
  }
}

if (typeof window !== 'undefined' && !window.WebGLRenderingContext) {
  (window as unknown as { WebGLRenderingContext: unknown }).WebGLRenderingContext = class WebGLRenderingContext {};
}
