"use client";

import React, { useEffect, useRef, useMemo } from "react";
import * as THREE from "three";
import { useQuantumStore } from "@/store/useQuantumStore";
import {
  createBaseScene,
  createBlochSphereScene,
  createParticlePool,
  burstParticles,
  updateParticles,
  calculateDecoherencePerturbation,
  computeSphericalVector,
  vectorToSphericalAngles,
  lerpSphericalAngles,
  updateBlochSphereUniforms,
  updatePolarArc,
  updateAzimuthalLine,
} from "./blochSceneObjects";
import {
  createDualBlochScene,
  updateLaserStrand,
  computeSynchronizedAngles,
  type SpinFlipWaveState,
} from "./EntanglementOverlay3D";
import {
  createThermalDistortionShaderMaterial,
  updateThermalDistortionUniforms,
  createDecoherenceParticleSystem,
  updateThermalParticles,
} from "./DecoherenceParticles";
import {
  createGroverBarScene,
  updateGroverBars,
  createShorWheelScene,
  updateShorWheelAnimation,
  createQECLatticeScene,
  updateQECLattice,
} from "@/features/missions/AlgorithmVisualizer3D";
import { simulateGroverStep, runShorDemo } from "@/core/algorithms";

export let singletonRenderer: THREE.WebGLRenderer | null = null;

