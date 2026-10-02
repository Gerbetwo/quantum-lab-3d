import * as THREE from 'three';

export interface SceneConfig {
  width: number;
  height: number;
  cameraPos: [number, number, number];
  cameraLookAt?: [number, number, number];
  fov?: number;
  near?: number;
  far?: number;
  pixelRatioCap?: number;
}

export interface SceneHandle {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  add(obj: THREE.Object3D): void;
  onFrame(cb: (elapsed: number, delta: number) => void): () => void;
  dispose(): void;
}

const SHARED_CACHE = new Map<string, unknown>();

/**
 * Returns a process-wide cached instance for the given key.
 * The instance is marked with userData.__shared so that createScene.dispose()
 * does NOT dispose it (reusable across scene lifecycles).
 */
export function cached<T extends { userData: Record<string, unknown> }>(
  key: string,
  factory: () => T
): T {
  const existing = SHARED_CACHE.get(key) as T | undefined;
  if (existing) return existing;
  const inst = factory();
  inst.userData = { ...inst.userData, __shared: true };
  SHARED_CACHE.set(key, inst);
  return inst;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function createScene(container: HTMLElement, config: SceneConfig): SceneHandle {
  const {
    width: initialWidth,
    height,
    cameraPos,
    cameraLookAt = [0, 0, 0],
    fov = 45,
    near = 0.1,
    far = 100,
    pixelRatioCap = 2,
  } = config;

  const width = initialWidth || container.clientWidth || 600;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, width / height, near, far);
  camera.position.set(cameraPos[0], cameraPos[1], cameraPos[2]);
  camera.lookAt(cameraLookAt[0], cameraLookAt[1], cameraLookAt[2]);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap));
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  const frameCallbacks = new Set<(elapsed: number, delta: number) => void>();
  let disposed = false;
  const startedAt = performance.now();
  let lastTime = startedAt;

  const loop = () => {
    if (disposed) return;
    if (typeof document !== 'undefined' && document.hidden) return;
    const now = performance.now();
    const delta = (now - lastTime) / 1000;
    lastTime = now;
    const elapsed = (now - startedAt) / 1000;
    for (const cb of frameCallbacks) cb(elapsed, delta);
    renderer.render(scene, camera);
  };
  renderer.setAnimationLoop(loop);

  const onResize = () => {
    if (disposed) return;
    const w = container.clientWidth;
    if (w === 0) return;
    camera.aspect = w / height;
    camera.updateProjectionMatrix();
    renderer.setSize(w, height);
  };
  window.addEventListener('resize', onResize);

  const disposeResource = (obj: unknown) => {
    if (!obj) return;
    const anyObj = obj as { userData?: Record<string, unknown>; dispose?: () => void };
    if (anyObj.userData?.__shared === true) return;
    anyObj.dispose?.();
  };

  const handle: SceneHandle = {
    scene,
    camera,
    renderer,
    add(obj) { scene.add(obj); },
    onFrame(cb) {
      frameCallbacks.add(cb);
      return () => { frameCallbacks.delete(cb); };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      renderer.setAnimationLoop(null);
      window.removeEventListener('resize', onResize);
      frameCallbacks.clear();
      scene.traverse((obj) => {
        const anyObj = obj as unknown as {
          geometry?: unknown;
          material?: unknown;
        };
        disposeResource(anyObj.geometry);
        const mat = anyObj.material;
        if (Array.isArray(mat)) mat.forEach(disposeResource);
        else disposeResource(mat);
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    },
  };

  return handle;
}
