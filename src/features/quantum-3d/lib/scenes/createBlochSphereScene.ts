import * as THREE from 'three';
import { ResourceTracker } from '../resourceTracker';

export function createBlochSphereScene(scene: THREE.Scene, tracker: ResourceTracker) {
  const sphereGeo = tracker.track(new THREE.SphereGeometry(1, 32, 32));
  const sphereMat = tracker.track(
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.15,
      wireframe: true,
    })
  );
  const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
  scene.add(sphereMesh);

  const axesGroup = new THREE.Group();
  const axisMaterialX = tracker.track(new THREE.LineBasicMaterial({ color: 0xef4444 }));
  const axisMaterialY = tracker.track(new THREE.LineBasicMaterial({ color: 0x22c55e }));
  const axisMaterialZ = tracker.track(new THREE.LineBasicMaterial({ color: 0x3b82f6 }));

  const pointsZ = [new THREE.Vector3(0, -1.2, 0), new THREE.Vector3(0, 1.2, 0)];
  const geoZ = tracker.track(new THREE.BufferGeometry().setFromPoints(pointsZ));
  axesGroup.add(new THREE.Line(geoZ, axisMaterialZ));

  const pointsX = [new THREE.Vector3(-1.2, 0, 0), new THREE.Vector3(1.2, 0, 0)];
  const geoX = tracker.track(new THREE.BufferGeometry().setFromPoints(pointsX));
  axesGroup.add(new THREE.Line(geoX, axisMaterialX));

  const pointsY = [new THREE.Vector3(0, 0, -1.2), new THREE.Vector3(0, 0, 1.2)];
  const geoY = tracker.track(new THREE.BufferGeometry().setFromPoints(pointsY));
  axesGroup.add(new THREE.Line(geoY, axisMaterialY));

  scene.add(axesGroup);

  const vectorGroup = new THREE.Group();
  const arrowHeight = 1;
  const arrowGeo = tracker.track(new THREE.ConeGeometry(0.08, 0.3, 16));
  arrowGeo.translate(0, arrowHeight - 0.15, 0);
  const arrowMat = tracker.track(new THREE.MeshStandardMaterial({ color: 0xf59e0b }));
  const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);

  const shaftGeo = tracker.track(new THREE.CylinderGeometry(0.02, 0.02, arrowHeight, 8));
  shaftGeo.translate(0, arrowHeight / 2, 0);
  const shaftMat = tracker.track(new THREE.MeshStandardMaterial({ color: 0xf59e0b }));
  const shaftMesh = new THREE.Mesh(shaftGeo, shaftMat);

    vectorGroup.add(shaftMesh);
  vectorGroup.add(arrowMesh);
  scene.add(vectorGroup);

  return {
    update: (theta: number, phi: number = 0) => {
      const x = Math.sin(theta) * Math.cos(phi);
      const z = Math.sin(theta) * Math.sin(phi);
      const y = Math.cos(theta);

      const targetDir = new THREE.Vector3(x, y, z).normalize();
      vectorGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), targetDir);
      vectorGroup.scale.set(1, 1, 1);
    },
  };
}