export function acquireRenderer(container: HTMLElement): THREE.WebGLRenderer {
  if (!singletonRenderer) {
    singletonRenderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    singletonRenderer.setPixelRatio(
      Math.min(
        typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1,
        2,
      ),
    );
  }
  const dom = singletonRenderer.domElement;
  dom.style.display = "block";
  dom.style.width = "100%";
  dom.style.height = "100%";
  if (dom.parentElement !== container) {
    dom.parentElement?.removeChild(dom);
    container.appendChild(dom);
  }
  singletonRenderer.setSize(
    container.clientWidth || 800,
    container.clientHeight || 600,
    false,
  );
  return singletonRenderer;
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export const BlochViewport: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const theta = useQuantumStore((s) => s.theta);
  const phi = useQuantumStore((s) => s.phi);
  const lastOutcome = useQuantumStore((s) => s.lastOutcome);

  const coords = useMemo(() => {
    const sT = Math.sin(theta);
    return {
      x: (sT * Math.cos(phi)).toFixed(3),
      y: Math.cos(theta).toFixed(3),
      z: (sT * Math.sin(phi)).toFixed(3),
    };
  }, [theta, phi]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      const state = useQuantumStore.getState();
      const step = 0.08;

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          state.setTheta(Math.max(0, state.theta - step));
          break;
        case "ArrowDown":
          e.preventDefault();
          state.setTheta(Math.min(Math.PI, state.theta + step));
          break;
        case "ArrowLeft":
          e.preventDefault();
          state.setPhi((state.phi - step + 2 * Math.PI) % (2 * Math.PI));
          break;
        case "ArrowRight":
          e.preventDefault();
          state.setPhi((state.phi + step) % (2 * Math.PI));
          break;
        case "h":
        case "H":
          e.preventDefault();
          state.applyGate("H");
          break;
        case "x":
        case "X":
          e.preventDefault();
          state.applyGate("X");
          break;
        case "z":
        case "Z":
          e.preventDefault();
          state.applyGate("Z");
          break;
        case " ":
        case "Spacebar":
          e.preventDefault();
          state.measure();
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Single WebGLRenderer context reuse safeguard (AGENTS.md Principle 2)
    const renderer = acquireRenderer(container);
    const { scene, camera } = createBaseScene(container);
    const initSt = useQuantumStore.getState();
    const elements = createBlochSphereScene(initSt.theme);
    const {
      sphere,
      ring,
      axes,
      arrowHelper,
      tipHandle,
      polarArc,
      azimuthalLine,
      geometries,
      materials,
    } = elements;
    scene.add(sphere, ring, axes, arrowHelper, tipHandle, polarArc, azimuthalLine);

    const initW = container.clientWidth || 800;
    const initH = container.clientHeight || 600;
    polarArc.material.resolution.set(initW, initH);
    azimuthalLine.material.resolution.set(initW, initH);

    const particlePool = createParticlePool(250);
    scene.add(particlePool.mesh);

    const ghostArrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, -1, 0),
      new THREE.Vector3(0, 0, 0),
      1.3,
      0xa855f7,
      0.2,
      0.08,
    );
    ghostArrow.visible = false;
    scene.add(ghostArrow);

    const trailPositions = new Float32Array(60 * 3);
    const trailGeo = new THREE.BufferGeometry();
    trailGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(trailPositions, 3),
    );
    const trailMat = new THREE.LineBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.85,
    });
    const trailLine = new THREE.Line(trailGeo, trailMat);
    trailLine.visible = false;
    scene.add(trailLine);

    const defaultSphereMat = sphere.material;
    const thermalShaderMat = createThermalDistortionShaderMaterial();
    const decoherenceParticles = createDecoherenceParticleSystem(350);
    decoherenceParticles.points.visible = false;
    scene.add(decoherenceParticles.points);

    const dualBloch = createDualBlochScene();
    const groverScene = createGroverBarScene(initSt.groverTargetIndex);
    let activeShorBase = initSt.shorBase;
    let shorScene = createShorWheelScene(runShorDemo(activeShorBase).period);
    const qecScene = createQECLatticeScene(initSt.qecInjectedError);
    const waveState: SpinFlipWaveState = {
      active: false,
      startTime: 0,
      duration: 1.2,
      outcome: 0,
    };
    let cameraImpulse = 0;

    let isDraggingCamera = false;
    let isDraggingHandle = false;
    let prevMouse = { x: 0, y: 0 };
    const spherical = { radius: 4.8, theta: Math.PI / 4, phi: Math.PI / 3 };

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const blochSphereGeom = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1.3);
    const hitPoint = new THREE.Vector3();

    const updateCamera = () => {
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
      camera.position.set(
        spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta),
        spherical.radius * Math.cos(spherical.phi),
        spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta),
      );
      camera.lookAt(0, 0, 0);
    };
    updateCamera();

    const updateMouseCoords = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const checkHandleIntersection = (): boolean => {
      raycaster.setFromCamera(mouse, camera);
      const targets = arrowHelper.cone
        ? [tipHandle, arrowHelper.cone]
        : [tipHandle];
      const hits = raycaster.intersectObjects(targets, false);
      return hits.length > 0;
    };

    const updateAnglesFromPointer = () => {
      raycaster.setFromCamera(mouse, camera);
      const hasHit = raycaster.ray.intersectSphere(blochSphereGeom, hitPoint);
      if (!hasHit) {
        raycaster.ray.closestPointToPoint(new THREE.Vector3(0, 0, 0), hitPoint);
      }
      const { theta: newTheta, phi: newPhi } =
        vectorToSphericalAngles(hitPoint);
      useQuantumStore.getState().setAngles(newTheta, newPhi);
    };

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      try {
        target?.setPointerCapture?.(e.pointerId);
      } catch (_err) {
        // Ignored in headless/test environments
      }
      updateMouseCoords(e);
      if (checkHandleIntersection()) {
        isDraggingHandle = true;
        container.style.cursor = "grabbing";
        tipHandle.scale.setScalar(1.35);
        updateAnglesFromPointer();
      } else {
        isDraggingCamera = true;
        prevMouse = { x: e.clientX, y: e.clientY };
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (isDraggingHandle) {
        updateMouseCoords(e);
        updateAnglesFromPointer();
        return;
      }
      if (isDraggingCamera) {
        const dx = (e.clientX - prevMouse.x) * 0.008;
        const dy = (e.clientY - prevMouse.y) * 0.008;
        spherical.theta -= dx;
        spherical.phi -= dy;
        prevMouse = { x: e.clientX, y: e.clientY };
        updateCamera();
        return;
      }
      updateMouseCoords(e);
      const isHovered = checkHandleIntersection();
      container.style.cursor = isHovered ? "grab" : "default";
      tipHandle.scale.setScalar(isHovered ? 1.3 : 1.0);
    };

    const onPointerUp = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      try {
        if (target?.hasPointerCapture?.(e.pointerId)) {
          target.releasePointerCapture(e.pointerId);
        }
      } catch (_err) {
        // Ignored
      }
      if (isDraggingHandle) {
        isDraggingHandle = false;
        const isHovered = checkHandleIntersection();
        container.style.cursor = isHovered ? "grab" : "default";
        tipHandle.scale.setScalar(isHovered ? 1.3 : 1.0);
      }
      isDraggingCamera = false;
    };

    const onPointerCancel = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      try {
        if (target?.hasPointerCapture?.(e.pointerId)) {
          target.releasePointerCapture(e.pointerId);
        }
      } catch (_err) {
        // Ignored
      }
      isDraggingHandle = false;
      isDraggingCamera = false;
      container.style.cursor = "default";
      tipHandle.scale.setScalar(1.0);
    };

    container.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    container.addEventListener("pointercancel", onPointerCancel);

    // Spherical angle state vector lerp tracker
    let currentAngles = { theta: initSt.theta, phi: initSt.phi };
    let animId = 0;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      cameraImpulse *= Math.pow(0.01, dt);
      camera.fov = 45 - cameraImpulse * 3.5;
      camera.updateProjectionMatrix();

      const state = useQuantumStore.getState();
      const isMission = state.appViewState === "IN_MISSION";
      const mId = isMission ? state.currentMissionId : "superposition";

      if (isMission) {
        if (mId === "entanglement") {
          if (
            waveState.active &&
            now / 1000 - waveState.startTime > waveState.duration
          ) {
            waveState.active = false;
          }
          updateLaserStrand(dualBloch, now / 1000, waveState);
          const angles = computeSynchronizedAngles(
            state.theta,
            state.phi,
            state.lastOutcome,
            waveState,
            now / 1000,
          );
          const dirA = computeSphericalVector(angles.thetaA, angles.phiA);
          dualBloch.arrowA.setDirection(dirA);
          dualBloch.arrowA.setLength(1.3, 0.2, 0.08);
          dualBloch.tipHandleA.position.copy(dirA).multiplyScalar(1.3);
          updatePolarArc(dualBloch.polarArcA, angles.thetaA, angles.phiA, 1.0);
          updateAzimuthalLine(dualBloch.azimuthalLineA, angles.thetaA, angles.phiA, 1.0);

          const dirB = computeSphericalVector(angles.thetaB, angles.phiB);
          dualBloch.arrowB.setDirection(dirB);
          dualBloch.arrowB.setLength(1.3, 0.2, 0.08);
          dualBloch.tipHandleB.position.copy(dirB).multiplyScalar(1.3);
          updatePolarArc(dualBloch.polarArcB, angles.thetaB, angles.phiB, 1.0);
          updateAzimuthalLine(dualBloch.azimuthalLineB, angles.thetaB, angles.phiB, 1.0);

          renderer.render(dualBloch.scene, dualBloch.camera);
          animId = requestAnimationFrame(loop);
          return;
        }

        if (mId === "grover") {
          const gRes = simulateGroverStep(
            2,
            state.groverTargetIndex,
            state.groverStep,
          );
          updateGroverBars(
            groverScene,
            gRes.probabilities,
            state.groverTargetIndex,
          );
          groverScene.camera.position.x = Math.sin((now / 1000) * 0.6) * 0.4;
          groverScene.camera.lookAt(0, 0.6, 0);
          renderer.render(groverScene.scene, groverScene.camera);
          animId = requestAnimationFrame(loop);
          return;
        }

        if (mId === "applications") {
          if (state.shorBase !== activeShorBase) {
            shorScene.geometries.forEach((g) => g.dispose());
            shorScene.materials.forEach((m) => m.dispose());
            activeShorBase = state.shorBase;
            shorScene = createShorWheelScene(
              runShorDemo(activeShorBase).period,
            );
          }
          updateShorWheelAnimation(shorScene, now / 1000);
          renderer.render(shorScene.scene, shorScene.camera);
          animId = requestAnimationFrame(loop);
          return;
        }

        if (mId === "error-correction") {
          updateQECLattice(qecScene, state.qecInjectedError, now / 1000);
          renderer.render(qecScene.scene, qecScene.camera);
          animId = requestAnimationFrame(loop);
          return;
        }
      }

      let targetT = state.theta;
      let targetP = state.phi;
      let targetLen = 1.3;

      if (!isDraggingHandle && state.temperatureK > 0.05) {
        const { deltaTheta, deltaPhi, vectorLength } =
          calculateDecoherencePerturbation(
            targetT,
            targetP,
            state.temperatureK,
          );
        targetT += deltaTheta;
        targetP += deltaPhi;
        targetLen = 1.3 * vectorLength;
      }

      // Smooth spherical angle easing across gate executions, instant 1:1 on direct drag
      currentAngles =
        prefersReducedMotion() || isDraggingHandle
          ? { theta: targetT, phi: targetP }
          : lerpSphericalAngles(
              currentAngles,
              { theta: targetT, phi: targetP },
              dt * 12.0,
            );

      const dir = computeSphericalVector(
        currentAngles.theta,
        currentAngles.phi,
      );
      arrowHelper.setDirection(dir);
      arrowHelper.setLength(targetLen, 0.2, 0.08);
      tipHandle.position.copy(dir).multiplyScalar(targetLen);
      updatePolarArc(polarArc, currentAngles.theta, currentAngles.phi, targetLen);
      updateAzimuthalLine(azimuthalLine, currentAngles.theta, currentAngles.phi, targetLen);

      // "decoherence"
      const isDecoherence = mId === "decoherence";
      sphere.material = isDecoherence ? thermalShaderMat : defaultSphereMat;
      decoherenceParticles.points.visible = isDecoherence;
      if (isDecoherence) {
        updateThermalDistortionUniforms(
          thermalShaderMat,
          now / 1000,
          state.temperatureK,
        );
        updateThermalParticles(decoherenceParticles, dt, state.temperatureK);
      }

      // "superposition"
      const showGhost =
        mId === "superposition" &&
        Math.sin(currentAngles.theta) > 0.25 &&
        state.lastOutcome === null;
      ghostArrow.visible = showGhost;
      if (showGhost) {
        ghostArrow.setDirection(
          computeSphericalVector(
            Math.PI - currentAngles.theta,
            currentAngles.phi + (now / 1000) * 4.0,
          ),
        );
        ring.rotation.z = (now / 1000) * 2.5;
      }

      // "gates"
      const isGates = isMission && mId === "gates";
      trailLine.visible = isGates;
      if (isGates) {
        ring.rotation.z = currentAngles.phi;
      } else if (!showGhost) {
        ring.rotation.z = 0;
      }

      // shift trailPositions each frame to record tipHandle.position
      for (let i = (60 - 1) * 3; i >= 3; i--) {
        trailPositions[i] = trailPositions[i - 3];
      }
      trailPositions[0] = tipHandle.position.x;
      trailPositions[1] = tipHandle.position.y;
      trailPositions[2] = tipHandle.position.z;
      trailGeo.attributes.position.needsUpdate = true;

      updateParticles(particlePool, dt);
      renderer.render(scene, camera);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    const onResize = () => {
      const w = container.clientWidth || 800;
      const h = container.clientHeight || 600;
      const aspect = w / h;
      [
        camera,
        dualBloch.camera,
        groverScene.camera,
        shorScene.camera,
        qecScene.camera,
      ].forEach((cam) => {
        cam.aspect = aspect;
        cam.updateProjectionMatrix();
      });
      renderer.setSize(w, h, false);
      polarArc.material.resolution.set(w, h);
      azimuthalLine.material.resolution.set(w, h);
      dualBloch.polarArcA.material.resolution.set(w, h);
      dualBloch.azimuthalLineA.material.resolution.set(w, h);
      dualBloch.polarArcB.material.resolution.set(w, h);
      dualBloch.azimuthalLineB.material.resolution.set(w, h);
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);

    const unsub = useQuantumStore.subscribe((state, prev) => {
      // In-place uniform/material updates on mission or theme changes without WebGL rebuild
      if (
        state.currentMissionId !== prev.currentMissionId ||
        state.theme !== prev.theme
      ) {
        const isEnt = state.currentMissionId === "entanglement";
        updateBlochSphereUniforms(elements, {
          theme: state.theme,
          sphereColor: isEnt ? 0x2e1065 : undefined,
          arrowColor: isEnt ? 0xa855f7 : undefined,
          gridAlpha: 0.15,
        });
      }
      if (
        state.lastOutcome !== null &&
        state.lastOutcome !== prev.lastOutcome
      ) {
        cameraImpulse = 1.0;
        burstParticles(
          particlePool,
          [0, state.lastOutcome === 0 ? 1.3 : -1.3, 0],
          80,
        );
        waveState.active = true;
        waveState.startTime = performance.now() / 1000;
        waveState.outcome = state.lastOutcome;
      }
    });

    return () => {
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      unsub();
      container.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      container.removeEventListener("pointercancel", onPointerCancel);
      [
        ...geometries,
        ...dualBloch.geometries,
        ...groverScene.geometries,
        ...shorScene.geometries,
        ...qecScene.geometries,
      ].forEach((g) => g.dispose());
      [
        ...materials,
        ...dualBloch.materials,
        ...groverScene.materials,
        ...shorScene.materials,
        ...qecScene.materials,
      ].forEach((m) => m.dispose());
      [
        arrowHelper.line?.geometry,
        arrowHelper.cone?.geometry,
        particlePool.mesh.geometry,
        ghostArrow.line?.geometry,
        ghostArrow.cone?.geometry,
        trailGeo,
        trailMat,
        thermalShaderMat,
        decoherenceParticles.points.geometry,
      ].forEach((res) => res?.dispose());
      // Safeguard: singletonRenderer is preserved across unmounts/mounts
    };
  }, []);

  return (
    <div
      className={`relative w-full h-full min-h-72 rounded-xl hud-panel flex flex-col overflow-hidden ${className}`}
    >
      <div className="relative flex-1 min-h-0 touch-none">
        <div ref={containerRef} className="absolute inset-0" />
        <div className="pointer-events-none absolute inset-0 bg-radial-glow" />
        <span className="absolute top-2 left-1/2 -translate-x-1/2 text-xs telemetry-mono pointer-events-none px-2 py-0.5 rounded select-none hud-badge-cyan">
          |0⟩ (+Y)
        </span>
        <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs telemetry-mono pointer-events-none px-2 py-0.5 rounded select-none hud-badge-purple">
          |1⟩ (-Y)
        </span>
      </div>
      <div className="shrink-0 border-t border-border bg-surface-2 px-4 py-2.5 text-xs telemetry-mono text-muted-foreground flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-4">
          <span>
            <strong className="text-axis-x">{"X:"}</strong> {coords.x}
          </span>
          <span>
            <strong className="text-axis-y">{"Y:"}</strong> {coords.y}
          </span>
          <span>
            <strong className="text-axis-z">{"Z:"}</strong> {coords.z}
          </span>
        </div>
        {lastOutcome !== null && (
          <span className="text-success font-bold">
            COLLAPSED: |{lastOutcome}⟩
          </span>
        )}
      </div>
    </div>
  );
};

export const BlochSphereWorkspace = BlochViewport;
export default BlochViewport;
