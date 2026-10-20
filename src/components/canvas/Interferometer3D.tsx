"use client";

import * as THREE from "three";

/**
 * Calculates quantum interference amplitudes for a dual-path interferometer.
 * Path 0 amplitude: A₀ = 1/√2
 * Path 1 amplitude: A₁ = (1/√2) * e^(iφ)
 * Constructive port: A_c = 0.5 * (1 + e^(iφ))  => P_c = cos²(φ/2)
 * Destructive port:  A_d = 0.5 * (1 - e^(iφ))  => P_d = sin²(φ/2)
 * Invariant: P_c + P_d = 1.0 for all φ ∈ [0, 2π]
 */
export interface InterferenceAmplitudes {
  phi: number;
  constructiveReal: number;
  constructiveImag: number;
  constructiveMagnitude: number;
  pConstructive: number;
  destructiveReal: number;
  destructiveImag: number;
  destructiveMagnitude: number;
  pDestructive: number;
}

export function computeInterferenceAmplitudes(phi: number): InterferenceAmplitudes {
  const safePhi = Number.isFinite(phi) ? phi : 0;
  const cosP = Math.cos(safePhi);
  const sinP = Math.sin(safePhi);

  const cReal = 0.5 * (1 + cosP);
  const cImag = 0.5 * sinP;
  const cMag = Math.sqrt(cReal * cReal + cImag * cImag);
  const pC = Math.cos(safePhi / 2) ** 2;

  const dReal = 0.5 * (1 - cosP);
  const dImag = -0.5 * sinP;
  const dMag = Math.sqrt(dReal * dReal + dImag * dImag);
  const pD = Math.sin(safePhi / 2) ** 2;

  return {
    phi: safePhi,
    constructiveReal: cReal,
    constructiveImag: cImag,
    constructiveMagnitude: cMag,
    pConstructive: pC,
    destructiveReal: dReal,
    destructiveImag: dImag,
    destructiveMagnitude: dMag,
    pDestructive: pD,
  };
}

export interface InterferometerGroupResult {
  group: THREE.Group;
  bs1Mesh: THREE.Mesh;
  bs2Mesh: THREE.Mesh;
  phaseShifterMesh: THREE.Mesh;
  phaseDial: THREE.Mesh;
  path0Line: THREE.Line;
  path1Line: THREE.Line;
  detectorConstructive: THREE.Mesh;
  detectorDestructive: THREE.Mesh;
  update: (phi: number) => void;
  dispose: () => void;
}

/**
 * Creates the 3D optical layout of the dual-path Mach-Zehnder interferometer.
 */
