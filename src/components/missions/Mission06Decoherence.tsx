"use client";

import React, { useRef, useEffect, useCallback, useMemo } from "react";
import * as THREE from "three";
import { useQuantumStore } from "@/store/useQuantumStore";
import { MissionCanvasShell } from "@/components/framework/MissionCanvasShell";
import { acquireRenderer } from "@/features/quantum-core/BlochViewport";
import {
  calculateThermalMetrics,
  createThermalDistortionShaderMaterial,
  updateThermalDistortionUniforms,
  createDecoherenceParticleSystem,
  updateThermalParticles,
} from "@/features/quantum-core/DecoherenceParticles";
import { computeSphericalVector } from "@/features/quantum-core/blochSceneObjects";
import { createBlochTargetZoneMesh, isVectorInBlochTarget } from "@/components/canvas/TargetZone3D";
import { useSpatialTelemetryBridge } from "@/hooks/useSpatialTelemetryBridge";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { soundEngine } from "@/lib/soundEngine";
import { Snowflake, Flame, Crosshair, CheckCircle2, RotateCcw, Activity, Zap } from "lucide-react";

export interface Mission06DecoherenceProps {
  className?: string;
  missionId?: string;
}

const CRYO_PRESETS = [
  { id: "15mK", label: "15 mK", tempK: 0.015, desc: "Cryo Dilution" },
  { id: "4K", label: "4.0 K", tempK: 4.0, desc: "Liquid Helium" },
  { id: "77K", label: "77 K", tempK: 77.0, desc: "Liquid Nitrogen" },
  { id: "300K", label: "300 K", tempK: 300.0, desc: "Room Ambient" },
] as const;

interface DecoherenceViewportProps {
  theta: number;
  phi: number;
  temperatureK: number;
  onVectorDrag: (theta: number, phi: number) => void;
}

