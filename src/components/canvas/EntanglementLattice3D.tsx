"use client";

import * as THREE from "three";

export type BellStateType = "phi_plus" | "phi_minus" | "psi_plus" | "psi_minus" | "separable";

export interface TwoQubitAmplitudes {
  bellType: BellStateType;
  entropy: number; // ebits [0, 1]
  c00: { real: number; imag: number; prob: number };
  c01: { real: number; imag: number; prob: number };
  c10: { real: number; imag: number; prob: number };
  c11: { real: number; imag: number; prob: number };
}

/**
 * Computes 2-qubit state vector amplitudes and von Neumann entanglement entropy.
 * Invariant: p00 + p01 + p10 + p11 = 1.0
 */
export function computeTwoQubitState(
  bellType: BellStateType,
  thetaA = 0,
  phiA = 0,
  entropyDegree = 1.0
): TwoQubitAmplitudes {
  const safeEntropy = Math.max(0, Math.min(1, Number.isFinite(entropyDegree) ? entropyDegree : 1));

  if (bellType === "separable" || safeEntropy === 0) {
    // Product state |ψ_A⟩ ⊗ |0_B⟩
    const cosA = Math.cos(thetaA / 2);
    const sinA = Math.sin(thetaA / 2);
    const p00 = cosA * cosA;
    const p10 = sinA * sinA;
    return {
      bellType: "separable",
      entropy: 0,
      c00: { real: cosA, imag: 0, prob: p00 },
      c01: { real: 0, imag: 0, prob: 0 },
      c10: { real: sinA * Math.cos(phiA), imag: sinA * Math.sin(phiA), prob: p10 },
      c11: { real: 0, imag: 0, prob: 0 },
    };
  }

  // Parameterize partial entanglement using entropy degree
  // When entropyDegree = 1: alpha = beta = 1/√2
  const gamma = (Math.PI / 4) * safeEntropy;
  const alpha = Math.cos(gamma);
  const beta = Math.sin(gamma);

  // Von Neumann entropy S(ρ_A) = - Σ λ_i log2(λ_i)
  const l1 = alpha * alpha;
  const l2 = beta * beta;
  const entropy = (l1 > 1e-6 ? -l1 * Math.log2(l1) : 0) + (l2 > 1e-6 ? -l2 * Math.log2(l2) : 0);

  if (bellType === "phi_plus") {
    // |Φ⁺⟩ = α|00⟩ + β|11⟩
    return {
      bellType,
      entropy,
      c00: { real: alpha, imag: 0, prob: alpha * alpha },
      c01: { real: 0, imag: 0, prob: 0 },
      c10: { real: 0, imag: 0, prob: 0 },
      c11: { real: beta, imag: 0, prob: beta * beta },
    };
  }

  if (bellType === "phi_minus") {
    // |Φ⁻⟩ = α|00⟩ - β|11⟩
    return {
      bellType,
      entropy,
      c00: { real: alpha, imag: 0, prob: alpha * alpha },
      c01: { real: 0, imag: 0, prob: 0 },
      c10: { real: 0, imag: 0, prob: 0 },
      c11: { real: -beta, imag: 0, prob: beta * beta },
    };
  }

  if (bellType === "psi_plus") {
    // |Ψ⁺⟩ = α|01⟩ + β|10⟩
    return {
      bellType,
      entropy,
      c00: { real: 0, imag: 0, prob: 0 },
      c01: { real: alpha, imag: 0, prob: alpha * alpha },
      c10: { real: beta, imag: 0, prob: beta * beta },
      c11: { real: 0, imag: 0, prob: 0 },
    };
  }

  // |Ψ⁻⟩ = α|01⟩ - β|10⟩ (Singlet)
  return {
    bellType: "psi_minus",
    entropy,
    c00: { real: 0, imag: 0, prob: 0 },
    c01: { real: alpha, imag: 0, prob: alpha * alpha },
    c10: { real: -beta, imag: 0, prob: beta * beta },
    c11: { real: 0, imag: 0, prob: 0 },
  };
}

