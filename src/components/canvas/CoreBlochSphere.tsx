"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { useQuantumStore } from "@/store/useQuantumStore";
import { useSpatialTelemetryBridge } from "@/hooks/useSpatialTelemetryBridge";
import { acquireRenderer } from "@/features/quantum-core/BlochViewport";
import {
  computePolarArcPositions,
  computeAzimuthalLinePositions,
  computeSphericalVector,
} from "@/features/quantum-core/blochSceneObjects";
import {
  createBlochTargetZoneMesh,
  isVectorInBlochTarget,
} from "./TargetZone3D";

export interface CoreBlochSphereProps {
  className?: string;
  radius?: number;
  showArcs?: boolean;
  showAxes?: boolean;
  showPoleLabels?: boolean;
  interactive?: boolean;
  targetZone?: { theta: number; phi: number } | null;
  onVectorDrag?: (coords: { theta: number; phi: number }, vector: THREE.Vector3) => void;
  onSceneReady?: (ctx: {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
  }) => (() => void) | void;
  children?: React.ReactNode;
}

export function slerpUnitVectors(v1: THREE.Vector3, v2: THREE.Vector3, t: number): THREE.Vector3 {
  const dot = Math.max(-1, Math.min(1, v1.dot(v2)));
  if (dot > 0.999999) return v1.clone().lerp(v2, t).normalize();
  if (dot < -0.999999) {
    const ortho = Math.abs(v1.x) < 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 0, 1);
    const axis = new THREE.Vector3().crossVectors(v1, ortho).normalize();
    return v1.clone().applyQuaternion(new THREE.Quaternion().setFromAxisAngle(axis, Math.PI * t));
  }
  const omega = Math.acos(dot);
  const sinO = Math.sin(omega);
  return new THREE.Vector3(
    v1.x * (Math.sin((1 - t) * omega) / sinO) + v2.x * (Math.sin(t * omega) / sinO),
    v1.y * (Math.sin((1 - t) * omega) / sinO) + v2.y * (Math.sin(t * omega) / sinO),
    v1.z * (Math.sin((1 - t) * omega) / sinO) + v2.z * (Math.sin(t * omega) / sinO)
  ).normalize();
}

export interface PoleContactResult {
  vector: THREE.Vector3;
  theta: number;
  phi: number;
  isContact: boolean;
  pole: "north" | "south" | null;
}

export function interpolatePoleSlerp(
  vector: THREE.Vector3,
  radius = 1.3,
  thresholdAngle = 0.16
): PoleContactResult {
  const unit = vector.clone().normalize();
  const rawTheta = Math.acos(Math.max(-1, Math.min(1, unit.y)));
  let rawPhi = Math.atan2(unit.z, unit.x);
  if (rawPhi < 0) rawPhi += 2 * Math.PI;

  const isNorth = rawTheta < thresholdAngle;
  const isSouth = Math.PI - rawTheta < thresholdAngle;
  if (isNorth || isSouth) {
    const pole: "north" | "south" = isNorth ? "north" : "south";
    const targetPole = isNorth ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, -1, 0);
    const angle = isNorth ? rawTheta : Math.PI - rawTheta;
    const t = 1 - angle / thresholdAngle;
    const smoothT = t * t * (3 - 2 * t);
    const snap = angle < 0.035;
    const finalUnit = snap ? targetPole : slerpUnitVectors(unit, targetPole, smoothT);
    const finalTheta = snap ? (isNorth ? 0 : Math.PI) : Math.acos(Math.max(-1, Math.min(1, finalUnit.y)));
    return { vector: finalUnit.clone().multiplyScalar(radius), theta: finalTheta, phi: rawPhi, isContact: true, pole };
  }
  return { vector: unit.multiplyScalar(radius), theta: rawTheta, phi: rawPhi, isContact: false, pole: null };
}

