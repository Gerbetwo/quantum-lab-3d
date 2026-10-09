import * as THREE from 'three';

const resourceCache = new Map<string, THREE.BufferGeometry | THREE.Material>();
const spriteMaterialCache = new Map<string, THREE.SpriteMaterial>();

export function cached<T extends THREE.BufferGeometry | THREE.Material>(
  key: string,
  factory: () => T
): T {
  if (resourceCache.has(key)) {
    const cachedObj = resourceCache.get(key) as T;
    if (cachedObj) return cachedObj;
  }
  const obj = factory();
  obj.userData = { ...obj.userData, __shared: true };
  resourceCache.set(key, obj);
  return obj;
}

export function clearResourceCache() {
  resourceCache.forEach((res) => res.dispose());
  resourceCache.clear();
}

export function clearSpriteMaterialCache() {
  spriteMaterialCache.forEach((mat) => mat.dispose());
  spriteMaterialCache.clear();
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function createTextSprite(
  text: string,
  options: { fontSize?: number; color?: string; background?: string } = {}
): THREE.Sprite {
  const { fontSize = 24, color = '#00ffff' } = options;
  const cacheKey = `${text}_${fontSize}_${color}`;

  let material = spriteMaterialCache.get(cacheKey);
  if (!material) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 128;
    if (ctx) {
      ctx.clearRect(0, 0, 256, 128);
      ctx.font = `bold ${fontSize}px monospace`;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 128, 64);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    spriteMaterialCache.set(cacheKey, material);
  }

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.6, 0.3, 1);
  return sprite;
}

export function disposeResource(object: THREE.Object3D | THREE.BufferGeometry | THREE.Material) {
  if (object instanceof THREE.BufferGeometry) {
    if (!object.userData?.__shared) {
      object.dispose();
    }
    return;
  }

  if (object instanceof THREE.Material) {
    if (!object.userData?.__shared) {
      Object.keys(object).forEach((prop) => {
        const val = (object as unknown as Record<string, unknown>)[prop];
        if (val && typeof val === 'object' && 'dispose' in val && typeof (val as THREE.Texture).dispose === 'function') {
          (val as THREE.Texture).dispose();
        }
      });
      object.dispose();
    }
    return;
  }

  object.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.Points || child instanceof THREE.Line) {
      if (child.geometry && !child.geometry.userData?.__shared) {
        child.geometry.dispose();
      }

      if (child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat) => {
          if (!mat.userData?.__shared) {
            Object.keys(mat).forEach((prop) => {
              const value = (mat as unknown as Record<string, unknown>)[prop];
              if (value && typeof value === 'object' && 'dispose' in value && typeof (value as THREE.Texture).dispose === 'function') {
                (value as THREE.Texture).dispose();
              }
            });
            mat.dispose();
          }
        });
      }
    }
  });
}

export interface SceneController {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  dispose: () => void;
}

export interface SceneHandle {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  add: (obj: THREE.Object3D) => void;
  remove: (obj: THREE.Object3D) => void;
  onFrame: (callback: (time: number, deltaTime: number) => void) => void;
}

export function createScene(container: HTMLElement): SceneHandle & SceneController {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight || 1, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });

  // Asegurar compatibilidad para vi.spyOn en JSDOM
  const rendAny = renderer as unknown as { forceContextLoss?: () => void };
  if (typeof rendAny.forceContextLoss !== 'function') {
    rendAny.forceContextLoss = () => {};
  }
  
  renderer.setSize(container.clientWidth || 600, container.clientHeight || 400);
  container.appendChild(renderer.domElement);

  const handleContextLost = (event: Event) => {
    event.preventDefault();
    console.warn('WebGL Context Lost detectado.');
  };
  renderer.domElement.addEventListener('webglcontextlost', handleContextLost, false);

  const frameCallbacks: ((time: number, dt: number) => void)[] = [];
  let animationFrameId: number;
  let lastTime = performance.now();

  const animate = (currentTime: number) => {
    animationFrameId = requestAnimationFrame(animate);
    const dt = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    frameCallbacks.forEach((cb) => cb(currentTime, dt));
    renderer.render(scene, camera);
  };
  animationFrameId = requestAnimationFrame(animate);

  const add = (obj: THREE.Object3D) => {
    scene.add(obj);
  };

  const remove = (obj: THREE.Object3D) => {
    scene.remove(obj);
  };

  const onFrame = (cb: (time: number, dt: number) => void) => {
    frameCallbacks.push(cb);
  };

  const dispose = () => {
    cancelAnimationFrame(animationFrameId);
    renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);

    scene.clear();
    disposeResource(scene);

    renderer.dispose();
    if (renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    if (typeof rendAny.forceContextLoss === 'function') {
      rendAny.forceContextLoss();
    }
  };

  return { scene, camera, renderer, add, remove, onFrame, dispose };
}

export function setupBaseScene(container: HTMLElement) {
  const controller = createScene(container);
  return {
    ...controller,
    cleanup: controller.dispose,
  };
}
