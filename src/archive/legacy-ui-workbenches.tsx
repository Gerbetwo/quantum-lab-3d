// @ts-nocheck
/* eslint-disable */
// Archived from src/features/quantum-core/quantum-ui-components.tsx

// Symbol: CircuitWorkbench
export function CircuitWorkbench() {
  const [circuit] = useState<QuantumCircuit>(() => createEmptyCircuit(3));
  const [evaluationResult] = useState<StateVectorHistory>(() => evaluateFullCircuit(circuit));
  const [viewMode] = useState<string>('bloch');

  const finalState = evaluationResult?.final || [{ re: 1, im: 0 }];

  return (
    <div className="flex flex-col h-full w-full bg-background text-foreground p-4">
      <div className="flex-1 flex items-center justify-center">
        {viewMode === 'phase-disk' && <PhaseDiskView evaluation={finalState} />}
        {viewMode === 'bloch' && <BlochPairView evaluation={finalState} />}
        {viewMode === 'histogram' && <HistogramView evaluation={finalState} />}
      </div>
    </div>
  );
}

// Symbol: ViewModeSwitcher
export function ViewModeSwitcher({ mode, onChange, available }: ViewModeSwitcherProps) {
  const modes: readonly ViewMode[] = available ?? ['bloch', 'histogram', 'phase-disk'];
  return (
    <div
      role="tablist"
      aria-label="Modo de visualizacion"
      data-testid="view-mode-switcher"
      className="flex gap-1.5 mb-3 flex-wrap"
    >
      {modes.map((m) => {
        const Icon = VIEW_ICONS[m];
        return (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            aria-label={VIEW_LABELS[m]}
            data-testid={'view-mode-' + m}
            onClick={() => onChange(m)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-mono transition-colors',
              'inline-flex items-center gap-1.5',
              mode === m
                ? 'bg-cyan/20 text-cyan border border-cyan/60'
                : 'bg-surface-2 text-muted-foreground border border-edge hover:bg-surface-3',
            )}
          >
            <Icon className="w-3.5 h-3.5" aria-hidden />
            <span>{VIEW_LABELS[m]}</span>
          </button>
        );
      })}
    </div>
  );
}

// Symbol: BlochPairView
export function BlochPairView(_props: ViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handle = createScene(container);

    const qubit0Pos: [number, number, number] = [-1.8, 0, 0];
    const qubit1Pos: [number, number, number] = [1.8, 0, 0];

    handle.scene.add(createQubitSphere(qubit0Pos));
    handle.scene.add(createQubitSphere(qubit1Pos));

    const v0 = new THREE.Vector3(...qubit0Pos);
    const v1 = new THREE.Vector3(...qubit1Pos);
    const mid = new THREE.Vector3().addVectors(v0, v1).multiplyScalar(0.5);
    const dist = v0.distanceTo(v1);

    const beamGeo = new THREE.CylinderGeometry(0.08, 0.08, dist, 32, 1, true);
    const beamMat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color('#00f0ff') },
        uIntensity: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });

    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamMesh.position.copy(mid);

    const dir = new THREE.Vector3().subVectors(v1, v0).normalize();
    const orientation = new THREE.Matrix4();
    if (Math.abs(dir.y) > 0.999) {
      orientation.lookAt(v0, v1, new THREE.Vector3(0, 0, 1));
    } else {
      orientation.lookAt(v0, v1, new THREE.Vector3(0, 1, 0));
    }
    const rot = new THREE.Euler().setFromRotationMatrix(orientation);
    beamMesh.rotation.set(rot.x + Math.PI / 2, rot.y, rot.z);

    handle.scene.add(beamMesh);

    const unregisterFrame = handle.onFrame((_time: number, delta: number) => {
      const state = useQuantumStore.getState();
      const entanglementDegree = state.entanglementDegree ?? (state.isEntangled ? 1.0 : 0.0);
      const isVisible = entanglementDegree > 0;

      beamMesh.visible = isVisible;
      if (isVisible) {
        beamMat.uniforms.uTime.value += delta;
        beamMat.uniforms.uIntensity.value = entanglementDegree;
      }
    });

    const resizeObserver = new ResizeObserver(() => handle.resize());
    resizeObserver.observe(container);

    return () => {
      unregisterFrame();
      resizeObserver.disconnect();
      handle.dispose();
    };
  }, []);

  return (
    <div className="flex items-center justify-center h-full w-full relative bg-background-90 rounded-xl overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}

// Symbol: HistogramView
export function HistogramView(_props: ViewportProps) {
  return (
    <div className="flex items-center justify-center h-full w-full">
      <canvas role="img" aria-label="Histogram View" className="w-full h-full" />
    </div>
  );
}
