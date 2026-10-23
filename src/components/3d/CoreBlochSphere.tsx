'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import type { QubitState } from '@/core/qubitMath';
import {
  createGateRingsGroup,
  createGeodesicParticleSystem,
  slerpUnitVectors,
} from './GateRotationRings';
import { useSpatialTelemetryBridge } from '@/hooks/useSpatialTelemetryBridge';
import { useVectorDrag, pointerCoordsToNdc } from '@/hooks/useVectorDrag';
import { useOrbitCamera } from '@/hooks/useOrbitCamera';
import { useBlochKeyboard } from '@/hooks/useBlochKeyboard';
import { readBlochPalette, observeThemeChanges } from '@/lib/3d/blochTheme';
import {
  createBlochTargetZoneMesh,
  isVectorInBlochTarget,
  type TargetZoneMesh,
} from '@/lib/3d/TargetZone3D';

export { slerpUnitVectors };

const toVector = (th: number, ph: number) =>
  new THREE.Vector3(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)).normalize();

export interface CoreBlochSphereProps {
  state?: QubitState;
  className?: string;
  purity?: number;
  thermalCollapse?: number;
  activeGate?: string | null;
  interactive?: boolean;
  onStateChange?: (state: QubitState) => void;
  targetZone?: { theta: number; phi: number } | null;
  onAlignmentChange?: (isAligned: boolean) => void;
  showGateRings?: boolean;
  showMeasurementPlane?: boolean;
  lastOutcome?: 0 | 1 | null;
}