export function createDualPathInterferometerGroup(): InterferometerGroupResult {
  const group = new THREE.Group();
  group.name = "dual-path-interferometer-group";

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  // 1. Beam Splitter 1 (BS1) - Input superposition generator
  const bsGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
  geometries.push(bsGeo);
  const bsMat1 = new THREE.MeshBasicMaterial({
    color: 0x00f3ff,
    transparent: true,
    opacity: 0.45,
    wireframe: true,
  });
  materials.push(bsMat1);
  const bs1Mesh = new THREE.Mesh(bsGeo, bsMat1);
  bs1Mesh.position.set(-1.8, 0, 0);
  bs1Mesh.rotation.z = Math.PI / 4;
  bs1Mesh.name = "interferometer-bs1";
  bs1Mesh.userData = { spatialId: "interferometer-path", label: "Input Beam Splitter (BS1)" };
  group.add(bs1Mesh);

  // 2. Beam Splitter 2 (BS2) - Recombination & interference
  const bsMat2 = new THREE.MeshBasicMaterial({
    color: 0x10b981,
    transparent: true,
    opacity: 0.45,
    wireframe: true,
  });
  materials.push(bsMat2);
  const bs2Mesh = new THREE.Mesh(bsGeo, bsMat2);
  bs2Mesh.position.set(1.4, 0, 0);
  bs2Mesh.rotation.z = Math.PI / 4;
  bs2Mesh.name = "interferometer-bs2";
  bs2Mesh.userData = { spatialId: "interferometer-path", label: "Recombination Splitter (BS2)" };
  group.add(bs2Mesh);

  // 3. Turning Mirrors (Upper M1 and Lower M2)
  const mirrorGeo = new THREE.BoxGeometry(0.04, 0.45, 0.25);
  geometries.push(mirrorGeo);
  const mirrorMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.6,
  });
  materials.push(mirrorMat);

  const m1Mesh = new THREE.Mesh(mirrorGeo, mirrorMat);
  m1Mesh.position.set(-0.6, 1.2, 0);
  m1Mesh.rotation.z = Math.PI / 4;
  group.add(m1Mesh);

  const m2Mesh = new THREE.Mesh(mirrorGeo, mirrorMat);
  m2Mesh.position.set(-0.6, -1.2, 0);
  m2Mesh.rotation.z = -Math.PI / 4;
  group.add(m2Mesh);

  // 4. Optical Path Lines
  // Path 0 (Upper Arm): BS1 -> M1 -> BS2
  const path0Points = [
    new THREE.Vector3(-1.8, 0, 0),
    new THREE.Vector3(-0.6, 1.2, 0),
    new THREE.Vector3(1.4, 0, 0),
  ];
  const path0Geo = new THREE.BufferGeometry().setFromPoints(path0Points);
  geometries.push(path0Geo);
  const path0Mat = new THREE.LineBasicMaterial({
    color: 0x00f3ff,
    transparent: true,
    opacity: 0.75,
    linewidth: 2,
  });
  materials.push(path0Mat);
  const path0Line = new THREE.Line(path0Geo, path0Mat);
  path0Line.name = "interferometer-path-0";
  path0Line.userData = { spatialId: "interferometer-path", path: 0 };
  group.add(path0Line);

  // Path 1 (Lower Arm - Phase Shifted): BS1 -> M2 -> Phase Shifter -> BS2
  const path1Points = [
    new THREE.Vector3(-1.8, 0, 0),
    new THREE.Vector3(-0.6, -1.2, 0),
    new THREE.Vector3(0.4, -0.6, 0),
    new THREE.Vector3(1.4, 0, 0),
  ];
  const path1Geo = new THREE.BufferGeometry().setFromPoints(path1Points);
  geometries.push(path1Geo);
  const path1Mat = new THREE.LineBasicMaterial({
    color: 0xa855f7,
    transparent: true,
    opacity: 0.75,
    linewidth: 2,
  });
  materials.push(path1Mat);
  const path1Line = new THREE.Line(path1Geo, path1Mat);
  path1Line.name = "interferometer-path-1";
  path1Line.userData = { spatialId: "interferometer-path", path: 1 };
  group.add(path1Line);

  // 5. Phase Shifter Crystal & Interactive Rotation Dial on Path 1
  const phaseShifterGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.45, 16);
  geometries.push(phaseShifterGeo);
  const phaseShifterMat = new THREE.MeshBasicMaterial({
    color: 0xa855f7,
    wireframe: true,
    transparent: true,
    opacity: 0.6,
  });
  materials.push(phaseShifterMat);
  const phaseShifterMesh = new THREE.Mesh(phaseShifterGeo, phaseShifterMat);
  phaseShifterMesh.position.set(0.4, -0.6, 0);
  phaseShifterMesh.rotation.z = Math.PI / 3;
  phaseShifterMesh.name = "phase-shifter-cell";
  phaseShifterMesh.userData = { spatialId: "phase-shifter" };
  group.add(phaseShifterMesh);

  // Rotating Phase Dial Needle
  const dialGeo = new THREE.TorusGeometry(0.32, 0.03, 8, 24);
  geometries.push(dialGeo);
  const dialMat = new THREE.MeshBasicMaterial({
    color: 0x00f3ff,
    transparent: true,
    opacity: 0.9,
  });
  materials.push(dialMat);
  const phaseDial = new THREE.Mesh(dialGeo, dialMat);
  phaseDial.position.set(0.4, -0.6, 0);
  phaseDial.userData = { spatialId: "phase-shifter" };
  group.add(phaseDial);

  // 6. Detector Targets (Constructive at x=2.2, y=0; Destructive at x=1.4, y=1.0)
  const detectorGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.06, 24);
  geometries.push(detectorGeo);

  const detConstructiveMat = new THREE.MeshBasicMaterial({
    color: 0x10b981,
    transparent: true,
    opacity: 0.8,
  });
  materials.push(detConstructiveMat);
  const detectorConstructive = new THREE.Mesh(detectorGeo, detConstructiveMat);
  detectorConstructive.position.set(2.2, 0, 0);
  detectorConstructive.rotation.z = Math.PI / 2;
  detectorConstructive.name = "detector-constructive";
  detectorConstructive.userData = {
    spatialId: "interference-detector",
    port: "constructive",
  };
  group.add(detectorConstructive);

  const detDestructiveMat = new THREE.MeshBasicMaterial({
    color: 0xf59e0b,
    transparent: true,
    opacity: 0.6,
  });
  materials.push(detDestructiveMat);
  const detectorDestructive = new THREE.Mesh(detectorGeo, detDestructiveMat);
  detectorDestructive.position.set(1.4, 1.0, 0);
  detectorDestructive.name = "detector-destructive";
  detectorDestructive.userData = {
    spatialId: "interference-detector",
    port: "destructive",
  };
  group.add(detectorDestructive);

  const update = (phi: number) => {
    phaseDial.rotation.z = phi;
    phaseShifterMesh.rotation.y = phi * 0.5;
  };

  const dispose = () => {
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
  };

  return {
    group,
    bs1Mesh,
    bs2Mesh,
    phaseShifterMesh,
    phaseDial,
    path0Line,
    path1Line,
    detectorConstructive,
    detectorDestructive,
    update,
    dispose,
  };
}