const DecoherenceViewport: React.FC<DecoherenceViewportProps> = ({
  theta,
  phi,
  temperatureK,
  onVectorDrag,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragPlaneRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const isDraggingRef = useRef<boolean>(false);
  const stateRef = useRef({ theta, phi, temperatureK });

  useEffect(() => {
    stateRef.current = { theta, phi, temperatureK };
  }, [theta, phi, temperatureK]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = acquireRenderer(container);
    const scene = new THREE.Scene();
    const w = container.clientWidth || 800;
    const h = container.clientHeight || 600;

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    camera.position.set(0, 0, 5.2);
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const dirLight = new THREE.DirectionalLight(0x00f3ff, 0.5);
    dirLight.position.set(2, 4, 5);
    scene.add(dirLight);

    const sphereGeo = new THREE.SphereGeometry(1.3, 36, 24);
    const sphereMat = createThermalDistortionShaderMaterial();
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.userData = { spatialId: "decoherence-envelope" };
    scene.add(sphere);

    const ringGeo = new THREE.RingGeometry(1.29, 1.31, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    const arrowHelper = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      1.3,
      0x00f3ff,
      0.2,
      0.08
    );
    scene.add(arrowHelper);

    const targetZone = createBlochTargetZoneMesh(Math.PI / 2, 0, 1.3, 0.35, 0x00f3ff);
    scene.add(targetZone.mesh);

    const particles = createDecoherenceParticleSystem(350);
    scene.add(particles.points);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const hitPoint = new THREE.Vector3();

    const getMouseNDC = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerDown = (e: PointerEvent) => {
      getMouseNDC(e);
      raycaster.setFromCamera(mouse, camera);
      if (raycaster.intersectObject(sphere, false).length > 0) {
        isDraggingRef.current = true;
        renderer.domElement.setPointerCapture?.(e.pointerId);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      getMouseNDC(e);
      raycaster.setFromCamera(mouse, camera);

      if (isDraggingRef.current) {
        if (raycaster.ray.intersectPlane(dragPlaneRef.current, hitPoint)) {
          const localVec = hitPoint.clone().normalize();
          const newTheta = Math.acos(Math.max(-1, Math.min(1, localVec.y)));
          let newPhi = Math.atan2(localVec.z, localVec.x);
          if (newPhi < 0) newPhi += 2 * Math.PI;
          onVectorDrag(newTheta, newPhi);
        }
        return;
      }

      const hits = raycaster.intersectObject(sphere, false);
      if (hits.length > 0) {
        useSpatialTelemetryBridge.getState().setActiveFocusId("decoherence-envelope");
        renderer.domElement.style.cursor = "pointer";
      } else {
        renderer.domElement.style.cursor = "default";
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        renderer.domElement.releasePointerCapture?.(e.pointerId);
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener("pointerdown", onPointerDown);
    dom.addEventListener("pointermove", onPointerMove);
    dom.addEventListener("pointerup", onPointerUp);

    let animId = 0;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const { theta: curTheta, phi: curPhi, temperatureK: curTemp } = stateRef.current;
      updateThermalDistortionUniforms(sphereMat, now / 1000, curTemp);
      updateThermalParticles(particles, dt, curTemp);

      const dir = computeSphericalVector(curTheta, curPhi);
      arrowHelper.setDirection(dir);

      const isAligned =
        isVectorInBlochTarget(curTheta, curPhi, Math.PI / 2, 0, 0.38) && curTemp <= 0.02;
      targetZone.updateAlignment(isAligned);

      renderer.render(scene, camera);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      dom.removeEventListener("pointerdown", onPointerDown);
      dom.removeEventListener("pointermove", onPointerMove);
      dom.removeEventListener("pointerup", onPointerUp);
      scene.remove(sphere, ring, arrowHelper, targetZone.mesh, particles.points);
      sphereGeo.dispose();
      sphereMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      targetZone.dispose();
      particles.points.geometry.dispose();
      (particles.points.material as THREE.Material).dispose();
    };
  }, [onVectorDrag]);

  return (
    <div
      ref={containerRef}
      data-testid="decoherence-viewport"
      className="relative w-full h-full select-none overflow-hidden touch-none"
    />
  );
};

/**
 * Mission 06: Cryogenic Thermal Decoherence & Environmental Noise
 */
export const Mission06Decoherence: React.FC<Mission06DecoherenceProps> = ({
  className = "",
  missionId = "decoherence",
}) => {
  const theta = useQuantumStore((s) => s.theta);
  const phi = useQuantumStore((s) => s.phi);
  const setAngles = useQuantumStore((s) => s.setAngles);
  const temperatureK = useQuantumStore((s) => s.temperatureK);
  const setTemperature = useQuantumStore((s) => s.setTemperature);
  const setLastOutcome = useQuantumStore((s) => s.setLastOutcome);

  const _activeFocusId = useSpatialTelemetryBridge((s) => s.activeFocusId);
  const activeMapping = useSpatialTelemetryBridge((s) => s.getActiveMapping());

  const safeTheta = Number.isFinite(theta) ? theta : Math.PI / 2;
  const safePhi = Number.isFinite(phi) ? phi : 0;
  const metrics = useMemo(() => calculateThermalMetrics(temperatureK), [temperatureK]);

  // Spatial alignment condition: Superposition aligned within target zone + cryogenic temp
  const isTargetAligned =
    isVectorInBlochTarget(safeTheta, safePhi, Math.PI / 2, 0, 0.38) && temperatureK <= 0.02;

  const handleSelectPreset = (tempK: number) => {
    setTemperature(tempK);
    soundEngine.playVectorSnap();
  };

  const handleReset = useCallback(() => {
    setAngles(Math.PI / 2, 0);
    setTemperature(0.015);
    setLastOutcome(null);
    soundEngine.playVectorSnap();
  }, [setAngles, setTemperature, setLastOutcome]);

  const handleMeasure = useCallback(() => {
    // If thermal noise is high, measurement collapses stochastically with thermal noise
    const noiseProb = metrics.normalizedDegradation * 0.5;
    const isThermalError = Math.random() < noiseProb;
    const outcome: 0 | 1 = isThermalError ? (Math.random() < 0.5 ? 1 : 0) : 0;
    setAngles(outcome === 0 ? 0 : Math.PI, 0);
    setLastOutcome(outcome);
    soundEngine.playStateCollapse();
  }, [metrics.normalizedDegradation, setAngles, setLastOutcome]);

  return (
    <MissionCanvasShell
      missionId={missionId}
      className={className}
      tier2Canvas={
        <DecoherenceViewport
          theta={safeTheta}
          phi={safePhi}
          temperatureK={temperatureK}
          onVectorDrag={(t, p) => setAngles(t, p)}
        />
      }
      pipelineRibbonProps={{
        activePhase: "measure",
        onMeasure: handleMeasure,
      }}
      tier2Overlays={
        <div className="absolute inset-0 pointer-events-none max-h-full overflow-y-auto pt-16 px-4 pb-4 sm:pt-20 sm:px-6 sm:pb-6 flex flex-col md:flex-row justify-between items-start gap-4 select-none">
          {/* Top Left: Cryogenic Guide & Spatial Telemetry Bridge */}
          <div className="w-full md:w-80 lg:w-96 pointer-events-auto shrink-0 space-y-2">
            <GlassCard
              title="Cryostat Thermal Chamber"
              badge={temperatureK <= 0.02 ? "Pristine Coherence" : "Thermal Degradation"}
            >
              <div className="space-y-2 text-xs font-mono">
                <p className="text-muted-foreground text-[11px] leading-relaxed flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-quantum-cyan shrink-0" />
                  <span>Thermal phonons jitter state vectors and distort the Hilbert space.</span>
                </p>

                {/* Spatial Telemetry Bridge Dynamic Binding */}
                {activeMapping ? (
                  <div
                    data-testid="spatial-telemetry-card"
                    className="p-2 rounded-lg border border-quantum-cyan/50 bg-quantum-cyan/10 text-quantum-cyan space-y-1 transition-all"
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase">
                      <span>Focused: {activeMapping.label}</span>
                      <span className="font-mono">{activeMapping.symbol}</span>
                    </div>
                    <div className="text-[11px] font-mono text-foreground font-semibold">
                      LaTeX: <code className="text-quantum-cyan">{activeMapping.latex}</code>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      {activeMapping.description}
                    </p>
                  </div>
                ) : (
                  <div className="p-2 rounded-lg border border-white/5 bg-surface-2/60 text-[10px] text-muted-foreground">
                    Hover the distorted sphere surface or background particles to inspect telemetry.
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {/* Top Right: Cryo Controls & T2 Telemetry */}
          <div className="w-full md:w-88 lg:w-96 pointer-events-auto shrink-0 space-y-2.5">
            <GlassCard title="Cryogenic Thermal Control" badge="T₂ Decay">
              <div className="space-y-2.5 font-mono text-xs">
                {/* 1. Presets */}
                <div className="grid grid-cols-4 gap-1">
                  {CRYO_PRESETS.map((p) => (
                    <Button
                      key={p.id}
                      variant={Math.abs(temperatureK - p.tempK) < 0.001 ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => handleSelectPreset(p.tempK)}
                      data-testid={`temp-preset-${p.id}`}
                      className="py-1 px-1 text-[10px] font-mono flex flex-col items-center"
                    >
                      <span className="font-bold">{p.label}</span>
                      <span className="text-[8px] opacity-70">{p.desc.split(" ")[0]}</span>
                    </Button>
                  ))}
                </div>

                {/* 2. Temperature Slider */}
                <div className="space-y-1 pt-1 border-t border-border">
                  <div className="flex justify-between text-[10px] text-muted-foreground uppercase">
                    <span className="flex items-center gap-1">
                      {temperatureK <= 1 ? <Snowflake className="w-3 h-3 text-quantum-cyan" /> : <Flame className="w-3 h-3 text-warning" />}
                      Temperature
                    </span>
                    <span className="font-bold tabular-nums text-foreground">
                      {temperatureK < 1 ? `${metrics.temperatureMilliK} mK` : `${temperatureK.toFixed(1)} K`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.015"
                    max="300"
                    step="0.5"
                    value={temperatureK}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    data-testid="temperature-slider"
                    className="w-full accent-quantum-cyan cursor-pointer h-1.5 bg-surface-3"
                  />
                </div>

                {/* 3. T2 Coherence Telemetry Readout */}
                <div className="grid grid-cols-2 gap-1.5 text-center text-[11px] pt-1 border-t border-border">
                  <div className="p-1.5 rounded border border-quantum-cyan/40 bg-quantum-cyan/10">
                    <div className="text-[10px] text-muted-foreground uppercase">Coherence T₂</div>
                    <div data-testid="t2-readout" className="text-quantum-cyan font-bold tabular-nums text-sm">
                      {metrics.t2CoherenceTimeUs} μs
                    </div>
                  </div>
                  <div className="p-1.5 rounded border border-quantum-purple/40 bg-quantum-purple/10">
                    <div className="text-[10px] text-muted-foreground uppercase">Distortion</div>
                    <div className="text-warning font-bold tabular-nums text-sm">
                      {(metrics.distortionAmplitude * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* 4. 3D Spatial Target Prediction Zone */}
                <div
                  data-testid="target-zone-status"
                  className="p-2 rounded border border-white/10 bg-surface-2/80 space-y-1"
                >
                  <div className="flex justify-between items-center text-[10px] uppercase text-muted-foreground">
                    <span className="flex items-center gap-1 font-bold">
                      <Crosshair className="w-3 h-3 text-quantum-cyan" />
                      <span>3D Target Zone</span>
                    </span>
                    <span
                      data-testid="target-alignment-badge"
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold flex items-center gap-1 ${
                        isTargetAligned ? "hud-badge-emerald" : "hud-badge-cyan"
                      }`}
                    >
                      {isTargetAligned ? <CheckCircle2 className="w-2.5 h-2.5 text-success" /> : null}
                      <span>{isTargetAligned ? "CRYO COHERENT" : "THERMAL NOISE"}</span>
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    {isTargetAligned
                      ? "Spatial threshold reached: Coherent superposition maintained at 15 mK."
                      : "Cool cryostat to 15 mK and align vector to equatorial target zone."}
                  </p>
                </div>

                {/* Reset & Action Buttons */}
                <div className="pt-2 border-t border-border flex flex-col gap-1.5">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleMeasure}
                    data-testid="measure-decoherence-button"
                    className="w-full text-xs py-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 mr-1 text-quantum-cyan" />
                    <span>Observe Wavefunction (Collapse)</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    data-testid="reset-button"
                    className="w-full text-[10px] py-0.5 text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="w-2.5 h-2.5 mr-1" />
                    <span>Reset Cryostat to 15 mK</span>
                  </Button>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      }
    />
  );
};

export default Mission06Decoherence;