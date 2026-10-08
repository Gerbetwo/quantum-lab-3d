import { useEffect, useRef } from 'react';
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
  options: UseThreeSceneOptions,
) {
  const {
    width = 600,
    height = 400,
    cameraPos = [0, 0, 5],
    cameraLookAt = [0, 0, 0],
    recreateOn,
    onSetup,
  } = options;

  const optionsRef = useRef({
    width,
    height,
    cameraPos,
    cameraLookAt,
    onSetup,
  });

  optionsRef.current = {
    width,
    height,
    cameraPos,
    cameraLookAt,
    onSetup,
  };

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const {
      width: sceneWidth,
      height: sceneHeight,
      cameraPos: sceneCameraPos,
      cameraLookAt: sceneCameraLookAt,
      onSetup: sceneOnSetup,
    } = optionsRef.current;

    let renderer: THREE.WebGLRenderer | null = null;

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });
    } catch {
      // JSDOM/test environment without a real WebGL context.
      return;
    }

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      45,
      sceneWidth / sceneHeight,
      0.1,
      100,
    );

    camera.position.set(...sceneCameraPos);
    camera.lookAt(...sceneCameraLookAt);

    renderer.setSize(sceneWidth, sceneHeight);

    const pixelRatio =
      typeof window !== 'undefined'
        ? Math.min(window.devicePixelRatio || 1, 2)
        : 1;

    renderer.setPixelRatio(pixelRatio);

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const frameCallbacks: Array<
      (t: number, dt: number) => void
    > = [];

    let cleanupSetup: (() => void) | void;

    if (sceneOnSetup) {
      cleanupSetup = sceneOnSetup({
        scene,
        camera,
        renderer,

        add: (...objects: THREE.Object3D[]) => {
          scene.add(...objects);
        },

        onFrame: (callback: (t: number, dt: number) => void) => {
          frameCallbacks.push(callback);
        },
      });
    }

    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      frameCallbacks.forEach((callback) => {
        callback(time, dt);
      });

      renderer?.render(scene, camera);

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);

      cleanupSetup?.();

      if (renderer) {
        renderer.dispose();

        if (container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      }

      frameCallbacks.length = 0;
    };
  }, [containerRef, recreateOn]);
}