export interface WaveInterferenceSystemResult {
  group: THREE.Group;
  waveRipplesConstructive: THREE.Mesh[];
  waveRipplesDestructive: THREE.Mesh[];
  update: (dt: number, phi: number) => void;
  dispose: () => void;
}

/**
 * Creates 3D wave packet interference ripples merging at the detector targets.
 * The ripples expand radially from each detector port; their amplitude and opacity
 * scale deterministically with P_constructive = cos²(φ/2) and P_destructive = sin²(φ/2).
 */
export function createWaveInterferenceSystem(): WaveInterferenceSystemResult {
  const group = new THREE.Group();
  group.name = "wave-interference-system";

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  const rippleCount = 5;
  const waveRipplesConstructive: THREE.Mesh[] = [];
  const waveRipplesDestructive: THREE.Mesh[] = [];

  // Concentric ripple rings for constructive detector at (2.2, 0, 0)
  for (let i = 0; i < rippleCount; i++) {
    const geo = new THREE.RingGeometry(0.1 + i * 0.08, 0.14 + i * 0.08, 32);
    geometries.push(geo);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    materials.push(mat);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(2.25, 0, 0);
    mesh.rotation.y = Math.PI / 2;
    mesh.userData = { spatialId: "interference-detector", phaseOffset: (i / rippleCount) * Math.PI * 2 };
    group.add(mesh);
    waveRipplesConstructive.push(mesh);
  }

  // Concentric ripple rings for destructive detector at (1.4, 1.0, 0)
  for (let i = 0; i < rippleCount; i++) {
    const geo = new THREE.RingGeometry(0.1 + i * 0.08, 0.14 + i * 0.08, 32);
    geometries.push(geo);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    materials.push(mat);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(1.4, 1.05, 0);
    mesh.rotation.x = Math.PI / 2;
    mesh.userData = { spatialId: "interference-detector", phaseOffset: (i / rippleCount) * Math.PI * 2 };
    group.add(mesh);
    waveRipplesDestructive.push(mesh);
  }

  let animationTimer = 0;

  const update = (dt: number, phi: number) => {
    animationTimer += dt * 3.5;
    const { pConstructive, pDestructive } = computeInterferenceAmplitudes(phi);

    // Update constructive ripple pulses
    waveRipplesConstructive.forEach((mesh, index) => {
      const basePhase = (animationTimer + index * 0.9) % (Math.PI * 2);
      const wavePulse = (Math.sin(basePhase) + 1) * 0.5; // [0, 1]
      const scale = 0.8 + wavePulse * 0.6;
      mesh.scale.set(scale, scale, 1);

      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = pConstructive * wavePulse * 0.85;
      mesh.visible = pConstructive > 0.01;
    });

    // Update destructive ripple pulses
    waveRipplesDestructive.forEach((mesh, index) => {
      const basePhase = (animationTimer + index * 0.9) % (Math.PI * 2);
      const wavePulse = (Math.sin(basePhase) + 1) * 0.5;
      const scale = 0.8 + wavePulse * 0.6;
      mesh.scale.set(scale, scale, 1);

      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = pDestructive * wavePulse * 0.85;
      mesh.visible = pDestructive > 0.01;
    });
  };

  const dispose = () => {
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
  };

  return {
    group,
    waveRipplesConstructive,
    waveRipplesDestructive,
    update,
    dispose,
  };
}
