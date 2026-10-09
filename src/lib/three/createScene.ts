import * as THREE from 'three';
import { ResourceTracker, DisposableResource } from './resourceTracker';

export interface SceneHandle {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  tracker: ResourceTracker;
  onFrame: (cb: (time: number, delta: number) => void) => (() => void);
  add: (obj: THREE.Object3D, id?: string) => (() => void);
  detach: (obj: THREE.Object3D) => void;
  resize: (width: number, height: number) => void;
  update: (theta: number, phi?: number) => void;
  setVisible: (visible: boolean) => void;
  cleanup: () => void;
  dispose: () => void;
}

export type SceneController = SceneHandle;

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const resourceCache = new Map<string, unknown>();

export function cached<T>(key: string, factory: () => T): T {
  if (resourceCache.has(key)) {
    return resourceCache.get(key) as T;
  }
  const item = factory();
  if (item && typeof item === 'object' && 'userData' in item) {
    const objWithData = item as { userData: Record<string, unknown> };
    objWithData.userData.__shared = true;
  }
  resourceCache.set(key, item);
  return item;
}

export function clearResourceCache() {
  for (const [, item] of resourceCache) {
    if (item && typeof (item as DisposableResource).dispose === 'function') {
      (item as DisposableResource).dispose();
    }
  }
  resourceCache.clear();
}

const spriteMaterialCache = new Map<string, THREE.SpriteMaterial>();

export function clearSpriteMaterialCache() {
  for (const [, mat] of spriteMaterialCache) {
    mat.dispose();
  }
  spriteMaterialCache.clear();
}

export interface TextSpriteParameters {
  font?: string;
  fontSize?: number;
  color?: string;
}

export function createTextSprite(text: string, parameters: TextSpriteParameters = {}): THREE.Sprite {
  const font = parameters.font || `${parameters.fontSize || 24}px monospace`;
  const color = parameters.color || '#ffffff';
  const cacheKey = `${text}_${font}_${color}`;
  let material: THREE.SpriteMaterial;

  if (spriteMaterialCache.has(cacheKey)) {
    material = spriteMaterialCache.get(cacheKey)!;
  } else {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    context.font = font;
    context.fillStyle = color;
    context.fillText(text, 0, 24);

    const texture = new THREE.CanvasTexture(canvas);
    material = new THREE.SpriteMaterial({ map: texture });
    material.userData = { ...material.userData, __shared: true };
    spriteMaterialCache.set(cacheKey, material);
  }

  return new THREE.Sprite(material);
}

export function disposeResource(resource: unknown) {
  if (resource && typeof resource === 'object') {
    const res = resource as { userData?: Record<string, unknown>; dispose?: () => void };
    if (res.userData && res.userData.__shared === true) {
      return;
    }
    if (res.dispose && typeof res.dispose === 'function') {
      res.dispose();
    }
  }
}

export function setupBaseScene(container: HTMLElement) {
  const tracker = new ResourceTracker();
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0f1d);

  const width = container.clientWidth || 300;
  const height = container.clientHeight || 300;

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
  camera.position.set(0, 1.5, 3.5);
  camera.lookAt(0, 0, 0);

  const renderer = tracker.track(new THREE.WebGLRenderer({ antialias: true, alpha: true }));
  renderer.setSize(width, height);
  container.appendChild(renderer.domElement);

  const cleanup = () => {
    if (renderer.domElement.parentNode === container) {
      container.removeChild(renderer.domElement);
    }
    tracker.dispose();
  };

  return { scene, camera, renderer, tracker, cleanup };
}

export function createScene(
  container: HTMLElement,
  initSceneFn?: (scene: THREE.Scene, tracker: ResourceTracker) => { update?: (theta: number, phi?: number) => void }
) {
  const base = setupBaseScene(container);
  const { scene, camera, renderer, tracker, cleanup } = base;
  const controllerLogic = initSceneFn ? initSceneFn(scene, tracker) : {};

  let animationFrameId: number;
  const clock = new THREE.Clock();
  const frameListeners: Array<(time: number, delta: number) => void> = [];

  const animate = () => {
    animationFrameId = requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const time = clock.getElapsedTime();
    for (const listener of frameListeners) {
      listener(time, delta);
    }
    renderer.render(scene, camera);
  };
  animate();

  const totalCleanup = () => {
    cancelAnimationFrame(animationFrameId);
    cleanup();
  };

  const handle: SceneHandle = {
    scene,
    camera,
    renderer,
    tracker,
    onFrame: (cb: (time: number, delta: number) => void) => {
      frameListeners.push(cb);
      return () => {
        const index = frameListeners.indexOf(cb);
        if (index > -1) frameListeners.splice(index, 1);
      };
    },
    add: (obj: THREE.Object3D, _id?: string) => {
      tracker.track(obj);
      scene.add(obj);
      return () => {
        scene.remove(obj);
      };
    },
    detach: (obj: THREE.Object3D) => {
      scene.remove(obj);
    },
    setVisible: (visible: boolean) => {
      renderer.domElement.style.display = visible ? 'block' : 'none';
    },
    cleanup: totalCleanup,
    dispose: totalCleanup,
    update: (theta: number, phi: number = 0) => {
      if (controllerLogic && typeof controllerLogic.update === 'function') {
        controllerLogic.update(theta, phi);
      }
    },
    resize: (w: number, h: number) => {
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
  };

  return handle;
}