/**
 * Computes steered angles (θ_B, φ_B) for Qubit B when Qubit A is dragged.
 * The degree of correlation smoothly attenuates with entanglement entropy.
 */
export function computeSteeredQubitB(
  bellType: BellStateType,
  thetaA: number,
  phiA: number,
  entropy: number
): { thetaB: number; phiB: number } {
  const normEntropy = Math.max(0, Math.min(1, entropy));

  if (bellType === "separable" || normEntropy < 0.02) {
    return { thetaB: 0, phiB: 0 };
  }

  if (bellType === "phi_plus") {
    return {
      thetaB: thetaA * normEntropy,
      phiB: ((2 * Math.PI - phiA) % (2 * Math.PI)) * normEntropy,
    };
  }

  if (bellType === "phi_minus") {
    return {
      thetaB: thetaA * normEntropy,
      phiB: ((Math.PI - phiA + 2 * Math.PI) % (2 * Math.PI)) * normEntropy,
    };
  }

  if (bellType === "psi_plus") {
    return {
      thetaB: (Math.PI - thetaA) * normEntropy,
      phiB: ((2 * Math.PI - phiA) % (2 * Math.PI)) * normEntropy,
    };
  }

  // psi_minus (Singlet antipodal correlation)
  return {
    thetaB: (Math.PI - thetaA) * normEntropy,
    phiB: ((phiA + Math.PI) % (2 * Math.PI)) * normEntropy,
  };
}

export interface EntanglementLatticeResult {
  group: THREE.Group;
  latticeMesh: THREE.LineSegments;
  particles: THREE.Points;
  triggerIgnition: (bellType: BellStateType) => void;
  triggerCollapseWave: (outcome: 0 | 1, onComplete?: () => void) => void;
  update: (dt: number, isEntangled: boolean) => void;
  dispose: () => void;
}

const PARTICLE_COUNT = 90;
const LATTICE_MIN_X = -1.2;
const LATTICE_MAX_X = 1.2;

/**
 * Creates the dynamic 3D energy/tensor lattice mesh connecting Alice and Bob.
 */