export const CoreBlochSphere: React.FC<CoreBlochSphereProps> = ({
  className = "",
  radius = 1.3,
  showArcs = true,
  showAxes = true,
  showPoleLabels = true,
  interactive = true,
  targetZone = null,
  onVectorDrag,
  onSceneReady,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const theta = useQuantumStore((s) => s.theta);
  const phi = useQuantumStore((s) => s.phi);
  const theme = useQuantumStore((s) => s.theme);
  const isDark = theme === "dark";

  const [isNearPole, setIsNearPole] = useState<"north" | "south" | null>(null);

  const coords = useMemo(() => {
    const sT = Math.sin(theta);
    return {
      x: (sT * Math.cos(phi)).toFixed(3),
      y: Math.cos(theta).toFixed(3),
      z: (sT * Math.sin(phi)).toFixed(3),
    };
  }, [theta, phi]);

  // Performance: Memoize 3D geometries to avoid re-allocation on re-renders
  const sphereGeo = useMemo(() => new THREE.SphereGeometry(radius, 32, 16), [radius]);
  const ringGeo = useMemo(() => new THREE.RingGeometry(radius - 0.01, radius + 0.01, 64), [radius]);
  const poleGeo = useMemo(() => new THREE.SphereGeometry(0.045, 12, 12), []);
  const tipHandleGeo = useMemo(() => new THREE.SphereGeometry(0.09, 16, 16), []);
  const axesGeo = useMemo(
    () =>
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-radius * 1.25, 0, 0),
        new THREE.Vector3(radius * 1.25, 0, 0),
        new THREE.Vector3(0, -radius * 1.25, 0),
        new THREE.Vector3(0, radius * 1.25, 0),
        new THREE.Vector3(0, 0, -radius * 1.25),
        new THREE.Vector3(0, 0, radius * 1.25),
      ]),
    [radius]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = acquireRenderer(container);
    const scene = new THREE.Scene();

    const w = container.clientWidth || 800;
    const h = container.clientHeight || 600;
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    camera.position.set(0, 0, 4.8);
    scene.add(new THREE.AmbientLight(0xffffff, 0.95));

    // 1. Bloch Sphere Mesh
    const sphereMat = new THREE.MeshBasicMaterial({
      color: isDark ? 0x1e293b : 0x94a3b8,
      wireframe: true,
      transparent: true,
      opacity: isDark ? 0.15 : 0.22,
      depthWrite: false,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphere);

    // 2. Equator Ring
    const ringMat = new THREE.MeshBasicMaterial({
      color: isDark ? 0x334155 : 0x64748b,
      transparent: true,
      opacity: isDark ? 0.25 : 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.name = "equator-ring";
    scene.add(ring);

    // 3. Coordinate Axes (X, Y, Z)
    const axesMat = new THREE.LineBasicMaterial({
      color: isDark ? 0x334155 : 0x64748b,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    const axes = new THREE.LineSegments(axesGeo, axesMat);
    axes.visible = showAxes;
    scene.add(axes);

    // 4. Pole Nodes
    const northMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, transparent: true, opacity: 0.8 });
    const southMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.8 });
    const northPoleMesh = new THREE.Mesh(poleGeo, northMat);
    northPoleMesh.position.set(0, radius, 0);
    northPoleMesh.name = "north-pole";
    const southPoleMesh = new THREE.Mesh(poleGeo, southMat);
    southPoleMesh.position.set(0, -radius, 0);
    southPoleMesh.name = "south-pole";
    scene.add(northPoleMesh, southPoleMesh);

    // 5. Polar Arc & Azimuthal Line
    const initSt = useQuantumStore.getState();
    const polarArcGeo = new LineGeometry();
    polarArcGeo.setPositions(computePolarArcPositions(initSt.theta, initSt.phi, radius));
    const polarArcMat = new LineMaterial({
      color: 0x00f3ff,
      linewidth: 3,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    polarArcMat.resolution.set(w, h);
    const polarArc = new Line2(polarArcGeo, polarArcMat);
    polarArc.name = "bloch-polar-arc";
    polarArc.visible = showArcs;
    scene.add(polarArc);

    const azimuthalGeo = new LineGeometry();
    azimuthalGeo.setPositions(computeAzimuthalLinePositions(initSt.theta, initSt.phi, radius));
    const azimuthalMat = new LineMaterial({
      color: 0xffee00,
      linewidth: 3.5,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });
    azimuthalMat.resolution.set(w, h);
    const azimuthalLine = new Line2(azimuthalGeo, azimuthalMat);
    azimuthalLine.name = "bloch-azimuthal-line";
    azimuthalLine.visible = showArcs;
    scene.add(azimuthalLine);

    // 6. Arrow & Vector Tip Handle
    const arrowDir = computeSphericalVector(initSt.theta, initSt.phi);
    const arrowHelper = new THREE.ArrowHelper(arrowDir, new THREE.Vector3(0, 0, 0), radius, 0x00f3ff, 0.18, 0.08);
    arrowHelper.name = "state-vector";
    scene.add(arrowHelper);

    const tipHandleMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });
    const tipHandle = new THREE.Mesh(tipHandleGeo, tipHandleMat);
    tipHandle.position.copy(arrowDir).multiplyScalar(radius);
    tipHandle.name = "bloch-vector-tip-handle";
    scene.add(tipHandle);

    // Optional 3D Target Zone Mesh
    let targetMesh: ReturnType<typeof createBlochTargetZoneMesh> | null = null;
    if (targetZone) {
      targetMesh = createBlochTargetZoneMesh(targetZone.theta, targetZone.phi, radius);
      scene.add(targetMesh.mesh);
    }

    const materials: (THREE.Material | LineMaterial)[] = [
      sphereMat, ringMat, axesMat, northMat, southMat, polarArcMat, azimuthalMat, tipHandleMat
    ];

    // External Scene Extension Slot (e.g. GateRotationRings)
    const cleanupExt = onSceneReady?.({ scene, camera, renderer });

    // Orbit & Drag Interaction
    const sphericalCam = { radius: 4.8, theta: Math.PI / 4, phi: Math.PI / 3 };
    const updateCameraPos = () => {
      sphericalCam.phi = Math.max(0.1, Math.min(Math.PI - 0.1, sphericalCam.phi));
      camera.position.set(
        sphericalCam.radius * Math.sin(sphericalCam.phi) * Math.sin(sphericalCam.theta),
        sphericalCam.radius * Math.cos(sphericalCam.phi),
        sphericalCam.radius * Math.sin(sphericalCam.phi) * Math.cos(sphericalCam.theta)
      );
      camera.lookAt(0, 0, 0);
    };
    updateCameraPos();

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const blochSphereGeom = new THREE.Sphere(new THREE.Vector3(0, 0, 0), radius);
    const hitPoint = new THREE.Vector3();

    let isDraggingHandle = false;
    let isDraggingCamera = false;
    let prevMouse = { x: 0, y: 0 };

    const updateMouse = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const checkInteractiveHits = () => {
      raycaster.setFromCamera(mouse, camera);
      const targets: THREE.Object3D[] = [tipHandle, northPoleMesh, southPoleMesh];
      if (arrowHelper.cone) targets.push(arrowHelper.cone);
      return raycaster.intersectObjects(targets, false);
    };

    const updateVectorFromRaycast = () => {
      raycaster.setFromCamera(mouse, camera);
      const hasHit = raycaster.ray.intersectSphere(blochSphereGeom, hitPoint);
      if (!hasHit) {
        raycaster.ray.closestPointToPoint(new THREE.Vector3(0, 0, 0), hitPoint);
      }

      // Apply Slerp interpolation on pole contact
      const slerpRes = interpolatePoleSlerp(hitPoint, radius);
      setIsNearPole(slerpRes.pole);

      useQuantumStore.getState().setAngles(slerpRes.theta, slerpRes.phi);
      onVectorDrag?.({ theta: slerpRes.theta, phi: slerpRes.phi }, slerpRes.vector);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!interactive) return;
      const target = e.target as HTMLElement | null;
      try {
        target?.setPointerCapture?.(e.pointerId);
      } catch (_e) { /* Safe */ }

      updateMouse(e);
      const hits = checkInteractiveHits();

      if (hits.length > 0) {
        isDraggingHandle = true;
        container.style.cursor = "grabbing";
        tipHandle.scale.setScalar(1.35);
        useSpatialTelemetryBridge.getState().setActiveFocusId("bloch-vector-tip-handle");
        updateVectorFromRaycast();
      } else {
        isDraggingCamera = true;
        prevMouse = { x: e.clientX, y: e.clientY };
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!interactive) return;
      updateMouse(e);

      if (isDraggingHandle) {
        updateVectorFromRaycast();
        return;
      }

      if (isDraggingCamera) {
        const dx = (e.clientX - prevMouse.x) * 0.008;
        const dy = (e.clientY - prevMouse.y) * 0.008;
        sphericalCam.theta -= dx;
        sphericalCam.phi -= dy;
        prevMouse = { x: e.clientX, y: e.clientY };
        updateCameraPos();
        return;
      }

      const hits = checkInteractiveHits();
      if (hits.length > 0) {
        const topHit = hits[0].object;
        container.style.cursor = "grab";
        tipHandle.scale.setScalar(1.25);
        if (topHit.name) {
          useSpatialTelemetryBridge.getState().setActiveFocusId(topHit.name);
        }
      } else {
        container.style.cursor = "default";
        tipHandle.scale.setScalar(1.0);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      try {
        target?.releasePointerCapture?.(e.pointerId);
      } catch (_e) { /* Safe */ }

      isDraggingHandle = false;
      isDraggingCamera = false;
      container.style.cursor = "default";
      tipHandle.scale.setScalar(1.0);
    };

    container.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    // Animation Render Loop
    let animId = 0;
    const loop = () => {
      const state = useQuantumStore.getState();
      const currentDir = computeSphericalVector(state.theta, state.phi);

      arrowHelper.setDirection(currentDir);
      tipHandle.position.copy(currentDir).multiplyScalar(radius);

      if (targetMesh && targetZone) {
        const isAligned = isVectorInBlochTarget(
          state.theta,
          state.phi,
          targetZone.theta,
          targetZone.phi
        );
        targetMesh.updateAlignment(isAligned);
      }

      if (showArcs) {
        const pArcPos = computePolarArcPositions(state.theta, state.phi, radius);
        polarArcGeo.setPositions(pArcPos);
        const aLinePos = computeAzimuthalLinePositions(state.theta, state.phi, radius);
        azimuthalGeo.setPositions(aLinePos);
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    const onResize = () => {
      const rw = container.clientWidth || 800;
      const rh = container.clientHeight || 600;
      camera.aspect = rw / rh;
      camera.updateProjectionMatrix();
      renderer.setSize(rw, rh, false);
      polarArcMat.resolution.set(rw, rh);
      azimuthalMat.resolution.set(rw, rh);
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      cleanupExt?.();
      targetMesh?.dispose();
      container.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      polarArcGeo.dispose();
      azimuthalGeo.dispose();
      materials.forEach((m) => m.dispose());
      axesMat.dispose();
      arrowHelper.line?.geometry.dispose();
      arrowHelper.cone?.geometry.dispose();
    };
  }, [radius, showArcs, showAxes, interactive, targetZone, onVectorDrag, onSceneReady, isDark, axesGeo, poleGeo, ringGeo, sphereGeo, tipHandleGeo]);

  return (
    <div
      data-testid="core-bloch-sphere"
      className={`relative w-full h-full select-none overflow-hidden touch-none ${className}`.trim()}
    >
      <div ref={containerRef} className="absolute inset-0 w-full h-full" />
      <div className="pointer-events-none absolute inset-0 bg-radial-glow opacity-60" />

      {/* Pole HUD Badges */}
      {showPoleLabels && (
        <>
          <span
            data-testid="north-pole-label"
            className="absolute top-3 left-1/2 -translate-x-1/2 text-xs telemetry-mono pointer-events-none px-2 py-0.5 rounded select-none hud-badge-cyan"
          >
            |0⟩ (+Y) {isNearPole === "north" ? "— SLERP LOCKED" : ""}
          </span>
          <span
            data-testid="south-pole-label"
            className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs telemetry-mono pointer-events-none px-2 py-0.5 rounded select-none hud-badge-purple"
          >
            |1⟩ (-Y) {isNearPole === "south" ? "— SLERP LOCKED" : ""}
          </span>
        </>
      )}

      {/* 3D Telemetry Coordinates Readout */}
      <div
        data-testid="core-bloch-coords"
        className="absolute bottom-2 left-4 pointer-events-none text-[10px] telemetry-mono text-muted-foreground flex items-center gap-2.5 px-2 py-1 rounded bg-surface-1/60 border border-white/5"
      >
        <span>
          <strong className="text-quantum-cyan">X:</strong> {coords.x}
        </span>
        <span>
          <strong className="text-quantum-emerald">Y:</strong> {coords.y}
        </span>
        <span>
          <strong className="text-quantum-purple">Z:</strong> {coords.z}
        </span>
      </div>

      {/* Embedded Overlays */}
      {children}
    </div>
  );
};

export default CoreBlochSphere;
