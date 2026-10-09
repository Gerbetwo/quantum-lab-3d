import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ResourceTracker } from '../lib/three/resourceTracker';

export interface ThreeSceneHandle {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  tracker: ResourceTracker;
  add: (...objects: THREE.Object3D[]) => void;
  onFrame: (cb: (time: number, dt: number) => void) => void;
}

export interface UseThreeSceneOptions {
  width?: number;
  height?: number;
  viewportRelative?: boolean;
  aspect?: number;
  cameraPos?: [number, number, number];
  cameraLookAt?: [number, number, number];
  recreateOn?: string | number | boolean;
  onSetup?: (handle: ThreeSceneHandle) => void | (() => void);
  onInit?: (scene: THREE.Scene, camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) => void;
  onUpdate?: (scene: THREE.Scene, camera: THREE.PerspectiveCamera, delta: number) => void;
}

export function useThreeScene(
  containerRef: React.RefObject<HTMLDivElement | null>,
  options: UseThreeSceneOptions = {}
) {
  const trackerRef = useRef<ResourceTracker>(new ResourceTracker());
  const recreateOn = options.recreateOn;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = options.width || container.clientWidth || 600;
    const height = options.height || container.clientHeight || 400;
    const aspect = options.aspect || width / height;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    if (options.cameraPos) {
      camera.position.set(...options.cameraPos);
    } else {
      camera.position.set(0, 0, 5);
    }
    if (options.cameraLookAt) {
      camera.lookAt(...options.cameraLookAt);
    }

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    const tracker = trackerRef.current;
    tracker.track(renderer.domElement as unknown as THREE.Object3D);

    const frameCallbacks: Array<(time: number, dt: number) => void> = [];
    const handle: ThreeSceneHandle = {
      scene,
      camera,
      renderer,
      tracker,
      add: (...objects) => {
        objects.forEach((obj) => {
          tracker.track(obj);
          scene.add(obj);
        });
      },
      onFrame: (cb) => frameCallbacks.push(cb),
    };

    let cleanupSetup: void | (() => void);
    if (options.onSetup) {
      cleanupSetup = options.onSetup(handle);
    }
    if (options.onInit) {
      options.onInit(scene, camera, renderer);
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (options.viewportRelative && entry.contentRect.width > 0) {
          const newW = entry.contentRect.width;
          const newH = options.height || entry.contentRect.height || 400;
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });

    resizeObserver.observe(container);

    const clock = new THREE.Clock();
    renderer.setAnimationLoop(() => {
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      frameCallbacks.forEach((cb) => cb(elapsedTime, delta));

      if (options.onUpdate) {
        options.onUpdate(scene, camera, delta);
      }
      renderer.render(scene, camera);
    });

    return () => {
      resizeObserver.disconnect();
      renderer.setAnimationLoop(null);
      if (typeof cleanupSetup === 'function') {
        cleanupSetup();
      }
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
      tracker.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, recreateOn]);

  return { containerRef };
}
