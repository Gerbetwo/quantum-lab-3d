import * as THREE from 'three';

export function computeSphericalVector(theta: number, phi: number): THREE.Vector3 {
  const sT = Math.sin(theta);
  return new THREE.Vector3(sT * Math.cos(phi), Math.cos(theta), sT * Math.sin(phi)).normalize();
}
