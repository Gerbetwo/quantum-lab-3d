'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { StateVector } from '@/core/types';
import { createScene } from '@/features/quantum-3d/lib/sceneManager';
import { useQuantumStore } from '@/store/useQuantumStore';

export interface ViewportProps {
  evaluation?: StateVector;
  state?: StateVector;
  nQubits?: number;
}

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uIntensity;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    if (uIntensity <= 0.0) {
      discard;
    }

    float wave1 = sin(vUv.y * 25.0 - uTime * 8.0) * 0.5 + 0.5;
    float wave2 = cos(vUv.y * 40.0 + uTime * 12.0) * 0.5 + 0.5;
    float pulse = wave1 * 0.6 + wave2 * 0.4;

    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewPosition);
    float fresnel = pow(1.0 - abs(dot(normal, viewDir)), 2.5);

    float fade = smoothstep(0.0, 0.12, vUv.y) * smoothstep(1.0, 0.88, vUv.y);

    float alpha = (pulse * 0.75 + fresnel * 0.6) * uIntensity * fade;
    vec3 finalColor = uColor * (1.3 + pulse * 0.7);

    gl_FragColor = vec4(finalColor, alpha);
  }
`;

function createQubitSphere(position: [number, number, number]): THREE.Group {
  const group = new THREE.Group();
  group.position.set(...position);

  const sphereGeo = new THREE.SphereGeometry(1, 32, 16);
  const sphereMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true, transparent: true, opacity: 0.2 });
  group.add(new THREE.Mesh(sphereGeo, sphereMat));

  const ringGeo = new THREE.RingGeometry(0.99, 1.01, 64);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  const markerGeo = new THREE.SphereGeometry(0.08, 16, 16);
  const markerMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 1 });
  group.add(new THREE.Mesh(markerGeo, markerMat));

  return group;
}

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

    // Energy Beam Setup
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
    <div className="flex items-center justify-center h-full w-full relative bg-background/90 rounded-xl overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}

export default BlochPairView;