export function createEntanglementLatticeGroup(): EntanglementLatticeResult {
  const group = new THREE.Group();
  group.name = "entanglement-lattice-group";

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  // 1. Helical Interlaced Tensor Struts
  const strutPoints: THREE.Vector3[] = [];
  const segments = 24;
  const helixRadius = 0.22;

  for (let i = 0; i < segments; i++) {
    const frac1 = i / segments;
    const frac2 = (i + 1) / segments;
    const x1 = LATTICE_MIN_X + frac1 * (LATTICE_MAX_X - LATTICE_MIN_X);
    const x2 = LATTICE_MIN_X + frac2 * (LATTICE_MAX_X - LATTICE_MIN_X);

    const a1 = frac1 * Math.PI * 6;
    const a2 = frac2 * Math.PI * 6;

    // Strand 1 (Clockwise)
    strutPoints.push(
      new THREE.Vector3(x1, Math.cos(a1) * helixRadius, Math.sin(a1) * helixRadius),
      new THREE.Vector3(x2, Math.cos(a2) * helixRadius, Math.sin(a2) * helixRadius)
    );

    // Strand 2 (Counter-clockwise)
    strutPoints.push(
      new THREE.Vector3(x1, Math.cos(-a1) * helixRadius, Math.sin(-a1) * helixRadius),
      new THREE.Vector3(x2, Math.cos(-a2) * helixRadius, Math.sin(-a2) * helixRadius)
    );

    // Cross-connecting tensor rungs every 3 segments
    if (i % 3 === 0) {
      strutPoints.push(
        new THREE.Vector3(x1, Math.cos(a1) * helixRadius, Math.sin(a1) * helixRadius),
        new THREE.Vector3(x1, Math.cos(-a1) * helixRadius, Math.sin(-a1) * helixRadius)
      );
    }
  }

  const latticeGeo = new THREE.BufferGeometry().setFromPoints(strutPoints);
  geometries.push(latticeGeo);

  const latticeMat = new THREE.LineBasicMaterial({
    color: 0x00f3ff,
    transparent: true,
    opacity: 0.75,
    depthWrite: false,
  });
  materials.push(latticeMat);

  const latticeMesh = new THREE.LineSegments(latticeGeo, latticeMat);
  latticeMesh.name = "entanglement-tensor-lattice";
  latticeMesh.userData = { spatialId: "entanglement-lattice" };
  group.add(latticeMesh);

  // 2. High-energy flowing tensor particles
  const particlePositions = new Float32Array(PARTICLE_COUNT * 3);
  const particleColors = new Float32Array(PARTICLE_COUNT * 3);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const frac = i / (PARTICLE_COUNT - 1);
    particlePositions[i * 3] = LATTICE_MIN_X + frac * (LATTICE_MAX_X - LATTICE_MIN_X);
    particlePositions[i * 3 + 1] = 0;
    particlePositions[i * 3 + 2] = 0;

    // Cyan to purple gradient
    particleColors[i * 3] = THREE.MathUtils.lerp(0.0, 0.66, frac);
    particleColors[i * 3 + 1] = THREE.MathUtils.lerp(0.95, 0.33, frac);
    particleColors[i * 3 + 2] = THREE.MathUtils.lerp(1.0, 0.97, frac);
  }

  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
  particleGeo.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));
  geometries.push(particleGeo);

  const particleMat = new THREE.PointsMaterial({
    size: 0.08,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  materials.push(particleMat);

  const particles = new THREE.Points(particleGeo, particleMat);
  particles.name = "entanglement-particles";
  group.add(particles);

  // State animation variables
  let timer = 0;
  let ignitionTime = -10;
  let collapseTime = -10;
  let collapseOutcome: 0 | 1 = 0;
  let collapseCallback: (() => void) | null = null;

  const triggerIgnition = (bellType: BellStateType) => {
    ignitionTime = timer;
    if (bellType === "psi_minus") {
      latticeMat.color.setHex(0xef4444);
    } else if (bellType === "phi_minus") {
      latticeMat.color.setHex(0xf59e0b);
    } else {
      latticeMat.color.setHex(0x00f3ff);
    }
  };

  const triggerCollapseWave = (outcome: 0 | 1, onComplete?: () => void) => {
    collapseTime = timer;
    collapseOutcome = outcome;
    collapseCallback = onComplete ?? null;
  };

  const update = (dt: number, isEntangled: boolean) => {
    timer += dt;

    if (!isEntangled) {
      latticeMat.opacity = 0.15;
      particleMat.opacity = 0.15;
      return;
    }

    // Ignition wave effect (0.6s shockwave)
    const ignitionElapsed = timer - ignitionTime;
    const ignitionBonus = ignitionElapsed < 0.6 ? (1.0 - ignitionElapsed / 0.6) * 1.5 : 0;

    // Collapse pulse effect (0.4s snap)
    const collapseElapsed = timer - collapseTime;
    const collapseBonus = collapseElapsed < 0.4 ? (1.0 - collapseElapsed / 0.4) * 2.0 : 0;

    if (collapseCallback && collapseElapsed >= 0.4) {
      const cb = collapseCallback;
      collapseCallback = null;
      cb();
    }

    latticeMat.opacity = Math.min(1.0, 0.75 + ignitionBonus + collapseBonus);
    particleMat.opacity = Math.min(1.0, 0.85 + ignitionBonus + collapseBonus);

    // Animate particles along the lattice
    const posAttr = particleGeo.getAttribute("position") as THREE.BufferAttribute;
    const colAttr = particleGeo.getAttribute("color") as THREE.BufferAttribute;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const baseFrac = i / (PARTICLE_COUNT - 1);
      // Particle cycle with velocity
      const shiftedFrac = (baseFrac + timer * 0.45) % 1.0;
      const x = LATTICE_MIN_X + shiftedFrac * (LATTICE_MAX_X - LATTICE_MIN_X);

      // Helical wave oscillation
      const angle = shiftedFrac * Math.PI * 6 + timer * 3.0;
      const r = helixRadius * (0.8 + 0.3 * Math.sin(timer * 4.0 + shiftedFrac * 6));

      posAttr.setXYZ(i, x, Math.cos(angle) * r, Math.sin(angle) * r);

      // Color flare on collapse
      if (collapseElapsed < 0.4) {
        if (collapseOutcome === 0) {
          colAttr.setXYZ(i, 0.0, 0.95, 1.0); // Cyan
        } else {
          colAttr.setXYZ(i, 0.66, 0.33, 0.97); // Purple
        }
      }
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  };

  const dispose = () => {
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
  };

  return {
    group,
    latticeMesh,
    particles,
    triggerIgnition,
    triggerCollapseWave,
    update,
    dispose,
  };
}

export interface BlochSphereGroupResult {
  group: THREE.Group;
  sphere: THREE.Mesh;
  ring: THREE.Mesh;
  arrow: THREE.ArrowHelper;
  tipHandle: THREE.Mesh;
  updateVector: (theta: number, phi: number) => void;
  dispose: () => void;
}

/**
 * Creates an individual Bloch sphere group (for Alice or Bob) with interactive vector handle.
 */
export function createBlochSphereGroup(
  x: number,
  radius = 0.9,
  mainColor = 0x00f3ff,
  spatialId: "qubit-alice" | "qubit-bob" = "qubit-alice"
): BlochSphereGroupResult {
  const group = new THREE.Group();
  group.position.set(x, 0, 0);

  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  // 1. Wireframe sphere
  const sphereGeo = new THREE.SphereGeometry(radius, 24, 16);
  geometries.push(sphereGeo);
  const sphereMat = new THREE.MeshBasicMaterial({
    color: mainColor,
    wireframe: true,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });
  materials.push(sphereMat);
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  sphere.userData = { spatialId };
  group.add(sphere);

  // 2. Equator ring
  const ringGeo = new THREE.RingGeometry(radius - 0.015, radius + 0.015, 48);
  geometries.push(ringGeo);
  const ringMat = new THREE.MeshBasicMaterial({
    color: mainColor,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  materials.push(ringMat);
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  // 3. State vector arrow
  const dir = new THREE.Vector3(0, 1, 0);
  const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0, 0), radius, mainColor, 0.16, 0.07);
  group.add(arrow);

  // 4. Vector tip handle
  const tipGeo = new THREE.SphereGeometry(0.08, 16, 16);
  geometries.push(tipGeo);
  const tipMat = new THREE.MeshBasicMaterial({
    color: mainColor,
    transparent: true,
    opacity: 0.95,
  });
  materials.push(tipMat);
  const tipHandle = new THREE.Mesh(tipGeo, tipMat);
  tipHandle.position.set(0, radius, 0);
  tipHandle.userData = { spatialId, isTipHandle: true };
  group.add(tipHandle);

  const updateVector = (theta: number, phi: number) => {
    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);
    const vx = sinT * Math.cos(phi);
    const vy = cosT;
    const vz = sinT * Math.sin(phi);

    const v = new THREE.Vector3(vx, vy, vz).normalize();
    arrow.setDirection(v);
    arrow.setLength(radius, 0.16, 0.07);
    tipHandle.position.copy(v.multiplyScalar(radius));
  };

  const dispose = () => {
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
  };

  return {
    group,
    sphere,
    ring,
    arrow,
    tipHandle,
    updateVector,
    dispose,
  };
}

