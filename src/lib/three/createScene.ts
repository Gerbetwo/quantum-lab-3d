import * as THREE from 'three';

export interface SceneHandle {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  add: (obj: THREE.Object3D, id?: string) => void;
  onFrame: (cb: (elapsed: number, dt: number) => void) => () => void;
  setVisible?: (visible: boolean) => void;
  dispose?: () => void;
}

const resourceCache = new Map<string, THREE.BufferGeometry | THREE.Material>();
const spriteMaterialCache = new Map<string, THREE.SpriteMaterial>();

export function cached<T extends THREE.BufferGeometry | THREE.Material>(key: string, fn: () => T): T {
  if (!resourceCache.has(key)) {
    const item = fn();
    item.userData = item.userData || {};
    item.userData.__shared = true;
    resourceCache.set(key, item);
  }
  return resourceCache.get(key) as T;
}

export function clearResourceCache(): void {
  resourceCache.forEach((resource) => resource.dispose());
  resourceCache.clear();
}

export function clearSpriteMaterialCache(): void {
  spriteMaterialCache.forEach((mat) => {
    if (mat.map) mat.map.dispose();
    mat.dispose();
  });
  spriteMaterialCache.clear();
}

export function createTextSprite(
  text: string,
  colorOrOptions?: string | { color?: string; fontSize?: number },
  fontSizeParam?: number
): THREE.Sprite {
  let color = '#ffffff';
  let fontSize = 28;

  if (typeof colorOrOptions === 'string') {
    color = colorOrOptions;
    if (typeof fontSizeParam === 'number') fontSize = fontSizeParam;
  } else if (typeof colorOrOptions === 'object' && colorOrOptions !== null) {
    if (colorOrOptions.color) color = colorOrOptions.color;
    if (colorOrOptions.fontSize) fontSize = colorOrOptions.fontSize;
  }

  const cacheKey = `${text}_${color}_${fontSize}`;
  let material = spriteMaterialCache.get(cacheKey);

  if (!material) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = color;
      ctx.font = `Bold ${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 128, 64);
    }
    const texture = new THREE.CanvasTexture(canvas);
    material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    spriteMaterialCache.set(cacheKey, material);
  }

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.8, 0.9, 1);
  return sprite;
}

export function disposeResource(resource: { dispose?: () => void; userData?: Record<string, any> } | null | undefined): void {
  if (resource && typeof resource.dispose === 'function') {
    if (resource.userData?.__shared) {
      return;
    }
    resource.dispose();
  }
}

export function setupBaseScene(container: HTMLElement) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
  let renderer: THREE.WebGLRenderer | null = null;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
  } catch {
    // Entorno JSDOM
  }

  const cleanup = () => {
    if (renderer) {
      renderer.dispose();
      if (container && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    }
  };

  return { scene, camera, renderer, cleanup };
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
