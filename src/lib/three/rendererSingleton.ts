import * as THREE from 'three';

export interface RendererSingletonOptions {
  antialias?: boolean;
  alpha?: boolean;
  powerPreference?: 'default' | 'high-performance' | 'low-power';
  preserveDrawingBuffer?: boolean;
  rendererFactory?: (params: THREE.WebGLRendererParameters) => THREE.WebGLRenderer;
}

export class WebGLRendererSingleton {
  private static instance: WebGLRendererSingleton | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private refCount = 0;
  private currentContainer: HTMLElement | null = null;

  private constructor() {}

  public static getInstance(): WebGLRendererSingleton {
    if (!WebGLRendererSingleton.instance) {
      WebGLRendererSingleton.instance = new WebGLRendererSingleton();
    }
    return WebGLRendererSingleton.instance;
  }

  /**
   * Acquires the singleton WebGLRenderer, incrementing the reference count
   * and re-parenting renderer.domElement to the target container.
   */
  public acquire(container: HTMLElement, options: RendererSingletonOptions = {}): THREE.WebGLRenderer {
    this.refCount++;

    if (!this.renderer) {
      if (typeof window === 'undefined') {
        throw new Error('WebGLRenderer cannot be acquired in an SSR environment.');
      }
      const params: THREE.WebGLRendererParameters = {
        antialias: options.antialias ?? true,
        alpha: options.alpha ?? true,
        powerPreference: options.powerPreference ?? 'high-performance',
        preserveDrawingBuffer: options.preserveDrawingBuffer ?? false,
      };
      this.renderer = options.rendererFactory
        ? options.rendererFactory(params)
        : new THREE.WebGLRenderer(params);

      const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);
      this.renderer.setPixelRatio(dpr);
    }

    const dom = this.renderer.domElement;
    dom.style.display = 'block';
    dom.style.width = '100%';
    dom.style.height = '100%';

    // Re-parent domElement if attached elsewhere
    if (dom.parentElement !== container) {
      if (dom.parentElement) {
        dom.parentElement.removeChild(dom);
      }
      container.appendChild(dom);
      this.currentContainer = container;
    }

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    this.renderer.setSize(width, height, false);

    return this.renderer;
  }

  /**
   * Releases an acquisition reference. Detaches the canvas from the container if requested,
   * but preserves the underlying WebGL context for subsequent mounts.
   */
  public release(container?: HTMLElement): void {
    if (this.refCount > 0) {
      this.refCount--;
    }

    if (container && this.renderer && this.renderer.domElement.parentElement === container) {
      container.removeChild(this.renderer.domElement);
      if (this.currentContainer === container) {
        this.currentContainer = null;
      }
    }
  }

  /**
   * Updates the renderer size to the given dimensions without changing canvas CSS dimensions.
   */
  public resize(width: number, height: number): void {
    if (this.renderer) {
      this.renderer.setSize(width, height, false);
    }
  }

  /**
   * Retrieves the current renderer instance without altering reference counts.
   */
  public getRenderer(): THREE.WebGLRenderer | null {
    return this.renderer;
  }

  /**
   * Returns the current active reference count.
   */
  public getRefCount(): number {
    return this.refCount;
  }

  /**
   * Returns the currently attached DOM container, if any.
   */
  public getCurrentContainer(): HTMLElement | null {
    return this.currentContainer;
  }

  /**
   * Full teardown of the WebGL context and singleton state (for tests or complete app exit).
   */
  public destroy(): void {
    if (this.renderer) {
      if (this.renderer.domElement.parentElement) {
        this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
      }
      this.renderer.dispose();
      this.renderer.forceContextLoss?.();
      this.renderer = null;
    }
    this.refCount = 0;
    this.currentContainer = null;
  }
}

export const rendererSingleton = WebGLRendererSingleton.getInstance();

export function acquireRenderer(container: HTMLElement, options?: RendererSingletonOptions): THREE.WebGLRenderer {
  return rendererSingleton.acquire(container, options);
}

export function releaseRenderer(container?: HTMLElement): void {
  rendererSingleton.release(container);
}

export function getRendererSingleton(): THREE.WebGLRenderer | null {
  return rendererSingleton.getRenderer();
}

export function destroyRendererSingleton(): void {
  rendererSingleton.destroy();
}
