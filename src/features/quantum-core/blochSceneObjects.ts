import * as THREE from 'three';

/**
 * Explicit Standardized Coordinate Transformation Mapping:
 * - Quantization / Phase Axis (Z_phys): Maps to Three.js +Y (0, 1, 0) [North Pole = |0⟩, South Pole = |1⟩]
 * - Bit-Flip Axis (X_phys): Maps to Three.js +X (1, 0, 0)
 * - Phase-Bit Axis (Y_phys): Maps to Three.js +Z (0, 0, 1)
 */
export function quantumToVisualVector(xPhys: number, yPhys: number, zPhys: number): THREE.Vector3 {
  return new THREE.Vector3(xPhys, zPhys, yPhys);
}

export function visualToQuantumVector(v: THREE.Vector3): { x: number; y: number; z: number } {
  return {
    x: v.x,
    y: v.z,
    z: v.y,
  };
}

export function computeSphericalVector(theta: number, phi: number, radius = 1.0): THREE.Vector3 {
  const sT = Math.sin(theta);
  const x = sT * Math.cos(phi); // X_phys -> Three.js +X
  const y = Math.cos(theta);    // Z_phys -> Three.js +Y
  const z = sT * Math.sin(phi); // Y_phys -> Three.js +Z
  return new THREE.Vector3(x * radius, y * radius, z * radius);
}

export const VISUAL_AXIS_Z_PHYS = new THREE.Vector3(0, 1, 0); // Quantization Axis (|0⟩ / |1⟩)
export const VISUAL_AXIS_X_PHYS = new THREE.Vector3(1, 0, 0); // Bit-Flip Axis (|+⟩ / |-⟩)
export const VISUAL_AXIS_Y_PHYS = new THREE.Vector3(0, 0, 1); // Phase-Bit Axis (|+i⟩ / |-i⟩)
