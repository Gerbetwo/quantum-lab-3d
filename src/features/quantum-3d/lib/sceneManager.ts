import * as THREE from 'three';

export interface SceneContext {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
}

export interface SceneHandle extends SceneContext {
  dispose: () => void;
  add: (object: THREE.Object3D, id?: string) => (() => void);
  remove?: (object: THREE.Object3D) => void;
  detach: (id: string) => void;
  setVisible: (id: string, visible: boolean) => void;
  onFrame: (cb: (time: number, delta: number) => void) => (() => void);
  resize: (width?: number, height?: number) => void;
  update: () => void;
  cleanup: () => void;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function createBaseScene(container: HTMLElement): SceneContext {
  const scene = new THREE.Scene();
  const width = container.clientWidth || 800;
  const height = container.clientHeight || 600;
  
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 0, 5);
  
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2));
  
  if (container.children.length === 0) {
    container.appendChild(renderer.domElement);
  }

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  return { scene, camera, renderer };
}

export function createScene(container: HTMLElement): SceneHandle {
  const base = createBaseScene(container);
  const frameCallbacks: Set<(time: number, delta: number) => void> = new Set();
  const namedObjects = new Map<string, THREE.Object3D>();

  let animId = 0;
  let lastTime = performance.now();

  const loop = (now: number) => {
    const delta = Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    frameCallbacks.forEach(cb => cb(now, delta));
    base.renderer.render(base.scene, base.camera);
    animId = requestAnimationFrame(loop);
  };

  animId = requestAnimationFrame(loop);

  const handle: SceneHandle = {
    ...base,
    add: (object: THREE.Object3D, id?: string) => {
      base.scene.add(object);
      if (id) namedObjects.set(id, object);
      return () => {
        base.scene.remove(object);
        if (id) namedObjects.delete(id);
      };
    },
    remove: (object: THREE.Object3D) => {
      base.scene.remove(object);
    },
    detach: (id: string) => {
      const obj = namedObjects.get(id);
      if (obj) {
        base.scene.remove(obj);
        namedObjects.delete(id);
      }
    },
    setVisible: (id: string, visible: boolean) => {
      const obj = namedObjects.get(id);
      if (obj) obj.visible = visible;
    },
    onFrame: (cb: (time: number, delta: number) => void) => {
      frameCallbacks.add(cb);
      return () => { frameCallbacks.delete(cb); };
    },
    resize: (w?: number, h?: number) => {
      const width = w || container.clientWidth || 800;
      const height = h || container.clientHeight || 600;
      base.camera.aspect = width / height;
      base.camera.updateProjectionMatrix();
      base.renderer.setSize(width, height);
    },
    update: () => {
      base.renderer.render(base.scene, base.camera);
    },
    cleanup: () => {
      cancelAnimationFrame(animId);
      frameCallbacks.clear();
      disposeResource(base.scene);
      base.renderer.dispose();
      base.renderer.forceContextLoss?.();
      if (base.renderer.domElement.parentElement) {
        base.renderer.domElement.parentElement.removeChild(base.renderer.domElement);
      }
    },
    dispose: () => {
      handle.cleanup();
    }
  };

  return handle;
}

export function setupBaseScene(container: HTMLElement) {
  return createScene(container);
}

const resourceCache = new Map<string, unknown>();
const spriteMaterialCache = new Map<string, THREE.SpriteMaterial>();

export function cached<T>(key: string, factory: () => T): T {
  if (!resourceCache.has(key)) {
    const val = factory();
    if (val && typeof val === 'object') {
      (val as Record<string, unknown>).userData = { ...((val as Record<string, unknown>).userData || {}), __shared: true };
    }
    resourceCache.set(key, val);
  }
  return resourceCache.get(key) as T;
}

export function clearResourceCache(): void { resourceCache.clear(); }
export function clearSpriteMaterialCache(): void { spriteMaterialCache.clear(); }

export function disposeResource(obj: unknown): void {
  if (!obj || typeof obj !== 'object') return;
  const target = obj as Record<string, unknown>;

  if (target.userData && (target.userData as Record<string, unknown>).__shared) return;
  if (typeof target.dispose === 'function') (target.dispose as () => void)();

  if (target.children && Array.isArray(target.children)) {
    target.children.forEach(child => disposeResource(child));
  }
  if (target.geometry) disposeResource(target.geometry);
  if (target.material) {
    if (Array.isArray(target.material)) target.material.forEach(m => disposeResource(m));
    else disposeResource(target.material);
  }
  if (target.map) disposeResource(target.map);
}

export function createTextSprite(text: string, options: { fontSize?: number; color?: string } = {}): THREE.Sprite {
  const color = options.color || '#ffffff';
  const key = `sprite_${text}_${color}`;
  
  if (!spriteMaterialCache.has(key)) {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = color;
      ctx.font = `${options.fontSize || 24}px sans-serif`;
      ctx.fillText(text, 10, 50);
    }
    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture });
    spriteMaterialCache.set(key, mat);
  }

  return new THREE.Sprite(spriteMaterialCache.get(key)!);
}
