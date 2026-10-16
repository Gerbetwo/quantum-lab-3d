// @ts-nocheck
/* eslint-disable */
// Archived from src/components/BlochCanvas.tsx

// Symbol: QuantumViewport
export function QuantumViewport({ state: _state, nQubits }: Props) {
  return (
    <div className="w-full rounded-2xl overflow-hidden bg-surface-1 border border-edge">
      <div
        data-testid="viewport-loading"
        className="w-full aspect-16/10 bg-surface-1 flex items-center justify-center p-4"
      >
        <span className="text-xs text-muted-foreground font-mono">
          Quantum Viewport ({nQubits} Qubit{nQubits > 1 ? 's' : ''})
        </span>
      </div>
    </div>
  );
}

// Symbol: useMeasurementBurst
export function useMeasurementBurst(
  _sceneRef: MutableRefObject<SceneHandle | null>
): UseMeasurementBurstResult {
  const controllerRef = useRef<MeasurementParticlesHandle | null>(null);

  const burst = useCallback((_origin: [number, number, number] | null = DEFAULT_ORIGIN, color?: number | null) => {
    const ctrl = controllerRef.current;
    if (!ctrl) return;
    const opts: TriggerOptions = { origin: _origin };
    if (color !== undefined && color !== null) opts.color = color;
    opts.count = 200;
    ctrl.trigger(opts);
  }, []);

  return { controllerRef, burst };
}

// Symbol: useOrbitControls
export function useOrbitControls(
  camera: THREE.PerspectiveCamera | null,
  domElement: HTMLElement | null,
  options?: OrbitControlsOptions | null
): RefObject<OrbitControlsHandle | null> {
  const ref = useRef<OrbitControlsHandle | null>(null);
  const optsRef = useRef(options);
  useEffect(() => {
    optsRef.current = options;
  });

  useEffect(() => {
    if (!camera || !domElement) return;
    const controls = createOrbitControls(camera, domElement, optsRef.current ?? undefined);
    ref.current = controls;
    let raf = 0; let last = performance.now();
    const loop = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      controls.update(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); controls.dispose(); ref.current = null; };
  }, [camera, domElement]);

  return ref;
}

// Symbol: useThreeScene
export function useThreeScene(
  containerOrFactory: React.RefObject<HTMLDivElement | null> | ((scene: THREE.Scene, tracker: ResourceTracker, ...args: unknown[]) => unknown),
  optionsOrFirstArg?: ThreeSceneOptions | unknown | null,
  ...restArgs: unknown[]
): React.RefObject<HTMLDivElement | null> {
  const internalRef = useRef<HTMLDivElement | null>(null);

  // Stabilize arguments and factory references via refs using useEffect
  const argsRef = useRef(restArgs);
  const optionsRef = useRef(optionsOrFirstArg);
  const factoryRef = useRef(containerOrFactory);

  useEffect(() => {
    argsRef.current = restArgs;
    optionsRef.current = optionsOrFirstArg;
    factoryRef.current = containerOrFactory;
  });

  useEffect(() => {
    const container = internalRef.current;
    if (!container) return;

    let isDisposed = false;
    let controller: SceneHandle | null = null;
    let tracker: ResourceTracker | null = null;
    let cleanupFn: (() => void) | void = undefined;

    try {
      const currentFactory = factoryRef.current;
      const currentOptionsOrArg = optionsRef.current;
      const currentRest = argsRef.current;

      if (typeof currentFactory === 'function') {
        controller = createScene(container);
        if (isDisposed) {
          controller.dispose();
        }
        tracker = new ResourceTracker();
        const res = (currentFactory as (scene: THREE.Scene, tracker: ResourceTracker, ...args: unknown[]) => unknown)(
          controller.scene,
          tracker,
          currentOptionsOrArg,
          ...currentRest
        );
        cleanupFn = () => {
          if (res && typeof (res as { dispose?: (() => void) | null }).dispose === 'function') {
            try {
              (res as { dispose: () => void }).dispose();
            } catch (e) {
              console.error('Error disposing scene resource return:', e);
            }
          }
        };
      } else {
        const options = (currentOptionsOrArg || {}) as ThreeSceneOptions;
        controller = createScene(container);
        if (isDisposed) {
          controller.dispose();
        }
        if (options.onSetup) {
          cleanupFn = options.onSetup(controller);
        }
      }
    } catch (error) {
      console.error('Error during ThreeScene initialization:', error);
      if (controller && !isDisposed) {
        try {
          controller.dispose();
        } catch (_e) {
          // Suppress secondary teardown exceptions
        }
      }
      if (tracker && !isDisposed) {
        try {
          tracker.dispose();
        } catch (_e) {
          // Suppress secondary teardown exceptions
        }
      }
    }

    return () => {
      if (isDisposed) return;
      isDisposed = true;

      if (typeof cleanupFn === 'function') {
        try {
          cleanupFn();
        } catch (e) {
          console.error('Error in scene cleanup function:', e);
        }
      }

      if (tracker) {
        try {
          tracker.dispose();
        } catch (e) {
          console.error('Error disposing resource tracker:', e);
        }
      }

      if (controller) {
        try {
          controller.dispose();
        } catch (e) {
          console.error('Error disposing scene controller:', e);
        }
      }
    };
  }, [containerOrFactory]);

  return internalRef;
}

// Symbol: setupBaseScene
export function setupBaseScene(_container: HTMLElement) {
  return createScene(_container);
}

// Symbol: createTextSprite
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

// Symbol: createBlochSphereScene
export function createBlochSphereScene(
  scene: THREE.Scene,
  tracker: ResourceTracker,
  theta: number = 0,
  phi: number = 0
) {
  const sphereGeo = tracker.track(new THREE.SphereGeometry(1, 32, 32));
  const sphereMat = tracker.track(
    new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true, transparent: true, opacity: 0.3 })
  );
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  scene.add(sphere);

  const x = Math.sin(theta) * Math.cos(phi);
  const y = Math.cos(theta);
  const z = Math.sin(theta) * Math.sin(phi);

  const dir = new THREE.Vector3(x, y, z).normalize();
  const arrow = tracker.track(new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0, 0), 1, 0xff007f));
  scene.add(arrow);

  return { sphere, arrow };
}

// Symbol: UseMeasurementBurstResult
export interface UseMeasurementBurstResult {
  controllerRef: MutableRefObject<MeasurementParticlesHandle | null>;
  burst: (origin?: [number, number, number] | null, color?: number | null) => void;
}

// Symbol: ThreeSceneOptions
export interface ThreeSceneOptions {
  width?: number | null;
  height?: number | null;
  viewportRelative?: boolean | null;
  aspect?: number | null;
  cameraPos?: [number, number, number] | number[] | null;
  cameraLookAt?: [number, number, number] | number[] | null;
  recreateOn?: string | null;
  onSetup?: ((handle: SceneHandle) => (() => void) | void) | null;
}
