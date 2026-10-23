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
import {
  createBlochTargetZoneMesh,
  isVectorInBlochTarget,
  type TargetZoneMesh,
} from '@/lib/3d/TargetZone3D';

export { slerpUnitVectors };

export interface CoreBlochSphereProps {
  state?: QubitState;
  className?: string;
  purity?: number;
  activeGate?: string | null;
  interactive?: boolean;
  onStateChange?: (state: QubitState) => void;
  targetZone?: { theta: number; phi: number } | null;
  onAlignmentChange?: (isAligned: boolean) => void;
}

export function CoreBlochSphere({
  state = { theta: 0, phi: 0 },
  className = '',
  purity = 1,
  activeGate = null,
  interactive = true,
  onStateChange,
  targetZone = null,
  onAlignmentChange,
}: CoreBlochSphereProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const targetStateRef = useRef<QubitState>(state);
  const targetPurityRef = useRef<number>(purity);
  const prevGateRef = useRef<string | null>(null);
  const targetZoneRef = useRef<{ theta: number; phi: number } | null>(targetZone);
  const onAlignmentChangeRef = useRef(onAlignmentChange);
  const interactiveObjectsRef = useRef<THREE.Object3D[]>([]);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());

  const onPointerOver = useSpatialTelemetryBridge((s) => s.onPointerOver);
  const onPointerOut = useSpatialTelemetryBridge((s) => s.onPointerOut);
  const clearFocus = useSpatialTelemetryBridge((s) => s.clearFocus);
  const activeFocusId = useSpatialTelemetryBridge((s) => s.activeFocusId);

  useEffect(() => {
    targetStateRef.current = state;
  }, [state]);

  useEffect(() => {
    targetPurityRef.current = purity;
  }, [purity]);

  useEffect(() => {
    targetZoneRef.current = targetZone;
  }, [targetZone]);

  useEffect(() => {
    onAlignmentChangeRef.current = onAlignmentChange;
  }, [onAlignmentChange]);

  // Integrated pointer dragging with magnetic snapping
  const {
    onPointerDown,
    onPointerMove: onDragPointerMove,
    onPointerUp,
    onPointerCancel,
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

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (interactive) {
        onDragPointerMove(e);
      }

      // If not actively dragging, perform raycast hover check for spatial telemetry tooltips
      if (!isDragging && cameraRef.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const ndc = pointerCoordsToNdc(e.clientX, e.clientY, rect);
        raycasterRef.current.setFromCamera(new THREE.Vector2(ndc.x, ndc.y), cameraRef.current);

        const hoverTargets = interactiveObjectsRef.current;
        const intersects = raycasterRef.current.intersectObjects(hoverTargets, true);
        if (intersects.length > 0) {
          let hitObj: THREE.Object3D | null = intersects[0].object;
          let spatialId: string | null = null;
          while (hitObj) {
            if (hitObj.userData?.spatialId) {
              spatialId = hitObj.userData.spatialId;
              break;
            }
            hitObj = hitObj.parent;
          }
          if (spatialId) {
            onPointerOver(spatialId);
          } else if (activeFocusId) {
            onPointerOut(activeFocusId);
          }
        } else if (activeFocusId) {
          clearFocus();
        }
      }
    },
    [interactive, onDragPointerMove, isDragging, onPointerOver, onPointerOut, activeFocusId, clearFocus]
  );

  const handlePointerLeave = useCallback(() => {
    clearFocus();
  }, [clearFocus]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 300;
    const height = container.clientHeight || 300;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(2.4, 1.8, 2.4);
    camera.lookAt(0, 0, 0);

    cameraRef.current = camera;
    useSpatialTelemetryBridge.getState().setCamera(camera);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    // Set raycaster line threshold for easy vector hovering
    raycasterRef.current.params.Line = { threshold: 0.08 };

    // 1. Sphere wireframe
    const sphereGeo = new THREE.SphereGeometry(1.2, 24, 16);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphereMesh);

    // 2. Equator Ring
    const ringGeo = new THREE.RingGeometry(1.18, 1.22, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.3,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    // 3. Axes
    const axesGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-1.4, 0, 0),
      new THREE.Vector3(1.4, 0, 0),
      new THREE.Vector3(0, -1.4, 0),
      new THREE.Vector3(0, 1.4, 0),
      new THREE.Vector3(0, 0, -1.4),
      new THREE.Vector3(0, 0, 1.4),
    ]);
    const axesMat = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.25,
    });
    const axes = new THREE.LineSegments(axesGeo, axesMat);
    scene.add(axes);

    // 4. Gate Rotation Rings Group
    const { group: ringsGroup, rings, dispose: disposeRings } = createGateRingsGroup(1.28);
    scene.add(ringsGroup);

    // 5. Geodesic Particle Tracer System
    const {
      mesh: particleMesh,
      guideLine,
      triggerArc,
      update: updateParticles,
      dispose: disposeParticles,
    } = createGeodesicParticleSystem(80, 1.25);
    scene.add(particleMesh);
    scene.add(guideLine);

    // 6. Target Zone Mesh (if target coordinates specified)
    let targetZoneMesh: TargetZoneMesh | null = null;
    const currentTarget = targetZoneRef.current;
    if (currentTarget) {
      targetZoneMesh = createBlochTargetZoneMesh(
        currentTarget.theta,
        currentTarget.phi,
        1.25,
        0.32,
        0x00f0ff,
        0x10b981
      );
      scene.add(targetZoneMesh.mesh);
    }

    // 7. State Vector Arrow
    let currentTheta = targetStateRef.current.theta;
    let currentPhi = targetStateRef.current.phi;
    let currentPurity = targetPurityRef.current ?? 1;

    const toVector = (th: number, ph: number) =>
      new THREE.Vector3(
        Math.sin(th) * Math.cos(ph),
        Math.cos(th),
        Math.sin(th) * Math.sin(ph)
      ).normalize();

    const arrow = new THREE.ArrowHelper(
      toVector(currentTheta, currentPhi),
      new THREE.Vector3(0, 0, 0),
      1.2 * currentPurity,
      0x00f0ff,
      0.2,
      0.08
    );
    arrow.line.userData = { spatialId: 'state-vector' };
    arrow.cone.userData = { spatialId: 'state-vector' };
    scene.add(arrow);

    // Register interactive hover targets for spatial telemetry raycasting
    interactiveObjectsRef.current = [
      arrow.line,
      arrow.cone,
      ...Object.values(rings),
    ];

    let animId = 0;
    let lastTime = performance.now();

    const animate = () => {
      const now = performance.now();
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      const { theta: targetTheta, phi: targetPhi } = targetStateRef.current;
      const targetPurity = Math.max(0.05, Math.min(1, targetPurityRef.current ?? 1));
      currentPurity += (targetPurity - currentPurity) * 0.1;

      if (currentTheta < 0.05 || Math.PI - currentTheta < 0.05) currentPhi = targetPhi;
      let dPhi = targetPhi - currentPhi;
      while (dPhi > Math.PI) dPhi -= 2 * Math.PI;
      while (dPhi < -Math.PI) dPhi += 2 * Math.PI;

      currentPhi += dPhi * 0.1;
      currentTheta += (targetTheta - currentTheta) * 0.1;

      const vec = toVector(currentTheta, currentPhi);
      arrow.setDirection(vec);
      const len = 1.2 * currentPurity;
      arrow.setLength(len, Math.min(len * 0.25, 0.2), Math.min(len * 0.1, 0.08));

      // Evaluate spatial target zone alignment
      if (targetZoneMesh && targetZoneRef.current) {
        const isAligned = isVectorInBlochTarget(
          currentTheta,
          currentPhi,
          targetZoneRef.current.theta,
          targetZoneRef.current.phi,
          0.35
        );
        targetZoneMesh.updateAlignment(isAligned);
        onAlignmentChangeRef.current?.(isAligned);
      }

      updateParticles(dt);

      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };
    animate();

    // Trigger geodesic particle arc when activeGate changes
    if (activeGate && activeGate !== prevGateRef.current) {
      const startVec = toVector(currentTheta, currentPhi);
      const targetVec = toVector(targetStateRef.current.theta, targetStateRef.current.phi);
      triggerArc(startVec, targetVec);
      prevGateRef.current = activeGate;
    }

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
      cameraRef.current = null;
      useSpatialTelemetryBridge.getState().setCamera(null);
      disposeRings();
      disposeParticles();
      if (targetZoneMesh) {
        targetZoneMesh.dispose();
        scene.remove(targetZoneMesh.mesh);
      }
      sphereGeo.dispose();
      sphereMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      axesGeo.dispose();
      axesMat.dispose();
      arrow.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [activeGate, targetZone]);

  return (
    <div
      data-testid="core-bloch-sphere"
      ref={containerRef}
      onPointerDown={interactive ? onPointerDown : undefined}
      onPointerMove={handlePointerMove}
      onPointerUp={interactive ? onPointerUp : undefined}
      onPointerCancel={interactive ? onPointerCancel : undefined}
      onPointerLeave={handlePointerLeave}
      className={`relative w-full h-full min-h-60 select-none ${className}`.trim()}
    />
  );
}

export default CoreBlochSphere;
