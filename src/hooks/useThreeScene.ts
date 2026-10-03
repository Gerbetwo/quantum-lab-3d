import { useEffect } from 'react';
import * as THREE from 'three';

interface UseThreeSceneOptions {
  width?: number;
  height?: number;
  viewportRelative?: boolean;
  aspect?: number;
  cameraPos?: [number, number, number];
  cameraLookAt?: [number, number, number];
  recreateOn?: string;
  onSetup?: (handle: {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    add: (...objs: THREE.Object3D[]) => void;
    onFrame: (cb: (t: number, dt: number) => void) => void;
  }) => (() => void) | void;
}

export function useThreeScene(
  containerRef: React.RefObject<HTMLDivElement | null>,
  options: UseThreeSceneOptions
) {
  const {
    width = 600,
    height = 400,
    cameraPos = [0, 0, 5],
    cameraLookAt = [0, 0, 0],
    recreateOn,
    onSetup,
  } = options;

  useEffect(() => {
    if (!containerRef.current) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      // Entorno de prueba JSDOM sin contexto WebGL real
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(...cameraPos);
    camera.lookAt(...cameraLookAt);

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2));

    const container = containerRef.current;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const frameCallbacks: Array<(t: number, dt: number) => void> = [];
    let cleanupSetup: (() => void) | void;

    if (onSetup) {
      cleanupSetup = onSetup({
        scene,
        camera,
        renderer,
        add: (...objs) => scene.add(...objs),
        onFrame: (cb) => frameCallbacks.push(cb),
      });
    }

    let animId: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      frameCallbacks.forEach((cb) => cb(time, dt));
      if (renderer) renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      if (cleanupSetup) cleanupSetup();
      if (renderer) {
        renderer.dispose();
        if (container && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      }
    };
  }, [recreateOn]);
}
