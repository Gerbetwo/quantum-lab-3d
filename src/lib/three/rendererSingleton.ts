import * as THREE from "three";

export interface RendererSingletonOptions {
  antialias?: boolean;
  alpha?: boolean;
  powerPreference?: "default" | "high-performance" | "low-power";
  preserveDrawingBuffer?: boolean;
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

  public acquire(container: HTMLElement, options: RendererSingletonOptions = {}): THREE.WebGLRenderer {
    this.refCount++;

    if (!this.renderer) {
      if (typeof window === "undefined") {
        throw new Error("WebGLRenderer cannot be acquired in an SSR environment.");
      }
      this.renderer = new THREE.WebGLRenderer({
        antialias: options.antialias ?? true,
        alpha: options.alpha ?? true,
        powerPreference: options.powerPreference ?? "high-performance",
        preserveDrawingBuffer: options.preserveDrawingBuffer ?? false,
      });

      const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2);
      this.renderer.setPixelRatio(dpr);
    }

    const dom = this.renderer.domElement;
    dom.style.display = "block";
    dom.style.width = "100%";
    dom.style.height = "100%";

    if (dom.parentElement !== container) {
      if (dom.parentElement) {
        dom.parentElement.removeChild(dom);
      }
      container.appendChild(dom);
      this.currentContainer = container;
    }

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 300;
    this.renderer.setSize(width, height, false);

    return this.renderer;
  }

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

  public resize(width: number, height: number): void {
    if (this.renderer) {
      this.renderer.setSize(width, height, false);
    }
  }

  public getRenderer(): THREE.WebGLRenderer | null {
    return this.renderer;
  }

  public getRefCount(): number {
    return this.refCount;
  }

  public getCurrentContainer(): HTMLElement | null {
    return this.currentContainer;
  }

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

/**
 * Recursively disposes all geometries, materials, and textures within a Three.js Object3D hierarchy.
 */
export function disposeObject3D(obj: THREE.Object3D): void {
  while (obj.children && obj.children.length > 0) {
    const child = obj.children[0];
    disposeObject3D(child);
    obj.remove(child);
  }

  const anyObj = obj as unknown as {
    geometry?: THREE.BufferGeometry;
    material?: THREE.Material | THREE.Material[];
    dispose?: () => void;
  };

  if (anyObj.geometry) {
    anyObj.geometry.dispose();
  }

  if (anyObj.material) {
    if (Array.isArray(anyObj.material)) {
      anyObj.material.forEach((mat) => {
        disposeMaterial(mat);
      });
    } else {
      disposeMaterial(anyObj.material);
    }
  }

  if (typeof anyObj.dispose === "function" && anyObj !== obj) {
    try {
      anyObj.dispose();
    } catch (_e) {}
  }
}

function disposeMaterial(mat: THREE.Material): void {
  const anyMat = mat as unknown as Record<string, unknown>;
  for (const key of Object.keys(anyMat)) {
    const val = anyMat[key];
    if (val && typeof val === "object" && typeof (val as { dispose?: unknown }).dispose === "function") {
      (val as { dispose: () => void }).dispose();
    }
  }
  mat.dispose();
}