export function CoreBlochSphere({
  state = { theta: 0, phi: 0 },
  className = '',
  purity = 1,
  thermalCollapse = 1,
  activeGate = null,
  interactive = true,
  onStateChange,
  targetZone = null,
  onAlignmentChange,
  showGateRings = false,
  showMeasurementPlane = false,
  lastOutcome = null,
}: CoreBlochSphereProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const targetStateRef = useRef<QubitState>(state);
  const targetPurityRef = useRef<number>(purity);
  const targetCollapseRef = useRef<number>(thermalCollapse);
  const prevGateRef = useRef<string | null>(null);
  const prevOutcomeRef = useRef<0 | 1 | null>(null);
  const targetZoneRef = useRef<{ theta: number; phi: number } | null>(targetZone);
  const onAlignmentChangeRef = useRef(onAlignmentChange);
  const interactiveObjectsRef = useRef<THREE.Object3D[]>([]);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const isVectorInteractingRef = useRef(false);

  const onPointerOver = useSpatialTelemetryBridge((s) => s.onPointerOver);
  const clearFocus = useSpatialTelemetryBridge((s) => s.clearFocus);
  const activeFocusId = useSpatialTelemetryBridge((s) => s.activeFocusId);

  useEffect(() => { targetStateRef.current = state; }, [state]);
  useEffect(() => { targetPurityRef.current = purity; }, [purity]);
  useEffect(() => { targetCollapseRef.current = thermalCollapse; }, [thermalCollapse]);
  useEffect(() => { targetZoneRef.current = targetZone; }, [targetZone]);
  useEffect(() => { onAlignmentChangeRef.current = onAlignmentChange; }, [onAlignmentChange]);

  // Keyboard navigation (Arrow keys & WASD)
  useBlochKeyboard(targetStateRef, {
    enabled: interactive,
    onStateChange: (newState) => {
      targetStateRef.current = newState;
      onStateChange?.(newState);
    },
  });

  // Spherical Orbit Camera & Wheel Zoom controller
  const orbit = useOrbitCamera(containerRef, {
    enabled: interactive,
    initialRadius: 3.5,
    minRadius: 1.8,
    maxRadius: 7.0,
  });

  // State Vector drag hook with magnetic snapping
  const {
    onPointerDown: onDragPointerDown,
    onPointerMove: onDragPointerMove,
    onPointerUp: onDragPointerUp,
    onPointerCancel: onDragPointerCancel,
    isDragging,
  } = useVectorDrag({
    camera: cameraRef,
    center: new THREE.Vector3(0, 0, 0),
    radius: 1.2,
    initialTheta: state.theta,
    initialPhi: state.phi,
    enabled: interactive,
    snapEnabled: true,
    snapThreshold: 0.08,
    playSnapAudio: true,
    onDrag: (coords) => {
      targetStateRef.current = coords;
      onStateChange?.(coords);
    },
  });

  // Pointer event router: Direct vector drag on arrow or Shift+drag; Camera orbit on background
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!interactive) return;

      let isHittingVector = e.shiftKey;
      if (!isHittingVector && cameraRef.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const ndc = pointerCoordsToNdc(e.clientX, e.clientY, rect);
        raycasterRef.current.setFromCamera(new THREE.Vector2(ndc.x, ndc.y), cameraRef.current);
        raycasterRef.current.params.Line = { threshold: 0.18 };
        const vectorParts = interactiveObjectsRef.current.filter((o) => o.userData?.spatialId === 'state-vector');
        isHittingVector = raycasterRef.current.intersectObjects(vectorParts, true).length > 0;
      }

      if (isHittingVector) {
        isVectorInteractingRef.current = true;
        onDragPointerDown(e);
      } else {
        isVectorInteractingRef.current = false;
        orbit.onPointerDown(e);
      }
    },
    [interactive, onDragPointerDown, orbit]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (interactive) {
        if (isVectorInteractingRef.current || isDragging) {
          onDragPointerMove(e);
        } else if (orbit.isOrbitingRef.current) {
          orbit.onPointerMove(e);
        }
      }

      // Telemetry hover check when idle
      if (!isDragging && !orbit.isOrbitingRef.current && cameraRef.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const ndc = pointerCoordsToNdc(e.clientX, e.clientY, rect);
        raycasterRef.current.setFromCamera(new THREE.Vector2(ndc.x, ndc.y), cameraRef.current);

        const hits = raycasterRef.current.intersectObjects(interactiveObjectsRef.current, true);
        let id: string | null = null;
        for (let obj: THREE.Object3D | null = hits[0]?.object; obj; obj = obj.parent) {
          if (obj.userData?.spatialId) { id = obj.userData.spatialId; break; }
        }
        if (id) onPointerOver(id);
        else if (activeFocusId) clearFocus();
      }
    },
    [interactive, isDragging, onDragPointerMove, orbit, onPointerOver, activeFocusId, clearFocus]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (isVectorInteractingRef.current || isDragging) {
        onDragPointerUp(e);
        isVectorInteractingRef.current = false;
      }
      orbit.onPointerUp();
    },
    [isDragging, onDragPointerUp, orbit]
  );

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      onDragPointerCancel(e);
      orbit.onPointerUp();
      isVectorInteractingRef.current = false;
    },
    [onDragPointerCancel, orbit]
  );

  const handlePointerLeave = useCallback(() => {
    orbit.onPointerUp();
    clearFocus();
  }, [orbit, clearFocus]);

  // Main Three.js Scene Lifecycle (Mounted once)
  const sceneRef = useRef<THREE.Scene | null>(null);
  const targetZoneMeshRef = useRef<TargetZoneMesh | null>(null);
  const ringsGroupRef = useRef<THREE.Group | null>(null);
  const projectionDiskRef = useRef<THREE.Mesh | null>(null);
  const triggerArcRef = useRef<((start: THREE.Vector3, target: THREE.Vector3, color?: number) => void) | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 300;
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    cameraRef.current = camera;
    useSpatialTelemetryBridge.getState().setCamera(camera);
    orbit.updateCamera(camera);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    raycasterRef.current.params.Line = { threshold: 0.12 };
    const initialPalette = readBlochPalette();

    // 1. Sphere wireframe
    const sphereGeo = new THREE.SphereGeometry(1.2, 24, 16);
    const sphereMat = new THREE.MeshBasicMaterial({ color: initialPalette.primary, wireframe: true, transparent: true, opacity: initialPalette.wireOpacity });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphereMesh);

    // 2. Equator Ring
    const ringGeo = new THREE.RingGeometry(1.18, 1.22, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: initialPalette.primary, side: THREE.DoubleSide, transparent: true, opacity: initialPalette.ringOpacity });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    // 3. Coordinate Axes
    const axesGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1.4, 0, 0), new THREE.Vector3(1.4, 0, 0),
      new THREE.Vector3(0, -1.4, 0), new THREE.Vector3(0, 1.4, 0),
      new THREE.Vector3(0, 0, -1.4), new THREE.Vector3(0, 0, 1.4),
    ]);
    const axesMat = new THREE.LineBasicMaterial({ color: initialPalette.foreground, transparent: true, opacity: initialPalette.axesOpacity });
    const axes = new THREE.LineSegments(axesGeo, axesMat);
    scene.add(axes);

    // 4. Gate Rotation Rings Group
    const { group: ringsGroup, rings, dispose: disposeRings } = createGateRingsGroup(1.28);
    ringsGroupRef.current = ringsGroup;
    ringsGroup.visible = showGateRings;
    scene.add(ringsGroup);

    // 5. Geodesic Particle Tracer System
    const {
      mesh: particleMesh,
      guideLine,
      triggerArc,
      update: updateParticles,
      dispose: disposeParticles,
    } = createGeodesicParticleSystem(80, 1.25);
    triggerArcRef.current = triggerArc;
    scene.add(particleMesh);
    scene.add(guideLine);

    // 6. Target Zone Mesh (if specified)
    if (targetZoneRef.current) {
      const tzMesh = createBlochTargetZoneMesh(targetZoneRef.current.theta, targetZoneRef.current.phi, 1.25, 0.32, 0x00f0ff, 0x10b981);
      targetZoneMeshRef.current = tzMesh;
      scene.add(tzMesh.mesh);
    }

    // 7. Measurement Probability Projection Disk (Mission 3)
    const diskGeo = new THREE.CircleGeometry(1.2, 48);
    const diskMat = new THREE.MeshBasicMaterial({ color: initialPalette.purple, transparent: true, opacity: initialPalette.diskOpacity, side: THREE.DoubleSide, depthWrite: false });
    const projectionDisk = new THREE.Mesh(diskGeo, diskMat);
    projectionDisk.rotation.x = Math.PI / 2;
    projectionDisk.visible = showMeasurementPlane;
    projectionDiskRef.current = projectionDisk;
    scene.add(projectionDisk);

    // 7. State Vector Arrow
    let curTh = targetStateRef.current.theta;
    let curPh = targetStateRef.current.phi;
    let curPur = targetPurityRef.current ?? 1;
    let curCollapse = targetCollapseRef.current ?? 1;

    const arrow = new THREE.ArrowHelper(
      toVector(curTh, curPh),
      new THREE.Vector3(0, 0, 0),
      1.2 * curPur,
      initialPalette.primary,
      0.2,
      0.08
    );
    arrow.line.userData = { spatialId: 'state-vector' };
    arrow.cone.userData = { spatialId: 'state-vector' };
    scene.add(arrow);

    interactiveObjectsRef.current = [arrow.line, arrow.cone, ...Object.values(rings)];

    // Live theme subscriber
    const stopThemeObserver = observeThemeChanges((p) => {
      sphereMat.color.setHex(p.primary);
      sphereMat.opacity = p.wireOpacity * curCollapse;
      ringMat.color.setHex(p.primary);
      ringMat.opacity = p.ringOpacity * curCollapse;
      axesMat.color.setHex(p.foreground);
      axesMat.opacity = p.axesOpacity * curCollapse;
      diskMat.color.setHex(p.purple);
      diskMat.opacity = p.diskOpacity;
      arrow.setColor(p.primary);
    });

    let animId = 0;
    let lastTime = performance.now();

    const animate = () => {
      const now = performance.now();
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      // Smooth kinematic interpolation
      const targetPurity = Math.max(0.01, Math.min(1, targetPurityRef.current ?? 1));
      curPur += (targetPurity - curPur) * 0.12;

      const targetCollapse = Math.max(0.001, Math.min(1, targetCollapseRef.current ?? 1));
      curCollapse += (targetCollapse - curCollapse) * 0.12;

      const { theta: targetTheta, phi: targetPhi } = targetStateRef.current;
      if (curTh < 0.05 || Math.PI - curTh < 0.05) curPh = targetPhi;
      let dPhi = targetPhi - curPh;
      while (dPhi > Math.PI) dPhi -= 2 * Math.PI;
      while (dPhi < -Math.PI) dPhi += 2 * Math.PI;

      curPh += dPhi * 0.15;
      curTh += (targetTheta - curTh) * 0.15;

      // Update camera transform via orbit controller
      orbit.updateCamera(camera);

      // Thermal collapse scaling (wireframe, ring, axes)
      sphereMesh.scale.setScalar(curCollapse);
      sphereMat.opacity = initialPalette.wireOpacity * curCollapse;
      ring.scale.setScalar(curCollapse);
      ringMat.opacity = initialPalette.ringOpacity * curCollapse;
      axes.scale.setScalar(curCollapse);
      axesMat.opacity = initialPalette.axesOpacity * curCollapse;

      // State vector position & length (governed by purity)
      const vec = toVector(curTh, curPh);
      arrow.setDirection(vec);
      const vecLen = Math.max(0.05, 1.2 * curPur);
      arrow.setLength(vecLen, Math.min(vecLen * 0.25, 0.2), Math.min(vecLen * 0.1, 0.08));

      // Probability projection disk height & radius (P0 = cos²(theta/2))
      if (projectionDisk.visible) {
        projectionDisk.position.y = vec.y * 1.2 * curCollapse;
        const diskRadius = Math.max(0.05, 1.2 * Math.sin(curTh) * curCollapse);
        projectionDisk.scale.set(diskRadius / 1.2, diskRadius / 1.2, 1);
      }

      // Check spatial target zone alignment
      const tzMesh = targetZoneMeshRef.current;
      const curTarget = targetZoneRef.current;
      if (tzMesh && curTarget) {
        const isAligned = isVectorInBlochTarget(
          curTh,
          curPh,
          curTarget.theta,
          curTarget.phi,
          0.35
        );
        tzMesh.updateAlignment(isAligned);
        onAlignmentChangeRef.current?.(isAligned);
      }

      updateParticles(dt);

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };
    animate();

    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(([entry]) => {
            if (!entry) return;
            const { width: w, height: h } = entry.contentRect;
            if (w > 0 && h > 0) {
              camera.aspect = w / h;
              camera.updateProjectionMatrix();
              renderer.setSize(w, h);
            }
          })
        : null;

    resizeObserver?.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver?.disconnect();
      stopThemeObserver();
      cameraRef.current = null;
      useSpatialTelemetryBridge.getState().setCamera(null);
      disposeRings();
      disposeParticles();
      if (targetZoneMeshRef.current) {
        targetZoneMeshRef.current.dispose();
        scene.remove(targetZoneMeshRef.current.mesh);
        targetZoneMeshRef.current = null;
      }
      [sphereGeo, sphereMat, ringGeo, ringMat, axesGeo, axesMat, diskGeo, diskMat, arrow].forEach((d) => d.dispose());
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deliberate singleton Three.js scene lifecycle; reactive props updated via dedicated effects
  }, []); // Run once! Single WebGL context safety

  // Reactive updates for dynamic visual props without rebuilding canvas
  useEffect(() => {
    if (ringsGroupRef.current) ringsGroupRef.current.visible = Boolean(showGateRings);
    if (projectionDiskRef.current) projectionDiskRef.current.visible = Boolean(showMeasurementPlane);
  }, [showGateRings, showMeasurementPlane]);

  // Target Zone reactive mounting/unmounting
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (targetZoneMeshRef.current) {
      scene.remove(targetZoneMeshRef.current.mesh);
      targetZoneMeshRef.current.dispose();
      targetZoneMeshRef.current = null;
    }

    if (targetZone) {
      const tzMesh = createBlochTargetZoneMesh(targetZone.theta, targetZone.phi, 1.25, 0.32, 0x00f0ff, 0x10b981);
      targetZoneMeshRef.current = tzMesh;
      scene.add(tzMesh.mesh);
      const isAligned = isVectorInBlochTarget(targetStateRef.current.theta, targetStateRef.current.phi, targetZone.theta, targetZone.phi, 0.35);
      tzMesh.updateAlignment(isAligned);
      onAlignmentChangeRef.current?.(isAligned);
    } else {
      onAlignmentChangeRef.current?.(false);
    }
  }, [targetZone]);

  // Gate transition geodesic particle arc
  useEffect(() => {
    if (activeGate && activeGate !== prevGateRef.current && triggerArcRef.current) {
      triggerArcRef.current(
        toVector(state.theta, state.phi),
        toVector(targetStateRef.current.theta, targetStateRef.current.phi)
      );
      prevGateRef.current = activeGate;
    }
  }, [activeGate, state]);

  // Measurement collapse animation
  useEffect(() => {
    if (lastOutcome !== null && lastOutcome !== prevOutcomeRef.current && triggerArcRef.current) {
      const collapseTarget = lastOutcome === 0 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, -1, 0);
      const curVec = toVector(targetStateRef.current.theta, targetStateRef.current.phi);
      triggerArcRef.current(curVec, collapseTarget, 0xa855f7);
      prevOutcomeRef.current = lastOutcome;
    }
  }, [lastOutcome]);

  return (
    <div
      data-testid="core-bloch-sphere"
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerLeave}
      className={`relative w-full h-full min-h-60 select-none cursor-grab active:cursor-grabbing ${className}`.trim()}
    />
  );
}

export default CoreBlochSphere;
